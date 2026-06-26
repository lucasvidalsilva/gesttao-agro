import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTotp } from "@/utils/totp";

export class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required";
}

export class InvalidMfaError extends CredentialsSignin {
  code = "invalid_mfa";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Sessão expira em 24 horas
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        mfaCode: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const mfaCode = credentials.mfaCode as string | undefined;

        // Rate limit: máximo de 5 tentativas de login por minuto por e-mail
        const limiter = rateLimit(`login:${email.toLowerCase()}`, {
          intervalMs: 60 * 1000,
          maxRequests: 5,
        });

        if (!limiter.success) {
          throw new Error("Muitas tentativas. Login bloqueado por 1 minuto.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.active) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        // Se o usuário for ADMIN e tiver MFA ativo
        if (user.role === "ADMIN" && user.twoFactorEnabled) {
          if (!mfaCode) {
            throw new MfaRequiredError();
          }

          const isValid = await verifyTotp(user.twoFactorSecret || "", mfaCode);
          if (!isValid) {
            throw new InvalidMfaError();
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.historicoEvento.create({
          data: {
            tipo: "AUTENTICACAO",
            descricao: `Login efetuado com sucesso por ${user.name || user.email}`,
            userId: user.id,
            dados: JSON.stringify({ email: user.email }),
          },
        });
      }
    },
    async signOut(message: any) {
      const token = message?.token;
      if (token?.id) {
        await prisma.historicoEvento.create({
          data: {
            tipo: "AUTENTICACAO",
            descricao: `Sessão encerrada (Logout) por ${token.name || token.email}`,
            userId: token.id as string,
            dados: JSON.stringify({ email: token.email }),
          },
        });
      }
    },
  },
});
