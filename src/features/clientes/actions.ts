"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { criarClienteSchema, atualizarClienteSchema } from "@/features/projetos/validations";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function criarCliente(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.role === "VISUALIZADOR") {
    return { success: false, error: "Acesso negado: Perfil visualizador não possui permissão de escrita" };
  }

  const raw = {
    nome: formData.get("nome") as string,
    cpfCnpj: (formData.get("cpfCnpj") as string)?.replace(/\D/g, ""),
    telefone: formData.get("telefone") as string,
    email: formData.get("email") as string,
    dataNascimento: formData.get("dataNascimento") as string,
    observacoes: formData.get("observacoes") as string,
  };

  const parsed = criarClienteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const existente = await prisma.cliente.findUnique({
    where: { cpfCnpj: parsed.data.cpfCnpj },
  });

  if (existente) {
    return { success: false, error: "CPF/CNPJ já cadastrado" };
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome: parsed.data.nome,
      cpfCnpj: parsed.data.cpfCnpj,
      telefone: parsed.data.telefone || null,
      email: parsed.data.email || null,
      dataNascimento: parsed.data.dataNascimento
        ? new Date(parsed.data.dataNascimento)
        : null,
      observacoes: parsed.data.observacoes || null,
    },
  });

  revalidatePath("/clientes");
  return { success: true, data: { clienteId: cliente.id } };
}

export async function atualizarCliente(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.role === "VISUALIZADOR") {
    return { success: false, error: "Acesso negado: Perfil visualizador não possui permissão de escrita" };
  }

  const id = formData.get("id") as string;
  const raw = {
    id,
    nome: formData.get("nome") as string,
    cpfCnpj: (formData.get("cpfCnpj") as string)?.replace(/\D/g, ""),
    telefone: formData.get("telefone") as string,
    email: formData.get("email") as string,
    dataNascimento: formData.get("dataNascimento") as string,
    observacoes: formData.get("observacoes") as string,
  };

  const parsed = atualizarClienteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const existente = await prisma.cliente.findFirst({
    where: { cpfCnpj: parsed.data.cpfCnpj, NOT: { id } },
  });

  if (existente) {
    return { success: false, error: "CPF/CNPJ já cadastrado para outro cliente" };
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      cpfCnpj: parsed.data.cpfCnpj,
      telefone: parsed.data.telefone || null,
      email: parsed.data.email || null,
      dataNascimento: parsed.data.dataNascimento
        ? new Date(parsed.data.dataNascimento)
        : null,
      observacoes: parsed.data.observacoes || null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function buscarClientes(busca?: string) {
  const where = busca
    ? {
        OR: [
          { nome: { contains: busca, mode: "insensitive" as const } },
          { cpfCnpj: { contains: busca.replace(/\D/g, "") } },
          { email: { contains: busca, mode: "insensitive" as const } },
        ],
      }
    : {};

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      projetos: {
        select: { id: true, nome: true, status: true },
      },
      _count: {
        select: { documentos: true, projetos: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return clientes;
}

export async function buscarClienteDetalhe(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      projetos: {
        include: {
          responsavel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      documentos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return cliente;
}

export async function buscarClientesSimples() {
  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, cpfCnpj: true },
    orderBy: { nome: "asc" },
  });
  return clientes;
}
