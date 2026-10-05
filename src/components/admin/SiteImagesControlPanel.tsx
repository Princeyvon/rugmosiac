import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getSiteImagesData,
  saveSiteImageSlot,
  resetAllSiteImages,
  getStudioLibraryImages,
} from "@/lib/site-images.functions";
import { adminUploadImage } from "@/lib/admin.functions";
import { updateClientOverrides } from "@/lib/site-images-client";
import {
  type FeaturedImageSlot,
  DEFAULT_FEATURED_SLOTS,
  type StudioLibraryItem,
} from "@/lib/site-images";
import {
  Image,
  Upload,
  RotateCcw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
  X,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Filter,
  Grid,
  Library,
  Sliders,
  Package,
  Film,
  Eye,
  CheckCheck,
  Clipboard,
  ClipboardPaste,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";

interface SiteImagesControlPanelProps {
  onToast?: (msg: string) => void;
  adminName?: string;
}

const GROUPS = [
  { id: "all", label: "All Slots" },
  { id: "homepage", label: "Homepage Hero" },
  { id: "categories", label: "Categories Grid" },
  { id: "carousels", label: "Heritage Carousel" },
  { id: "editorial", label: "Editorial & Social" },
  { id: "banners", label: "Banners & Footers" },
  { id: "craft", label: "Atelier Craft" },
] as const;

const LIBRARY_CATEGORIES = [
  { id: "all", label: "All Assets" },
  { id: "product", label: "Product Photography" },
  { id: "archival", label: "Studio Archival" },
  { id: "editorial", label: "Editorial & Styling" },
] as const;

interface PastedImageMeta {
  width: number;
  height: number;
  sizeKb: number;
  aspectRatio: string;
  ratioMatch: boolean;
}

export function SiteImagesControlPanel({
  onToast,
  adminName = "Studio Admin",
}: SiteImagesControlPanelProps) {
  const loadData = useServerFn(getSiteImagesData);
  const saveSlot = useServerFn(saveSiteImageSlot);
  const resetAll = useServerFn(resetAllSiteImages);
  const uploadImage = useServerFn(adminUploadImage);
  const loadLibrary = useServerFn(getStudioLibraryImages);

  // Top-level Sub Tab state
  const [subTab, setSubTab] = useState<"featured" | "library">("featured");

  // Featured Slots State
  const [slots, setSlots] = useState<FeaturedImageSlot[]>(DEFAULT_FEATURED_SLOTS);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Studio Library State
  const [libraryItems, setLibraryItems] = useState<StudioLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibCategory, setSelectedLibCategory] = useState<string>("all");
  const [librarySearch, setLibrarySearch] = useState<string>("");

  // Quick Assign Modal State (assign any library item to a featured slot)
  const [assigningItem, setAssigningItem] = useState<StudioLibraryItem | null>(null);

  // Modal / Drawer state for replacing image
  const [activeReplaceSlot, setActiveReplaceSlot] = useState<FeaturedImageSlot | null>(null);
  const [replaceMode, setReplaceMode] = useState<"clipboard" | "upload" | "library" | "url">("clipboard");
  const [pastedUrl, setPastedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Clipboard paste state for active slot
  const [pastedImageFile, setPastedImageFile] = useState<File | null>(null);
  const [pastedImageDataUrl, setPastedImageDataUrl] = useState<string | null>(null);
  const [pastedImageMeta, setPastedImageMeta] = useState<PastedImageMeta | null>(null);

  // Unassigned pasted image modal (when user presses ⌘V without any slot open)
  const [unassignedPastedData, setUnassignedPastedData] = useState<{
    file: File;
    dataUrl: string;
    width: number;
    height: number;
    sizeKb: number;
  } | null>(null);

  // Lightbox preview modal state
  const [previewLightbox, setPreviewLightbox] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  // Library replacement search filter
  const [modalLibSearch, setModalLibSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  // Load featured slots
  const refreshSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadData();
      if (res?.slots) {
        setSlots(res.slots);
        setOverrides(res.overrides || {});
        updateClientOverrides(res.overrides || {});
      }
    } catch (err: any) {
      console.error("Failed to load featured site images:", err);
      onToast?.("Could not refresh featured site images.");
    } finally {
      setLoading(false);
    }
  }, [loadData, onToast]);

  // Load studio library
  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const items = await loadLibrary();
      if (items) {
        setLibraryItems(items);
      }
    } catch (err: any) {
      console.error("Failed to load studio library:", err);
      onToast?.("Could not load studio library images.");
    } finally {
      setLibraryLoading(false);
    }
  }, [loadLibrary, onToast]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  // Fetch library when switching to library tab if empty
  useEffect(() => {
    if (subTab === "library" && libraryItems.length === 0) {
      refreshLibrary();
    }
  }, [subTab, libraryItems.length, refreshLibrary]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewLightbox) setPreviewLightbox(null);
        else if (activeReplaceSlot) closeReplaceModal();
        else if (assigningItem) setAssigningItem(null);
        else if (unassignedPastedData) setUnassignedPastedData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewLightbox, activeReplaceSlot, assigningItem, unassignedPastedData]);

  // Filter featured slots
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchGroup = selectedGroup === "all" || s.group === selectedGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.locationDesc.toLowerCase().includes(q) ||
        s.recommendedDimensions.toLowerCase().includes(q) ||
        s.aspectRatio.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [slots, selectedGroup, searchQuery]);

  // Filter library items
  const filteredLibrary = useMemo(() => {
    return libraryItems.filter((item) => {
      const matchCategory =
        selectedLibCategory === "all" || item.category === selectedLibCategory;
      const q = librarySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.role && item.role.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [libraryItems, selectedLibCategory, librarySearch]);

  const activeCustomCount = useMemo(() => {
    return Object.keys(overrides).length;
  }, [overrides]);

  // Handle single slot reset to default
  const handleResetSlot = async (slot: FeaturedImageSlot) => {
    if (!confirm(`Reset "${slot.title}" back to the studio original default image?`)) return;

    try {
      const res = await saveSlot({
        data: {
          slotId: slot.id,
          customUrl: null,
          updatedBy: adminName,
        },
      });
      if (res?.ok) {
        setOverrides(res.overrides);
        updateClientOverrides(res.overrides);
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, customUrl: null, updatedAt: null } : s))
        );
        onToast?.(`Reset "${slot.title}" to studio default.`);
      }
    } catch (err: any) {
      onToast?.(err?.message || "Failed to reset image.");
    }
  };

  // Handle saving new replacement URL for a slot
  const handleApplyReplacement = async (slotId: string, newUrl: string, slotTitle?: string) => {
    if (!newUrl.trim()) return;

    try {
      const res = await saveSlot({
        data: {
          slotId,
          customUrl: newUrl.trim(),
          updatedBy: adminName,
        },
      });

      if (res?.ok) {
        setOverrides(res.overrides);
        updateClientOverrides(res.overrides);
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? {
                  ...s,
                  customUrl: newUrl.trim(),
                  updatedAt: new Date().toISOString(),
                  updatedBy: adminName,
                }
              : s
          )
        );
        onToast?.(`Updated featured image for "${slotTitle || slotId}"! Changes are live.`);
        closeReplaceModal();
        setAssigningItem(null);
        setUnassignedPastedData(null);
      }
    } catch (err: any) {
      onToast?.(err?.message || "Failed to save image replacement.");
    }
  };

  // Handle file upload for slot replacement
  const handleFileUpload = async (file: File) => {
    if (!activeReplaceSlot) return;
    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;

        const uploadRes = await uploadImage({
          data: {
            filename: file.name,
            dataUrl,
          },
        });

        if (uploadRes?.url) {
          await handleApplyReplacement(activeReplaceSlot.id, uploadRes.url, activeReplaceSlot.title);
        } else {
          throw new Error("Server did not return an image URL.");
        }
      } catch (err: any) {
        setUploadError(err?.message || "Failed to upload image. Please try again.");
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Error reading local file.");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Handle direct upload to Studio Library
  const handleDirectLibraryUpload = useCallback(async (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const uploadRes = await uploadImage({
          data: {
            filename: file.name || `studio-asset-${Date.now()}.png`,
            dataUrl,
          },
        });

        if (uploadRes?.url) {
          onToast?.(`Uploaded "${file.name}" to studio assets!`);
          refreshLibrary();
        }
      } catch (err: any) {
        onToast?.(err?.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [uploadImage, onToast, refreshLibrary]);

  // Process an image file obtained from clipboard paste or dropzone
  const handlePastedFile = useCallback((file: File, targetSlot?: FeaturedImageSlot | null) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / (h || 1);
        setPastedImageFile(file);
        setPastedImageDataUrl(dataUrl);

        const slot = targetSlot || activeReplaceSlot;
        let targetRatio = 1;
        if (slot) {
          if (slot.aspectRatio.includes("16:9")) targetRatio = 16 / 9;
          else if (slot.aspectRatio.includes("4:5")) targetRatio = 4 / 5;
          else if (slot.aspectRatio.includes("1:1")) targetRatio = 1;
          else if (slot.aspectRatio.includes("24:10") || slot.aspectRatio.includes("21:9")) targetRatio = 2.4;
          else if (slot.aspectRatio.includes("3:2")) targetRatio = 3 / 2;
          else if (slot.aspectRatio.includes("5:4") || slot.aspectRatio.includes("4:3")) targetRatio = 4 / 3;
        }

        const isGoodMatch = Math.abs(ratio - targetRatio) < 0.28;

        setPastedImageMeta({
          width: w,
          height: h,
          sizeKb: Math.round(file.size / 1024),
          aspectRatio: `${(w / h).toFixed(2)}:1`,
          ratioMatch: isGoodMatch,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [activeReplaceSlot]);

  // Apply the clipboard image to the active slot
  const handleApplyPastedImage = async () => {
    if (!pastedImageFile || !pastedImageDataUrl || !activeReplaceSlot) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploadRes = await uploadImage({
        data: {
          filename: pastedImageFile.name || `clipboard-image-${Date.now()}.png`,
          dataUrl: pastedImageDataUrl,
        },
      });

      if (uploadRes?.url) {
        await handleApplyReplacement(
          activeReplaceSlot.id,
          uploadRes.url,
          activeReplaceSlot.title
        );
        setPastedImageFile(null);
        setPastedImageDataUrl(null);
        setPastedImageMeta(null);
      } else {
        throw new Error("Server did not return an image URL.");
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload pasted image.");
    } finally {
      setUploading(false);
    }
  };

  // Read clipboard in browser using Clipboard API
  const handleReadSystemClipboard = async (slot?: FeaturedImageSlot) => {
    setUploadError(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        onToast?.("Press ⌘V or Ctrl+V directly to paste from your clipboard.");
        return;
      }
      const items = await navigator.clipboard.read();
      let found = false;
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const file = new File([blob], `clipboard-image-${Date.now()}.${ext}`, {
            type: imageType,
          });
          handlePastedFile(file, slot || activeReplaceSlot);
          found = true;
          onToast?.("Image successfully loaded from clipboard!");
          break;
        }
      }
      if (!found) {
        onToast?.("No image detected on clipboard. Copy an image first, then paste.");
      }
    } catch {
      onToast?.("Press ⌘V or Ctrl+V on your keyboard to paste the image directly.");
    }
  };

  // Paste image directly into Studio Library
  const handleLibraryPasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        onToast?.("Press ⌘V or Ctrl+V directly to paste into Studio Library.");
        return;
      }
      const items = await navigator.clipboard.read();
      let found = false;
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const file = new File([blob], `studio-clipboard-${Date.now()}.${ext}`, {
            type: imageType,
          });
          await handleDirectLibraryUpload(file);
          found = true;
          onToast?.("Pasted image uploaded to Studio Library!");
          break;
        }
      }
      if (!found) {
        onToast?.("No image found on clipboard. Copy an image first, then paste.");
      }
    } catch {
      onToast?.("Press ⌘V or Ctrl+V on your keyboard to paste.");
    }
  };

  // Global paste event listener
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing into text inputs unless a file is in clipboardData
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        target.getAttribute("type") === "text"
      ) {
        if (!e.clipboardData?.files || e.clipboardData.files.length === 0) {
          return;
        }
      }

      if (!e.clipboardData) return;

      let file: File | null = null;
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const f = e.clipboardData.files[i];
          if (f.type.startsWith("image/")) {
            file = f;
            break;
          }
        }
      }

      if (!file && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith("image/")) {
            const blob = item.getAsFile();
            if (blob) {
              const ext = item.type.split("/")[1] || "png";
              file = new File([blob], `clipboard-${Date.now()}.${ext}`, {
                type: item.type,
              });
              break;
            }
          }
        }
      }

      if (file) {
        e.preventDefault();
        if (activeReplaceSlot) {
          setReplaceMode("clipboard");
          handlePastedFile(file, activeReplaceSlot);
          onToast?.("Image pasted from clipboard!");
        } else if (subTab === "library") {
          handleDirectLibraryUpload(file);
          onToast?.("Pasted image uploaded to Studio Library!");
        } else {
          // No slot active: open unassigned paste modal to let user choose slot
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const img = new window.Image();
            img.onload = () => {
              setUnassignedPastedData({
                file,
                dataUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
                sizeKb: Math.round(file.size / 1024),
              });
              onToast?.("Image detected from clipboard! Choose a slot to assign.");
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeReplaceSlot, subTab, handlePastedFile, handleDirectLibraryUpload, onToast]);

  // Apply unassigned pasted image to a selected slot
  const handleApplyUnassignedToSlot = async (slotId: string, slotTitle: string) => {
    if (!unassignedPastedData) return;
    setUploading(true);
    try {
      const uploadRes = await uploadImage({
        data: {
          filename: unassignedPastedData.file.name || `clipboard-image-${Date.now()}.png`,
          dataUrl: unassignedPastedData.dataUrl,
        },
      });

      if (uploadRes?.url) {
        await handleApplyReplacement(slotId, uploadRes.url, slotTitle);
        setUnassignedPastedData(null);
      } else {
        throw new Error("Server did not return an image URL.");
      }
    } catch (err: any) {
      onToast?.(err?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Handle reset all to studio defaults
  const handleResetAll = async () => {
    if (
      !confirm(
        "Are you sure you want to reset ALL featured images across the website back to their studio originals? Any uploaded replacements will be rolled back."
      )
    )
      return;

    try {
      await resetAll();
      setOverrides({});
      updateClientOverrides({});
      setSlots((prev) => prev.map((s) => ({ ...s, customUrl: null, updatedAt: null })));
      onToast?.("All featured imagery successfully reset to studio originals.");
    } catch (err: any) {
      onToast?.("Failed to reset images.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onToast?.("Image URL copied to clipboard.");
  };

  const closeReplaceModal = () => {
    setActiveReplaceSlot(null);
    setPastedUrl("");
    setUploadError(null);
    setUploading(false);
    setPastedImageFile(null);
    setPastedImageDataUrl(null);
    setPastedImageMeta(null);
    setModalLibSearch("");
  };

  // Quick action: Open slot directly in Paste mode
  const openSlotPaste = (slot: FeaturedImageSlot) => {
    setActiveReplaceSlot(slot);
    setReplaceMode("clipboard");
    setPastedUrl(slot.customUrl || "");
    setPastedImageFile(null);
    setPastedImageDataUrl(null);
    setPastedImageMeta(null);
    setTimeout(() => {
      handleReadSystemClipboard(slot);
    }, 60);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-accent">Storefront Art Direction</span>
              {activeCustomCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {activeCustomCount} Custom {activeCustomCount === 1 ? "Image" : "Images"} Live
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Site Imagery &amp; Studio Library
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Full control of all imagery across the storefront. Calibrate and replace featured
              hero cards, category backgrounds, and carousels with precision dimension specs, paste
              images directly from your clipboard (<kbd className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono font-medium">⌘V</kbd>), or browse and reuse the complete studio library of product and archival photography.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {subTab === "featured" ? (
              <>
                <button
                  type="button"
                  onClick={refreshSlots}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                {activeCustomCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
                  >
                    Reset All to Defaults
                  </button>
                )}
              </>
            ) : (
              <>
                <input
                  ref={libraryFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleDirectLibraryUpload(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => libraryFileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 active:scale-95"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload New Asset"}
                </button>
                <button
                  type="button"
                  onClick={handleLibraryPasteFromClipboard}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                  title="Paste image directly from clipboard (Cmd+V / Ctrl+V)"
                >
                  <ClipboardPaste className="h-3.5 w-3.5 text-accent" />
                  <span>Paste from Clipboard</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘V</span>
                </button>
                <button
                  type="button"
                  onClick={refreshLibrary}
                  disabled={libraryLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${libraryLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {/* Primary Sub-Tab Switcher */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setSubTab("featured")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              subTab === "featured"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Featured Site Slots</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {slots.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("library")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              subTab === "library"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Library className="h-4 w-4" />
            <span>Studio Image Library</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {libraryItems.length > 0 ? libraryItems.length : "All Media"}
            </span>
          </button>
        </div>

        {/* Search & Filter Bar: Sub-Tab 1 (Featured Slots) */}
        {subTab === "featured" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {GROUPS.map((g) => {
                const isSelected = selectedGroup === g.id;
                const count =
                  g.id === "all" ? slots.length : slots.filter((s) => s.group === g.id).length;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{g.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? "bg-background/20 text-background"
                          : "bg-background text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search slot, dimension, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter Bar: Sub-Tab 2 (Studio Library) */}
        {subTab === "library" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {LIBRARY_CATEGORIES.map((cat) => {
                const isSelected = selectedLibCategory === cat.id;
                const count =
                  cat.id === "all"
                    ? libraryItems.length
                    : libraryItems.filter((i) => i.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedLibCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? "bg-background/20 text-background"
                          : "bg-background text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by product name, SKU, asset..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground"
              />
              {librarySearch && (
                <button
                  type="button"
                  onClick={() => setLibrarySearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FEATURED SITE SLOTS                                            */}
      {/* ========================================================================= */}
      {subTab === "featured" && (
        <div className="space-y-6">
          {/* Quick Helper Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/20 text-accent font-mono font-bold shrink-0">
                ⌘V
              </span>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Instant Clipboard Paste:</strong> Copy any image to your clipboard and press <kbd className="rounded bg-background border px-1.5 py-0.5 font-mono text-[10px] text-foreground">⌘V</kbd> or <kbd className="rounded bg-background border px-1.5 py-0.5 font-mono text-[10px] text-foreground">Ctrl+V</kbd> anywhere on this screen, or click <strong className="text-foreground">Paste</strong> on any card to replace it instantly.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {filteredSlots.length} {filteredSlots.length === 1 ? "slot" : "slots"} shown
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => {
              const effectiveUrl = slot.customUrl || slot.defaultUrl;
              const isCustom = Boolean(slot.customUrl);
              const isDragOver = dragOverSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverSlotId(slot.id);
                  }}
                  onDragLeave={() => setDragOverSlotId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSlotId(null);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      setActiveReplaceSlot(slot);
                      setReplaceMode("upload");
                      handleFileUpload(file);
                    }
                  }}
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border transition-all ${
                    isDragOver
                      ? "border-accent ring-2 ring-accent scale-[1.01] bg-card shadow-lg"
                      : isCustom
                      ? "border-emerald-500/40 bg-card shadow-sm ring-1 ring-emerald-500/20"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  {/* Image Preview Container with Aspect Ratio */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img
                      src={effectiveUrl}
                      alt={slot.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-white backdrop-blur-md">
                        {slot.groupLabel}
                      </span>
                      {isCustom ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10.5px] font-medium text-white shadow-sm">
                          <Check className="h-3 w-3" /> Live Replacement
                        </span>
                      ) : (
                        <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10.5px] font-medium text-white/80 backdrop-blur-md">
                          Studio Default
                        </span>
                      )}
                    </div>

                    {/* Bottom Overlay Info & Quick Lightbox Preview */}
                    <div className="absolute bottom-3 inset-x-3 flex items-end justify-between text-white">
                      <div>
                        <span className="block font-mono text-[11px] font-semibold text-emerald-400">
                          Recommended: {slot.recommendedDimensions}
                        </span>
                        <span className="text-[10px] text-white/70">{slot.aspectRatio}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewLightbox({
                            url: effectiveUrl,
                            title: slot.title,
                            subtitle: `Recommended: ${slot.recommendedDimensions} (${slot.aspectRatio})`,
                          })
                        }
                        title="View High-Resolution Image"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-foreground"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                          {slot.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {slot.locationDesc}
                        </p>
                      </div>

                      {/* Recommendation Specifications Box */}
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Dimensions:</span>
                          <span className="font-mono font-medium text-foreground">
                            {slot.recommendedDimensions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Aspect Ratio:</span>
                          <span className="font-mono font-medium text-foreground">
                            {slot.aspectRatio}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Format & Max Size:</span>
                          <span className="font-medium text-muted-foreground">
                            {slot.recommendedFormat} ({slot.maxRecommendedSize})
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground/80 italic">
                        Tip: {slot.designNotes}
                      </p>

                      {isCustom && slot.updatedAt && (
                        <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
                          Active since {new Date(slot.updatedAt).toLocaleDateString()}
                          {slot.updatedBy ? ` by ${slot.updatedBy}` : ""}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplaceSlot(slot);
                          setReplaceMode("upload");
                          setPastedUrl(slot.customUrl || "");
                          setPastedImageFile(null);
                          setPastedImageDataUrl(null);
                          setPastedImageMeta(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Replace
                      </button>

                      <button
                        type="button"
                        onClick={() => openSlotPaste(slot)}
                        title="Paste image directly from clipboard (⌘V / Ctrl+V)"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted hover:border-foreground/40 active:scale-[0.98]"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5 text-accent" />
                        <span>Paste</span>
                        <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-mono text-muted-foreground">⌘V</span>
                      </button>

                      {isCustom ? (
                        <button
                          type="button"
                          onClick={() => handleResetSlot(slot)}
                          title="Revert back to studio original default"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => copyToClipboard(effectiveUrl, slot.id)}
                        title="Copy Image URL"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {copiedId === slot.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSlots.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="text-sm">No featured image slots match your search query.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs underline hover:text-foreground"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STUDIO IMAGE LIBRARY (INCLUDING ALL PRODUCTS)                   */}
      {/* ========================================================================= */}
      {subTab === "library" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {filteredLibrary.length} studio photography &amp; product assets
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredLibrary.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/40 hover:shadow-sm"
              >
                {/* Media preview */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Category Chip */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md ${
                        item.category === "product"
                          ? "bg-black/60 text-emerald-400"
                          : "bg-black/60 text-white"
                      }`}
                    >
                      {item.role || item.categoryLabel}
                    </span>
                  </div>

                  {/* Quick Zoom Trigger */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewLightbox({
                          url: item.url,
                          title: item.title,
                          subtitle: `${item.source} · ${item.url}`,
                        })
                      }
                      title="Inspect full image"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-white hover:text-black transition-colors"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Bottom Quick-Assign Action Overlay */}
                  <div className="absolute bottom-2.5 inset-x-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setAssigningItem(item)}
                      className="w-full rounded-xl bg-white py-2 text-xs font-semibold text-black shadow-lg hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Use as Featured Image...</span>
                    </button>
                  </div>
                </div>

                {/* Details info */}
                <div className="p-3.5 space-y-2">
                  <div>
                    <h4 className="font-display text-sm font-semibold truncate text-foreground">
                      {item.title}
                    </h4>
                    {item.productName && (
                      <span className="text-[11px] text-muted-foreground block truncate">
                        Product: {item.productName} {item.sku ? `(${item.sku})` : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[170px]">
                      {item.url}
                    </span>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.url, item.id)}
                      title="Copy Image Path"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="text-sm">No studio library assets match your search filter.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ASSIGN LIBRARY ITEM TO FEATURED SLOT MODAL                             */}
      {/* ========================================================================= */}
      {assigningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={assigningItem.url}
                  alt={assigningItem.title}
                  className="h-12 w-12 rounded-xl object-cover border border-border"
                />
                <div>
                  <span className="eyebrow text-accent">Assign to Featured Location</span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {assigningItem.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                    {assigningItem.url}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssigningItem(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select which slot on the storefront to assign this image to. The change takes effect
              immediately live on the website:
            </p>

            {/* Slots selector list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {slots.map((slot) => {
                const isCurrent = (slot.customUrl || slot.defaultUrl) === assigningItem.url;
                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-foreground/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={slot.customUrl || slot.defaultUrl}
                        alt={slot.title}
                        className="h-10 w-14 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {slot.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {slot.recommendedDimensions}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block line-clamp-1">
                          {slot.locationDesc}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                          <Check className="h-3 w-3" /> Currently Assigned
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyReplacement(slot.id, assigningItem.url, slot.title)
                          }
                          className="rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all"
                        >
                          Assign Here
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningItem(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. UNASSIGNED PASTED IMAGE MODAL (User pressed ⌘V without open slot)       */}
      {/* ========================================================================= */}
      {unassignedPastedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={unassignedPastedData.dataUrl}
                  alt="Clipboard Pasted Asset"
                  className="h-14 w-14 rounded-xl object-cover border border-border shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow text-accent">Clipboard Detected</span>
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-mono font-medium text-accent">
                      {unassignedPastedData.width} × {unassignedPastedData.height} px · {unassignedPastedData.sizeKb} KB
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    Select Slot for Pasted Image
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click any slot below to upload and replace that featured image live on the website:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUnassignedPastedData(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-foreground/50 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={slot.customUrl || slot.defaultUrl}
                      alt={slot.title}
                      className="h-10 w-14 rounded-lg object-cover border border-border shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {slot.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {slot.recommendedDimensions} ({slot.aspectRatio})
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block line-clamp-1">
                        {slot.locationDesc}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => handleApplyUnassignedToSlot(slot.id, slot.title)}
                    className="rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading ? "Applying..." : "Assign Here"}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setUnassignedPastedData(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REPLACE IMAGE MODAL / DRAWER                                           */}
      {/* ========================================================================= */}
      {activeReplaceSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="eyebrow text-accent">{activeReplaceSlot.groupLabel}</span>
                <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Replace: {activeReplaceSlot.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeReplaceSlot.locationDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReplaceModal}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Recommended Dimension Banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Target Dimensions: {activeReplaceSlot.recommendedDimensions} (
                  {activeReplaceSlot.aspectRatio})
                </div>
                <div className="text-emerald-700/80 dark:text-emerald-300/80">
                  Optimal format: {activeReplaceSlot.recommendedFormat} (
                  {activeReplaceSlot.maxRecommendedSize}).
                </div>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setReplaceMode("clipboard")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all ${
                  replaceMode === "clipboard"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-accent" />
                <span>Paste</span>
                <span className="hidden sm:inline rounded bg-muted px-1 text-[9px] font-mono">⌘V</span>
              </button>

              <button
                type="button"
                onClick={() => setReplaceMode("upload")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all ${
                  replaceMode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setReplaceMode("library")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all ${
                  replaceMode === "library"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Library className="h-3.5 w-3.5" />
                <span>Library</span>
              </button>

              <button
                type="button"
                onClick={() => setReplaceMode("url")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all ${
                  replaceMode === "url"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Direct URL</span>
              </button>
            </div>

            {/* =================================================================== */}
            {/* MODE 1: PASTE FROM CLIPBOARD (PRIMARY REQUEST)                      */}
            {/* =================================================================== */}
            {replaceMode === "clipboard" && (
              <div className="space-y-4">
                {!pastedImageDataUrl ? (
                  // State 1A: Waiting for paste
                  <div
                    tabIndex={0}
                    onClick={() => handleReadSystemClipboard()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleReadSystemClipboard();
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        handlePastedFile(file);
                      }
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-8 text-center transition-all hover:border-accent hover:bg-accent/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent transition-transform group-hover:scale-110">
                      <ClipboardPaste className="h-7 w-7" />
                    </div>

                    <div className="mt-3 font-medium text-sm text-foreground">
                      Click here to paste from clipboard
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                      Or press <kbd className="rounded bg-background border px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold">⌘V</kbd> (Mac) / <kbd className="rounded bg-background border px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold">Ctrl+V</kbd> anywhere on your keyboard.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadSystemClipboard();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        <span>Paste from Clipboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Or browse file</span>
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] text-muted-foreground/70">
                      You can copy any image from Figma, Photoshop, Pinterest, or your file explorer.
                    </p>
                  </div>
                ) : (
                  // State 1B: Image Pasted & Ready for Live Replacement
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Visual Comparison: Current vs Pasted */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground block">
                          Current Active Image
                        </span>
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
                          <img
                            src={activeReplaceSlot.customUrl || activeReplaceSlot.defaultUrl}
                            alt="Current"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Pasted Image Preview
                        </span>
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border-2 border-emerald-500 bg-muted shadow-sm">
                          <img
                            src={pastedImageDataUrl}
                            alt="Pasted preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewLightbox({
                                url: pastedImageDataUrl,
                                title: "Pasted Clipboard Image",
                                subtitle: `${pastedImageMeta?.width} × ${pastedImageMeta?.height} px · ${pastedImageMeta?.sizeKb} KB`,
                              })
                            }
                            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-white hover:text-black transition-colors"
                          >
                            <Maximize2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dimension & Calibration Inspector */}
                    {pastedImageMeta && (
                      <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pasted Resolution:</span>
                          <span className="font-mono font-medium text-foreground">
                            {pastedImageMeta.width} × {pastedImageMeta.height} px
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Recommended Slot Size:</span>
                          <span className="font-mono font-medium text-muted-foreground">
                            {activeReplaceSlot.recommendedDimensions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Aspect Ratio:</span>
                          <span className="font-mono font-medium text-foreground">
                            {pastedImageMeta.aspectRatio} (Target: {activeReplaceSlot.aspectRatio})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">File Size:</span>
                          <span className="font-mono text-muted-foreground">
                            {pastedImageMeta.sizeKb} KB
                          </span>
                        </div>

                        {pastedImageMeta.ratioMatch ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/50">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Optimal aspect ratio match! Proportions align cleanly with this slot.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t border-border/50">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Proportion variance: Image will automatically be centered with object-cover.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={handleApplyPastedImage}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-sm"
                      >
                        {uploading ? (
                          <>
                            <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading &amp; Replacing Live...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Apply Live Replacement</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPastedImageFile(null);
                          setPastedImageDataUrl(null);
                          setPastedImageMeta(null);
                        }}
                        className="rounded-xl border border-border px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Paste Different
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* MODE 2: UPLOAD FILE                                                 */}
            {/* =================================================================== */}
            {replaceMode === "upload" && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-foreground/50 hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-110">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="mt-3 font-medium text-sm">
                    {uploading ? "Analyzing & uploading image..." : "Choose image file or drag here"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepts JPEG, PNG, or WebP up to 10MB
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    <ClipboardPaste className="h-3 w-3" /> Or press ⌘V to paste from clipboard
                  </span>
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* MODE 3: STUDIO LIBRARY SELECTOR                                     */}
            {/* =================================================================== */}
            {replaceMode === "library" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Click any product or archival asset to apply:
                  </span>
                  <input
                    type="text"
                    placeholder="Search library..."
                    value={modalLibSearch}
                    onChange={(e) => setModalLibSearch(e.target.value)}
                    className="w-40 rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-foreground"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto p-1">
                  {(libraryItems.length > 0
                    ? libraryItems
                    : DEFAULT_FEATURED_SLOTS.map((s) => ({
                        id: s.id,
                        url: s.defaultUrl,
                        title: s.title,
                        category: "featured" as const,
                        categoryLabel: "Featured",
                        source: "Defaults",
                      }))
                  )
                    .filter(
                      (item) =>
                        !modalLibSearch ||
                        item.title.toLowerCase().includes(modalLibSearch.toLowerCase()) ||
                        ((item as { productName?: string }).productName &&
                          ((item as { productName?: string }).productName as string).toLowerCase().includes(modalLibSearch.toLowerCase()))
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          handleApplyReplacement(activeReplaceSlot.id, s.url, activeReplaceSlot.title)
                        }
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border hover:border-foreground transition-all"
                      >
                        <img
                          src={s.url}
                          alt={s.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center p-1 text-center">
                          <span className="text-[10.5px] text-white font-medium line-clamp-2">
                            Select {s.title}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* MODE 4: DIRECT URL                                                  */}
            {/* =================================================================== */}
            {replaceMode === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Image URL (relative path or HTTPS CDN link)
                  </label>
                  <input
                    type="text"
                    value={pastedUrl}
                    onChange={(e) => setPastedUrl(e.target.value)}
                    placeholder="e.g. /__l5e/assets-v1/... or https://..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                  />
                </div>

                {pastedUrl && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted border border-border">
                    <img
                      src={pastedUrl}
                      alt="URL preview"
                      className="h-full w-full object-cover"
                      onError={() => onToast?.("Image failed to load from that URL.")}
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!pastedUrl.trim()}
                  onClick={() =>
                    handleApplyReplacement(activeReplaceSlot.id, pastedUrl, activeReplaceSlot.title)
                  }
                  className="w-full rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Apply Live Replacement
                </button>
              </div>
            )}

            {/* Current vs Default footer info */}
            <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Default asset:{" "}
                <button
                  type="button"
                  onClick={() =>
                    handleApplyReplacement(
                      activeReplaceSlot.id,
                      activeReplaceSlot.defaultUrl,
                      activeReplaceSlot.title
                    )
                  }
                  className="underline hover:text-foreground"
                >
                  Restore original
                </button>
              </span>
              <button
                type="button"
                onClick={closeReplaceModal}
                className="text-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIGHTBOX HIGH-RESOLUTION PREVIEW MODAL                                 */}
      {/* ========================================================================= */}
      {previewLightbox && (
        <div
          onClick={() => setPreviewLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-background text-foreground shadow-2xl cursor-default"
          >
            <div className="relative aspect-[16/10] max-h-[70vh] w-full bg-black flex items-center justify-center">
              <img
                src={previewLightbox.url}
                alt={previewLightbox.title}
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewLightbox(null)}
                className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-white hover:text-black transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border">
              <div>
                <h4 className="font-display text-lg font-semibold">{previewLightbox.title}</h4>
                {previewLightbox.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {previewLightbox.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(previewLightbox.url, "lightbox")}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-medium hover:bg-muted"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = libraryItems.find((i) => i.url === previewLightbox.url) || {
                      id: "custom",
                      url: previewLightbox.url,
                      title: previewLightbox.title,
                      category: "archival" as const,
                      categoryLabel: "Studio Asset",
                      source: "Preview",
                    };
                    setPreviewLightbox(null);
                    setAssigningItem(item);
                  }}
                  className="rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
                >
                  Use as Featured Image...
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
