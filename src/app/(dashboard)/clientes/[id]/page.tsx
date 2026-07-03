import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarClienteDetalhe } from "@/features/clientes/actions";
import { prisma } from "@/lib/prisma";
import ClienteDetailClient from "./ClienteDetailClient";

interface ClienteDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClienteDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const cliente = await buscarClienteDetalhe(id);

  if (!cliente) {
    return { title: "Cliente não encontrado | Gestão Agro" };
  }

  return {
    title: `${cliente.nome} | Gestão Agro`,
    description: `Detalhes do cliente ${cliente.nome}`,
  };
}

export default async function ClienteDetailPage({ params }: ClienteDetailPageProps) {
  const { id } = await params;
  const cliente = await buscarClienteDetalhe(id);

  if (!cliente) {
    notFound();
  }

  const tiposDocumentos = await prisma.tipoDocumento.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return <ClienteDetailClient cliente={cliente} tiposDocumentos={tiposDocumentos} />;
}


