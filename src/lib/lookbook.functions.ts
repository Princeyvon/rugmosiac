import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LOOKBOOK_CONFIG, type LookbookConfig } from "./lookbook-config";

// The database (site_settings "lookbook_config") is the single source of truth.
// A short in-memory cache only speeds up repeat reads on a warm worker.
let cache: { value: LookbookConfig; at: number } | null = null;
const CACHE_MS = 30_000;

async function readConfig(fresh = false): Promise<LookbookConfig> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "lookbook_config")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value: LookbookConfig = {
    ...DEFAULT_LOOKBOOK_CONFIG,
    ...((data?.value && typeof data.value === "object" ? data.value : {}) as Partial<LookbookConfig>),
  };
  cache = { value, at: Date.now() };
  return value;
}

async function writeConfig(config: LookbookConfig): Promise<LookbookConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("site_settings").upsert(
    { key: "lookbook_config", value: config as never, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(`The lookbook could not be saved: ${error.message}`);
  cache = { value: config, at: Date.now() };
  return config;
}

export const getLookbookSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<LookbookConfig> => {
    try {
      return await readConfig();
    } catch (err) {
      console.error("[lookbook] read failed:", err);
      return cache?.value ?? { ...DEFAULT_LOOKBOOK_CONFIG };
    }
  },
);

export const saveLookbookSettings = createServerFn({ method: "POST" })
  .validator((data: unknown): Partial<LookbookConfig> => {
    if (!data || typeof data !== "object") throw new Error("Invalid lookbook data");
    const c = data as Record<string, unknown>;
    const out: Partial<LookbookConfig> = {};
    for (const k of ["pdfUrl", "fileName", "fileSize", "volumeTitle", "editionName", "subtitle", "notes"] as const) {
      if (typeof c[k] === "string") (out as Record<string, string>)[k] = c[k] as string;
    }
    return out;
  })
  .handler(async ({ data }): Promise<{ ok: boolean; config: LookbookConfig }> => {
    const { requireAdmin, logActivity } = await import("@/lib/admin.server");
    const actor = await requireAdmin("content");
    const current = await readConfig(true);
    const next: LookbookConfig = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const config = await writeConfig(next);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await logActivity(supabaseAdmin as never, actor, {
        action: "lookbook.update",
        entity_type: "lookbook",
        entity_id: "lookbook_config",
        summary: `${actor.name} updated the lookbook details`,
      });
    } catch {
      // logging is best effort
    }
    return { ok: true, config };
  });

export const uploadLookbookPdfServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): { filename: string; base64: string; fileSize?: string; volumeTitle?: string } => {
    if (!data || typeof data !== "object") throw new Error("Invalid upload payload");
    const d = data as Record<string, unknown>;
    if (typeof d.filename !== "string" || !d.filename) throw new Error("Missing filename");
    if (typeof d.base64 !== "string" || !d.base64) throw new Error("Missing file data");
    return {
      filename: d.filename,
      base64: d.base64,
      fileSize: typeof d.fileSize === "string" ? d.fileSize : undefined,
      volumeTitle: typeof d.volumeTitle === "string" ? d.volumeTitle : undefined,
    };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; pdfUrl: string; config: LookbookConfig }> => {
    const { requireAdmin, logActivity } = await import("@/lib/admin.server");
    const actor = await requireAdmin("content");

    const clean = data.base64.replace(/^data:.*?;base64,/, "");
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const { validateUploadBuffer } = await import("@/lib/security.server");
    const { sanitizedFilename } = validateUploadBuffer(bytes as never, ["pdf"], {
      filename: data.filename,
      maxBytes: 35_000_000,
    });

    const { saveUploadedPdfFile } = await import("@/lib/studio-store.server");
    const pdfUrl = await saveUploadedPdfFile(sanitizedFilename, bytes);

    const current = await readConfig(true);
    const config = await writeConfig({
      ...current,
      pdfUrl,
      fileName: sanitizedFilename,
      fileSize: data.fileSize || `${(bytes.length / (1024 * 1024)).toFixed(1)} MB`,
      volumeTitle: data.volumeTitle || current.volumeTitle,
      updatedAt: new Date().toISOString().split("T")[0],
    });
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await logActivity(supabaseAdmin as never, actor, {
        action: "lookbook.upload",
        entity_type: "lookbook",
        entity_id: "lookbook_config",
        summary: `${actor.name} uploaded a new lookbook PDF`,
      });
    } catch {
      // best effort
    }
    return { ok: true, pdfUrl, config };
  });
