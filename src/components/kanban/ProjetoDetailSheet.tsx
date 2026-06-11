'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  User,
  FileText,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { buscarProjetoDetalhe } from '@/features/projetos/actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KANBAN_COLUMNS } from '@/lib/kanban-rules';
import { formatMoeda, formatCPFCNPJ } from '@/utils/format';
import type { TipoEvento } from '@prisma/client';

type ProjetoDetalhe = Awaited<ReturnType<typeof buscarProjetoDetalhe>>;

interface ProjetoDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projetoId: string | null;
}

interface CollapsibleSectionProps {
  titulo: string;
  icone: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

function CollapsibleSection({
  titulo,
  icone,
  defaultOpen = true,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-text-tertiary">{icone}</span>
          <span className="text-sm font-semibold text-text-primary">
            {titulo}
          </span>
          {badge}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-tertiary" />
        )}
      </button>
      {open && <div className="px-6 pb-4">{children}</div>}
    </div>
  );
}

function getStatusConfig(status: string) {
  const col = KANBAN_COLUMNS.find((c) => c.id === status);
  return col ?? KANBAN_COLUMNS[0];
}

function formatDatetime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

function getEventoConfig(tipo: TipoEvento) {
  switch (tipo) {
    case 'CRIACAO':
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'bg-green-100 text-green-600 border-green-200',
      };
    case 'MOVIMENTACAO':
      return {
        icon: <ArrowRight className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-600 border-blue-200',
      };
    case 'UPLOAD':
      return {
        icon: <Upload className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-600 border-purple-200',
      };
    case 'ALTERACAO':
      return {
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-amber-100 text-amber-600 border-amber-200',
      };
    case 'OBSERVACAO':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-600 border-gray-200',
      };
    default:
      return {
        icon: <Circle className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-1.5">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-text-primary text-right max-w-[60%]">
        {value ?? '—'}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse px-6 py-5 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded-lg bg-gray-200" />
        <div className="h-5 w-1/4 rounded-full bg-gray-200" />
      </div>

      {/* Info section skeleton */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Checklist skeleton */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="h-4 w-40 rounded bg-gray-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-24 rounded bg-gray-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-2.5 w-20 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjetoDetailSheet({
  isOpen,
  onClose,
  projetoId,
}: ProjetoDetailSheetProps) {
  const [projeto, setProjeto] = useState<ProjetoDetalhe>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjeto = useCallback(async (id: string) => {
    setLoading(true);
    const data = await buscarProjetoDetalhe(id);
    setProjeto(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && projetoId) {
      fetchProjeto(projetoId);
    } else {
      setProjeto(null);
    }
  }, [isOpen, projetoId, fetchProjeto]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusConfig = projeto ? getStatusConfig(projeto.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-[480px] max-w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
        {loading || !projeto ? (
          <>
            {/* Loading Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LoadingSkeleton />
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {projeto.nome}
                </h2>
                {statusConfig && (
                  <span
                    className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary shrink-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Informações */}
              <CollapsibleSection
                titulo="Informações"
                icone={<User className="h-4 w-4" />}
                defaultOpen={true}
              >
                <div className="space-y-0.5">
                  <InfoRow
                    label="Cliente"
                    value={projeto.cliente.nome}
                  />
                  <InfoRow
                    label="CPF/CNPJ"
                    value={formatCPFCNPJ(projeto.cliente.cpfCnpj)}
                  />
                  <InfoRow
                    label="Responsável"
                    value={projeto.responsavel.name}
                  />
                  <InfoRow
                    label="Criado por"
                    value={projeto.criador.name}
                  />
                  <InfoRow
                    label="Data de Início"
                    value={formatDateOnly(projeto.dataInicio)}
                  />
                  <InfoRow
                    label="Data de Criação"
                    value={formatDatetime(projeto.createdAt)}
                  />
                </div>
              </CollapsibleSection>

              {/* Valores - only when valorProjeto exists */}
              {projeto.valorProjeto != null && (
                <CollapsibleSection
                  titulo="Valores"
                  icone={<FileText className="h-4 w-4" />}
                  defaultOpen={true}
                >
                  <div className="space-y-0.5">
                    <InfoRow
                      label="Valor do Projeto"
                      value={
                        <span className="text-green-700 font-semibold">
                          {formatMoeda(projeto.valorProjeto)}
                        </span>
                      }
                    />
                    {projeto.comissao != null && (
                      <InfoRow
                        label="Comissão"
                        value={
                          <span className="text-brand-700 font-semibold">
                            {formatMoeda(projeto.comissao)}
                          </span>
                        }
                      />
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Checklist Documental */}
              <CollapsibleSection
                titulo="Checklist Documental"
                icone={<CheckCircle2 className="h-4 w-4" />}
                defaultOpen={true}
                badge={
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
                    {
                      projeto.checklistItems.filter((item) => item.enviado)
                        .length
                    }
                    /{projeto.checklistItems.length}
                  </span>
                }
              >
                <div className="space-y-1.5">
                  {projeto.checklistItems.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-2">
                      Nenhum item no checklist
                    </p>
                  ) : (
                    projeto.checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50/50"
                      >
                        {item.enviado ? (
                          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-500" />
                        ) : (
                          <Circle className="h-4.5 w-4.5 shrink-0 text-gray-300" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${item.enviado ? 'text-text-primary' : 'text-text-secondary'}`}
                          >
                            {item.nome}
                            {item.obrigatorio && (
                              <span className="text-red-400 ml-0.5">*</span>
                            )}
                          </p>
                          {item.descricao && (
                            <p className="text-xs text-text-tertiary truncate">
                              {item.descricao}
                            </p>
                          )}
                        </div>
                        {item.documento && (
                          <a
                            href={`/api/documentos/download?id=${item.documento.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-brand-600 transition-colors hover:bg-brand-50"
                            title="Baixar documento"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleSection>

              {/* Documentos */}
              <CollapsibleSection
                titulo="Documentos"
                icone={<Upload className="h-4 w-4" />}
                defaultOpen={false}
                badge={
                  projeto.documentos.length > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
                      {projeto.documentos.length}
                    </span>
                  ) : undefined
                }
              >
                <div className="space-y-1.5">
                  {projeto.documentos.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-2">
                      Nenhum documento enviado
                    </p>
                  ) : (
                    projeto.documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 shrink-0">
                          <FileText className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {doc.nomeOriginal}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {formatDatetime(doc.createdAt)}
                          </p>
                        </div>
                        <a
                          href={`/api/documentos/download?id=${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-brand-600 transition-colors hover:bg-brand-50"
                          title="Baixar"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleSection>

              {/* Histórico (Timeline) */}
              <CollapsibleSection
                titulo="Histórico"
                icone={<Clock className="h-4 w-4" />}
                defaultOpen={false}
                badge={
                  projeto.historicos.length > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
                      {projeto.historicos.length}
                    </span>
                  ) : undefined
                }
              >
                <div className="relative">
                  {projeto.historicos.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-2">
                      Nenhum evento registrado
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {projeto.historicos.map((evento, index) => {
                        const cfg = getEventoConfig(evento.tipo);
                        const isLast =
                          index === projeto.historicos.length - 1;

                        return (
                          <div
                            key={evento.id}
                            className="relative flex gap-3 pb-4 last:pb-0"
                          >
                            {/* Timeline line */}
                            {!isLast && (
                              <div className="absolute left-[15px] top-9 bottom-0 w-px bg-gray-200" />
                            )}

                            {/* Icon */}
                            <div
                              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cfg.color}`}
                            >
                              {cfg.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm text-text-primary leading-snug">
                                {evento.descricao}
                              </p>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                {evento.user?.name && (
                                  <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                    <User className="h-3 w-3" />
                                    {evento.user.name}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                  <Calendar className="h-3 w-3" />
                                  {formatDatetime(evento.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
