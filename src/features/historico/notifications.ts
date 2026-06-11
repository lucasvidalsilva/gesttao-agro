"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface NotificacaoDados {
  aniversariantes: {
    id: string;
    nome: string;
    telefone: string | null;
    dataNascimento: Date | null;
  }[];
  pendencias: {
    id: string;
    nome: string;
    observacao: string | null;
    updatedAt: Date;
  }[];
  recentes: {
    id: string;
    tipo: string;
    descricao: string;
    createdAt: Date;
    projetoName: string | null;
  }[];
}

export async function buscarDadosNotificacoes(): Promise<NotificacaoDados> {
  const session = await auth();
  if (!session?.user?.id) {
    return { aniversariantes: [], pendencias: [], recentes: [] };
  }

  // 1. Buscar aniversariantes do dia
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;

  const clientesNascimento = await prisma.cliente.findMany({
    where: {
      dataNascimento: {
        not: null,
      },
    },
    select: {
      id: true,
      nome: true,
      telefone: true,
      dataNascimento: true,
    },
  });

  const aniversariantes = clientesNascimento.filter((cliente) => {
    if (!cliente.dataNascimento) return false;
    const data = new Date(cliente.dataNascimento);
    // Usar getUTCDate/getUTCMonth para evitar problemas com deslocamento de fuso horário
    return (
      data.getUTCDate() === diaHoje &&
      data.getUTCMonth() + 1 === mesHoje
    );
  });

  // 2. Buscar projetos com pendências ativas
  const pendencias = await prisma.projeto.findMany({
    where: {
      status: "COM_PENDENCIA",
    },
    select: {
      id: true,
      nome: true,
      observacao: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  });

  // 3. Buscar eventos operacionais recentes (últimos 5 eventos gerais)
  const eventosDb = await prisma.historicoEvento.findMany({
    select: {
      id: true,
      tipo: true,
      descricao: true,
      createdAt: true,
      projeto: {
        select: {
          nome: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const recentes = eventosDb.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    descricao: e.descricao,
    createdAt: e.createdAt,
    projetoName: e.projeto?.nome || null,
  }));

  return {
    aniversariantes,
    pendencias,
    recentes,
  };
}
