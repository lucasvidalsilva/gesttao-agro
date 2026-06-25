"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};

export async function buscarTiposDocumento() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  
  return prisma.tipoDocumento.findMany({
    orderBy: { createdAt: "asc" }
  });
}

export async function criarTipoDocumento(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }
  
  const nome = formData.get("nome") as string;
  const descricao = formData.get("descricao") as string;
  const obrigatorio = formData.get("obrigatorio") === "on" || formData.get("obrigatorio") === "true";
  
  if (!nome || nome.trim() === "") {
    return { success: false, error: "Nome é obrigatório" };
  }

  await prisma.tipoDocumento.create({
    data: {
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : null,
      obrigatorio,
      ativo: true
    }
  });

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function alternarStatusTipoDocumento(id: string, ativo: boolean): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  await prisma.tipoDocumento.update({
    where: { id },
    data: { ativo }
  });

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function excluirTipoDocumento(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  const hasDocuments = await prisma.documentoUpload.findFirst({
    where: { tipoDocumentoId: id }
  });

  if (hasDocuments) {
    return { success: false, error: "Não é possível excluir. Já existem documentos utilizando este tipo. Tente inativá-lo." };
  }

  await prisma.tipoDocumento.delete({
    where: { id }
  });

  revalidatePath("/configuracoes");
  return { success: true };
}
