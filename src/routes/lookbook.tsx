import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/site-chrome";
import {
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Send,
  X,
  FileText,
  Printer,
  Layers,
  Share2,
  Check,
  Volume2,
  VolumeX,
  Lock,
  MousePointer,
  AlertCircle,
  Smartphone,
  Hand,
  MoveHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getClientLookbookConfig,
  DEFAULT_LOOKBOOK_CONFIG,
  getLocalPdfBlob,
  saveClientLookbookConfig,
  type LookbookConfig,
} from "@/lib/lookbook-config";
import {
  getLookbookSettings,
} from "@/lib/lookbook.functions";
import {
  loadPdfDocument,
  buildLookbookSpreadViews,
  analyzeDocAndBuildViews,
  type LookbookSpreadView,
  type PDFDocumentProxy,
} from "@/lib/pdf-renderer";
import { PdfCanvasPage } from "@/components/lookbook/PdfCanvasPage";
import { RealisticBookSpread } from "@/components/lookbook/RealisticBookSpread";

// High-resolution atelier visual hero image
import lookbookYellowRug from "@/assets/lookbook-yellow-rug.jpg";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook Monograph | Mosiac Handcrafted Rugs · Volume I" },
      {
        name: "description",
        content:
          "Browse the Mosiac Kigali Atelier Monograph Volume I. An e-lookbook featuring bespoke hand-tufted Highland wool rugs, studio photography, and architectural commissions.",
      },
      { property: "og:title", content: "Lookbook Monograph | Mosiac Kigali Atelier Volume I" },
      {
        property: "og:description",
        content:
          "Browse or download the Mosiac 2026 Atelier Lookbook. Discover hand-tufted Rwandan floor art.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LookbookPage,
});

/**
 * Tactile acoustic synthesis: Pink noise burst filtered through a dynamic
 * frequency sweep approximating natural heavy paper leaf friction across a spine.
 */
function playPaperRustleSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const duration = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const b0 = 0.99886 * lastOut + white * 0.0555179;
      lastOut = b0;
      output[i] = b0 * 0.7;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1450, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + duration);
    filter.Q.value = 1.35;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch {
    // Audio context unavailable or blocked
  }
}

export function LookbookPage() {
  const [config, setConfig] = useState<LookbookConfig>(DEFAULT_LOOKBOOK_CONFIG);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [spreadViews, setSpreadViews] = useState<LookbookSpreadView[]>([]);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

  const [viewMode, setViewMode] = useState<"spread" | "scroll">("spread");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [printFormSubmitted, setPrintFormSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const spreadStageRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const isFlippingRef = useRef(false);
  const bookAnimationRef = useRef<{
    triggerNext: () => boolean;
    triggerPrev: () => boolean;
  } | null>(null);

  // Mobile 1-Page A4 Split View vs Full View mode
  const [mobilePageMode, setMobilePageMode] = useState<"split_a4" | "full_spread">("split_a4");
  const [mobileSubPage, setMobileSubPage] = useState<"left" | "right">("left");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Drag-to-turn and touch swipe states
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartXRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Responsive screen size detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Sync sound preferences from localStorage on mount (prevent SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mosiac_lookbook_sound");
      if (stored !== null) {
        setIsSoundEnabled(stored !== "false");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mosiac_lookbook_sound", String(next));
      } catch {
        // ignore
      }
      if (next) playPaperRustleSound();
      return next;
    });
  };

  // Sync config from local storage and server
  useEffect(() => {
    const local = getClientLookbookConfig();
    setConfig(local);

    getLookbookSettings()
      .then((res) => {
        if (res) setConfig(res);
      })
      .catch((err) => console.warn("Lookbook config server fetch fallback:", err));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LookbookConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      }
    };
    window.addEventListener("mosiac:lookbook-updated", handleUpdate);
    return () => window.removeEventListener("mosiac:lookbook-updated", handleUpdate);
  }, []);

  // Load PDF Document whenever config or local blob changes
  useEffect(() => {
    let active = true;
    setPdfLoading(true);
    setPdfError(null);

    async function loadActivePdf() {
      try {
        // 1. Check local IndexedDB blob first (fastest, offline-safe, handles custom uploads)
        const localBlob = await getLocalPdfBlob();
        if (localBlob && active) {
          const doc = await loadPdfDocument(localBlob);
          if (doc && active) {
            setPdfDoc(doc);
            const { views } = await analyzeDocAndBuildViews(doc);
            if (active) {
              setSpreadViews(views);
              setPdfLoading(false);
              return;
            }
          }
        }

        // 2. Load from config.pdfUrl or default fallback
        const targetUrl = config.pdfUrl || "/Mosiac-Lookbook-2026.pdf";
        const doc = await loadPdfDocument(targetUrl);
        if (doc && active) {
          setPdfDoc(doc);
          const { views } = await analyzeDocAndBuildViews(doc);
          if (active) {
            setSpreadViews(views);
            setPdfLoading(false);
            return;
          }
        }

        // 3. Fallback to default static file if custom URL failed
        if (targetUrl !== "/Mosiac-Lookbook-2026.pdf" && active) {
          const fallbackDoc = await loadPdfDocument("/Mosiac-Lookbook-2026.pdf");
          if (fallbackDoc && active) {
            setPdfDoc(fallbackDoc);
            const { views } = await analyzeDocAndBuildViews(fallbackDoc);
            if (active) {
              setSpreadViews(views);
              setPdfLoading(false);
              return;
            }
          }
        }

        if (active) {
          setPdfError("Could not load lookbook PDF document.");
          setPdfLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error("PDF initialization error:", err);
          setPdfError(err?.message || "Failed to parse PDF document.");
          setPdfLoading(false);
        }
      }
    }

    loadActivePdf();

    return () => {
      active = false;
    };
  }, [config.pdfUrl, config.updatedAt]);

  const totalSpreads = spreadViews.length;
  const currentSpread: LookbookSpreadView | undefined = spreadViews[currentSpreadIndex];
  const totalPages = pdfDoc ? pdfDoc.numPages : 0;

  // Auto-scroll active thumbnail into view on the 1-row filmstrip scrubber (contained scroll without page glitch)
  useEffect(() => {
    const container = filmstripRef.current;
    if (!container) return;
    const thumb = document.getElementById(`lookbook-thumb-spread-${currentSpreadIndex + 1}`);
    if (!thumb) return;

    const thumbLeft = thumb.offsetLeft;
    const thumbWidth = thumb.offsetWidth;
    const containerWidth = container.clientWidth;
    const targetScroll = thumbLeft - containerWidth / 2 + thumbWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  }, [currentSpreadIndex]);

  // Turn page navigation (with mobile 1-page leaf awareness for both A4 and Full View)
  const nextSpread = useCallback(() => {
    // On mobile, first step through left leaf then right leaf before advancing
    if (isMobileScreen) {
      const cur = spreadViews[currentSpreadIndex];
      if (cur && (cur.type === "paired_spread" || cur.type === "combined_spread")) {
        if (mobileSubPage === "left") {
          if (isSoundEnabled) playPaperRustleSound();
          setMobileSubPage("right");
          return;
        }
      }
    }

    if (currentSpreadIndex < totalSpreads - 1) {
      if (isSoundEnabled) playPaperRustleSound();
      setCurrentSpreadIndex((i) => i + 1);
      setMobileSubPage("left");
    }
  }, [isMobileScreen, spreadViews, currentSpreadIndex, mobileSubPage, totalSpreads, isSoundEnabled]);

  const prevSpread = useCallback(() => {
    if (isMobileScreen) {
      const cur = spreadViews[currentSpreadIndex];
      if (cur && (cur.type === "paired_spread" || cur.type === "combined_spread")) {
        if (mobileSubPage === "right") {
          if (isSoundEnabled) playPaperRustleSound();
          setMobileSubPage("left");
          return;
        }
      }
    }

    if (currentSpreadIndex > 0) {
      if (isSoundEnabled) playPaperRustleSound();
      const prevIdx = currentSpreadIndex - 1;
      setCurrentSpreadIndex(prevIdx);
      const prevSp = spreadViews[prevIdx];
      if (prevSp && (prevSp.type === "paired_spread" || prevSp.type === "combined_spread")) {
        setMobileSubPage("right");
      } else {
        setMobileSubPage("left");
      }
    }
  }, [isMobileScreen, spreadViews, currentSpreadIndex, mobileSubPage, isSoundEnabled]);

  const goToSpread = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSpreads && index !== currentSpreadIndex) {
        if (isSoundEnabled) playPaperRustleSound();
        setCurrentSpreadIndex(index);
        setMobileSubPage("left");
      }
    },
    [totalSpreads, currentSpreadIndex, isSoundEnabled]
  );

  // Navigation triggers that invoke realistic 3D slow page animation
  const handleNextAction = useCallback(() => {
    if (isMobileScreen) {
      nextSpread();
      return;
    }
    if (bookAnimationRef.current?.triggerNext()) return;
    nextSpread();
  }, [isMobileScreen, nextSpread]);

  const handlePrevAction = useCallback(() => {
    if (isMobileScreen) {
      prevSpread();
      return;
    }
    if (bookAnimationRef.current?.triggerPrev()) return;
    prevSpread();
  }, [isMobileScreen, prevSpread]);

  // Keyboard navigation: Left/Right arrows with slow page flip animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        handleNextAction();
      } else if (e.key === "ArrowLeft") {
        handlePrevAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextAction, handlePrevAction]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleDownloadPdf = async () => {
    try {
      const localBlob = await getLocalPdfBlob();
      if (localBlob) {
        const blobUrl = URL.createObjectURL(localBlob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = config.fileName || "Mosiac-Lookbook-2026.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        setIsPdfModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn("Lookbook local blob download fallback:", err);
    }

    const targetFilename =
      config.fileName ||
      (config.pdfUrl ? config.pdfUrl.split("/").pop() : "Mosiac-Lookbook-2026.pdf") ||
      "Mosiac-Lookbook-2026.pdf";
    const downloadUrl = `/api/public/download/${targetFilename}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = targetFilename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsPdfModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPrintFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0E0E10] text-foreground flex flex-col selection:bg-amber-500/20 relative">
      <Nav />

      {/* EDITORIAL ATELIER MONOGRAPH VISUAL HERO */}
      <header className="border-b border-border/70 bg-background pt-4 sm:pt-6 pb-6 select-none">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-950 border border-border/80 shadow-2xl">
            <div className="relative min-h-[340px] sm:min-h-[400px] md:min-h-[440px] w-full">
              <img
                src={lookbookYellowRug}
                alt="Atelier Mosiac Lookbook Monograph"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/85 sm:via-black/35 sm:to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12 text-white z-10">
                <div className="max-w-3xl space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300 backdrop-blur-md">
                      <Lock className="h-3 w-3 stroke-[2.5]" />
                      <span>{config.editionName || "Atelier Monograph · Volume I"}</span>
                    </span>
                    <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-mono text-white/80 backdrop-blur-md uppercase tracking-wider">
                      {totalPages > 0 ? `${totalPages} Document Plates` : "Archival Plates"}
                    </span>
                    <span className="hidden sm:inline-block rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 text-[9px] font-mono text-amber-200 backdrop-blur-md uppercase tracking-wider">
                      Highland Pure Wool
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-white">
                    Mosiac Lookbook <span className="font-serif italic font-light text-amber-200">Monograph</span>.
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed font-light max-w-2xl">
                    {config.subtitle ||
                      "A curated physical compendium of bespoke hand-tufted Highland wool rugs, studio archive plates, and architectural commissions. Turn the pages below or download the archival PDF."}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    {/* Download PDF button */}
                    <button
                      type="button"
                      id="lookbook-download-pdf-btn"
                      onClick={handleDownloadPdf}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF ({config.fileSize || "4.0 MB"})</span>
                    </button>

                    <button
                      type="button"
                      id="lookbook-request-printed-btn"
                      onClick={() => {
                        setPrintFormSubmitted(false);
                        setIsPrintModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                      <span className="hidden sm:inline">Request Hardbound</span>
                      <span className="sm:hidden">Print</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      title="Share Monograph Link"
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white/20 cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLS & PAGE SCRUBBER TOOLBAR */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-background/80 p-1 shadow-2xs">
              <button
                type="button"
                id="lookbook-mode-spread-btn"
                onClick={() => setViewMode("spread")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                  viewMode === "spread"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Spread Reader</span>
              </button>

              <button
                type="button"
                id="lookbook-mode-scroll-btn"
                onClick={() => setViewMode("scroll")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                  viewMode === "scroll"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Continuous Feed</span>
              </button>
            </div>

            {/* Mobile View Toggle: 1 Page (A4) vs Full View (Wide Leaf) */}
            {viewMode === "spread" && (
              <div className="flex md:hidden items-center rounded-full border border-amber-600/30 bg-amber-500/10 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMobilePageMode("split_a4")}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all ${
                    mobilePageMode === "split_a4"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 dark:text-amber-300 hover:text-foreground"
                  }`}
                  title="Show 1 leaf at a time in portrait A4 dimensions"
                >
                  <Smartphone className="h-3 w-3" />
                  <span>A4 Leaf</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePageMode("full_spread")}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all ${
                    mobilePageMode === "full_spread"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 dark:text-amber-300 hover:text-foreground"
                  }`}
                  title="Show each leaf in a wider, expansive high-res version"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Full View (Wide)</span>
                </button>
              </div>
            )}

            {/* Page Counter & Indicator (Showing accurate single leaf on mobile or 2-page spread on desktop) */}
            <div className="flex items-center gap-3 font-mono text-muted-foreground">
              {viewMode === "spread" ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider">
                    {isMobileScreen ? "Leaf" : "Spread"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {String(currentSpreadIndex + 1).padStart(2, "0")} /{" "}
                    {String(totalSpreads || 1).padStart(2, "0")}
                  </span>
                  <span className="text-border">|</span>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {currentSpread?.type === "cover"
                      ? "Page 1 (Front Cover)"
                      : currentSpread?.type === "back_cover"
                      ? `Page ${currentSpread.singlePageNumber || totalPages} (Back Cover)`
                      : isMobileScreen
                      ? currentSpread?.type === "combined_spread"
                        ? `Plate ${currentSpread.singlePageNumber} (${mobileSubPage === "left" ? "Part 1/2 · Left" : "Part 2/2 · Right"})`
                        : currentSpread?.type === "paired_spread"
                        ? `Page ${mobileSubPage === "left" ? currentSpread.leftPageNumber : currentSpread.rightPageNumber} of ${totalPages}`
                        : `Page ${currentSpread?.singlePageNumber} of ${totalPages}`
                      : currentSpread?.type === "combined_spread"
                      ? `Plate ${currentSpread.singlePageNumber} (2-in-1 Spread) · of ${totalPages}`
                      : currentSpread?.type === "single_page"
                      ? `Page ${currentSpread.singlePageNumber} of ${totalPages}`
                      : `Pages ${currentSpread?.leftPageNumber}–${currentSpread?.rightPageNumber} of ${totalPages}`}
                  </span>
                </div>
              ) : (
                <span className="text-[11px]">
                  Continuous Document Feed · {totalPages} Plates
                </span>
              )}
            </div>

            {/* Zoom, Audio & Fullscreen Controls */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center rounded-full border border-border/80 bg-background/80 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-[10px] font-mono text-muted-foreground">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                  title="Zoom In"
                  aria-label="Zoom In"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    title="Reset Zoom"
                    aria-label="Reset Zoom"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors border-l border-border/50 ml-0.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Tactile Paper Rustle Sound Toggle */}
              <button
                type="button"
                id="lookbook-sound-toggle-btn"
                onClick={toggleSound}
                title={isSoundEnabled ? "Mute paper turn sound" : "Enable realistic paper turn sound"}
                aria-label="Toggle paper sound"
                className={`flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs transition-colors shadow-2xs cursor-pointer ${
                  isSoundEnabled
                    ? "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSoundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                    <span className="text-[10px] font-mono hidden sm:inline">Paper Sound</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-mono hidden sm:inline">Muted</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="lookbook-fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                className="hidden md:flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors shadow-2xs cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{isFullscreen ? "Exit" : "Fullscreen"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LOOKBOOK STAGE */}
      <main className="flex-1 py-8 sm:py-12 px-3 sm:px-6">
        <div className="container-x mx-auto max-w-[1400px]">
          {/* Loading State */}
          {pdfLoading && (
            <div className="flex flex-col items-center justify-center min-h-[480px] rounded-3xl border border-border/60 bg-stone-900/10 dark:bg-stone-950/40 p-12 text-center">
              <div className="h-10 w-10 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin mb-4" />
              <h3 className="font-display text-xl font-bold">Integrating Atelier Monograph PDF…</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Parsing document vectors and preparing high-resolution plate rendering without modifications.
              </p>
            </div>
          )}

          {/* Error State */}
          {!pdfLoading && pdfError && (
            <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <h3 className="font-display text-lg font-bold text-foreground">Could not render PDF document</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md">{pdfError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:opacity-90 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Reload Monograph</span>
              </button>
            </div>
          )}

          {/* SPREAD READER VIEW */}
          {!pdfLoading && !pdfError && viewMode === "spread" && currentSpread && (
            <div className="relative select-none flex flex-col items-center w-full">
              {/* STAGE CONTAINER WITH REALISTIC 3D BOOK SPREAD */}
              <div
                ref={spreadStageRef}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
                className="relative w-full max-w-[1240px] flex items-center justify-center py-2"
              >
                <RealisticBookSpread
                  pdfDoc={pdfDoc}
                  currentSpread={currentSpread}
                  nextSpread={currentSpreadIndex < totalSpreads - 1 ? spreadViews[currentSpreadIndex + 1] : null}
                  prevSpread={currentSpreadIndex > 0 ? spreadViews[currentSpreadIndex - 1] : null}
                  totalPages={totalPages}
                  zoomLevel={zoomLevel}
                  isSoundEnabled={isSoundEnabled}
                  onAdvanceSpread={() => {
                    if (currentSpreadIndex < totalSpreads - 1) {
                      setCurrentSpreadIndex((i) => i + 1);
                      setMobileSubPage("left");
                    }
                  }}
                  onPreviousSpread={() => {
                    if (currentSpreadIndex > 0) {
                      const prevIdx = currentSpreadIndex - 1;
                      setCurrentSpreadIndex(prevIdx);
                      const prevSp = spreadViews[prevIdx];
                      if (prevSp && (prevSp.type === "paired_spread" || prevSp.type === "combined_spread")) {
                        setMobileSubPage("right");
                      } else {
                        setMobileSubPage("left");
                      }
                    }
                  }}
                  isMobileScreen={isMobileScreen}
                  mobilePageMode={mobilePageMode}
                  mobileSubPage={mobileSubPage}
                  setMobileSubPage={setMobileSubPage}
                  playRustleSound={playPaperRustleSound}
                  animationTriggerRef={bookAnimationRef}
                />
              </div>

              {/* Drag to turn / navigation prompt */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground/80 font-mono">
                <span className="flex items-center gap-1.5">
                  <Hand className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 animate-pulse" />
                  {isMobileScreen
                    ? "Swipe left or right to turn leaves slowly"
                    : "Drag right page left or left page right to turn slowly"}
                </span>
                <span className="text-border">·</span>
                <span className="hidden sm:inline">
                  {currentSpread.type === "cover"
                    ? "Click cover or drag corner to open · Arrow Keys (← →)"
                    : "Drag corner to turn or Arrow Keys (← →)"}
                </span>
                {isMobileScreen && (
                  <>
                    <span className="text-border">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setMobilePageMode((m) => (m === "split_a4" ? "full_spread" : "split_a4"))
                      }
                      className="text-amber-700 dark:text-amber-400 underline font-medium cursor-pointer"
                    >
                      {mobilePageMode === "split_a4" ? "Switch to Full View (Wide Leaf)" : "Switch to A4 Leaf"}
                    </button>
                  </>
                )}
              </div>

              {/* Navigation Previous Arrow */}
              <button
                type="button"
                id="lookbook-spread-prev-btn"
                onClick={handlePrevAction}
                disabled={currentSpreadIndex === 0 && (!isMobileScreen || mobileSubPage === "left")}
                aria-label="Previous page"
                className="absolute -left-3 sm:-left-5 top-[45%] -translate-y-1/2 z-30 grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full bg-background/95 border border-border/80 shadow-lg text-foreground transition-all hover:bg-background hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5 stroke-[2]" />
              </button>

              {/* Navigation Next Arrow */}
              <button
                type="button"
                id="lookbook-spread-next-btn"
                onClick={handleNextAction}
                disabled={
                  currentSpreadIndex === totalSpreads - 1 &&
                  (!isMobileScreen ||
                    !(
                      (currentSpread?.type === "paired_spread" || currentSpread?.type === "combined_spread") &&
                      mobileSubPage === "left"
                    ))
                }
                aria-label="Next page"
                className="absolute -right-3 sm:-right-5 top-[45%] -translate-y-1/2 z-30 grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full bg-background/95 border border-border/80 shadow-lg text-foreground transition-all hover:bg-background hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-5 w-5 stroke-[2]" />
              </button>

              {/* FILMSTRIP THUMBNAIL SCRUBBER IN 1 ROW */}
              <div className="group/filmstrip relative mt-10 w-full max-w-[1240px]">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                      Filmstrip Scrubber (1 Row)
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[10px] font-mono text-amber-800 dark:text-amber-400">
                      {totalSpreads} Spreads ({totalPages} Plates)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => filmstripRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                      className="p-1 rounded-full border border-border/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Scroll filmstrip left"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-xs text-foreground font-medium">
                      Spread {currentSpreadIndex + 1} of {totalSpreads}
                    </span>
                    <button
                      type="button"
                      onClick={() => filmstripRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                      className="p-1 rounded-full border border-border/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Scroll filmstrip right"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 1 Single Row Horizontal Scrubber */}
                <div
                  ref={filmstripRef}
                  className="relative flex flex-nowrap items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth scrollbar-thin scrollbar-thumb-stone-700/50 scrollbar-track-transparent select-none px-1"
                >
                  {spreadViews.map((sp, idx) => {
                    const isCurrent = idx === currentSpreadIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        id={`lookbook-thumb-spread-${idx + 1}`}
                        onClick={() => goToSpread(idx)}
                        className={`flex-shrink-0 w-32 sm:w-36 md:w-40 group relative overflow-hidden rounded-xl border p-1 text-left transition-all cursor-pointer ${
                          isCurrent
                            ? "border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/40"
                            : "border-border/80 bg-background/80 hover:border-foreground/50 hover:bg-muted/40"
                        }`}
                      >
                        {/* Thumbnail View */}
                        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-stone-900 flex items-center justify-center">
                          {sp.type === "cover" ? (
                            <div className="h-full overflow-hidden bg-stone-950 border border-stone-800 shadow-xs" style={{ aspectRatio: "1 / 1.4142" }}>
                              <PdfCanvasPage
                                pdfDoc={pdfDoc}
                                pageNumber={1}
                                scale={0.4}
                                side="single"
                              />
                            </div>
                          ) : sp.type === "back_cover" || sp.type === "single_page" ? (
                            <div className="h-full overflow-hidden bg-stone-950 border border-stone-800 shadow-xs" style={{ aspectRatio: "1 / 1.4142" }}>
                              <PdfCanvasPage
                                pdfDoc={pdfDoc}
                                pageNumber={sp.singlePageNumber || totalPages}
                                scale={0.4}
                                side="single"
                              />
                            </div>
                          ) : sp.type === "combined_spread" ? (
                            /* 1 single PDF page that is already a wide 2-in-1 spread */
                            <div className="h-full w-full overflow-hidden bg-stone-950">
                              <PdfCanvasPage
                                pdfDoc={pdfDoc}
                                pageNumber={sp.singlePageNumber!}
                                scale={0.4}
                                side="combined_spread"
                              />
                            </div>
                          ) : (
                            <div className="h-full w-full grid grid-cols-2 gap-0.5 bg-stone-950">
                              <div className="overflow-hidden border-r border-stone-800">
                                <PdfCanvasPage
                                  pdfDoc={pdfDoc}
                                  pageNumber={sp.leftPageNumber!}
                                  scale={0.35}
                                  side="left"
                                />
                              </div>
                              <div className="overflow-hidden">
                                <PdfCanvasPage
                                  pdfDoc={pdfDoc}
                                  pageNumber={sp.rightPageNumber!}
                                  scale={0.35}
                                  side="right"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 px-0.5 flex items-center justify-between font-mono text-[9px]">
                          <span
                            className={`font-semibold ${
                              isCurrent ? "text-amber-800 dark:text-amber-300" : "text-foreground"
                            }`}
                          >
                            {sp.type === "cover"
                              ? "Cover (P.1)"
                              : sp.type === "back_cover"
                              ? `P.${sp.singlePageNumber}`
                              : sp.type === "combined_spread"
                              ? `Spread ${sp.singlePageNumber}`
                              : sp.type === "single_page"
                              ? `P.${sp.singlePageNumber}`
                              : `P.${sp.leftPageNumber}–${sp.rightPageNumber}`}
                          </span>
                          <span className="text-[8.5px] text-muted-foreground uppercase">
                            #{idx + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CONTINUOUS SCROLL VIEW */}
          {!pdfLoading && !pdfError && viewMode === "scroll" && pdfDoc && (
            <div className="mx-auto max-w-[840px] space-y-8 select-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className="relative overflow-hidden rounded-2xl bg-stone-950 shadow-2xl border border-[#E0D7C6] dark:border-border/60"
                >
                  <PdfCanvasPage
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={2.0}
                    isCover={pageNum === 1}
                    isBackCover={pageNum === totalPages}
                  />
                  <div className="absolute bottom-3 left-4 font-mono text-[10px] text-stone-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
                    Plate {pageNum} of {totalPages} {pageNum === 1 ? "· Front Cover" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ATELIER PROVENANCE & TECHNICAL MONOGRAPH SECTION */}
          <div className="mt-16 sm:mt-24 border-t border-border/70 pt-12 sm:pt-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-800 dark:text-amber-400 font-semibold">
                  Atelier Documentation
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-normal leading-tight text-foreground">
                  Preserved with Absolute Fidelity.
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every page in this lookbook is rendered directly from the source document using client-side vector precision. Text, high-pile photography, and dimensions are integrated with zero modifications.
                </p>

                <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Document Name</span>
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {config.fileName || "Mosiac-Lookbook-2026.pdf"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Total Plates</span>
                    <span className="font-semibold text-foreground">
                      {totalPages > 0 ? `${totalPages} Pages` : "8 Pages"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">File Size</span>
                    <span className="font-semibold text-foreground">{config.fileSize || "4.0 MB"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Cover Layout</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Single Page (1 Page Cover)
                    </span>
                  </div>
                </div>
              </div>

              {/* PDF Actions & Inquiries */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 bg-background/60 p-6 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3">
                      <Download className="h-5 w-5" />
                    </div>
                    <h4 className="font-display text-lg font-bold text-foreground">
                      Download Full Archival PDF
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Download the high-resolution publication for offline viewing on iPad, desktop, or print reproduction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-background transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF ({config.fileSize || "4.0 MB"})</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/60 p-6 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3">
                      <Printer className="h-5 w-5" />
                    </div>
                    <h4 className="font-display text-lg font-bold text-foreground">
                      Request Linen Clothbound Copy
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Complimentary physical monographs are dispatched to interior architecture firms, designers, and collectors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintFormSubmitted(false);
                      setIsPrintModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/30 bg-muted/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Request Hardcopy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* REQUEST PRINT MONOGRAPH DIALOG */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">
              Request Hardbound Monograph
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              We send our linen clothbound lookbooks to interior designers, architects, and collectors worldwide via DHL Express.
            </DialogDescription>
          </DialogHeader>

          {printFormSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h4 className="font-display text-lg font-bold">Request Dispatched</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our Kigali studio team has registered your dispatch address. A numbered copy will be sent to you shortly.
              </p>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="mt-3 rounded-xl bg-foreground px-5 py-2 text-xs font-semibold text-background hover:opacity-90"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handlePrintSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Full Name / Studio Name *
                </label>
                <input
                  required
                  placeholder="e.g. Studio Kigali Architecture"
                  className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:bg-background outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  placeholder="designer@studio.com"
                  className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:bg-background outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Shipping Address (City & Country) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street, Suite, Postal Code, Country"
                  className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:bg-background outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                id="lookbook-print-form-submit-btn"
                className="w-full mt-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity cursor-pointer"
              >
                Submit Hardbound Request
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DOWNLOAD PDF CONFIRMATION DIALOG */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-sm bg-background border border-border text-foreground text-center">
          <div className="py-4 space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Download className="h-6 w-6 stroke-[2]" />
            </div>
            <h3 className="font-display text-xl font-bold">Download Initiated</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your download of <span className="font-semibold text-foreground">{config.fileName || "Mosiac-Lookbook-2026.pdf"}</span> has started. Thank you for exploring the Kigali atelier monograph.
            </p>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(false)}
              className="mt-3 rounded-xl bg-foreground px-6 py-2 text-xs font-semibold text-background hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
