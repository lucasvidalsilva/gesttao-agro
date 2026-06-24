import { Prisma } from "@prisma/client";

export enum Role {
  ADMIN = "ADMIN",
  COLABORADOR = "COLABORADOR",
  VISUALIZADOR = "VISUALIZADOR",
}

export enum KanbanStatus {
  INICIAL = "INICIAL",
  EM_ANALISE = "EM_ANALISE",
  COM_PENDENCIA = "COM_PENDENCIA",
  LIBERADO = "LIBERADO",
  PAGO = "PAGO",
}

export enum TipoEvento {
  CRIACAO = "CRIACAO",
  MOVIMENTACAO = "MOVIMENTACAO",
  UPLOAD = "UPLOAD",
  DOWNLOAD = "DOWNLOAD",
  EXCLUSAO = "EXCLUSAO",
  AUTENTICACAO = "AUTENTICACAO",
  ALTERACAO = "ALTERACAO",
  OBSERVACAO = "OBSERVACAO",
}

export type ProjetoComRelacoes = Prisma.ProjetoGetPayload<{
  include: {
    cliente: true;
    responsavel: true;
    criador: true;
    checklistItems: {
      include: {
        documento: true;
      };
    };
    documentos: true;
    historicos: {
      include: {
        user: true;
      };
    };
    transicoes: true;
  };
}>;

export type ProjetoCard = Prisma.ProjetoGetPayload<{
  include: {
    cliente: {
      select: {
        id: true;
        nome: true;
        cpfCnpj: true;
      };
    };
    responsavel: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type ClienteComRelacoes = Prisma.ClienteGetPayload<{
  include: {
    projetos: {
      select: {
        id: true;
        nome: true;
        status: true;
      };
    };
    documentos: true;
  };
}>;

export type HistoricoComUsuario = Prisma.HistoricoEventoGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
  };
}>;

export type KanbanColumn = {
  id: KanbanStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  projetos: ProjetoCard[];
};
