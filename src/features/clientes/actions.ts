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

  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Cliente "${cliente.nome}" cadastrado no sistema`,
      userId: session.user.id,
      dados: JSON.stringify({ clienteId: cliente.id, nome: cliente.nome }),
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

  const updatedCliente = await prisma.cliente.update({
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

  await prisma.historicoEvento.create({
    data: {
      tipo: "ALTERACAO",
      descricao: `Cadastro do cliente "${updatedCliente.nome}" atualizado`,
      userId: session.user.id,
      dados: JSON.stringify({ clienteId: id, nome: updatedCliente.nome }),
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function buscarClientes(busca?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const where: Record<string, any> = {};

  // RLS Lógico: Se o usuário NÃO for ADMIN, ele só vê clientes vinculados a projetos dele
  if (session.user.role !== "ADMIN") {
    where.projetos = {
      some: {
        OR: [
          { responsavelId: session.user.id },
          { criadorId: session.user.id },
        ],
      },
    };
  }

  if (busca) {
    const buscaFilter = {
      OR: [
        { nome: { contains: busca } },
        { cpfCnpj: { contains: busca.replace(/\D/g, "") } },
        { email: { contains: busca } },
      ],
    };

    if (session.user.role !== "ADMIN") {
      where.AND = [
        { projetos: where.projetos },
        buscaFilter,
      ];
      delete where.projetos;
    } else {
      where.OR = buscaFilter.OR;
    }
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      projetos: {
        where: session.user.role !== "ADMIN" ? {
          OR: [
            { responsavelId: session.user.id },
            { criadorId: session.user.id },
          ],
        } : undefined,
        select: { id: true, nome: true, status: true },
      },
      _count: {
        select: { documentos: true, projetos: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return clientes as any;
}

export async function buscarClienteDetalhe(clienteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // RLS Lógico: Se não for ADMIN, verifica se o usuário está associado a algum projeto deste cliente
  if (session.user.role !== "ADMIN") {
    const count = await prisma.projeto.count({
      where: {
        clienteId,
        OR: [
          { responsavelId: session.user.id },
          { criadorId: session.user.id },
        ],
      },
    });

    if (count === 0) {
      return null; // Acesso negado
    }
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      projetos: {
        where: session.user.role !== "ADMIN" ? {
          OR: [
            { responsavelId: session.user.id },
            { criadorId: session.user.id },
          ],
        } : undefined,
        include: {
          responsavel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      documentos: {
        where: session.user.role !== "ADMIN" ? {
          OR: [
            { uploadPorId: session.user.id },
            {
              projeto: {
                OR: [
                  { responsavelId: session.user.id },
                  { criadorId: session.user.id },
                ],
              },
            },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return cliente as any;
}

export async function buscarClientesSimples() {
  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, cpfCnpj: true },
    orderBy: { nome: "asc" },
  });
  return clientes;
}
