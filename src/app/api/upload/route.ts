import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role === "VISUALIZADOR") {
      return NextResponse.json(
        { error: "Acesso negado: Perfil visualizador não possui permissão para upload" },
        { status: 403 }
      );
    }

    // Rate Limit: máximo de 10 uploads por minuto por usuário
    const limiter = rateLimit(`upload:${session.user.id}`, {
      intervalMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Muitas requisições. Limite de uploads excedido (máximo 10 por minuto). Tente novamente em breve." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projetoId = formData.get("projetoId") as string | null;
    const clienteId = formData.get("clienteId") as string | null;
    const checklistItemId = formData.get("checklistItemId") as string | null;
    const tipoDocumentoId = formData.get("tipoDocumentoId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido" },
        { status: 400 }
      );
    }

    let folder = "geral";
    if (projetoId) folder = `projetos/${projetoId}`;
    else if (clienteId) folder = `clientes/${clienteId}`;

    let uploadResult;
    try {
      uploadResult = await uploadFile(file, folder);
    } catch (uploadError: any) {
      return NextResponse.json(
        { error: `Erro ao salvar arquivo: ${uploadError.message || "Erro interno"}` },
        { status: 500 }
      );
    }

    const { storageName } = uploadResult;

    // Criar o registro no banco com um placeholder temporário para a URL
    const documento = await prisma.documentoUpload.create({
      data: {
        nomeOriginal: file.name,
        nomeStorage: storageName,
        url: `/api/documentos/download?id=PENDING`,
        tamanho: file.size,
        tipo: file.type,
        uploadPorId: session.user.id,
        projetoId: projetoId || undefined,
        clienteId: clienteId || undefined,
        checklistItemId: checklistItemId || undefined,
        tipoDocumentoId: tipoDocumentoId || undefined,
      },
    });

    // Atualiza a URL contendo o ID real gerado pelo banco para a rota de download segura
    const updatedDocumento = await prisma.documentoUpload.update({
      where: { id: documento.id },
      data: {
        url: `/api/documentos/download?id=${documento.id}`,
      },
    });

    if (checklistItemId) {
      await prisma.documentoChecklist.update({
        where: { id: checklistItemId },
        data: { enviado: true },
      });
    }

    if (projetoId) {
      await prisma.historicoEvento.create({
        data: {
          tipo: "UPLOAD",
          descricao: `Documento "${file.name}" enviado`,
          projetoId,
          userId: session.user.id,
          dados: JSON.stringify({ documentoId: updatedDocumento.id, nomeOriginal: file.name }),
        },
      });
    }

    return NextResponse.json({ documento: updatedDocumento }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
