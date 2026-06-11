'use client';

import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import type { KanbanColumn as KanbanColumnType } from '@/types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick: (projetoId: string) => void;
}

const DOT_COLORS: Record<string, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
};

const COUNT_BADGE_COLORS: Record<string, string> = {
  gray: 'bg-gray-200 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
};

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const dotColor = DOT_COLORS[column.color] ?? 'bg-gray-400';
  const countBadge = COUNT_BADGE_COLORS[column.color] ?? 'bg-gray-200 text-gray-700';

  return (
    <div className="flex w-[300px] flex-shrink-0 flex-col">
      {/* Column Header */}
      <div
        className={`mb-3 flex items-center justify-between rounded-xl border px-4 py-3 ${column.bgColor} ${column.borderColor}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <h3 className={`text-sm font-semibold ${column.textColor}`}>
            {column.label}
          </h3>
        </div>
        <span
          className={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold ${countBadge}`}
        >
          {column.projetos.length}
        </span>
      </div>

      {/* Droppable Zone */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[500px] flex-1 flex-col gap-2.5 rounded-xl border border-dashed p-2 transition-colors duration-200 ${
              snapshot.isDraggingOver
                ? 'border-brand-300 bg-brand-50/50'
                : 'border-transparent bg-gray-50/50'
            }`}
          >
            {column.projetos.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-text-tertiary select-none">
                  Nenhum projeto
                </p>
              </div>
            )}

            {column.projetos.map((projeto, index) => (
              <KanbanCard
                key={projeto.id}
                projeto={projeto}
                index={index}
                onClick={() => onCardClick(projeto.id)}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;
