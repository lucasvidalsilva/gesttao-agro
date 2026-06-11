"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  nomeOriginal: string;
  url: string;
  tamanho: number;
  tipo: string;
}

interface FileUploadProps {
  projetoId?: string;
  clienteId?: string;
  checklistItemId?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  compact?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(tipo: string) {
  if (tipo.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
  if (tipo === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

export default function FileUpload({
  projetoId,
  clienteId,
  checklistItemId,
  onUploadComplete,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx",
  maxSizeMB = 10,
  label = "Arraste arquivos aqui ou clique para selecionar",
  compact = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    status: "uploading" | "success" | "error";
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      setUploadProgress({ fileName: file.name, status: "uploading" });

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (projetoId) formData.append("projetoId", projetoId);
        if (clienteId) formData.append("clienteId", clienteId);
        if (checklistItemId) formData.append("checklistItemId", checklistItemId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro no upload");
        }

        setUploadProgress({ fileName: file.name, status: "success" });
        toast.success(`"${file.name}" enviado com sucesso`);
        onUploadComplete?.(data.documento);

        setTimeout(() => setUploadProgress(null), 2000);
      } catch (error) {
        setUploadProgress({ fileName: file.name, status: "error" });
        toast.error(
          error instanceof Error ? error.message : "Erro ao enviar arquivo"
        );
        setTimeout(() => setUploadProgress(null), 3000);
      } finally {
        setUploading(false);
      }
    },
    [projetoId, clienteId, checklistItemId, maxSizeMB, onUploadComplete]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(handleUpload);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(handleUpload);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-green-400 bg-green-50/50"
            : "border-gray-200 hover:border-green-300 hover:bg-gray-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-green-500" : "text-gray-300"}`}
        />
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, imagens, Word, Excel — Máximo {maxSizeMB}MB
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            uploadProgress.status === "uploading"
              ? "bg-blue-50 border-blue-100"
              : uploadProgress.status === "success"
                ? "bg-green-50 border-green-100"
                : "bg-red-50 border-red-100"
          } animate-slide-up`}
        >
          {uploadProgress.status === "uploading" && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          )}
          {uploadProgress.status === "success" && (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          )}
          {uploadProgress.status === "error" && (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span className="text-sm text-gray-700 truncate">
            {uploadProgress.fileName}
          </span>
          {uploadProgress.status === "uploading" && (
            <button
              onClick={() => setUploadProgress(null)}
              className="ml-auto p-1 hover:bg-white/50 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
