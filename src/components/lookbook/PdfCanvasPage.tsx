import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "@/lib/pdf-renderer";

interface PdfCanvasPageProps {
  pdfDoc: PDFDocumentProxy | null;
  pageNumber: number;
  scale?: number;
  className?: string;
  isCover?: boolean;
  isBackCover?: boolean;
  side?: "left" | "right" | "single" | "combined_spread";
  splitHalf?: "left" | "right" | "none";
  priority?: boolean;
}

// Global in-memory cache for rendered PDF canvases to ensure instant 0ms page flips
const globalPageCanvasCache = new Map<string, {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  aspectRatio: number;
}>();

export function PdfCanvasPage({
  pdfDoc,
  pageNumber,
  scale = 1.8,
  className = "",
  isCover = false,
  isBackCover = false,
  side = "single",
  splitHalf = "none",
}: PdfCanvasPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  // Default A4 ratio (width / height = 595.28 / 841.89 = 0.7070757)
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(0.7070757);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc || pageNumber < 1 || pageNumber > pdfDoc.numPages) {
      return;
    }

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2.5);
    const dprKey = Math.round(dpr * 10) / 10;
    const cacheKey = `${pageNumber}_${scale}_${dprKey}`;

    // Fast path: Check in-memory cache for instant display (0ms wait)
    const cached = globalPageCanvasCache.get(cacheKey);
    if (cached) {
      canvas.width = cached.width;
      canvas.height = cached.height;
      setPageAspectRatio(cached.aspectRatio);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.drawImage(cached.canvas, 0, 0);
        setRendered(true);
      }
      return;
    }

    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (!active) return;

        // Exact unscaled dimensions from the PDF page
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const exactRatio = unscaledViewport.width / unscaledViewport.height;
        setPageAspectRatio(exactRatio);

        const actualScale = scale * dpr;
        const viewport = page.getViewport({ scale: actualScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport as any,
        });
        renderTaskRef.current = renderTask;

        renderTask.promise
          .then(() => {
            if (active) {
              setRendered(true);
              // Store in in-memory cache for instant subsequent turns
              try {
                const offscreen = document.createElement("canvas");
                offscreen.width = canvas.width;
                offscreen.height = canvas.height;
                const offCtx = offscreen.getContext("2d");
                if (offCtx) {
                  offCtx.drawImage(canvas, 0, 0);
                  globalPageCanvasCache.set(cacheKey, {
                    canvas: offscreen,
                    width: canvas.width,
                    height: canvas.height,
                    aspectRatio: exactRatio,
                  });
                }
              } catch {}

              // Pre-render adjacent pages in the background for zero-wait experience
              if (typeof window !== "undefined") {
                const prefetch = (nextPage: number) => {
                  if (nextPage >= 1 && nextPage <= pdfDoc.numPages) {
                    const nextKey = `${nextPage}_${scale}_${dprKey}`;
                    if (!globalPageCanvasCache.has(nextKey)) {
                      pdfDoc.getPage(nextPage).then((p) => {
                        const vp = p.getViewport({ scale: actualScale });
                        const off = document.createElement("canvas");
                        off.width = Math.floor(vp.width);
                        off.height = Math.floor(vp.height);
                        const octx = off.getContext("2d", { alpha: false });
                        if (octx) {
                          p.render({ canvasContext: octx, viewport: vp as any }).promise.then(() => {
                            globalPageCanvasCache.set(nextKey, {
                              canvas: off,
                              width: off.width,
                              height: off.height,
                              aspectRatio: vp.width / vp.height,
                            });
                          }).catch(() => {});
                        }
                      }).catch(() => {});
                    }
                  }
                };
                setTimeout(() => {
                  prefetch(pageNumber + 1);
                  prefetch(pageNumber + 2);
                  prefetch(pageNumber - 1);
                }, 80);
              }
            }
          })
          .catch((err: any) => {
            if (err?.name !== "RenderingCancelledException") {
              console.warn("PDF page render error:", err);
            }
          });
      })
      .catch((err) => {
        if (active) {
          console.warn("Failed to get PDF page", pageNumber, err);
        }
      });

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  const isSplit = splitHalf === "left" || splitHalf === "right";
  // Container aspect ratio matching the exact PDF dimensions (width / height)
  const containerAspect = isSplit ? pageAspectRatio * 0.5 : pageAspectRatio;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full flex items-center justify-center overflow-hidden bg-stone-900 select-none ${className}`}
      style={{
        aspectRatio: `${containerAspect}`,
      }}
    >
      {/* Loading Skeleton */}
      {!rendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 backdrop-blur-xs text-stone-400 z-10">
          <div className="h-5 w-5 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin mb-1.5" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">
            {isCover
              ? "Cover"
              : isSplit
              ? `Page ${pageNumber} (${splitHalf === "left" ? "L" : "R"})`
              : `Page ${pageNumber}`}
          </span>
        </div>
      )}

      {/* Rendered PDF Page Canvas - 100% visible, exactly fits container with zero cropping on either side */}
      <canvas
        ref={canvasRef}
        style={
          isSplit
            ? {
                position: "absolute",
                top: 0,
                left: splitHalf === "left" ? "0%" : "-100%",
                width: "200%",
                maxWidth: "none",
                height: "100%",
                objectFit: "cover",
              }
            : {
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "contain",
              }
        }
        className={`transition-opacity duration-150 ${
          rendered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle Book Binding Gutter Sheen - Clean & thin so it never obscures side text */}
      {isSplit ? (
        splitHalf === "left" ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/15 to-transparent z-10" />
        ) : (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/15 to-transparent z-10" />
        )
      ) : side === "combined_spread" ? (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-gradient-to-r from-black/15 via-black/5 to-black/15 z-10" />
      ) : side === "left" ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-black/10 to-transparent z-10" />
      ) : side === "right" ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/10 to-transparent z-10" />
      ) : null}

      {isCover && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05]" />
      )}
    </div>
  );
}

