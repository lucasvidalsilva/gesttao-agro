"use client";

import KanbanBoard from "@/components/kanban/KanbanBoard";
import type { ProjetoCard } from "@/types";

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
}

interface Colaborador {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjetosClient({
  projetos,
  clientes,
  colaboradores,
  selectedCollaboratorId,
  userRole,
}: {
  projetos: ProjetoCard[];
  clientes: Cliente[];
  colaboradores: Colaborador[];
  selectedCollaboratorId: string;
  userRole: string;
}) {
  return (
    <KanbanBoard 
      projetos={projetos} 
      clientes={clientes} 
      colaboradores={colaboradores}
      selectedCollaboratorId={selectedCollaboratorId}
      userRole={userRole}
    />
  );
}
