import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// Inicialização do Supabase (apenas para modo production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "documentos";

/**
 * Uploads a file.
 * In production, saves to Supabase Storage.
 * In on-premise, saves to the local filesystem under public/uploads.
 */
export async function uploadFile(
  file: File,
  folder: string
): Promise<{ url: string; storageName: string }> {
  const timestamp = Date.now();
  const sanitizedName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageName = `${folder}/${timestamp}_${sanitizedName}`;

  const mode = process.env.DEPLOYMENT_MODE || "on-premise";

  if (mode === "production") {
    const fileBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storageName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      throw new Error(`Erro ao fazer upload no Supabase: ${error.message}`);
    }
  } else {
    // Local File System (On-Premise)
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, `${timestamp}_${sanitizedName}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
  }

  // The download URL routes through our secure API download endpoint
  const downloadUrl = `/api/documentos/download?id=`; // Filled in later with the DB document ID
  return { url: downloadUrl, storageName };
}

/**
 * Deletes a file.
 * In production, removes from Supabase Storage.
 * In on-premise, removes from the local filesystem.
 */
export async function deleteFile(storageName: string): Promise<void> {
  const mode = process.env.DEPLOYMENT_MODE || "on-premise";

  if (mode === "production") {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storageName]);
      
    if (error) {
      console.warn("Could not delete file from Supabase storage:", error);
    }
  } else {
    // Local File System (On-Premise)
    try {
      const filePath = path.join(process.cwd(), "public", "uploads", storageName);
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("Could not delete local file from on-premise storage:", e);
    }
  }
}

