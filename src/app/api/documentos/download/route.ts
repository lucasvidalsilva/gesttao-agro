import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Acesso negado para o perfil VISUALIZADOR baixar/visualizar documentos
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

    // Gerar URL assinada com validade de 60 segundos
    const { data, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(documento.nomeStorage, 60);

    if (signedUrlError || !data?.signedUrl) {
      return NextResponse.json(
        { error: `Erro ao gerar link de acesso: ${signedUrlError?.message || "URL nula"}` },
        { status: 500 }
      );
    }

    // Redireciona o navegador para a URL assinada temporária
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
