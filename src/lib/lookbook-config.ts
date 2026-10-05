/**
 * Lookbook configuration and persistence for Mosiac Kigali Atelier Monograph
 */

export interface LookbookConfig {
  pdfUrl: string;
  fileName: string;
  fileSize: string;
  volumeTitle: string;
  editionName: string;
  subtitle: string;
  updatedAt: string;
  pageCount?: number;
  notes?: string;
}

export const DEFAULT_LOOKBOOK_CONFIG: LookbookConfig = {
  pdfUrl: "/Mosiac-Lookbook-2026.pdf",
  fileName: "Mosiac-Lookbook-2026-Volume-I.pdf",
  fileSize: "4.0 MB",
  volumeTitle: "Volume I · 2026 Edition",
  editionName: "Kigali Atelier Monograph",
  subtitle: "Bespoke Hand-Tufted Rugs, Sculptural Pile Reliefs & Architectural Commissions",
  updatedAt: "2026-09-23",
  pageCount: 8,
  notes: "Official hardcopy monograph companion for architects and private collectors.",
};

const STORAGE_KEY = "mosiac.lookbook.config";
const IDB_NAME = "mosiac_lookbook_db";
const IDB_STORE = "pdf_blobs";

export function getClientLookbookConfig(): LookbookConfig {
  if (typeof window === "undefined") return DEFAULT_LOOKBOOK_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LOOKBOOK_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to read lookbook config from localStorage", e);
  }
  return DEFAULT_LOOKBOOK_CONFIG;
}

export function saveClientLookbookConfig(config: LookbookConfig): void {
  if (typeof window === "undefined") return;
  try {
    // If pdfUrl is a huge data URL, sanitize it for localStorage to avoid QuotaExceededError
    const safeConfig: LookbookConfig = { ...config };
    if (safeConfig.pdfUrl && safeConfig.pdfUrl.startsWith("data:") && safeConfig.pdfUrl.length > 500000) {
      // Keep lightweight reference in localStorage while retaining fileName, size, and title
      safeConfig.pdfUrl = "/api/public/img/lookbook-latest.pdf";
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
    // Dispatch custom event for reactive UI updates across tabs & components
    window.dispatchEvent(new CustomEvent("mosiac:lookbook-updated", { detail: config }));
  } catch (e) {
    console.warn("Failed to write lookbook config to localStorage", e);
  }
}

// IndexedDB Helper for storing large PDF Blobs in browser with no 5MB quota limit
function openPdfDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function storePdfBlobLocally(blob: Blob): Promise<boolean> {
  try {
    const db = await openPdfDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(blob, "active_pdf");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function getLocalPdfBlob(): Promise<Blob | null> {
  try {
    const db = await openPdfDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get("active_pdf");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
