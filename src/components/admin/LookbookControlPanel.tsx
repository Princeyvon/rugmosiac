import { useState, useEffect, useRef } from "react";
import {
  DEFAULT_LOOKBOOK_CONFIG,
  getClientLookbookConfig,
  saveClientLookbookConfig,
  type LookbookConfig,
} from "@/lib/lookbook-config";
import {
  getLookbookSettings,
  saveLookbookSettings,
  uploadLookbookPdfServerFn,
} from "@/lib/lookbook.functions";
import { loadPdfDocument, type PDFDocumentProxy } from "@/lib/pdf-renderer";
import { PdfCanvasPage } from "@/components/lookbook/PdfCanvasPage";
import {
  BookOpen,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Calendar,
  HardDrive,
  Info,
} from "lucide-react";

export function LookbookControlPanel({
  onToast,
}: {
  onToast?: (msg: string) => void;
}) {
  const [config, setConfig] = useState<LookbookConfig>(DEFAULT_LOOKBOOK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial load from client storage for instant reactivity, then sync with server
    const local = getClientLookbookConfig();
    setConfig(local);

    getLookbookSettings()
      .then((res) => {
        if (res) {
          setConfig(res);
          saveClientLookbookConfig(res);
        }
      })
      .catch((err) => console.warn("Could not fetch lookbook settings:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPdf() {
      const targetUrl = config.pdfUrl || "/Mosiac-Lookbook-2026.pdf";
      const doc = await loadPdfDocument(targetUrl);
      if (doc && active) {
        setPdfDoc(doc);
      }
    }
    loadPdf();
    return () => {
      active = false;
    };
  }, [config.pdfUrl, config.updatedAt]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      onToast?.("Please upload a valid PDF document (.pdf)");
      return;
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const readableSize = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

    setUploadingPdf(true);
    setUploadedFileName(file.name);

    try {
      if (file.size > 35_000_000) throw new Error("PDF must be smaller than 35 MB.");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string"
          ? resolve(reader.result) : reject(new Error("Could not read PDF."));
        reader.onerror = () => reject(new Error("Could not read PDF."));
        reader.readAsDataURL(file);
      });
      const result = await uploadLookbookPdfServerFn({ data: {
        filename: file.name, base64, fileSize: readableSize, volumeTitle: config.volumeTitle,
      } });
      if (!result.ok) throw new Error("The PDF could not be published.");
      setConfig(result.config);
      saveClientLookbookConfig(result.config);
      onToast?.(`Successfully uploaded & published "${file.name}" (${readableSize}) to /lookbook!`);
    } catch (err: unknown) {
      setUploadedFileName(null);
      onToast?.(err instanceof Error ? `Upload failed: ${err.message}` : "PDF upload failed. Please try again.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveLookbookSettings({ data: config });
      setConfig(result.config);
      saveClientLookbookConfig(result.config);
      onToast?.("Lookbook configuration & PDF successfully updated and published live!");
    } catch (err) {
      console.error("Save lookbook error:", err);
      onToast?.("Lookbook changes were not saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset lookbook settings to the studio defaults?")) {
      setConfig(DEFAULT_LOOKBOOK_CONFIG);
      saveClientLookbookConfig(DEFAULT_LOOKBOOK_CONFIG);
      onToast?.("Reset lookbook settings to default.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-accent">Publication & Archive</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
              Live on /lookbook
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            Lookbook Monograph Management
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl font-light">
            Update the official Mosiac Lookbook PDF document, download metadata, volume titles, and publication parameters for clients, architects, and collectors.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/lookbook"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
          >
            <BookOpen className="h-4 w-4 text-accent" />
            <span>View Live Lookbook</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Publishing..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & PDF Source (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Upload Box */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span>Upload New Lookbook PDF</span>
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">PDF max 50MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploadingPdf && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragOver
                  ? "border-accent bg-accent/10"
                  : "border-border/80 bg-background/50 hover:border-foreground/40 hover:bg-muted/30"
              }`}
            >
              {uploadingPdf ? (
                <div className="py-2">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-foreground border-t-transparent mb-3" />
                  <p className="text-sm font-semibold text-foreground">Uploading & Publishing PDF...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Storing document and syncing live lookbook page</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-foreground mb-3">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop your new Lookbook PDF here, or{" "}
                    <span className="text-accent underline underline-offset-2">browse files</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted: Portable Document Format (.pdf) · Changes publish live to /lookbook instantly
                  </p>
                </>
              )}
            </div>

            {/* Current Active File Banner */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 text-xs">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground truncate max-w-[240px] sm:max-w-xs">
                    {config.fileName}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Size: {config.fileSize} · Updated: {config.updatedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={config.pdfUrl}
                  download={config.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] hover:bg-muted transition-colors text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Test Download</span>
                </a>
              </div>
            </div>
          </div>

          {/* URL & Asset Link Specification */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-medium text-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-accent" />
              <span>PDF Source URL or Public Path</span>
            </h3>
            <p className="text-xs text-muted-foreground font-light">
              You can also specify a hosted URL (e.g. Supabase Storage, Cloudflare R2, Dropbox, AWS S3, or relative static asset path like <code className="font-mono bg-muted px-1.5 py-0.5 rounded">/Mosiac-Lookbook-2026.pdf</code>).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  PDF Source Link / URL
                </label>
                <input
                  type="text"
                  value={config.pdfUrl.startsWith("data:") ? "[Embedded Uploaded Document Base64]" : config.pdfUrl}
                  onChange={(e) => setConfig({ ...config, pdfUrl: e.target.value })}
                  placeholder="https://example.com/lookbook.pdf or /Mosiac-Lookbook-2026.pdf"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-mono outline-none transition-colors focus:border-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Download File Name
                  </label>
                  <input
                    type="text"
                    value={config.fileName}
                    onChange={(e) => setConfig({ ...config, fileName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-mono outline-none transition-colors focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    File Size Label
                  </label>
                  <input
                    type="text"
                    value={config.fileSize}
                    onChange={(e) => setConfig({ ...config, fileSize: e.target.value })}
                    placeholder="18.4 MB"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-mono outline-none transition-colors focus:border-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Metadata & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Editorial Metadata Form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Publication Monograph Titles</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Edition Header (Eyebrow)
                </label>
                <input
                  type="text"
                  value={config.editionName}
                  onChange={(e) => setConfig({ ...config, editionName: e.target.value })}
                  placeholder="Kigali Atelier Monograph"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Volume & Edition Title
                </label>
                <input
                  type="text"
                  value={config.volumeTitle}
                  onChange={(e) => setConfig({ ...config, volumeTitle: e.target.value })}
                  placeholder="Volume I · 2026 Edition"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Subtitle Description
                </label>
                <textarea
                  rows={3}
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-foreground resize-none leading-relaxed font-light"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Internal Studio / Archive Notes
                </label>
                <input
                  type="text"
                  value={config.notes || ""}
                  onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                  placeholder="e.g. Master print proof approved on Sept 2026"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-foreground"
                />
              </div>
            </div>
          </div>

          {/* Real-time Visitor Preview */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Public Lookbook Card Preview
              </h3>
              <span className="text-[10px] font-mono text-accent">Live Snapshot</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-background p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[220px]">{config.fileName}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {config.fileSize} · {pdfDoc?.numPages || 8} Plates
                  </p>
                </div>
              </div>

              {/* Live Render of Page 1 (strictly 1 single page, not 2) */}
              <div className="rounded-lg overflow-hidden border border-border/60 bg-stone-950 p-2 text-center">
                <div className="max-w-[220px] mx-auto overflow-hidden rounded shadow-md border border-stone-800 flex items-center justify-center">
                  <PdfCanvasPage
                    pdfDoc={pdfDoc}
                    pageNumber={1}
                    scale={0.6}
                    isCover
                    side="single"
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-muted-foreground">
                  Page 1: Single Front Cover (1 page, not 2)
                </p>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-semibold uppercase tracking-wider text-background shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Complete PDF ({config.fileSize})</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Publish Updates</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
