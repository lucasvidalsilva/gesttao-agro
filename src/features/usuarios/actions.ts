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

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash },
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

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
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
