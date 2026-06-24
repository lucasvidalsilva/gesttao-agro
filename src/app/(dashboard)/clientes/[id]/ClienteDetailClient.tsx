"use client";

import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Edit,
  Upload,
  FileText,
  FolderKanban,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Download,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCPFCNPJ, formatTelefone, formatData } from "@/utils/format";
import { KANBAN_COLUMNS } from "@/lib/kanban-rules";
import ClienteFormModal from "@/components/forms/ClienteFormModal";
import type { KanbanStatus } from "@/types";

interface ProjetoItem {
  id: string;
  nome: string;
  status: KanbanStatus;
  dataInicio: Date | string;
  createdAt: Date | string;
  responsavel: {
    name: string;
  };
}

interface DocumentoItem {
  id: string;
  nomeOriginal: string;
  nomeStorage: string;
  url: string;
  tamanho: number;
  tipo: string;
  createdAt: Date | string;
}

interface ClienteData {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  dataNascimento: Date | string | null;
  dataEntrada: Date | string;
  observacoes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  projetos: ProjetoItem[];
  documentos: DocumentoItem[];
}

interface ClienteDetailClientProps {
  cliente: ClienteData;
}

function getStatusConfig(status: KanbanStatus) {
  return KANBAN_COLUMNS.find((col) => col.id === status) ?? KANBAN_COLUMNS[0];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClienteDetailClient({ cliente }: ClienteDetailClientProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("clienteId", cliente.id);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Erro ao enviar arquivo");
          }
        }

        toast.success(
          files.length === 1
            ? "Documento enviado com sucesso!"
            : `${files.length} documentos enviados com sucesso!`
        );
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao enviar documento";
        toast.error(message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [cliente.id, router]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const infoItems = [
    {
      icon: User,
      label: "CPF/CNPJ",
      value: formatCPFCNPJ(cliente.cpfCnpj),
    },
    {
      icon: Phone,
      label: "Telefone",
      value: cliente.telefone ? formatTelefone(cliente.telefone) : null,
    },
    {
      icon: Mail,
      label: "E-mail",
      value: cliente.email,
    },
    {
      icon: Calendar,
      label: "Data de Nascimento",
      value: cliente.dataNascimento ? formatData(cliente.dataNascimento) : null,
    },
    {
      icon: MapPin,
      label: "Data de Entrada",
      value: formatData(cliente.dataEntrada),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{cliente.nome}</h1>
            <p className="text-sm text-text-secondary">
              Cliente desde {formatData(cliente.dataEntrada)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEditForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <Edit className="h-4 w-4" />
          Editar
        </button>
      </div>

      {/* Info Grid */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Informações do Cliente
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                  <Icon className="h-4 w-4 text-text-tertiary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-tertiary">{item.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {item.value || "Não informado"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Observações */}
        {cliente.observacoes && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-medium text-text-tertiary">Observações</p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
              {cliente.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Projetos */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-semibold text-text-primary">
              Projetos do Cliente
            </h2>
            <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-100 px-1.5 text-xs font-semibold text-brand-700">
              {cliente.projetos.length}
            </span>
          </div>
        </div>

        {cliente.projetos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary">
              <FolderKanban className="h-6 w-6 text-text-tertiary" />
            </div>
            <p className="mt-3 text-sm font-medium text-text-secondary">
              Nenhum projeto vinculado a este cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cliente.projetos.map((projeto) => {
              const statusConfig = getStatusConfig(projeto.status);
              return (
                <Link
                  key={projeto.id}
                  href={`/projetos`}
                  className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-tertiary transition-colors group-hover:bg-brand-100">
                      <FolderKanban className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {projeto.nome}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Responsável: {projeto.responsavel.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}
                  >
                    {statusConfig.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Documentos */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-semibold text-text-primary">Documentos</h2>
          <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-100 px-1.5 text-xs font-semibold text-brand-700">
            {cliente.documentos.length}
          </span>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
            isDragging
              ? "border-brand-400 bg-brand-50"
              : "border-border hover:border-brand-300 hover:bg-brand-50/30"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
              isDragging ? "bg-brand-100" : "bg-surface-tertiary"
            }`}
          >
            <Upload
              className={`h-6 w-6 transition-colors duration-200 ${
                isDragging ? "text-brand-600" : "text-text-tertiary"
              }`}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-text-primary">
            {isUploading ? "Enviando..." : "Arraste arquivos aqui ou clique para selecionar"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            PDF, imagens, Word ou Excel — máximo 10MB por arquivo
          </p>
        </div>

        {/* Documents List */}
        {cliente.documentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary">
              <FileText className="h-6 w-6 text-text-tertiary" />
            </div>
            <p className="mt-3 text-sm font-medium text-text-secondary">
              Nenhum documento enviado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cliente.documentos.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-xl border border-border p-3.5 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                    <FileText className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {doc.nomeOriginal}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {formatFileSize(doc.tamanho)} • {formatData(doc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/api/documentos/download?id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-all duration-200 hover:bg-brand-50 hover:text-brand-600"
                    title="Baixar / Visualizar"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ClienteFormModal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        cliente={{
          id: cliente.id,
          nome: cliente.nome,
          cpfCnpj: cliente.cpfCnpj,
          telefone: cliente.telefone,
          email: cliente.email,
          dataNascimento: cliente.dataNascimento
            ? new Date(cliente.dataNascimento).toISOString().split("T")[0]
            : null,
          observacoes: cliente.observacoes,
        }}
      />
    </div>
  );
}
