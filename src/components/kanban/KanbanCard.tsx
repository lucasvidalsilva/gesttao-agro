'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProjeto {
  id: string;
  nome: string;
  cliente: {
    nome: string;
  };
  responsavel: {
    name: string | null;
  };
  dataInicio: Date | string;
  createdAt: Date | string;
}

interface KanbanCardProps {
  projeto: KanbanCardProjeto;
  index: number;
  onClick: () => void;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM', { locale: ptBR });
}

function getInitials(name: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function KanbanCard({ projeto, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={projeto.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group rounded-xl border bg-white p-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
            snapshot.isDragging
              ? 'shadow-lg border-brand-300 ring-2 ring-brand-100 rotate-[2deg]'
              : 'shadow-sm border-gray-100 hover:shadow-md hover:border-gray-200'
          }`}
        >
          {/* Project Name */}
          <h4 className="text-sm font-semibold text-text-primary leading-snug mb-2 line-clamp-2">
            {projeto.nome}
          </h4>

          {/* Client Name */}
          <p className="text-xs text-text-secondary mb-3 line-clamp-1">
            {projeto.cliente.nome}
          </p>

          {/* Footer: Responsible + Date */}
          <div className="flex items-center justify-between">
            {/* Responsible Badge */}
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
                {getInitials(projeto.responsavel.name)}
              </div>
              <span className="text-[11px] text-text-tertiary font-medium truncate max-w-[100px]">
                {projeto.responsavel.name ?? 'Sem responsável'}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-text-tertiary">
              <Calendar className="h-3 w-3" />
              <span className="text-[11px] font-medium">
                {formatDate(projeto.dataInicio)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default KanbanCard;
