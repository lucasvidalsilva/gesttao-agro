import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
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

    const timestamp = Date.now();
    const sanitizedName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    let path = "geral";
    if (projetoId) path = `projetos/${projetoId}`;
    else if (clienteId) path = `clientes/${clienteId}`;

    const storageName = `${path}/${timestamp}_${sanitizedName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storageName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      let friendlyMessage = `Erro no upload: ${uploadError.message}`;
      
      const errMsg = uploadError.message?.toLowerCase() || "";
      if (
        errMsg.includes("bucket") || 
        errMsg.includes("not found") ||
        errMsg.includes("does not exist")
      ) {
        friendlyMessage = `O bucket '${STORAGE_BUCKET}' não foi encontrado no seu Supabase. Por favor, crie um bucket chamado '${STORAGE_BUCKET}' no painel do Supabase Storage e configure as políticas de acesso (RLS) para permitir uploads.`;
      } else if (errMsg.includes("policy") || errMsg.includes("permission") || errMsg.includes("unauthorized")) {
        friendlyMessage = `Permissão negada ao enviar para o bucket '${STORAGE_BUCKET}'. Certifique-se de configurar políticas (RLS) no Supabase permitindo INSERT e SELECT para usuários autenticados.`;
      }

      return NextResponse.json(
        { error: friendlyMessage },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageName);

    const documento = await prisma.documentoUpload.create({
      data: {
        nomeOriginal: file.name,
        nomeStorage: storageName,
        url: publicUrl,
        tamanho: file.size,
        tipo: file.type,
        uploadPorId: session.user.id,
        projetoId: projetoId || undefined,
        clienteId: clienteId || undefined,
        checklistItemId: checklistItemId || undefined,
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
          dados: { documentoId: documento.id, nomeOriginal: file.name },
        },
      });
    }

    return NextResponse.json({ documento }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
