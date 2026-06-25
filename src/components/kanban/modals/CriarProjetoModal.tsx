'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, Plus, Calendar } from 'lucide-react';
import { criarProjeto } from '@/features/projetos/actions';
import { toast } from 'sonner';

interface ClienteOption {
  id: string;
  nome: string;
  cpfCnpj: string;
}

interface CriarProjetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: { projetoId: string; clienteId?: string; missingDocuments?: any[] }) => void;
  clientes: ClienteOption[];
}

export function CriarProjetoModal({
  isOpen,
  onClose,
  onSuccess,
  clientes,
}: CriarProjetoModalProps) {
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputClienteRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setNome('');
    setClienteId('');
    setClienteBusca('');
    setClienteSelecionado(null);
    setShowDropdown(false);
    setDataInicio('');
    setErro('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const clientesFiltrados = clientes.filter((c) => {
    const termo = clienteBusca.toLowerCase();
    return (
      c.nome.toLowerCase().includes(termo) ||
      c.cpfCnpj.toLowerCase().includes(termo)
    );
  });

  function handleSelecionarCliente(cliente: ClienteOption) {
    setClienteId(cliente.id);
    setClienteSelecionado(cliente);
    setClienteBusca(cliente.nome);
    setShowDropdown(false);
  }

  function handleClienteInputChange(value: string) {
    setClienteBusca(value);
    setShowDropdown(true);
    if (clienteSelecionado && value !== clienteSelecionado.nome) {
      setClienteId('');
      setClienteSelecionado(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome do projeto');
      return;
    }
    if (!clienteId) {
      setErro('Selecione um cliente');
      return;
    }
    if (!dataInicio) {
      setErro('Informe a data de início');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set('nome', nome.trim());
    formData.set('clienteId', clienteId);
    formData.set('dataInicio', dataInicio);

    const result = await criarProjeto(formData);

    if (result.success) {
      toast.success('Projeto criado com sucesso!');
      if (onSuccess && result.data) {
        onSuccess(result.data as { projetoId: string; clienteId?: string; missingDocuments?: any[] });
      }
      onClose();
    } else {
      setErro(result.error ?? 'Erro ao criar projeto');
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                <Plus className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Novo Projeto
                </h2>
                <p className="text-sm text-text-tertiary">
                  Preencha os dados para criar um novo projeto
                </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Nome do Projeto */}
            <div className="space-y-1.5">
              <label
                htmlFor="projeto-nome"
                className="block text-sm font-medium text-text-primary"
              >
                Nome do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                id="projeto-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Financiamento Rural - Fazenda São João"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                disabled={loading}
              />
            </div>

            {/* Cliente */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <label
                htmlFor="projeto-cliente"
                className="block text-sm font-medium text-text-primary"
              >
                Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="projeto-cliente"
                  ref={inputClienteRef}
                  type="text"
                  value={clienteBusca}
                  onChange={(e) => handleClienteInputChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                  className={`h-10 w-full rounded-lg border px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                    clienteSelecionado
                      ? 'border-brand-300 bg-brand-50'
                      : 'border-gray-200 bg-white focus:border-brand-400'
                  }`}
                  disabled={loading}
                  autoComplete="off"
                />
                {clienteSelecionado && (
                  <button
                    type="button"
                    onClick={() => {
                      setClienteId('');
                      setClienteSelecionado(null);
                      setClienteBusca('');
                      inputClienteRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-gray-300 hover:text-gray-700"
                    aria-label="Limpar seleção"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && !clienteSelecionado && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {clientesFiltrados.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-tertiary">
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => handleSelecionarCliente(cliente)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-brand-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {cliente.nome}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {cliente.cpfCnpj}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Data de Início */}
            <div className="space-y-1.5">
              <label
                htmlFor="projeto-data-inicio"
                className="block text-sm font-medium text-text-primary"
              >
                Data de Início <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                <input
                  id="projeto-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-text-primary transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error */}
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{erro}</p>
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
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Projeto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
