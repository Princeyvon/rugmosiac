// Durable file storage for studio uploads (images, lookbook PDFs).
// The live site runs on stateless edge workers with no writable disk, so every
// upload goes to the private "product-images" bucket and is served back
// through /api/public/img/* or /api/public/download/*.

const BUCKET = "product-images";
const PREFIX = "uploads";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120) || "file";
}

export async function storeUpload(
  filename: string,
  bytes: Uint8Array,
  contentType: string,
  namePrefix = "",
): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const unique = `${namePrefix}${Date.now()}-${safeName(filename)}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(`${PREFIX}/${unique}`, bytes, { contentType, upsert: true });
  if (error) throw new Error(`The file could not be saved: ${error.message}`);
  return unique;
}

/** Looks up a stored file by name; also checks older upload locations. */
export async function readUpload(
  rawPath: string,
): Promise<{ bytes: Uint8Array; contentType: string; name: string } | null> {
  if (!rawPath || rawPath.includes("\0") || rawPath.includes("..")) return null;
  const clean = rawPath.replace(/^\/+/, "");
  const base = clean.split("/").pop() || clean;
  const candidates = Array.from(
    new Set([`${PREFIX}/${base}`, clean, `catalogue/${base}`, base]),
  );
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const key of candidates) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(key);
    if (!error && data) {
      return {
        bytes: new Uint8Array(await data.arrayBuffer()),
        contentType: data.type || guessType(base),
        name: base,
      };
    }
  }
  return null;
}

export function guessType(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}
