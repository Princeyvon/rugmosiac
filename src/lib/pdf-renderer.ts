/**
 * High-fidelity client-side PDF rendering engine.
 * Integrates external uploaded PDFs without any modifications.
 * Loads PDF.js strictly on the client to avoid SSR canvas/Node dependencies.
 */

export interface PDFViewport {
  width: number;
  height: number;
}

export interface PDFPageProxy {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFViewport;
  }): {
    promise: Promise<void>;
    cancel(): void;
  };
}

export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

let pdfjsLoadPromise: Promise<any> | null = null;

export async function getPdfjs(): Promise<any> {
  if (typeof window === "undefined") return null;

  if (window.pdfjsLib) {
    if (window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    }
    return window.pdfjsLib;
  }

  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      if (window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      }
      resolve(window.pdfjsLib);
      return;
    }

    const existingScript = document.querySelector('script[src="/pdf.min.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        } else {
          reject(new Error("pdfjsLib not defined after script load"));
        }
      });
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("pdfjsLib failed to initialize"));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

const pdfDocCache = new Map<string, Promise<PDFDocumentProxy | null>>();

export async function loadPdfDocument(
  source: string | Blob | ArrayBuffer
): Promise<PDFDocumentProxy | null> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) return null;

  if (typeof source === "string") {
    const existing = pdfDocCache.get(source);
    if (existing) return existing;

    const loadPromise = (async () => {
      try {
        const res = await fetch(source);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const data = new Uint8Array(ab);
          return await pdfjs.getDocument({ data }).promise;
        }
        return await pdfjs.getDocument(source).promise;
      } catch (err) {
        console.error("Failed to load PDF document:", err);
        return null;
      }
    })();

    pdfDocCache.set(source, loadPromise);
    return loadPromise;
  }

  try {
    if (source instanceof Blob) {
      const data = new Uint8Array(await source.arrayBuffer());
      return await pdfjs.getDocument({ data }).promise;
    }
    if (source instanceof ArrayBuffer) {
      const data = new Uint8Array(source);
      return await pdfjs.getDocument({ data }).promise;
    }
  } catch (err) {
    console.error("Failed to load PDF document:", err);
  }
  return null;
}

export interface LookbookSpreadView {
  index: number;
  type: "cover" | "combined_spread" | "paired_spread" | "single_page" | "back_cover" | "spread";
  pageNumbers: number[];
  leftPageNumber?: number;
  rightPageNumber?: number;
  singlePageNumber?: number;
  isLandscape?: boolean;
  aspectRatio?: number;
  label: string;
}

export interface PDFPageDimension {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  isLandscapeSpread: boolean; // aspectRatio >= 1.15 (2 pages combined into 1)
}

/**
 * Asynchronously inspects the natural dimensions (width, height, aspect ratio)
 * of every page in the PDF document.
 */
export async function inspectPdfDimensions(
  doc: PDFDocumentProxy
): Promise<PDFPageDimension[]> {
  const dims: PDFPageDimension[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1.0 });
      const aspectRatio = vp.width / vp.height;
      dims.push({
        pageNumber: i,
        width: vp.width,
        height: vp.height,
        aspectRatio,
        // If width > height with a threshold of 1.15, the page is already an exported 2-in-1 spread!
        isLandscapeSpread: aspectRatio >= 1.15,
      });
    } catch {
      dims.push({
        pageNumber: i,
        width: 595.28,
        height: 841.89,
        aspectRatio: 0.707,
        isLandscapeSpread: false,
      });
    }
  }
  return dims;
}

/**
 * Dimension-aware monograph spread builder:
 * - Cover (Page 1) is STRICTLY 1 single page (not 2).
 * - Pages where dimensions are already 2 combined into 1 (landscape, width > height)
 *   are rendered as 1 single page!
 * - Portrait pages are paired (left & right) or rendered single if standalone/back cover.
 */
export function buildLookbookSpreadViews(
  dimsOrTotal: PDFPageDimension[] | number
): LookbookSpreadView[] {
  // If a simple number is passed (e.g. before async dimensions load), fallback gracefully
  if (typeof dimsOrTotal === "number") {
    const totalPages = dimsOrTotal;
    if (totalPages <= 0) return [];
    const views: LookbookSpreadView[] = [];

    views.push({
      index: 0,
      type: "cover",
      pageNumbers: [1],
      singlePageNumber: 1,
      isLandscape: false,
      label: "Cover · Page 1",
    });

    let p = 2;
    while (p < totalPages) {
      views.push({
        index: views.length,
        type: "paired_spread",
        pageNumbers: [p, p + 1],
        leftPageNumber: p,
        rightPageNumber: p + 1,
        isLandscape: false,
        label: `Pages ${p}–${p + 1}`,
      });
      p += 2;
    }

    if (p === totalPages) {
      views.push({
        index: views.length,
        type: "back_cover",
        pageNumbers: [p],
        singlePageNumber: p,
        isLandscape: false,
        label: `Back Cover · Page ${p}`,
      });
    }

    return views;
  }

  // Dimension-based inspection
  const dims = dimsOrTotal;
  const totalPages = dims.length;
  if (totalPages <= 0) return [];

  const views: LookbookSpreadView[] = [];
  const dimMap = new Map<number, PDFPageDimension>();
  dims.forEach((d) => dimMap.set(d.pageNumber, d));

  // 1. FRONT COVER (Strictly Page 1, presented as ONE single page)
  const page1Dim = dimMap.get(1);
  const p1IsLandscape = page1Dim ? page1Dim.isLandscapeSpread : false;
  views.push({
    index: 0,
    type: "cover",
    pageNumbers: [1],
    singlePageNumber: 1,
    isLandscape: p1IsLandscape,
    aspectRatio: page1Dim?.aspectRatio || 0.707,
    label: "Cover · Page 1",
  });

  // 2. INTERIOR PAGES (Checking dimensions for each page)
  let p = 2;
  while (p <= totalPages) {
    const curDim = dimMap.get(p);
    const isLandscape = curDim ? curDim.isLandscapeSpread : false;

    // RULE: If page is landscape (width > height), it is ALREADY 2 pages combined into 1!
    // Therefore: Put it as 1 single page!
    if (isLandscape) {
      views.push({
        index: views.length,
        type: "combined_spread",
        pageNumbers: [p],
        singlePageNumber: p,
        isLandscape: true,
        aspectRatio: curDim?.aspectRatio || 1.414,
        label: `Spread · Plate ${p} (2-in-1)`,
      });
      p++;
      continue;
    }

    // RULE: If page is portrait (height > width):
    // If it's the last page, treat as Back Cover (single page)
    if (p === totalPages) {
      views.push({
        index: views.length,
        type: "back_cover",
        pageNumbers: [p],
        singlePageNumber: p,
        isLandscape: false,
        aspectRatio: curDim?.aspectRatio || 0.707,
        label: `Back Cover · Page ${p}`,
      });
      p++;
      continue;
    }

    // Check if next page (p + 1) is also portrait
    const nextDim = dimMap.get(p + 1);
    const nextIsLandscape = nextDim ? nextDim.isLandscapeSpread : false;

    if (!nextIsLandscape) {
      // Both are portrait: Pair them as Left and Right into a 2-page spread
      views.push({
        index: views.length,
        type: "paired_spread",
        pageNumbers: [p, p + 1],
        leftPageNumber: p,
        rightPageNumber: p + 1,
        isLandscape: false,
        label: `Pages ${p}–${p + 1}`,
      });
      p += 2;
    } else {
      // Next page is a landscape spread, so current portrait page stands alone
      views.push({
        index: views.length,
        type: "single_page",
        pageNumbers: [p],
        singlePageNumber: p,
        isLandscape: false,
        aspectRatio: curDim?.aspectRatio || 0.707,
        label: `Page ${p}`,
      });
      p++;
    }
  }

  return views;
}

export async function analyzeDocAndBuildViews(doc: PDFDocumentProxy): Promise<{
  dimensions: PDFPageDimension[];
  views: LookbookSpreadView[];
}> {
  const dimensions = await inspectPdfDimensions(doc);
  const views = buildLookbookSpreadViews(dimensions);
  return { dimensions, views };
}
