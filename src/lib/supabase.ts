import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = "documentos";

export async function uploadFile(
  file: File,
  path: string
): Promise<{ url: string; storageName: string }> {
  const timestamp = Date.now();
  const sanitizedName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageName = `${path}/${timestamp}_${sanitizedName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storageName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro ao enviar arquivo: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageName);

  return { url: publicUrl, storageName };
}

export async function deleteFile(storageName: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storageName]);

  if (error) {
    throw new Error(`Erro ao remover arquivo: ${error.message}`);
  }
}

export function getFileUrl(storageName: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageName);
  return publicUrl;
}
