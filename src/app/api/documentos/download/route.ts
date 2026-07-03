import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// Inicialização Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "documentos";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role === "VISUALIZADOR") {
      return NextResponse.json(
        { error: "Acesso negado: Perfil visualizador não possui permissão para visualizar ou baixar documentos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do documento é obrigatório" }, { status: 400 });
    }

    const documento = await prisma.documentoUpload.findUnique({
      where: { id },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    // Registrar o log de auditoria
    await prisma.historicoEvento.create({
      data: {
        tipo: "DOWNLOAD",
        descricao: `Download do documento "${documento.nomeOriginal}"`,
        projetoId: documento.projetoId,
        userId: session.user.id,
        dados: JSON.stringify({ documentoId: documento.id, nomeOriginal: documento.nomeOriginal }),
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", documento.tipo);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(documento.nomeOriginal)}"`);

    const mode = process.env.DEPLOYMENT_MODE || "on-premise";

    if (mode === "production") {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(documento.nomeStorage);

      if (error || !data) {
        console.error("Supabase download error:", error);
        return NextResponse.json({ error: "Arquivo não encontrado no storage" }, { status: 404 });
      }

      return new NextResponse(data, { headers });
    } else {
      const filePath = path.join(process.cwd(), "public", "uploads", documento.nomeStorage);
      try {
        const fileBuffer = await fs.readFile(filePath);
        return new NextResponse(fileBuffer, { headers });
      } catch (e) {
        return NextResponse.json({ error: "Arquivo local não encontrado" }, { status: 404 });
      }
    }
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
