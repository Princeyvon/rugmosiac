import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Sparkles,
  ExternalLink,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ClipboardPaste,
  CheckCircle2,
  Upload,
  Loader2,
} from "lucide-react";

interface MediaImage {
  id?: string;
  url: string;
  alt: string | null;
  sort_order?: number;
  colorway_id?: string | null;
}

interface MediaGalleryManagerProps {
  images: MediaImage[];
  colorways?: Array<{ id?: string; name: string }>;
  onChange: (images: MediaImage[]) => void;
  onUploadFile?: (file: File) => Promise<string>;
}

// Curated architectural & luxury textile editorial photography from Unsplash
const UNSPLASH_EDITORIAL_PRESETS = [
  {
    title: "Highland Loom Close-Up",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    alt: "Macro wool yarn texture and woven structure",
  },
  {
    title: "Minimalist Kigali Interior",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    alt: "Sculptural rug staged in sunlit living room",
  },
  {
    title: "Artisan Workshop Staging",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    alt: "Handcrafted textile lying on polished concrete",
  },
  {
    title: "Gallery Hall Perspective",
    url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    alt: "Bespoke runner extending through bright contemporary corridor",
  },
];

export function MediaGalleryManager({
  images,
  colorways = [],
  onChange,
  onUploadFile,
}: MediaGalleryManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddImage = useCallback(
    (url: string, alt: string) => {
      if (!url.trim()) return;
      onChange([...images, { url: url.trim(), alt: alt.trim() || null, sort_order: images.length }]);
      setNewUrl("");
      setNewAlt("");
      setErrorMsg(null);
    },
    [images, onChange],
  );

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleSetPrimary(index: number) {
    if (index === 0) return;
    const item = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  }

  function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  }

  function handleColorwayAssign(index: number, colorwayId: string | null) {
    const updated = [...images];
    updated[index] = { ...updated[index], colorway_id: colorwayId || null };
    onChange(updated);
  }

  const processImageFile = useCallback(
    async (file: File, sourceDesc = "Uploaded file") => {
      setIsUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        if (onUploadFile) {
          const uploadedUrl = await onUploadFile(file);
          handleAddImage(uploadedUrl, file.name.replace(/\.[^.]+$/, "") || sourceDesc);
          setSuccessMsg("Image uploaded successfully!");
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            handleAddImage(reader.result as string, file.name.replace(/\.[^.]+$/, "") || sourceDesc);
            setSuccessMsg("Image added successfully!");
            setIsUploading(false);
          };
          reader.onerror = () => {
            setErrorMsg("Failed to read image file.");
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
          return;
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to process image file.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadFile, handleAddImage],
  );

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file, "Uploaded file");
  }

  // Direct Clipboard Paste Handler (Button action)
  async function handlePasteFromClipboard() {
    setIsPasting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard access is not supported by your browser.");
      }

      // 1. Try reading clipboard items directly (for copied images/screenshots)
      if (navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                const blob = await item.getType(type);
                const ext = type.split("/")[1]?.replace("jpeg", "jpg") || "png";
                const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type });
                await processImageFile(file, "Pasted from clipboard");
                setSuccessMsg("Image successfully pasted from clipboard!");
                return;
              }
            }
          }
        } catch (readErr: any) {
          // If browser restricts read() permission, fall back to readText()
          console.warn("clipboard.read() warning:", readErr);
        }
      }

      // 2. Try reading clipboard text (e.g. copied image URL)
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
        handleAddImage(text.trim(), "Pasted link from clipboard");
        setSuccessMsg("Image URL pasted from clipboard!");
        return;
      }

      throw new Error("No image found in clipboard. Copy an image or image URL first, then click Paste.");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not paste from clipboard. Try pressing Ctrl+V / ⌘V directly.");
    } finally {
      setIsPasting(false);
    }
  }

  // Global window paste listener when media area is mounted
  useEffect(() => {
    async function handleGlobalPaste(e: ClipboardEvent) {
      // Don't intercept if user is typing in a text input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        // If it's a file or not an image input, allow standard text paste
        if (target.getAttribute("type") !== "file") {
          return;
        }
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await processImageFile(file, "Pasted from clipboard");
            setSuccessMsg("Image pasted directly from clipboard!");
            return;
          }
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [processImageFile]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Multi-Angle Gallery & Media Assets ({images.length})
          </span>
          <p className="text-xs text-muted-foreground">
            Designate primary cover photo, atmospheric room mockups, and macro yarn close-ups.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Curated Staging Shots</span>
        </button>
      </div>

      {/* Unsplash Presets Drawer */}
      {showPresets && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Editorial Studio Mockups (Unsplash)
            </span>
            <span className="text-[11px] text-muted-foreground">Click thumbnail to append</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {UNSPLASH_EDITORIAL_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddImage(preset.url, preset.alt)}
                className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-foreground"
              >
                <img
                  src={preset.url}
                  alt={preset.alt}
                  referrerPolicy="no-referrer"
                  className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="p-2">
                  <div className="text-[11px] font-semibold truncate">{preset.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{preset.alt}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Thumbnail Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl border transition-all ${
                idx === 0
                  ? "border-foreground/80 bg-foreground/5 ring-2 ring-foreground/20"
                  : "border-border bg-card"
              }`}
            >
              {/* Primary Badge */}
              {idx === 0 ? (
                <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background shadow-xs">
                  <Star className="h-2.5 w-2.5 fill-current" /> Cover Photo
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100"
                >
                  Set as Cover
                </button>
              )}

              {/* Action Buttons */}
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "up")}
                    title="Move forward"
                    className="grid h-6 w-6 place-items-center rounded-lg bg-black/70 text-white hover:bg-black"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                )}
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "down")}
                    title="Move back"
                    className="grid h-6 w-6 place-items-center rounded-lg bg-black/70 text-white hover:bg-black"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Remove image"
                  className="grid h-6 w-6 place-items-center rounded-lg bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Image Preview */}
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={img.url}
                  alt={img.alt || `Product image ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* Alt & Colorway association */}
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  value={img.alt || ""}
                  onChange={(e) => {
                    const updated = [...images];
                    updated[idx] = { ...updated[idx], alt: e.target.value };
                    onChange(updated);
                  }}
                  placeholder="Alt caption text..."
                  className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] outline-hidden focus:border-foreground"
                />

                {colorways.length > 0 && (
                  <select
                    value={img.colorway_id || ""}
                    onChange={(e) => handleColorwayAssign(idx, e.target.value || null)}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground outline-hidden focus:border-foreground"
                  >
                    <option value="">All Colourways</option>
                    {colorways.map((c) => (
                      <option key={c.id || c.name} value={c.id || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <span className="mt-2 text-xs font-semibold">No media assets in gallery</span>
          <span className="text-[11px] text-muted-foreground">
            Paste a high-res image URL or pick from curated staging shots above.
          </span>
        </div>
      )}

      {/* Add New Media Form */}
      <div className="rounded-2xl border border-border bg-background/50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-7">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Image URL / Path
            </label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://... or /assets/...jpg"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Alt / Caption
            </label>
            <input
              type="text"
              value={newAlt}
              onChange={(e) => setNewAlt(e.target.value)}
              placeholder="e.g. Living room staging"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => handleAddImage(newUrl, newAlt)}
              disabled={!newUrl.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground py-2 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Image Actions: Clipboard Paste, File Upload & URL */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Clipboard Paste Button */}
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              disabled={isPasting || isUploading}
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/30 bg-foreground/5 px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-foreground hover:text-background disabled:opacity-50"
              title="Paste copied screenshot or image directly from clipboard (or press Ctrl+V / ⌘V)"
            >
              {isPasting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClipboardPaste className="h-3.5 w-3.5 text-accent" />
              )}
              <span>Paste from Clipboard</span>
            </button>

            {/* Local File Upload */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted transition">
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>{isUploading ? "Uploading..." : "Choose File"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Tip: Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">Ctrl+V</kbd> or <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">⌘V</kbd> anywhere to paste an image instantly
          </span>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
