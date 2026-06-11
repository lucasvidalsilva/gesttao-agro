"use server";

import { prisma } from "@/lib/prisma";

export async function registrarEvento(dados: {
  tipo: "CRIACAO" | "MOVIMENTACAO" | "UPLOAD" | "ALTERACAO" | "OBSERVACAO";
  descricao: string;
  projetoId?: string;
  userId: string;
  dados?: Record<string, unknown>;
}) {
  const evento = await prisma.historicoEvento.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      projetoId: dados.projetoId || null,
      userId: dados.userId,
      dados: (dados.dados as any) || null,
    },
  });

  return evento;
}

export async function buscarHistoricoProjeto(projetoId: string) {
  const historicos = await prisma.historicoEvento.findMany({
    where: { projetoId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return historicos;
}

export async function buscarDashboardData() {
  const [
    totalProjetos,
    projetosPorStatus,
    projetosRecentes,
    totalClientes,
    colaboradores,
  ] = await Promise.all([
    prisma.projeto.count(),
    prisma.projeto.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.projeto.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        cliente: { select: { nome: true } },
        responsavel: { select: { name: true } },
      },
    }),
    prisma.cliente.count(),
    prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: { projetosResponsavel: true },
        },
      },
    }),
  ]);

  const statusMap: Record<string, number> = {
    INICIAL: 0,
    EM_ANALISE: 0,
    COM_PENDENCIA: 0,
    LIBERADO: 0,
    PAGO: 0,
  };

  projetosPorStatus.forEach((item) => {
    statusMap[item.status] = item._count.status;
  });

  return {
    totalProjetos,
    totalClientes,
    projetosPorStatus: statusMap,
    projetosRecentes,
    colaboradores,
  };
}
