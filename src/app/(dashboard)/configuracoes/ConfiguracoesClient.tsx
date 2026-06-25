"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ShieldCheck, ShieldAlert, Loader2, FileText, Check, X } from "lucide-react";
import {
  criarTipoDocumento,
  alternarStatusTipoDocumento,
  excluirTipoDocumento,
} from "@/features/configuracoes/actions";

interface TipoDocumento {
  id: string;
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
  ativo: boolean;
}

export function ConfiguracoesClient({ initialTiposDocumentos }: { initialTiposDocumentos: TipoDocumento[] }) {
  const [tipos, setTipos] = useState<TipoDocumento[]>(initialTiposDocumentos);
  const [loading, setLoading] = useState(false);

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const res = await criarTipoDocumento(formData);
      if (res.success) {
        toast.success("Tipo de documento criado com sucesso!");
        e.currentTarget.reset();
        // Recarregar a página para puxar os dados atualizados
        window.location.reload();
      } else {
        toast.error(res.error || "Erro ao criar");
      }
    } catch (err) {
      toast.error("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  async function handleAlternarStatus(id: string, ativo: boolean) {
    try {
      const res = await alternarStatusTipoDocumento(id, ativo);
      if (res.success) {
        toast.success(`Tipo de documento ${ativo ? "ativado" : "desativado"}.`);
        setTipos((prev) => prev.map((t) => (t.id === id ? { ...t, ativo } : t)));
      } else {
        toast.error(res.error || "Erro ao alterar status");
      }
    } catch (err) {
      toast.error("Erro interno");
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita e falhará se já houver documentos enviados com este tipo.")) return;

    try {
      const res = await excluirTipoDocumento(id);
      if (res.success) {
        toast.success("Excluído com sucesso.");
        setTipos((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(res.error || "Erro ao excluir");
      }
    } catch (err) {
      toast.error("Erro interno");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Configurações Gerais</h1>
        <p className="text-sm text-text-tertiary">
          Gerencie os parâmetros globais do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Formulário de Criação */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
              <FileText className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-text-primary">Novo Documento</h2>
            </div>

            <form onSubmit={handleCriar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase">Nome do Documento *</label>
                <input
                  name="nome"
                  required
                  placeholder="Ex: RG/CPF"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase">Descrição (Opcional)</label>
                <input
                  name="descricao"
                  placeholder="Ex: Frente e verso"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="obrigatorio"
                  id="obrigatorio"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                />
                <label htmlFor="obrigatorio" className="text-sm text-text-primary font-medium">
                  Documento Obrigatório
                </label>
              </div>
              <p className="text-[11px] text-text-tertiary ml-6 leading-tight">
                Se marcado, o projeto do cliente não poderá ser criado/avançado até que este documento seja enviado.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar Parâmetro
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-6 bg-surface-secondary/50">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Parâmetros de Documentação</h2>
                <p className="text-xs text-text-tertiary">Lista de documentos parametrizados no sistema.</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {tipos.length === 0 ? (
                <div className="p-8 text-center text-text-tertiary text-sm">
                  Nenhum tipo de documento parametrizado ainda.
                </div>
              ) : (
                tipos.map((tipo) => (
                  <div key={tipo.id} className={`flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors ${!tipo.ativo ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm">{tipo.nome}</span>
                        {tipo.obrigatorio ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 border border-red-200">
                            <ShieldAlert className="h-3 w-3" /> Obrigatório
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                            Opcional
                          </span>
                        )}
                        {!tipo.ativo && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            Inativo
                          </span>
                        )}
                      </div>
                      {tipo.descricao && (
                        <span className="text-xs text-text-tertiary">{tipo.descricao}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAlternarStatus(tipo.id, !tipo.ativo)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                          tipo.ativo
                            ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                        title={tipo.ativo ? "Desativar" : "Ativar"}
                      >
                        {tipo.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleExcluir(tipo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
