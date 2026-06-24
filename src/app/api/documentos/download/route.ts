import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

    const isCloudflare =
      process.env.NODE_ENV === "production" ||
      process.env.CF_PAGES === "1" ||
      typeof EdgeRuntime !== "undefined";

    const headers = new Headers();
    headers.set("Content-Type", documento.tipo);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(documento.nomeOriginal)}"`);

    if (isCloudflare) {
      const { env } = getCloudflareContext();
      const bucket = env.BUCKET as any; // R2Bucket
      if (!bucket) {
        return NextResponse.json({ error: "Storage indisponível" }, { status: 500 });
      }

      const object = await bucket.get(documento.nomeStorage);
      if (!object) {
        return NextResponse.json({ error: "Arquivo não encontrado no storage" }, { status: 404 });
      }

      return new NextResponse(object.body, { headers });
    } else {
      const fs = await import("fs/promises");
      const path = await import("path");
      
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
