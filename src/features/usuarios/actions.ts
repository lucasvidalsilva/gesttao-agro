"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { criarUsuarioSchema, resetarSenhaSchema } from "@/features/projetos/validations";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function criarUsuario(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const parsed = criarUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const existente = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existente) {
    return { success: false, error: "E-mail já cadastrado" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const usuario = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Novo colaborador "${usuario.name}" criado no sistema`,
      userId: session.user.id,
      dados: JSON.stringify({ userId: usuario.id, email: usuario.email, role: usuario.role }),
    },
  });

  revalidatePath("/usuarios");
  return { success: true, data: { userId: usuario.id } };
}

export async function resetarSenha(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  const raw = {
    userId: formData.get("userId") as string,
    newPassword: formData.get("newPassword") as string,
  };

  const parsed = resetarSenhaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash },
  });

  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Senha do colaborador "${updatedUser.name}" redefinida`,
      userId: session.user.id,
      dados: JSON.stringify({ userId: updatedUser.id, email: updatedUser.email }),
    },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function desativarUsuario(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "Não é possível desativar sua própria conta" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Colaborador "${updatedUser.name}" ${updatedUser.active ? "ativado" : "desativado"} no sistema`,
      userId: session.user.id,
      dados: JSON.stringify({ userId: updatedUser.id, email: updatedUser.email, active: updatedUser.active }),
    },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function buscarUsuarios() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return [];
  }

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: {
        select: { projetosResponsavel: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return usuarios;
}

export async function buscarColaboradores() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const colaboradores = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
  return colaboradores;
}

export async function obterStatusMfa() {
  const session = await auth();
  if (!session?.user?.id) {
    return { enabled: false, email: "" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, email: true },
  });

  return {
    enabled: user?.twoFactorEnabled || false,
    email: user?.email || "",
  };
}

export async function gerarSegredoMfa() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const { generateSecret, getProvisioningUri } = await import("@/utils/totp");
  const secret = generateSecret();
  const uri = getProvisioningUri(user.email, secret);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;

  return { secret, qrCodeUrl };
}

export async function ativarMfa(secret: string, code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  const { verifyTotp } = await import("@/utils/totp");
  const isValid = await verifyTotp(secret, code);
  if (!isValid) {
    return { success: false, error: "Código de verificação inválido." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    },
  });

  // Gravar log de auditoria
  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Autenticação Multifator (MFA) ativada para o administrador "${session.user.name}"`,
      userId: session.user.id,
      dados: JSON.stringify({ email: session.user.email, action: "mfa_enabled" }),
    },
  });

  return { success: true };
}

export async function desativarMfa(code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "MFA não está ativo nesta conta." };
  }

  const { verifyTotp } = await import("@/utils/totp");
  const isValid = await verifyTotp(user.twoFactorSecret, code);
  if (!isValid) {
    return { success: false, error: "Código de verificação inválido." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    },
  });

  // Gravar log de auditoria
  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Autenticação Multifator (MFA) desativada para o administrador "${session.user.name}"`,
      userId: session.user.id,
      dados: JSON.stringify({ email: session.user.email, action: "mfa_disabled" }),
    },
  });

  return { success: true };
}
