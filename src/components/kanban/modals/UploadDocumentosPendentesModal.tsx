'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TipoDocumento {
  id: string;
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
}

interface UploadDocumentosPendentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  documentosPendentes: TipoDocumento[];
  onUploadSuccess: () => void;
}

export function UploadDocumentosPendentesModal({
  isOpen,
  onClose,
  clienteId,
  documentosPendentes,
  onUploadSuccess,
}: UploadDocumentosPendentesModalProps) {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [documentosConcluidos, setDocumentosConcluidos] = useState<Set<string>>(new Set());

  const handleFileUpload = useCallback(
    async (files: FileList | null, tipoDocumentoId: string) => {
      if (!files || files.length === 0) return;

      setUploadingIds((prev) => new Set(prev).add(tipoDocumentoId));

      try {
        const file = files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clienteId", clienteId);
        formData.append("tipoDocumentoId", tipoDocumentoId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro ao enviar arquivo");
        }

        toast.success(`Documento enviado com sucesso!`);
        setDocumentosConcluidos((prev) => new Set(prev).add(tipoDocumentoId));
        
        // If all mandatory documents are uploaded, automatically refresh and close
        if (documentosConcluidos.size + 1 === documentosPendentes.length) {
          toast.success("Todos os documentos obrigatórios foram enviados!");
          onUploadSuccess();
          setTimeout(() => onClose(), 1500);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao enviar documento";
        toast.error(message);
      } finally {
        setUploadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tipoDocumentoId);
          return newSet;
        });
      }
    },
    [clienteId, documentosConcluidos.size, documentosPendentes.length, onClose, onUploadSuccess]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-amber-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900">Documentos Pendentes</h2>
                <p className="text-sm text-amber-700/80">O cliente possui documentos obrigatórios pendentes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-200/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-text-secondary mb-2">
              Para prosseguir com as análises do projeto, faça o upload dos documentos abaixo. Eles serão vinculados diretamente ao perfil do cliente.
            </p>

            <div className="space-y-3">
              {documentosPendentes.map((doc) => {
                const isUploading = uploadingIds.has(doc.id);
                const isDone = documentosConcluidos.has(doc.id);

                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border p-4 bg-surface-secondary/50">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDone ? 'bg-green-100 text-green-600' : 'bg-surface-tertiary text-text-tertiary'}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`truncate text-sm font-semibold ${isDone ? 'text-green-700' : 'text-text-primary'}`}>
                            {doc.nome}
                          </p>
                          {isDone && (
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Enviado</span>
                          )}
                        </div>
                        {doc.descricao && (
                          <p className="text-xs text-text-tertiary line-clamp-1">{doc.descricao}</p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isDone ? (
                        <div className="h-9 flex items-center px-3 text-sm font-medium text-green-600">
                          Ok!
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => handleFileUpload(e.target.files, doc.id)}
                            disabled={isUploading}
                          />
                          <button
                            disabled={isUploading}
                            className="flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            {isUploading ? "Enviando..." : "Enviar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border p-4 bg-surface-secondary/50">
            <button
              onClick={onClose}
              className="h-10 rounded-lg px-5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              Fechar e enviar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
