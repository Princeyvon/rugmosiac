import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs";
import path from "node:path";

export interface AtelierFiguresState {
  fig1Url: string | null;
  fig2Url: string | null;
  swapped: boolean;
}

const STORE_PATH = path.join(process.cwd(), "data", "atelier-figures.json");

function ensureDataDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readAtelierStore(): AtelierFiguresState {
  ensureDataDir();
  if (fs.existsSync(STORE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
      return {
        fig1Url: data.fig1Url || null,
        fig2Url: data.fig2Url || null,
        swapped: Boolean(data.swapped),
      };
    } catch {
      // ignore
    }
  }

  // Check if user uploaded files exist directly in public or src/assets
  const possibleFig1 = ["Gemini_Generated_Image_ltfrk2ltfrk2ltfr.jpeg", "Gemini_Generated_Image_ltfrk2ltfrk2ltfr.jpg", "fig1.jpg", "fig1.jpeg"];
  const possibleFig2 = ["Gemini_Generated_Image_148wsp148wsp148w.jpeg", "Gemini_Generated_Image_148wsp148wsp148w.jpg", "fig2.jpg", "fig2.jpeg"];

  let foundFig1: string | null = null;
  let foundFig2: string | null = null;

  for (const name of possibleFig1) {
    if (fs.existsSync(path.join(process.cwd(), "public", name))) {
      foundFig1 = `/${name}`;
      break;
    }
    if (fs.existsSync(path.join(process.cwd(), "public", "assets", name))) {
      foundFig1 = `/assets/${name}`;
      break;
    }
  }

  for (const name of possibleFig2) {
    if (fs.existsSync(path.join(process.cwd(), "public", name))) {
      foundFig2 = `/${name}`;
      break;
    }
    if (fs.existsSync(path.join(process.cwd(), "public", "assets", name))) {
      foundFig2 = `/assets/${name}`;
      break;
    }
  }

  return {
    fig1Url: foundFig1,
    fig2Url: foundFig2,
    swapped: false,
  };
}

function writeAtelierStore(state: AtelierFiguresState) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export const getAtelierFigures = createServerFn({ method: "GET" }).handler(async () => {
  return readAtelierStore();
});

export const toggleSwapAtelierFigures = createServerFn({ method: "POST" }).handler(async () => {
  const current = readAtelierStore();
  current.swapped = !current.swapped;
  writeAtelierStore(current);
  return current;
});

export const uploadAtelierFigure = createServerFn({ method: "POST" })
  .inputValidator((d: { figure: "fig1" | "fig2"; dataUrl: string; filename?: string }) => d)
  .handler(async ({ data }) => {
    // 1. Strict Admin Authentication
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();

    const match = /^data:([^;]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("Invalid image format. Please select a valid JPG, PNG, or WebP image.");

    const bytes = Buffer.from(match[2], "base64");

    // 2. Strict Magic Bytes & Malware Scanning
    const { validateUploadBuffer } = await import("@/lib/security.server");
    const validated = validateUploadBuffer(bytes, ["image"], {
      filename: data.filename || `${data.figure}.jpg`,
      maxBytes: 15_000_000,
    });

    // Save directly to static assets so bundler and public folder both have the raw bytes
    const publicAssetsDir = path.join(process.cwd(), "public", "assets");
    const srcAssetsDir = path.join(process.cwd(), "src", "assets");
    const uploadsDir = path.join(process.cwd(), "data", "uploads");

    for (const dir of [publicAssetsDir, srcAssetsDir, uploadsDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    const ext = validated.extension;
    const baseTargetName = data.figure === "fig1" ? "craft-rose-tufting" : "craft-blue-scallop";
    const fileNameWithExt = `${baseTargetName}.${ext}`;
    const timestampedName = `${baseTargetName}-${Date.now()}.${ext}`;

    // Write to src/assets (for Vite bundle)
    try {
      fs.writeFileSync(path.join(srcAssetsDir, fileNameWithExt), bytes);
      if (data.figure === "fig1") {
        fs.writeFileSync(path.join(srcAssetsDir, "craft-1.jpg"), bytes);
      } else {
        fs.writeFileSync(path.join(srcAssetsDir, "craft-2.jpg"), bytes);
      }
    } catch (e) {
      console.warn("[atelier.functions] Failed to write to src/assets:", e);
    }

    // Write to public/assets and data/uploads (for direct web serving)
    fs.writeFileSync(path.join(publicAssetsDir, timestampedName), bytes);
    fs.writeFileSync(path.join(uploadsDir, timestampedName), bytes);

    const servedUrl = `/assets/${timestampedName}`;

    // Update store state
    const current = readAtelierStore();
    if (data.figure === "fig1") {
      current.fig1Url = servedUrl;
    } else {
      current.fig2Url = servedUrl;
    }
    writeAtelierStore(current);

    return { ok: true, url: servedUrl, state: current };
  });
