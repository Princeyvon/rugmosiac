import * as fs from "node:fs";
import * as path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LOOKBOOK_CONFIG, type LookbookConfig } from "./lookbook-config";

let cachedLookbookConfig: LookbookConfig = { ...DEFAULT_LOOKBOOK_CONFIG };

function getLocalConfigPath(): string {
  return path.join(process.cwd(), "data", "lookbook-config.json");
}

function readDiskConfig(): LookbookConfig | null {
  try {
    const p = getLocalConfigPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return null;
}

function writeDiskConfig(config: LookbookConfig): void {
  try {
    const p = getLocalConfigPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf-8");
  } catch {
    // Ignore
  }
}

export const getLookbookSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<LookbookConfig> => {
    // 1. Try Supabase
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "lookbook_config")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        cachedLookbookConfig = {
          ...DEFAULT_LOOKBOOK_CONFIG,
          ...(data.value as Partial<LookbookConfig>),
        };
        writeDiskConfig(cachedLookbookConfig);
        return cachedLookbookConfig;
      }
    } catch {
      // Fallback to disk
    }

    // 2. Try disk
    const disk = readDiskConfig();
    if (disk) {
      cachedLookbookConfig = { ...DEFAULT_LOOKBOOK_CONFIG, ...disk };
      return cachedLookbookConfig;
    }

    return cachedLookbookConfig;
  }
);

export const saveLookbookSettings = createServerFn({ method: "POST" })
  .validator((data: unknown): LookbookConfig => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid lookbook data");
    }
    const c = data as Partial<LookbookConfig>;
    return {
      pdfUrl: typeof c.pdfUrl === "string" ? c.pdfUrl : DEFAULT_LOOKBOOK_CONFIG.pdfUrl,
      fileName: typeof c.fileName === "string" ? c.fileName : DEFAULT_LOOKBOOK_CONFIG.fileName,
      fileSize: typeof c.fileSize === "string" ? c.fileSize : DEFAULT_LOOKBOOK_CONFIG.fileSize,
      volumeTitle: typeof c.volumeTitle === "string" ? c.volumeTitle : DEFAULT_LOOKBOOK_CONFIG.volumeTitle,
      editionName: typeof c.editionName === "string" ? c.editionName : DEFAULT_LOOKBOOK_CONFIG.editionName,
      subtitle: typeof c.subtitle === "string" ? c.subtitle : DEFAULT_LOOKBOOK_CONFIG.subtitle,
      updatedAt: new Date().toISOString().split("T")[0],
      notes: typeof c.notes === "string" ? c.notes : DEFAULT_LOOKBOOK_CONFIG.notes,
    };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; config: LookbookConfig }> => {
    cachedLookbookConfig = { ...data };
    writeDiskConfig(cachedLookbookConfig);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_settings").upsert(
        {
          key: "lookbook_config",
          value: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch {
      // Memory + disk fallback persisted
    }
    return { ok: true, config: cachedLookbookConfig };
  });

export const uploadLookbookPdfServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): { filename: string; base64: string; fileSize?: string; volumeTitle?: string } => {
    if (!data || typeof data !== "object") throw new Error("Invalid upload payload");
    const d = data as any;
    if (typeof d.filename !== "string" || !d.filename) throw new Error("Missing filename");
    if (typeof d.base64 !== "string" || !d.base64) throw new Error("Missing base64 data");
    return {
      filename: d.filename,
      base64: d.base64,
      fileSize: typeof d.fileSize === "string" ? d.fileSize : undefined,
      volumeTitle: typeof d.volumeTitle === "string" ? d.volumeTitle : undefined,
    };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; pdfUrl: string; config: LookbookConfig }> => {
    // 1. Strict Admin Authentication Check
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();

    // 2. Decode and Clean Buffer
    const cleanBase64 = data.base64.replace(/^data:application\/pdf;base64,/, "").replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    // 3. Strict Security & Malware Inspection (Magic bytes, exploit scanning, 35MB cap)
    const { validateUploadBuffer } = await import("@/lib/security.server");
    const { sanitizedFilename } = validateUploadBuffer(buffer, ["pdf"], {
      filename: data.filename,
      maxBytes: 35_000_000,
    });

    const { saveUploadedPdfFile } = await import("@/lib/studio-store.server");
    const pdfUrl = saveUploadedPdfFile(sanitizedFilename, buffer);

    const updatedConfig: LookbookConfig = {
      ...cachedLookbookConfig,
      pdfUrl,
      fileName: sanitizedFilename,
      fileSize: data.fileSize || `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`,
      volumeTitle: data.volumeTitle || cachedLookbookConfig.volumeTitle || "Volume I · 2026 Edition",
      updatedAt: new Date().toISOString().split("T")[0],
    };

    cachedLookbookConfig = updatedConfig;
    writeDiskConfig(updatedConfig);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_settings").upsert(
        {
          key: "lookbook_config",
          value: updatedConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch {
      // Ignored, disk + cache saved
    }

    return { ok: true, pdfUrl, config: updatedConfig };
  });
