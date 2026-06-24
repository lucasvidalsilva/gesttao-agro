"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { KanbanStatus } from "@/types";
import {
  criarProjetoSchema,
  transicaoAnaliseSchema,
  transicaoPendenciaSchema,
  transicaoLiberadoSchema,
  transicaoPagoSchema,
} from "./validations";
import {
  isTransicaoPermitida,
  CHECKLIST_DOCUMENTOS_PADRAO,
} from "@/lib/kanban-rules";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function criarProjeto(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.role === "VISUALIZADOR") {
    return { success: false, error: "Acesso negado: Perfil visualizador não possui permissão de escrita" };
  }

  const raw = {
    nome: formData.get("nome") as string,
    clienteId: formData.get("clienteId") as string,
    dataInicio: formData.get("dataInicio") as string,
  };

  const parsed = criarProjetoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const clienteExists = await prisma.cliente.findUnique({
    where: { id: parsed.data.clienteId },
  });

  if (!clienteExists) {
    return { success: false, error: "Cliente não encontrado" };
  }

  const maxPosicao = await prisma.projeto.aggregate({
    where: { status: "INICIAL" },
    _max: { posicao: true },
  });

  const projeto = await prisma.projeto.create({
    data: {
      nome: parsed.data.nome,
      clienteId: parsed.data.clienteId,
      dataInicio: new Date(parsed.data.dataInicio),
      responsavelId: session.user.id,
      criadorId: session.user.id,
      posicao: (maxPosicao._max.posicao ?? -1) + 1,
    },
  });

  await prisma.documentoChecklist.createMany({
    data: CHECKLIST_DOCUMENTOS_PADRAO.map((doc, index) => ({
      nome: doc.nome,
      descricao: doc.descricao,
      obrigatorio: doc.obrigatorio,
      ordem: index,
      projetoId: projeto.id,
    })),
  });

  await prisma.historicoEvento.create({
    data: {
      tipo: "CRIACAO",
      descricao: `Projeto "${parsed.data.nome}" criado para o cliente ${clienteExists.nome}`,
      projetoId: projeto.id,
      userId: session.user.id,
      dados: {
        clienteNome: clienteExists.nome,
        dataInicio: parsed.data.dataInicio,
      },
    },
  });

  revalidatePath("/projetos");
  return { success: true, data: { projetoId: projeto.id } };
}

export async function moverCard(
  projetoId: string,
  novoStatus: KanbanStatus,
  formData?: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.role === "VISUALIZADOR") {
    return { success: false, error: "Acesso negado: Perfil visualizador não possui permissão de escrita" };
  }

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: { checklistItems: true },
  });

  if (!projeto) {
    return { success: false, error: "Projeto não encontrado" };
  }

  if (!isTransicaoPermitida(projeto.status, novoStatus)) {
    return {
      success: false,
      error: `Transição de "${projeto.status}" para "${novoStatus}" não é permitida`,
    };
  }

  const statusAnterior = projeto.status;
  const updateData: Record<string, unknown> = { status: novoStatus };
  let dadosTransicao: Record<string, unknown> = {};

  if (novoStatus === "EM_ANALISE" && statusAnterior === "INICIAL") {
    const raw = {
      projetoId,
      dataEnvioAnalise: formData?.get("dataEnvioAnalise") as string,
    };
    const parsed = transicaoAnaliseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos",
      };
    }

    const obrigatorios = projeto.checklistItems.filter(
      (item) => item.obrigatorio
    );
    const naoEnviados = obrigatorios.filter((item) => !item.enviado);
    if (naoEnviados.length > 0) {
      return {
        success: false,
        error: `Documentos obrigatórios pendentes: ${naoEnviados.map((d) => d.nome).join(", ")}`,
      };
    }

    updateData.dataEnvioAnalise = new Date(parsed.data.dataEnvioAnalise);
    dadosTransicao = { dataEnvioAnalise: parsed.data.dataEnvioAnalise };
  }

  if (novoStatus === "COM_PENDENCIA") {
    const raw = {
      projetoId,
      dataResposta: formData?.get("dataResposta") as string,
      dataOcorrencia: formData?.get("dataOcorrencia") as string,
      observacao: formData?.get("observacao") as string,
    };
    const parsed = transicaoPendenciaSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos",
      };
    }
    updateData.dataResposta = new Date(parsed.data.dataResposta);
    updateData.dataOcorrencia = new Date(parsed.data.dataOcorrencia);
    updateData.observacao = parsed.data.observacao;
    dadosTransicao = {
      dataResposta: parsed.data.dataResposta,
      dataOcorrencia: parsed.data.dataOcorrencia,
      observacao: parsed.data.observacao,
    };
  }

  if (novoStatus === "LIBERADO") {
    const valorStr = formData?.get("valorProjeto") as string;
    const comissaoStr = formData?.get("comissao") as string;
    const raw = {
      projetoId,
      valorProjeto: valorStr ? parseFloat(valorStr) : undefined,
      comissao: comissaoStr ? parseFloat(comissaoStr) : undefined,
    };
    const parsed = transicaoLiberadoSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos",
      };
    }
    updateData.valorProjeto = parsed.data.valorProjeto;
    updateData.comissao = parsed.data.comissao;
    dadosTransicao = {
      valorProjeto: parsed.data.valorProjeto,
      comissao: parsed.data.comissao,
    };
  }

  if (novoStatus === "PAGO") {
    const raw = {
      projetoId,
      dataPagamento: formData?.get("dataPagamento") as string,
      confirmacao: formData?.get("confirmacao") === "true",
    };
    const parsed = transicaoPagoSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos",
      };
    }
    updateData.dataPagamento = new Date(parsed.data.dataPagamento);
    dadosTransicao = { dataPagamento: parsed.data.dataPagamento };
  }

  const maxPosicao = await prisma.projeto.aggregate({
    where: { status: novoStatus },
    _max: { posicao: true },
  });
  updateData.posicao = (maxPosicao._max.posicao ?? -1) + 1;

  await prisma.$transaction([
    prisma.projeto.update({
      where: { id: projetoId },
      data: updateData,
    }),
    prisma.transicaoKanban.create({
      data: {
        projetoId,
        statusAnterior,
        statusNovo: novoStatus,
        dados: dadosTransicao as any,
      },
    }),
    prisma.historicoEvento.create({
      data: {
        tipo: "MOVIMENTACAO",
        descricao: `Projeto movido de "${statusAnterior}" para "${novoStatus}"`,
        projetoId,
        userId: session.user.id,
        dados: { statusAnterior, statusNovo: novoStatus, ...dadosTransicao } as any,
      },
    }),
  ]);

  revalidatePath("/projetos");
  return { success: true };
}

export async function buscarProjetos(filtros?: {
  responsavelId?: string;
  status?: KanbanStatus;
  busca?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filtros?.responsavelId) {
    where.responsavelId = filtros.responsavelId;
  }
  if (filtros?.status) {
    where.status = filtros.status;
  }
  if (filtros?.busca) {
    where.OR = [
      { nome: { contains: filtros.busca, mode: "insensitive" } },
      {
        cliente: {
          nome: { contains: filtros.busca, mode: "insensitive" },
        },
      },
    ];
  }

  const projetos = await prisma.projeto.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, cpfCnpj: true } },
      responsavel: { select: { id: true, name: true, email: true } },
    },
    orderBy: { posicao: "asc" },
  });

  return projetos;
}

export async function buscarProjetoDetalhe(projetoId: string) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      cliente: true,
      responsavel: { select: { id: true, name: true, email: true } },
      criador: { select: { id: true, name: true, email: true } },
      checklistItems: {
        include: {
          documento: true,
        },
        orderBy: { ordem: "asc" },
      },
      documentos: {
        orderBy: { createdAt: "desc" },
      },
      historicos: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      transicoes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return projeto;
}

export async function reordenarCards(
  updates: { id: string; posicao: number }[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.role === "VISUALIZADOR") {
    return { success: false, error: "Acesso negado: Perfil visualizador não possui permissão de escrita" };
  }

  await prisma.$transaction(
    updates.map((update) =>
      prisma.projeto.update({
        where: { id: update.id },
        data: { posicao: update.posicao },
      })
    )
  );

  revalidatePath("/projetos");
  return { success: true };
}
