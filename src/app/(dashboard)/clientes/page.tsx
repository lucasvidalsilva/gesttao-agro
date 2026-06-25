import type { Metadata } from "next";
import { buscarClientes } from "@/features/clientes/actions";
import ClientesPageClient from "./ClientesPageClient";

export const metadata: Metadata = {
  title: "Clientes | Gestão Agro",
  description: "Gerenciamento de clientes do sistema Gestão Agro",
};

export default async function ClientesPage() {
  const clientes = await buscarClientes();

  return <ClientesPageClient clientes={clientes} />;
}

export const runtime = 'edge';
