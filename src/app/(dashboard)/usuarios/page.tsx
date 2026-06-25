import { buscarUsuarios } from "@/features/usuarios/actions";
import { requireAdmin } from "@/lib/auth-utils";
import UsuariosClient from "./UsuariosClient";

export const metadata = {
  title: "Usuários | Gestão Agro",
  description: "Gestão de usuários do sistema",
};

export default async function UsuariosPage() {
  await requireAdmin();
  const usuarios = await buscarUsuarios();
  return <UsuariosClient usuarios={usuarios} />;
}

export const runtime = 'edge';
