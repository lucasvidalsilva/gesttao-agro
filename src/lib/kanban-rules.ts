import { KanbanStatus } from "@/types";

export interface KanbanColumnConfig {
  id: KanbanStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: KanbanStatus.INICIAL,
    label: "Inicial",
    color: "gray",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
  },
  {
    id: KanbanStatus.EM_ANALISE,
    label: "Em Análise",
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
  },
  {
    id: KanbanStatus.COM_PENDENCIA,
    label: "Com Pendência",
    color: "amber",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
  },
  {
    id: KanbanStatus.LIBERADO,
    label: "Liberado",
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-300",
  },
  {
    id: KanbanStatus.PAGO,
    label: "Pago",
    color: "emerald",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
  },
];

/**
 * Matriz de transições permitidas entre status do Kanban.
 * Define quais movimentações são válidas para cada status de origem.
 */
export const TRANSICOES_PERMITIDAS: Record<KanbanStatus, KanbanStatus[]> = {
  [KanbanStatus.INICIAL]: [KanbanStatus.EM_ANALISE],
  [KanbanStatus.EM_ANALISE]: [KanbanStatus.COM_PENDENCIA, KanbanStatus.LIBERADO],
  [KanbanStatus.COM_PENDENCIA]: [
    KanbanStatus.EM_ANALISE,
    KanbanStatus.LIBERADO,
    KanbanStatus.PAGO,
  ],
  [KanbanStatus.LIBERADO]: [KanbanStatus.PAGO],
  [KanbanStatus.PAGO]: [],
};

/**
 * Verifica se uma transição entre dois status é permitida.
 */
export function isTransicaoPermitida(
  from: KanbanStatus,
  to: KanbanStatus
): boolean {
  return TRANSICOES_PERMITIDAS[from].includes(to);
}

/**
 * Retorna a lista de status de destino permitidos a partir de um status de origem.
 */
export function getTransicoesPermitidas(from: KanbanStatus): KanbanStatus[] {
  return TRANSICOES_PERMITIDAS[from];
}

/**
 * Determina qual modal deve ser exibido para uma determinada transição.
 * Retorna null se a transição não for permitida.
 */
export function getModalParaTransicao(
  from: KanbanStatus,
  to: KanbanStatus
): string | null {
  if (!isTransicaoPermitida(from, to)) {
    return null;
  }

  switch (to) {
    case KanbanStatus.EM_ANALISE:
      return "analise";
    case KanbanStatus.COM_PENDENCIA:
      return "pendencia";
    case KanbanStatus.LIBERADO:
      return "liberado";
    case KanbanStatus.PAGO:
      return "pago";
    default:
      return null;
  }
}

export interface ChecklistDocumentoPadrao {
  nome: string;
  descricao: string;
  obrigatorio: boolean;
}

/**
 * Lista padrão de documentos para o checklist de um projeto.
 * Esses itens são criados automaticamente ao iniciar um novo projeto.
 */
export const CHECKLIST_DOCUMENTOS_PADRAO: ChecklistDocumentoPadrao[] = [
  {
    nome: "DARF",
    descricao: "Documento de Arrecadação de Receitas Federais",
    obrigatorio: true,
  },
  {
    nome: "Documento Pessoal (RG/CPF)",
    descricao: "Cópia do RG ou CPF do proprietário",
    obrigatorio: true,
  },
  {
    nome: "Comprovante de Endereço",
    descricao: "Comprovante de endereço atualizado (últimos 3 meses)",
    obrigatorio: true,
  },
  {
    nome: "Contrato Social / Matrícula do Imóvel",
    descricao: "Contrato social da empresa ou matrícula atualizada do imóvel rural",
    obrigatorio: true,
  },
  {
    nome: "Declaração do ITR",
    descricao: "Última declaração do Imposto sobre a Propriedade Territorial Rural",
    obrigatorio: true,
  },
  {
    nome: "Certidão Negativa de Débitos",
    descricao: "Certidão negativa de débitos federais, estaduais ou municipais",
    obrigatorio: false,
  },
  {
    nome: "Outros Documentos",
    descricao: "Documentos adicionais relevantes ao projeto",
    obrigatorio: false,
  },
];
