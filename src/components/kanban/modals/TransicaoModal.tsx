'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle, Upload, Check, FileText } from 'lucide-react';
import { moverCard } from '@/features/projetos/actions';
import { toast } from 'sonner';
import { KANBAN_COLUMNS } from '@/lib/kanban-rules';
import type { KanbanStatus } from '@/types';

type ModalType =
  | 'analise'
  | 'pendencia'
  | 'liberado'
  | 'pago'
  | 'retorno_analise';

interface TransicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: ModalType;
  projetoId: string;
  fromStatus: string;
  toStatus: string;
}

interface ModalConfig {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  corIcone: string;
}

function getModalConfig(modalType: ModalType): ModalConfig {
  switch (modalType) {
    case 'analise':
      return {
        titulo: 'Enviar para Análise',
        descricao: 'Defina a data de envio e confirme os documentos',
        icone: <Upload className="h-5 w-5" />,
        corIcone: 'bg-blue-100 text-blue-600',
      };
    case 'pendencia':
      return {
        titulo: 'Registrar Pendência',
        descricao: 'Informe os detalhes da pendência encontrada',
        icone: <AlertCircle className="h-5 w-5" />,
        corIcone: 'bg-amber-100 text-amber-600',
      };
    case 'liberado':
      return {
        titulo: 'Marcar como Liberado',
        descricao: 'Informe os valores do projeto e comissão',
        icone: <Check className="h-5 w-5" />,
        corIcone: 'bg-green-100 text-green-600',
      };
    case 'pago':
      return {
        titulo: 'Confirmar Pagamento',
        descricao: 'Registre a data e confirme o recebimento',
        icone: <FileText className="h-5 w-5" />,
        corIcone: 'bg-emerald-100 text-emerald-600',
      };
    case 'retorno_analise':
      return {
        titulo: 'Retornar para Análise',
        descricao: 'Confirme o retorno do projeto para análise',
        icone: <Upload className="h-5 w-5" />,
        corIcone: 'bg-blue-100 text-blue-600',
      };
  }
}

function getStatusLabel(status: string): string {
  const col = KANBAN_COLUMNS.find((c) => c.id === status);
  return col?.label ?? status;
}

function getStatusBadgeClasses(status: string): string {
  const col = KANBAN_COLUMNS.find((c) => c.id === status);
  if (!col) return 'bg-gray-100 text-gray-700';
  return `${col.bgColor} ${col.textColor}`;
}

export function TransicaoModal({
  isOpen,
  onClose,
  modalType,
  projetoId,
  fromStatus,
  toStatus,
}: TransicaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Form fields - analise
  const [dataEnvioAnalise, setDataEnvioAnalise] = useState('');

  // Form fields - pendencia
  const [dataResposta, setDataResposta] = useState('');
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [observacao, setObservacao] = useState('');

  // Form fields - liberado
  const [valorProjeto, setValorProjeto] = useState('');
  const [comissao, setComissao] = useState('');

  // Form fields - pago
  const [dataPagamento, setDataPagamento] = useState('');
  const [confirmacao, setConfirmacao] = useState(false);

  const resetForm = useCallback(() => {
    setErro('');
    setDataEnvioAnalise('');
    setDataResposta('');
    setDataOcorrencia('');
    setObservacao('');
    setValorProjeto('');
    setComissao('');
    setDataPagamento('');
    setConfirmacao(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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

  if (!isOpen) return null;

  const config = getModalConfig(modalType);

  function validateForm(): boolean {
    switch (modalType) {
      case 'analise':
        if (!dataEnvioAnalise) {
          setErro('Informe a data de envio para análise');
          return false;
        }
        return true;
      case 'pendencia':
        if (!dataResposta) {
          setErro('Informe a data da resposta');
          return false;
        }
        if (!dataOcorrencia) {
          setErro('Informe a data da ocorrência');
          return false;
        }
        if (!observacao.trim() || observacao.trim().length < 5) {
          setErro('Observação deve ter no mínimo 5 caracteres');
          return false;
        }
        return true;
      case 'liberado':
        if (
          !valorProjeto ||
          isNaN(parseFloat(valorProjeto)) ||
          parseFloat(valorProjeto) <= 0
        ) {
          setErro('Informe um valor de projeto válido');
          return false;
        }
        if (!comissao || isNaN(parseFloat(comissao)) || parseFloat(comissao) < 0) {
          setErro('Informe um valor de comissão válido');
          return false;
        }
        return true;
      case 'pago':
        if (!dataPagamento) {
          setErro('Informe a data de pagamento');
          return false;
        }
        if (!confirmacao) {
          setErro('Confirme o recebimento da comissão');
          return false;
        }
        return true;
      case 'retorno_analise':
        return true;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');

    if (!validateForm()) return;

    setLoading(true);

    const formData = new FormData();

    switch (modalType) {
      case 'analise':
        formData.set('dataEnvioAnalise', dataEnvioAnalise);
        break;
      case 'pendencia':
        formData.set('dataResposta', dataResposta);
        formData.set('dataOcorrencia', dataOcorrencia);
        formData.set('observacao', observacao.trim());
        break;
      case 'liberado':
        formData.set('valorProjeto', valorProjeto);
        formData.set('comissao', comissao);
        break;
      case 'pago':
        formData.set('dataPagamento', dataPagamento);
        formData.set('confirmacao', String(confirmacao));
        break;
      case 'retorno_analise':
        break;
    }

    const result = await moverCard(
      projetoId,
      toStatus as KanbanStatus,
      formData
    );

    if (result.success) {
      toast.success('Projeto movido com sucesso!');
      onClose();
    } else {
      setErro(result.error ?? 'Erro ao mover projeto');
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.corIcone}`}
              >
                {config.icone}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {config.titulo}
                </h2>
                <p className="text-sm text-text-tertiary">{config.descricao}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status transition indicator */}
          <div className="flex items-center justify-center gap-3 border-b border-gray-100 px-6 py-3 bg-gray-50/50">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(fromStatus)}`}
            >
              {getStatusLabel(fromStatus)}
            </span>
            <svg
              className="h-4 w-4 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(toStatus)}`}
            >
              {getStatusLabel(toStatus)}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Analise Fields */}
            {modalType === 'analise' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="data-envio-analise"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Data de Envio para Análise{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data-envio-analise"
                    type="date"
                    value={dataEnvioAnalise}
                    onChange={(e) => setDataEnvioAnalise(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-800">
                        Checklist Documental
                      </p>
                      <p className="text-xs text-blue-700">
                        Todos os documentos obrigatórios do checklist devem
                        estar marcados como enviados antes de prosseguir. Caso
                        contrário, a movimentação será bloqueada.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pendencia Fields */}
            {modalType === 'pendencia' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="data-resposta"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Data da Resposta <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data-resposta"
                    type="date"
                    value={dataResposta}
                    onChange={(e) => setDataResposta(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="data-ocorrencia"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Data da Ocorrência <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data-ocorrencia"
                    type="date"
                    value={dataOcorrencia}
                    onChange={(e) => setDataOcorrencia(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="observacao"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Observação <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Descreva a pendência encontrada..."
                    rows={4}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                  <p className="text-xs text-text-tertiary">
                    {observacao.length}/2000 caracteres
                  </p>
                </div>
              </>
            )}

            {/* Liberado Fields */}
            {modalType === 'liberado' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="valor-projeto"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Valor do Projeto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary pointer-events-none">
                      R$
                    </span>
                    <input
                      id="valor-projeto"
                      type="number"
                      value={valorProjeto}
                      onChange={(e) => setValorProjeto(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="comissao"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Comissão <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary pointer-events-none">
                      R$
                    </span>
                    <input
                      id="comissao"
                      type="number"
                      value={comissao}
                      onChange={(e) => setComissao(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Pago Fields */}
            {modalType === 'pago' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="data-pagamento"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Data de Pagamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data-pagamento"
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled={loading}
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    disabled={loading}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Confirmo o recebimento da comissão
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Ao marcar, você confirma que a comissão referente a este
                      projeto foi devidamente recebida.
                    </p>
                  </div>
                </label>
              </>
            )}

            {/* Retorno Analise Fields */}
            {modalType === 'retorno_analise' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">
                      Confirmar Retorno para Análise
                    </p>
                    <p className="text-xs text-blue-700">
                      O projeto retornará para a coluna &quot;Em Análise&quot;
                      para ser reavaliado. Essa ação ficará registrada no
                      histórico do projeto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              </div>
            )}

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
                    <Loader2 className="h-4 w-4 animate-spin" />
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
