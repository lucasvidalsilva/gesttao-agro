"use client";

import {
  FileText,
  ArrowRight,
  Upload,
  Edit,
  MessageSquare,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoEvento {
  id: string;
  tipo: string;
  descricao: string;
  dados: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

const tipoConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  CRIACAO: {
    icon: <PlusCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  MOVIMENTACAO: {
    icon: <ArrowRight className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  UPLOAD: {
    icon: <Upload className="w-4 h-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  ALTERACAO: {
    icon: <Edit className="w-4 h-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
  OBSERVACAO: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
};

export default function Timeline({
  eventos,
}: {
  eventos: HistoricoEvento[];
}) {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />

      <div className="space-y-4">
        {eventos.map((evento, index) => {
          const config = tipoConfig[evento.tipo] || tipoConfig.OBSERVACAO;
          return (
            <div
              key={evento.id}
              className="relative flex gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-900">{evento.descricao}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {evento.user.name}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {format(
                        new Date(evento.createdAt),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
