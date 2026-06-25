import { buscarProjetos } from "@/features/projetos/actions";
import { buscarClientesSimples } from "@/features/clientes/actions";
import { buscarColaboradores } from "@/features/usuarios/actions";
import { requireAuth } from "@/lib/auth-utils";
import ProjetosClient from "./ProjetosClient";

export const metadata = {
  title: "Projetos | Gestão Agro",
  description: "Kanban de projetos de crédito rural",
};

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ collaboratorId?: string }>;
}) {
  const session = await requireAuth();
  const { collaboratorId } = await searchParams;
  const userRole = session.user.role;

  const [projetos, clientes, colaboradores] = await Promise.all([
    buscarProjetos({ responsavelId: collaboratorId }),
    buscarClientesSimples(),
    userRole === "ADMIN" ? buscarColaboradores() : Promise.resolve([]),
  ]);

  return (
    <ProjetosClient 
      projetos={projetos} 
      clientes={clientes} 
      colaboradores={colaboradores}
      selectedCollaboratorId={collaboratorId || ""}
      userRole={userRole}
    />
  );
}

export const runtime = 'edge';
