import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { buscarTiposDocumento } from "@/features/configuracoes/actions";
import { ConfiguracoesClient } from "./ConfiguracoesClient";

export default async function ConfiguracoesPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const tiposDocumentos = await buscarTiposDocumento();

  return <ConfiguracoesClient initialTiposDocumentos={tiposDocumentos} />;
}

export const runtime = 'edge';
