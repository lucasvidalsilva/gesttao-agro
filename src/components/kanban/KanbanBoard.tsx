'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { CriarProjetoModal } from '@/components/kanban/modals/CriarProjetoModal';
import { UploadDocumentosPendentesModal } from '@/components/kanban/modals/UploadDocumentosPendentesModal';
import { KANBAN_COLUMNS, isTransicaoPermitida, getModalParaTransicao } from '@/lib/kanban-rules';
import { moverCard, reordenarCards } from '@/features/projetos/actions';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { KanbanStatus } from '@/types';
import type { KanbanColumn as KanbanColumnType, ProjetoCard } from '@/types';

interface ClienteOption {
  id: string;
  nome: string;
  cpfCnpj: string;
}

interface ColaboradorOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ActiveModal {
  type: string;
  projetoId: string;
  fromStatus: KanbanStatus;
  toStatus: KanbanStatus;
}

interface KanbanBoardProps {
  projetos: ProjetoCard[];
  clientes: ClienteOption[];
  colaboradores: ColaboradorOption[];
  selectedCollaboratorId: string;
  userRole: string;
}

function buildColumns(projetos: ProjetoCard[]): KanbanColumnType[] {
  return KANBAN_COLUMNS.map((col) => ({
    ...col,
    projetos: projetos
      .filter((p) => p.status === col.id)
      .sort((a, b) => a.posicao - b.posicao),
  }));
}

export function KanbanBoard({ 
  projetos, 
  clientes,
  colaboradores,
  selectedCollaboratorId,
  userRole
}: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [columns, setColumns] = useState<KanbanColumnType[]>(() =>
    buildColumns(projetos)
  );

  const handleCollaboratorChange = useCallback(
    (collaboratorId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (collaboratorId) {
        params.set('collaboratorId', collaboratorId);
      } else {
        params.delete('collaboratorId');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [selectedProjeto, setSelectedProjeto] = useState<string | null>(null);
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [missingDocsModalData, setMissingDocsModalData] = useState<{
    clienteId: string;
    documentosPendentes: any[];
  } | null>(null);

  useEffect(() => {
    setColumns(buildColumns(projetos));
  }, [projetos]);

  const handleCardClick = useCallback((projetoId: string) => {
    setSelectedProjeto(projetoId);
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      if (!destination) return;

      const fromStatus = source.droppableId as KanbanStatus;
      const toStatus = destination.droppableId as KanbanStatus;

      if (fromStatus === toStatus && source.index === destination.index) {
        return;
      }

      // Reorder within the same column
      if (fromStatus === toStatus) {
        setColumns((prev) => {
          const newColumns = prev.map((col) => {
            if (col.id !== fromStatus) return col;
            const items = [...col.projetos];
            const [moved] = items.splice(source.index, 1);
            items.splice(destination.index, 0, moved);
            return { ...col, projetos: items };
          });
          return newColumns;
        });

        const column = columns.find((c) => c.id === fromStatus);
        if (!column) return;

        const items = [...column.projetos];
        const [moved] = items.splice(source.index, 1);
        items.splice(destination.index, 0, moved);

        const updates = items.map((item, idx) => ({
          id: item.id,
          posicao: idx,
        }));

        const result = await reordenarCards(updates);
        if (!result.success) {
          toast.error(result.error ?? 'Erro ao reordenar projetos');
          setColumns(buildColumns(projetos));
        }
        return;
      }

      // Moving to a different column — check rules
      if (!isTransicaoPermitida(fromStatus, toStatus)) {
        toast.error(
          `Transição de "${getLabelForStatus(fromStatus)}" para "${getLabelForStatus(toStatus)}" não é permitida`
        );
        return;
      }

      // Check if a modal is needed for this transition
      const modalType = getModalParaTransicao(fromStatus, toStatus);
      if (modalType) {
        setActiveModal({
          type: modalType,
          projetoId: draggableId,
          fromStatus,
          toStatus,
        });
        return;
      }

      // Direct move (no modal needed) with optimistic update
      setColumns((prev) => {
        const newColumns = prev.map((col) => {
          if (col.id === fromStatus) {
            return {
              ...col,
              projetos: col.projetos.filter((p) => p.id !== draggableId),
            };
          }
          if (col.id === toStatus) {
            const sourceCol = prev.find((c) => c.id === fromStatus);
            const movedProjeto = sourceCol?.projetos.find(
              (p) => p.id === draggableId
            );
            if (!movedProjeto) return col;
            const items = [...col.projetos];
            items.splice(destination.index, 0, {
              ...movedProjeto,
              status: toStatus,
            });
            return { ...col, projetos: items };
          }
          return col;
        });
        return newColumns;
      });

      const moveResult = await moverCard(draggableId, toStatus);
      if (!moveResult.success) {
        toast.error(moveResult.error ?? 'Erro ao mover projeto');
        setColumns(buildColumns(projetos));
      } else {
        toast.success('Projeto movido com sucesso');
      }
    },
    [columns, projetos]
  );

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleModalSubmit = useCallback(
    async (formData: FormData) => {
      if (!activeModal) return;

      const result = await moverCard(
        activeModal.projetoId,
        activeModal.toStatus,
        formData
      );

      if (result.success) {
        toast.success('Projeto movido com sucesso');
        setActiveModal(null);
      } else {
        toast.error(result.error ?? 'Erro ao mover projeto');
      }
    },
    [activeModal]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projetos</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Gerencie o fluxo dos seus projetos de crédito rural
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Collaborator Filter */}
          {userRole === "ADMIN" && colaboradores && colaboradores.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Responsável:</span>
              <select
                value={selectedCollaboratorId}
                onChange={(e) => handleCollaboratorChange(e.target.value)}
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Todos os Colaboradores</option>
                {colaboradores.map((colab) => (
                  <option key={colab.id} value={colab.id}>
                    {colab.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCriarModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Create Project Modal */}
      <CriarProjetoModal
        isOpen={showCriarModal}
        onClose={() => setShowCriarModal(false)}
        onSuccess={(data) => {
          if (data.missingDocuments && data.missingDocuments.length > 0 && data.clienteId) {
            setMissingDocsModalData({
              clienteId: data.clienteId,
              documentosPendentes: data.missingDocuments,
            });
          }
        }}
        clientes={clientes}
      />

      {/* Upload Pendentes Modal */}
      {missingDocsModalData && (
        <UploadDocumentosPendentesModal
          isOpen={true}
          onClose={() => setMissingDocsModalData(null)}
          clienteId={missingDocsModalData.clienteId}
          documentosPendentes={missingDocsModalData.documentosPendentes}
          onUploadSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Transition Modal */}
      {activeModal && (
        <TransicaoModalWrapper
          activeModal={activeModal}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

/* ─── Transition Modal Wrapper ─────────────────────────────── */

interface TransicaoModalWrapperProps {
  activeModal: ActiveModal;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

function TransicaoModalWrapper({
  activeModal,
  onClose,
  onSubmit,
}: TransicaoModalWrapperProps) {
  const [loading, setLoading] = useState(false);

  const config = useMemo(() => getTransicaoConfig(activeModal.type), [activeModal.type]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg}`}>
                <config.Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {config.title}
                </h2>
                <p className="text-sm text-text-tertiary">
                  {config.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label="Fechar"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label
                  htmlFor={`transicao-${field.name}`}
                  className="block text-sm font-medium text-text-primary"
                >
                  {field.label}{' '}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`transicao-${field.name}`}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
                    disabled={loading}
                  />
                ) : field.type === 'number' ? (
                  <input
                    id={`transicao-${field.name}`}
                    type="number"
                    name={field.name}
                    step="0.01"
                    min="0"
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input
                      id={`transicao-${field.name}`}
                      type="checkbox"
                      name={field.name}
                      value="true"
                      required={field.required}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-text-secondary">
                      {field.placeholder}
                    </span>
                  </div>
                ) : (
                  <input
                    id={`transicao-${field.name}`}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

import {
  X as XIcon,
  Loader2 as LoaderIcon,
  Search,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

function getLabelForStatus(status: KanbanStatus): string {
  const col = KANBAN_COLUMNS.find((c) => c.id === status);
  return col?.label ?? status;
}

interface TransicaoField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface TransicaoConfig {
  title: string;
  description: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  fields: TransicaoField[];
}

function getTransicaoConfig(type: string): TransicaoConfig {
  switch (type) {
    case 'analise':
      return {
        title: 'Enviar para Análise',
        description: 'Informe a data de envio para análise',
        Icon: Search,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        fields: [
          {
            name: 'dataEnvioAnalise',
            label: 'Data de Envio para Análise',
            type: 'date',
            placeholder: '',
            required: true,
          },
        ],
      };
    case 'pendencia':
      return {
        title: 'Registrar Pendência',
        description: 'Preencha os dados da pendência encontrada',
        Icon: AlertTriangle,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        fields: [
          {
            name: 'dataResposta',
            label: 'Data da Resposta',
            type: 'date',
            placeholder: '',
            required: true,
          },
          {
            name: 'dataOcorrencia',
            label: 'Data da Ocorrência',
            type: 'date',
            placeholder: '',
            required: true,
          },
          {
            name: 'observacao',
            label: 'Observação',
            type: 'textarea',
            placeholder: 'Descreva a pendência encontrada...',
            required: true,
          },
        ],
      };
    case 'liberado':
      return {
        title: 'Liberar Projeto',
        description: 'Informe os valores do projeto liberado',
        Icon: CheckCircle2,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        fields: [
          {
            name: 'valorProjeto',
            label: 'Valor do Projeto (R$)',
            type: 'number',
            placeholder: '0,00',
            required: true,
          },
          {
            name: 'comissao',
            label: 'Comissão (R$)',
            type: 'number',
            placeholder: '0,00',
            required: true,
          },
        ],
      };
    case 'pago':
      return {
        title: 'Confirmar Pagamento',
        description: 'Confirme os dados do pagamento',
        Icon: DollarSign,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        fields: [
          {
            name: 'dataPagamento',
            label: 'Data do Pagamento',
            type: 'date',
            placeholder: '',
            required: true,
          },
          {
            name: 'confirmacao',
            label: 'Confirmação',
            type: 'checkbox',
            placeholder: 'Confirmo que o pagamento foi realizado',
            required: true,
          },
        ],
      };
    default:
      return {
        title: 'Transição',
        description: 'Confirme a transição do projeto',
        Icon: CheckCircle2,
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        fields: [],
      };
  }
}

export default KanbanBoard;
