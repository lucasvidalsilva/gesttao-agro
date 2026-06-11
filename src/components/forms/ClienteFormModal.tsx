"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarCliente, atualizarCliente } from "@/features/clientes/actions";
import { toast } from "sonner";
import { maskCPFCNPJ, maskTelefone } from "@/utils/format";

interface ClienteEditData {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  dataNascimento: string | null;
  observacoes: string | null;
}

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: ClienteEditData;
}

export default function ClienteFormModal({
  isOpen,
  onClose,
  cliente,
}: ClienteFormModalProps) {
  const isEdit = !!cliente;
  const router = useRouter();

  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cpfCnpj, setCpfCnpj] = useState(
    cliente?.cpfCnpj ? maskCPFCNPJ(cliente.cpfCnpj) : ""
  );
  const [telefone, setTelefone] = useState(
    cliente?.telefone ? maskTelefone(cliente.telefone) : ""
  );
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [dataNascimento, setDataNascimento] = useState(
    cliente?.dataNascimento ?? ""
  );
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (isEdit && cliente) {
      formData.append("id", cliente.id);
    }
    formData.append("nome", nome.trim());
    formData.append("cpfCnpj", cpfCnpj);
    formData.append("telefone", telefone);
    formData.append("email", email.trim());
    formData.append("dataNascimento", dataNascimento);
    formData.append("observacoes", observacoes.trim());

    try {
      const result = isEdit
        ? await atualizarCliente(formData)
        : await criarCliente(formData);

      if (result.success) {
        toast.success(
          isEdit
            ? "Cliente atualizado com sucesso!"
            : "Cliente criado com sucesso!"
        );
        router.refresh();
        handleClose();
      } else {
        setError(result.error ?? "Erro ao salvar cliente");
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (!isEdit) {
        setNome("");
        setCpfCnpj("");
        setTelefone("");
        setEmail("");
        setDataNascimento("");
        setObservacoes("");
      }
      setError(null);
      onClose();
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50 disabled:cursor-not-allowed";

  const labelClasses = "block text-xs font-semibold text-text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors duration-200 hover:bg-surface-tertiary hover:text-text-secondary disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nome + CPF/CNPJ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nome" className={labelClasses}>
                Nome *
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                disabled={isSubmitting}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="cpfCnpj" className={labelClasses}>
                CPF/CNPJ *
              </label>
              <input
                id="cpfCnpj"
                type="text"
                required
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(maskCPFCNPJ(e.target.value))}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Row 2: Telefone + E-mail */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telefone" className={labelClasses}>
                Telefone
              </label>
              <input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                disabled={isSubmitting}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClasses}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={isSubmitting}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Row 3: Data de Nascimento */}
          <div>
            <label htmlFor="dataNascimento" className={labelClasses}>
              Data de Nascimento
            </label>
            <input
              id="dataNascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              disabled={isSubmitting}
              className={inputClasses}
            />
          </div>

          {/* Row 4: Observações */}
          <div>
            <label htmlFor="observacoes" className={labelClasses}>
              Observações
            </label>
            <textarea
              id="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais sobre o cliente..."
              disabled={isSubmitting}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-tertiary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Salvando..."
                : isEdit
                ? "Salvar Alterações"
                : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
