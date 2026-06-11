import { Prisma, KanbanStatus, Role, TipoEvento } from "@prisma/client";

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

export type { KanbanStatus, Role, TipoEvento };

export type KanbanColumn = {
  id: KanbanStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  projetos: ProjetoCard[];
};
