import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Uploads a file.
 * In production/Cloudflare environment, saves to R2 bucket.
 * In development environment, saves to the local filesystem under public/uploads.
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

  const isCloudflare =
    process.env.NODE_ENV === "production" ||
    process.env.CF_PAGES === "1" ||
    typeof (globalThis as any).EdgeRuntime !== "undefined";

  if (isCloudflare) {
    const { env } = getCloudflareContext() as any;
    const bucket = env.BUCKET;
    if (!bucket) {
      throw new Error("R2 bucket binding 'BUCKET' not found in Cloudflare environment.");
    }
    const fileBuffer = await file.arrayBuffer();
    await bucket.put(storageName, fileBuffer, {
      httpMetadata: { contentType: file.type },
    });
  } else {
    // Dynamic import to prevent bundler errors on the Edge
    const fs = await import("fs/promises");
    const path = await import("path");
    
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
 * In production/Cloudflare, removes from R2.
 * In development, removes from the local filesystem.
 */
export async function deleteFile(storageName: string): Promise<void> {
  const isCloudflare =
    process.env.NODE_ENV === "production" ||
    process.env.CF_PAGES === "1" ||
    typeof (globalThis as any).EdgeRuntime !== "undefined";

  if (isCloudflare) {
    const { env } = getCloudflareContext() as any;
    const bucket = env.BUCKET;
    if (bucket) {
      await bucket.delete(storageName);
    }
  } else {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      
      const filePath = path.join(process.cwd(), "public", "uploads", storageName);
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("Could not delete local file from development storage:", e);
    }
  }
}
