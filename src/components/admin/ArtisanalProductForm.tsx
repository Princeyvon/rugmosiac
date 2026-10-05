import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Sparkles,
  Calculator,
  Layers,
  DollarSign,
  Palette,
  Check,
  RefreshCw,
  Eye,
  Star,
  Flame,
  Info,
  Link as LinkIcon,
  Ruler,
  Loader2,
  X,
  Tag,
  CheckCircle2,
  ClipboardPaste,
  Upload,
} from "lucide-react";
import {
  ArtisanalSpecs,
  DEFAULT_ARTISANAL_SPECS,
  parseArtisanalSpecs,
  serializeArtisanalSpecs,
  cmToFeetInches,
  calculateWeightKg,
  SizeRow,
} from "./types";
import { MediaGalleryManager } from "./MediaGalleryManager";
import {
  HASSAN_OUTLINE_SVG,
  RECTANGLE_OUTLINE_SVG,
  CIRCULAR_OUTLINE_SVG,
  interpolateOutlineSvg,
} from "@/lib/size-guide-outlines";

export interface ColorwayEdition {
  id?: string;
  name: string;
  colors?: string;
  hex?: string; // primary color for backwards compatibility
  hexes: string[]; // array of 1 or more colors combined into a gradient!
  gradient: string; // CSS linear-gradient string
}

export interface ArtisanalProductDraft {
  id?: string;
  slug?: string;
  name: string;
  sku?: string | null;
  category_id?: string | null;
  shape: "rectangle" | "circular" | "runner" | "organic";
  short_description?: string | null;
  description?: string | null;
  stock_status: "in_stock" | "made_to_order" | "out_of_stock";
  fulfilment_type: "ready_to_ship" | "made_to_order" | "custom";
  production_time?: string | null;
  material?: string | null;
  design_style?: string | null;
  care_instructions?: string | null;
  weight_kg?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  featured: boolean;
  featured_order: number;
  is_published: boolean;
  main_image_url?: string | null;
  hover_image_url?: string | null;
  color_palette: string[];
  tags: string[];
  base_price_rwf?: number | null;
  cost_rwf?: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  sizes: SizeRow[];
  size_guide_svg?: string | null;
  colorways?: ColorwayEdition[];
  images: Array<{ id?: string; url: string; alt: string | null; sort_order?: number; colorway_id?: string | null }>;
  notes?: string | null;
  archived_at?: string | null;
}

interface ArtisanalProductFormProps {
  initialData: ArtisanalProductDraft | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  exchangeRateRwfPerUsd: number;
  onSave: (draft: ArtisanalProductDraft) => Promise<void>;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
}

// Standard standard sizing presets
const STANDARD_SIZES: Record<string, { label: string; width_cm: number; height_cm: number; priceMult: number }> = {
  S: { label: "S (120 × 180 cm)", width_cm: 120, height_cm: 180, priceMult: 0.75 },
  M: { label: "M (160 × 230 cm)", width_cm: 160, height_cm: 230, priceMult: 1.0 },
  L: { label: "L (200 × 300 cm)", width_cm: 200, height_cm: 300, priceMult: 1.6 },
  XL: { label: "XL (240 × 340 cm)", width_cm: 240, height_cm: 340, priceMult: 2.2 },
};

// Preset artisanal palettes to quickly generate multi-color gradient editions
const ARTISANAL_GRADIENT_PRESETS = [
  { name: "Volcanic Basalt & Ochre", hexes: ["#C08A21", "#1A202C"] },
  { name: "Highland Sunset Trio", hexes: ["#C08A21", "#C86446", "#1A202C"] },
  { name: "Lake Kivu Azure & Sand", hexes: ["#2B7FC4", "#E8DEC8", "#D4A373"] },
  { name: "Rift Minimalist Neutral", hexes: ["#E8DEC8", "#D4A373"] },
  { name: "Forest Moss & Terracotta", hexes: ["#3D5A45", "#C86446", "#1A202C"] },
  { name: "Kigali Clay & Raw Cream", hexes: ["#D4A373", "#F4EBD9"] },
];

function normalizeColorways(rawList: any[] | undefined): ColorwayEdition[] {
  if (!rawList || rawList.length === 0) {
    return [
      {
        id: "col-1",
        name: "Highland Ochre & Basalt",
        hex: "#C08A21",
        hexes: ["#C08A21", "#1A202C"],
        gradient: "linear-gradient(135deg, #C08A21, #1A202C)",
        colors: "Warm ochre & volcanic basalt",
      },
      {
        id: "col-2",
        name: "Rift Neutral Tri-Tone",
        hex: "#E8DEC8",
        hexes: ["#E8DEC8", "#D4A373", "#2D3748"],
        gradient: "linear-gradient(135deg, #E8DEC8, #D4A373, #2D3748)",
        colors: "Unbleached wool, amber, slate",
      },
    ];
  }

  return rawList.map((cw, i) => {
    let hexes: string[] = [];
    if (Array.isArray(cw.hexes) && cw.hexes.length > 0) {
      hexes = cw.hexes;
    } else if (typeof cw.colors === "string" && cw.colors.includes("#")) {
      const matches = cw.colors.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
      if (matches && matches.length > 0) {
        hexes = matches;
      }
    }
    if (hexes.length === 0 && cw.hex) {
      hexes = [cw.hex];
    }
    if (hexes.length === 0) {
      hexes = ["#C08A21"];
    }

    const gradient =
      cw.gradient ||
      (hexes.length > 1
        ? `linear-gradient(135deg, ${hexes.join(", ")})`
        : hexes[0]);

    return {
      id: cw.id || `col-${i + 1}`,
      name: cw.name || `Edition ${i + 1}`,
      hex: hexes[0],
      hexes,
      gradient,
      colors: cw.colors || cw.name,
    };
  });
}

export function ArtisanalProductForm({
  initialData,
  categories,
  exchangeRateRwfPerUsd,
  onSave,
  onClose,
  onDelete,
  onUploadFile,
}: ArtisanalProductFormProps) {
  // Primary product state
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || "");
  const [shape, setShape] = useState<"rectangle" | "circular" | "runner" | "organic">(
    initialData?.shape || "rectangle",
  );
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [stockStatus, setStockStatus] = useState<"in_stock" | "made_to_order" | "out_of_stock">(
    initialData?.stock_status || "made_to_order",
  );
  const [fulfilmentType, setFulfilmentType] = useState<"ready_to_ship" | "made_to_order" | "custom">(
    initialData?.fulfilment_type || "made_to_order",
  );
  const [productionTime, setProductionTime] = useState(
    initialData?.production_time || "Hand-tufted to order: 3–4 weeks in Kigali Studio",
  );
  const [material, setMaterial] = useState(
    initialData?.material || "100% Rwandan Highland Wool on Organic Cotton Base",
  );
  const [basePriceRwf, setBasePriceRwf] = useState<number | null>(initialData?.base_price_rwf || 320000);
  const [costRwf, setCostRwf] = useState<number | null>(initialData?.cost_rwf || 140000);
  const [stockQty, setStockQty] = useState<number>(initialData?.stock_qty ?? 3);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialData?.low_stock_threshold ?? 2);
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? false);
  const [featuredOrder, setFeaturedOrder] = useState<number>(initialData?.featured_order ?? 1);
  const [isPublished, setIsPublished] = useState<boolean>(initialData?.is_published ?? true);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(
    (initialData?.tags || []).includes("new"),
  );

  // Sizing & Weights Matrix
  const [sizes, setSizes] = useState<SizeRow[]>(() => {
    if (initialData?.sizes && initialData.sizes.length > 0) {
      return initialData.sizes;
    }
    return [
      { label: "S (120 × 180 cm)", width_cm: 120, height_cm: 180, price_rwf: 240000, weight_kg: 8.2, sort_order: 0 },
      { label: "M (160 × 230 cm)", width_cm: 160, height_cm: 230, price_rwf: 320000, weight_kg: 14.0, sort_order: 1 },
      { label: "L (200 × 300 cm)", width_cm: 200, height_cm: 300, price_rwf: 510000, weight_kg: 22.8, sort_order: 2 },
      { label: "XL (240 × 340 cm)", width_cm: 240, height_cm: 340, price_rwf: 700000, weight_kg: 31.0, sort_order: 3 },
    ];
  });

  // Colourways with Multi-Color Gradient support
  const [colorways, setColorways] = useState<ColorwayEdition[]>(() =>
    normalizeColorways(initialData?.colorways),
  );

  // Add new edition state
  const [newColorwayName, setNewColorwayName] = useState("");
  const [newColorwayHexes, setNewColorwayHexes] = useState<string[]>(["#C08A21", "#1A202C"]);

  // Media images
  const [images, setImages] = useState<Array<{ id?: string; url: string; alt: string | null; sort_order?: number; colorway_id?: string | null }>>(() => {
    if (initialData?.images && initialData.images.length > 0) return initialData.images;
    if (initialData?.main_image_url) {
      const arr = [{ url: initialData.main_image_url, alt: "Primary studio view", sort_order: 0 }];
      if (initialData.hover_image_url) {
        arr.push({ url: initialData.hover_image_url, alt: "Interior atmospheric shot", sort_order: 1 });
      }
      return arr;
    }
    return [];
  });

  // Artisanal Specs (parsed from notes)
  const [specs, setSpecs] = useState<ArtisanalSpecs>(() => parseArtisanalSpecs(initialData?.notes));
  const [sizeGuideSvg, setSizeGuideSvg] = useState<string>(initialData?.size_guide_svg ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Sizing helpers
  function handleRecalculateWeights() {
    const updated = sizes.map((s) => ({
      ...s,
      weight_kg: calculateWeightKg(shape, s.width_cm, s.height_cm, specs.pileHeightMm >= 16 ? 4.8 : 3.8),
    }));
    setSizes(updated);
  }

  function handleResetStandardSizes() {
    const base = basePriceRwf || 320000;
    const standardList: SizeRow[] = Object.entries(STANDARD_SIZES).map(([key, def], i) => {
      const p = Math.round((base * def.priceMult) / 5000) * 5000;
      const w = calculateWeightKg(shape, def.width_cm, def.height_cm, specs.pileHeightMm >= 16 ? 4.8 : 3.8);
      return {
        label: `${key} (${def.width_cm} × ${def.height_cm} cm)`,
        width_cm: def.width_cm,
        height_cm: def.height_cm,
        price_rwf: p,
        weight_kg: w,
        sort_order: i,
      };
    });
    setSizes(standardList);
  }

  function handleQuickAddSize(key: "S" | "M" | "L" | "XL") {
    const def = STANDARD_SIZES[key];
    if (!def) return;
    const base = basePriceRwf || 320000;
    const p = Math.round((base * def.priceMult) / 5000) * 5000;
    const w = calculateWeightKg(shape, def.width_cm, def.height_cm);
    setSizes([
      ...sizes,
      {
        label: `${key} (${def.width_cm} × ${def.height_cm} cm)`,
        width_cm: def.width_cm,
        height_cm: def.height_cm,
        price_rwf: p,
        weight_kg: w,
        sort_order: sizes.length,
      },
    ]);
  }

  // Multi-color colorway manipulation handlers
  function handleAddColorToColorway(cwIndex: number) {
    const updated = [...colorways];
    const cw = { ...updated[cwIndex] };
    const currentHexes = [...cw.hexes];
    const fallbackColor = currentHexes.length === 1 ? "#1A202C" : "#E8DEC8";
    currentHexes.push(fallbackColor);
    cw.hexes = currentHexes;
    cw.hex = currentHexes[0];
    cw.gradient = `linear-gradient(135deg, ${currentHexes.join(", ")})`;
    updated[cwIndex] = cw;
    setColorways(updated);
  }

  function handleUpdateColorInColorway(cwIndex: number, colorIndex: number, newHex: string) {
    const updated = [...colorways];
    const cw = { ...updated[cwIndex] };
    const currentHexes = [...cw.hexes];
    currentHexes[colorIndex] = newHex;
    cw.hexes = currentHexes;
    cw.hex = currentHexes[0];
    cw.gradient = currentHexes.length > 1 ? `linear-gradient(135deg, ${currentHexes.join(", ")})` : currentHexes[0];
    updated[cwIndex] = cw;
    setColorways(updated);
  }

  function handleRemoveColorFromColorway(cwIndex: number, colorIndex: number) {
    const updated = [...colorways];
    const cw = { ...updated[cwIndex] };
    if (cw.hexes.length <= 1) return;
    const currentHexes = cw.hexes.filter((_, i) => i !== colorIndex);
    cw.hexes = currentHexes;
    cw.hex = currentHexes[0];
    cw.gradient = currentHexes.length > 1 ? `linear-gradient(135deg, ${currentHexes.join(", ")})` : currentHexes[0];
    updated[cwIndex] = cw;
    setColorways(updated);
  }

  function handleUpdateColorwayName(cwIndex: number, newName: string) {
    const updated = [...colorways];
    updated[cwIndex] = { ...updated[cwIndex], name: newName };
    setColorways(updated);
  }

  function handleRemoveColorway(index: number) {
    setColorways(colorways.filter((_, i) => i !== index));
  }

  function handleAddNewColorway() {
    if (!newColorwayName.trim()) return;
    const id = `col-${Date.now().toString().slice(-4)}`;
    const hexes = newColorwayHexes.length > 0 ? newColorwayHexes : ["#C08A21"];
    const gradient = hexes.length > 1 ? `linear-gradient(135deg, ${hexes.join(", ")})` : hexes[0];
    setColorways([
      ...colorways,
      {
        id,
        name: newColorwayName.trim(),
        hex: hexes[0],
        hexes,
        gradient,
        colors: newColorwayName.trim(),
      },
    ]);
    setNewColorwayName("");
    setNewColorwayHexes(["#C08A21", "#1A202C"]);
  }

  function handleAddColorToNewEdition() {
    const nextTones = ["#C86446", "#2B7FC4", "#E8DEC8", "#1A202C", "#3D5A45"];
    const nextColor = nextTones[newColorwayHexes.length % nextTones.length];
    setNewColorwayHexes([...newColorwayHexes, nextColor]);
  }

  function handleUpdateColorInNewEdition(idx: number, hex: string) {
    const next = [...newColorwayHexes];
    next[idx] = hex;
    setNewColorwayHexes(next);
  }

  function handleRemoveColorFromNewEdition(idx: number) {
    if (newColorwayHexes.length <= 1) return;
    setNewColorwayHexes(newColorwayHexes.filter((_, i) => i !== idx));
  }

  // Margin & Economics
  const rawMaterialTotalRwf =
    (specs.rawMaterials.woolKg || 0) * (specs.rawMaterials.woolRateRwfPerKg || 14000) +
    (specs.rawMaterials.foundationClothRwf || 0) +
    (specs.rawMaterials.latexRwf || 0) +
    (specs.rawMaterials.edgeBindingRwf || 0);

  const laborTotalRwf = (specs.labor.weavingHours || 0) * (specs.labor.hourlyRateRwf || 4500);
  const calculatedCostRwf = rawMaterialTotalRwf + laborTotalRwf + (specs.logisticsRwf || 0);
  const grossProfitRwf = (basePriceRwf || 0) - calculatedCostRwf;
  const grossMarginPct = basePriceRwf && basePriceRwf > 0 ? Math.round((grossProfitRwf / basePriceRwf) * 100) : 0;
  const usdPrice = basePriceRwf ? Math.round(basePriceRwf / exchangeRateRwfPerUsd) : 0;

  async function handleFormSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a rug title.");
      return;
    }
    setIsSaving(true);
    try {
      const tagsList = initialData?.tags || [];
      const cleanTags = tagsList.filter((t) => t !== "new");
      if (isNewArrival) cleanTags.push("new");

      const allPaletteColors = Array.from(
        new Set(colorways.flatMap((c) => c.hexes || [c.hex]).filter(Boolean)),
      ) as string[];

      const draftToSave: ArtisanalProductDraft = {
        id: initialData?.id,
        slug: initialData?.slug,
        name: name.trim(),
        sku: sku.trim() || null,
        category_id: categoryId || null,
        shape,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        stock_status: stockStatus,
        fulfilment_type: fulfilmentType,
        production_time: productionTime.trim() || null,
        material: material.trim() || null,
        design_style: specs.constructionTechnique,
        care_instructions: initialData?.care_instructions || "Vacuum gently without beater bar. Spot clean with damp cloth and organic soap.",
        weight_kg: sizes[0]?.weight_kg || 12.0,
        featured,
        featured_order: featuredOrder,
        is_published: isPublished,
        main_image_url: images[0]?.url || initialData?.main_image_url || null,
        hover_image_url: images[1]?.url || images[0]?.url || null,
        color_palette: allPaletteColors,
        colorways,
        tags: cleanTags,
        base_price_rwf: basePriceRwf,
        cost_rwf: costRwf || calculatedCostRwf,
        stock_qty: stockQty,
        low_stock_threshold: lowStockThreshold,
        sizes,
        size_guide_svg: sizeGuideSvg.trim() || null,
        images,
        notes: serializeArtisanalSpecs(specs),
        archived_at: initialData?.archived_at ?? null,
      };

      await onSave(draftToSave);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Page Header & Sticky Action Bar */}
      <div className="sticky top-16 z-20 -mx-4 -mt-2 border-b border-border bg-background/95 px-4 py-3 sm:-mx-6 sm:-mt-4 sm:px-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
              title="Return to catalogue inventory"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Catalogue</span>
            </button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-base font-bold sm:text-lg">
                  {name ? name : "New Studio Piece"}
                </h1>
                {sku && (
                  <span className="hidden rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase sm:inline">
                    {sku}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isPublished
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {initialData?.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
                    onDelete(initialData.id!);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleFormSubmit()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2 text-xs font-semibold text-background shadow-xs hover:opacity-90 disabled:opacity-50 transition"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? "Saving Piece..." : "Save Product"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Highlights Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Base Retail</div>
          <div className="mt-1 font-mono text-base font-bold sm:text-lg">
            {(basePriceRwf || 0).toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-muted-foreground">≈ ${usdPrice} USD</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gross Margin</div>
          <div className={`mt-1 font-mono text-base font-bold sm:text-lg ${grossMarginPct >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
            {grossMarginPct}%
          </div>
          <div className="text-[11px] text-muted-foreground">Profit: {(grossProfitRwf || 0).toLocaleString()} RWF</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Availability</div>
          <div className="mt-1 text-xs font-bold capitalize">
            {stockStatus.replace(/_/g, " ")}
          </div>
          <div className="text-[11px] text-muted-foreground">{stockQty} units in stock</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Colorways</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-mono text-base font-bold">{colorways.length}</span>
            <div className="flex -space-x-1">
              {colorways.slice(0, 3).map((cw, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border border-border shadow-xs"
                  style={{ background: cw.gradient || cw.hex }}
                  title={cw.name}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">Multi-gradient enabled</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Size Options</div>
          <div className="mt-1 font-mono text-base font-bold sm:text-lg">{sizes.length} Tiers</div>
          <div className="text-[11px] text-muted-foreground">{sizes[0]?.label?.split(" ")[0] || "Standard"} to {sizes[sizes.length - 1]?.label?.split(" ")[0] || "Custom"}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gallery Assets</div>
          <div className="mt-1 font-mono text-base font-bold sm:text-lg">{images.length} Photos</div>
          <div className="text-[11px] text-muted-foreground">Clipboard paste active</div>
        </div>
      </div>

      {/* SECTION 1: ESSENTIALS & STOREFRONT PROFILE */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 font-serif font-bold text-foreground">
              01
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Essentials & Storefront Presence</h2>
              <p className="text-xs text-muted-foreground">
                Rug identity, collection classification, commercial pricing, and stock settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-0"
              />
              <span>Live on Storefront</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-0"
              />
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-0"
              />
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <span>New Arrival</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Piece Title */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rug Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arc / Imigongo Basalt / Volcanic Terracotta"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold outline-hidden focus:border-foreground"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atelier SKU
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. MOS-ARC-001"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capsule Collection
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium outline-hidden focus:border-foreground"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shape */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Silhouette / Shape
            </label>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value as any)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium outline-hidden focus:border-foreground"
            >
              <option value="rectangle">Rectangle (Standard)</option>
              <option value="circular">Circular / Round</option>
              <option value="runner">Long Corridor Runner</option>
              <option value="organic">Organic / Sculptural Contour</option>
            </select>
          </div>

          {/* Fulfilment Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fulfilment Type
            </label>
            <select
              value={fulfilmentType}
              onChange={(e) => setFulfilmentType(e.target.value as any)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium outline-hidden focus:border-foreground"
            >
              <option value="ready_to_ship">Ready to Ship (In Atelier)</option>
              <option value="made_to_order">Made to Order (3–4 Weeks)</option>
              <option value="custom">Bespoke Architectural Commission</option>
            </select>
          </div>

          {/* Pricing: Base Price */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Base Retail Price (RWF)
            </label>
            <div className="relative mt-1.5">
              <input
                type="number"
                value={basePriceRwf ?? ""}
                onChange={(e) => setBasePriceRwf(e.target.value ? Number(e.target.value) : null)}
                placeholder="320000"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm font-semibold outline-hidden focus:border-foreground"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                ≈ ${usdPrice} USD
              </span>
            </div>
          </div>

          {/* Production Cost */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Production Cost (RWF)
            </label>
            <input
              type="number"
              value={costRwf ?? ""}
              onChange={(e) => setCostRwf(e.target.value ? Number(e.target.value) : null)}
              placeholder="140000"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-hidden focus:border-foreground"
            />
          </div>

          {/* Stock Status & Quantity */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Status & Quantity
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-hidden focus:border-foreground"
              >
                <option value="in_stock">In Stock</option>
                <option value="made_to_order">Made to Order</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                placeholder="Qty"
                className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-hidden focus:border-foreground"
              />
            </div>
          </div>

          {/* Material */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Fiber & Material
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="100% Rwandan Highland Wool on Organic Cotton Base"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Lead / Production Time */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Production & Weaving Lead Time
            </label>
            <input
              type="text"
              value={productionTime}
              onChange={(e) => setProductionTime(e.target.value)}
              placeholder="Hand-tufted to order: 3–4 weeks"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Short Story */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Short Concept Narrative (Shown on Card Hover)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Minimalist geometric forms inspired by sacred Rwandan basalt ridges."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Comprehensive Narrative */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Architectural Story & Design Philosophy
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the piece, its tactile density, room context, and provenance..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-hidden focus:border-foreground leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: CURATED MEDIA & EDITORIAL PHOTOGRAPHY (WITH DIRECT CLIPBOARD PASTE) */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 font-serif font-bold text-foreground">
              02
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Editorial Imagery & Media Gallery</h2>
              <p className="text-xs text-muted-foreground">
                Paste screenshots directly from clipboard (<kbd className="rounded bg-muted px-1 font-mono text-[10px]">Ctrl+V</kbd>), upload local files, or pick curated staging presets
              </p>
            </div>
          </div>
        </div>

        <MediaGalleryManager
          images={images}
          colorways={colorways}
          onChange={setImages}
          onUploadFile={onUploadFile}
        />
      </section>

      {/* SECTION 3: COLOURWAYS & MULTI-COLOR GRADIENTS (1+ COLORS PER COLORWAY) */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 font-serif font-bold text-foreground">
              03
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold">Colourway Editions & Multi-Color Gradients</h2>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase">
                  Multi-Tone Gradients Enabled
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Each colorway can have 1, 2, 3, or more colors combined seamlessly into dynamic gradients
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const mapped = images.map((img, i) => ({
                ...img,
                colorway_id: colorways[i % colorways.length]?.id || null,
              }));
              setImages(mapped);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Auto-Map Images to Editions</span>
          </button>
        </div>

        {/* Existing Colorways List */}
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Editions ({colorways.length})
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {colorways.map((cw, cwIdx) => {
              const linkedCount = images.filter(
                (img) => img.colorway_id === cw.id || img.colorway_id === cw.name,
              ).length;
              const effectiveHexes = cw.hexes && cw.hexes.length > 0 ? cw.hexes : [cw.hex || "#C08A21"];
              const gradientCss =
                effectiveHexes.length > 1
                  ? `linear-gradient(135deg, ${effectiveHexes.join(", ")})`
                  : effectiveHexes[0];

              return (
                <div
                  key={cw.id || cwIdx}
                  className="rounded-2xl border border-border bg-background p-4 shadow-xs space-y-3 transition hover:border-foreground/30"
                >
                  {/* Top Bar: Gradient Preview Bar & Edition Name */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Gradient Preview Swatch */}
                      <div
                        className="h-10 w-10 shrink-0 rounded-xl border border-border shadow-xs"
                        style={{ background: gradientCss }}
                        title={`${cw.name} gradient`}
                      />

                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={cw.name}
                          onChange={(e) => handleUpdateColorwayName(cwIdx, e.target.value)}
                          placeholder="Edition name..."
                          className="w-full rounded-lg border border-transparent bg-transparent font-semibold text-sm outline-hidden hover:border-border focus:border-foreground focus:bg-background px-1.5 py-0.5"
                        />
                        <div className="text-[11px] text-muted-foreground px-1.5">
                          {effectiveHexes.length} color{effectiveHexes.length === 1 ? "" : "s"} combined in gradient · {linkedCount} photo{linkedCount === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveColorway(cwIdx)}
                      title="Remove edition"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Visual Gradient Display Strip */}
                  <div
                    className="h-3.5 w-full rounded-full border border-border/50 shadow-inner"
                    style={{ background: gradientCss }}
                  />

                  {/* Colors in this Colorway */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Gradient Color Stops:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddColorToColorway(cwIdx)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add Color
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {effectiveHexes.map((hex, colorIdx) => (
                        <div
                          key={colorIdx}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-2xs"
                        >
                          <input
                            type="color"
                            value={hex}
                            onChange={(e) => handleUpdateColorInColorway(cwIdx, colorIdx, e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={hex}
                            onChange={(e) => handleUpdateColorInColorway(cwIdx, colorIdx, e.target.value)}
                            className="w-18 rounded border-0 bg-transparent font-mono text-[11px] font-semibold uppercase outline-hidden"
                          />
                          {effectiveHexes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColorFromColorway(cwIdx, colorIdx)}
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                              title="Remove color from gradient"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Colorway Box with Live Multi-Color Gradient Preview */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Create New Colourway Edition (Combine Multiple Colors into a Gradient)
            </h4>
            <div className="text-[11px] text-muted-foreground">
              Add 2 or more colors to blend into a custom gradient
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
            {/* Edition Name */}
            <div className="lg:col-span-4">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Edition Title
              </label>
              <input
                type="text"
                value={newColorwayName}
                onChange={(e) => setNewColorwayName(e.target.value)}
                placeholder="e.g. Volcanic Basalt & Golden Amber"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-hidden focus:border-foreground"
              />
            </div>

            {/* Colors in the new edition */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Colors in this Edition ({newColorwayHexes.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddColorToNewEdition}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Another Color
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {newColorwayHexes.map((hex, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-2xs"
                  >
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => handleUpdateColorInNewEdition(i, e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={hex}
                      onChange={(e) => handleUpdateColorInNewEdition(i, e.target.value)}
                      className="w-18 rounded border-0 bg-transparent font-mono text-[11px] font-semibold uppercase outline-hidden"
                    />
                    {newColorwayHexes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColorFromNewEdition(i)}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Gradient Preview & Add Button */}
            <div className="lg:col-span-3 space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Live Combined Gradient
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-full rounded-xl border border-border shadow-xs"
                  style={{
                    background:
                      newColorwayHexes.length > 1
                        ? `linear-gradient(135deg, ${newColorwayHexes.join(", ")})`
                        : newColorwayHexes[0],
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewColorway}
                  disabled={!newColorwayName.trim()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Edition</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-t border-border pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or pick an artisanal studio gradient preset:
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {ARTISANAL_GRADIENT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewColorwayName(preset.name);
                    setNewColorwayHexes(preset.hexes);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition"
                >
                  <span
                    className="h-3.5 w-7 rounded-full border border-border shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${preset.hexes.join(", ")})` }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SIZING MATRIX & DIMENSIONS LADDER */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 font-serif font-bold text-foreground">
              04
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Sizing Matrix & Dimensional Ladder</h2>
              <p className="text-xs text-muted-foreground">
                Metric and imperial dimensions, automatic tufting weight calculation, and tier pricing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick Add:</span>
            {(["S", "M", "L", "XL"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleQuickAddSize(k)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
              >
                + {k}
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetStandardSizes}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
            >
              Reset to S-XL
            </button>
            <button
              type="button"
              onClick={handleRecalculateWeights}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
            >
              <Calculator className="h-3 w-3" />
              Recalc Weights
            </button>
          </div>
        </div>

        {/* Sizing Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3">Size Label</th>
                <th className="py-2.5 px-3">Width (cm)</th>
                <th className="py-2.5 px-3">Height (cm)</th>
                <th className="py-2.5 px-3">Imperial</th>
                <th className="py-2.5 px-3">Tufting Weight</th>
                <th className="py-2.5 px-3">Price (RWF)</th>
                <th className="py-2.5 px-3">USD Estimate</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {sizes.map((s, idx) => {
                const usd = s.price_rwf ? Math.round(s.price_rwf / exchangeRateRwfPerUsd) : 0;
                return (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => {
                          const updated = [...sizes];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setSizes(updated);
                        }}
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs font-sans font-semibold outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={s.width_cm ?? ""}
                        onChange={(e) => {
                          const w = e.target.value ? Number(e.target.value) : null;
                          const updated = [...sizes];
                          updated[idx] = {
                            ...updated[idx],
                            width_cm: w,
                            weight_kg: calculateWeightKg(shape, w, s.height_cm),
                          };
                          setSizes(updated);
                        }}
                        className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={s.height_cm ?? ""}
                        onChange={(e) => {
                          const h = e.target.value ? Number(e.target.value) : null;
                          const updated = [...sizes];
                          updated[idx] = {
                            ...updated[idx],
                            height_cm: h,
                            weight_kg: calculateWeightKg(shape, s.width_cm, h),
                          };
                          setSizes(updated);
                        }}
                        className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3 text-muted-foreground font-sans">
                      {cmToFeetInches(s.width_cm)} × {cmToFeetInches(s.height_cm)}
                    </td>
                    <td className="py-2 px-3 font-semibold">
                      {s.weight_kg ? `${s.weight_kg.toFixed(1)} kg` : "-"}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={s.price_rwf ?? ""}
                        onChange={(e) => {
                          const p = e.target.value ? Number(e.target.value) : null;
                          const updated = [...sizes];
                          updated[idx] = { ...updated[idx], price_rwf: p };
                          setSizes(updated);
                        }}
                        className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3 text-muted-foreground font-sans">
                      ≈ ${usd} USD
                    </td>
                    <td className="py-2 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setSizes([
                ...sizes,
                {
                  label: `Custom Tier ${sizes.length + 1}`,
                  width_cm: 180,
                  height_cm: 250,
                  price_rwf: 380000,
                  weight_kg: 17.1,
                  sort_order: sizes.length,
                },
              ])
            }
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add Custom Size Tier
          </button>
        </div>

        {/* Custom Outline Blueprint SVG for "Find your size" */}
        <div className="mt-6 rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Find Your Size: Architectural Blueprint SVG (Custom Outline)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize the outline shown for this product in "Find your size" using SVG code. Supports dynamic placeholders like <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">&#123;width_label&#125;</code> and <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">&#123;height_label&#125;</code>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSizeGuideSvg(HASSAN_OUTLINE_SVG)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                Hassan Preset
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideSvg(RECTANGLE_OUTLINE_SVG)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                Rectangle Preset
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideSvg(CIRCULAR_OUTLINE_SVG)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                Circular Preset
              </button>
              {sizeGuideSvg && (
                <button
                  type="button"
                  onClick={() => setSizeGuideSvg("")}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Clear (Auto)
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            value={sizeGuideSvg}
            onChange={(e) => setSizeGuideSvg(e.target.value)}
            placeholder="Paste custom <svg>...</svg> outline code here, or leave empty to use automatic blueprint calculation based on rug shape and dimensions."
            className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 outline-hidden focus:ring-1 focus:ring-foreground/20"
          />

          {sizeGuideSvg.trim() && (
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Blueprint Code Live Preview
              </span>
              <div
                className="max-h-[220px] overflow-hidden flex items-center justify-center [&>svg]:max-h-[200px] [&>svg]:w-auto [&>svg]:h-auto"
                dangerouslySetInnerHTML={{
                  __html: interpolateOutlineSvg(sizeGuideSvg, {
                    wLabel: `${sizes[0]?.width_cm ?? 160} cm`,
                    hLabel: `${sizes[0]?.height_cm ?? 230} cm`,
                    widthCm: sizes[0]?.width_cm ?? 160,
                    heightCm: sizes[0]?.height_cm ?? 230,
                    units: "metric",
                  }),
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: ARTISANAL PROVENANCE & COST ARCHITECTURE */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 font-serif font-bold text-foreground">
              05
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Artisanal Provenance & Cost Architecture</h2>
              <p className="text-xs text-muted-foreground">
                Technical weave specifications, artisan workshop attribution, and raw material labor breakdown
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Construction Technique */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Construction Technique
            </label>
            <select
              value={specs.constructionTechnique}
              onChange={(e) => setSpecs({ ...specs, constructionTechnique: e.target.value as any })}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium outline-hidden focus:border-foreground"
            >
              <option value="hand_tufted">Hand-Tufted Cut Pile</option>
              <option value="hand_knotted">Hand-Knotted Tibetan/Persian</option>
              <option value="flatweave_kilim">Flat-Weave Kilim</option>
              <option value="relief_carved">Relief-Carved High/Low</option>
              <option value="loop_cut_pile">Loop & Cut Combination</option>
            </select>
          </div>

          {/* Master Weaver */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Master Weaver Attribution
            </label>
            <input
              type="text"
              value={specs.masterWeaver}
              onChange={(e) => setSpecs({ ...specs, masterWeaver: e.target.value })}
              placeholder="e.g. Marie Mukamana & Atelier Weavers"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Workshop Atelier */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Production Atelier
            </label>
            <input
              type="text"
              value={specs.workshopId}
              onChange={(e) => setSpecs({ ...specs, workshopId: e.target.value })}
              placeholder="e.g. Kigali Studio Atelier 01"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Fiber Composition */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fiber Composition
            </label>
            <input
              type="text"
              value={specs.fiberComposition}
              onChange={(e) => setSpecs({ ...specs, fiberComposition: e.target.value })}
              placeholder="80% Rwandan Highland Wool / 20% Bamboo Silk"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
            />
          </div>

          {/* Dye Formulation */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dye Formulation
            </label>
            <select
              value={specs.dyeFormulation}
              onChange={(e) => setSpecs({ ...specs, dyeFormulation: e.target.value as any })}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium outline-hidden focus:border-foreground"
            >
              <option value="vegetable_botanical">Vegetable & Botanical Pigments</option>
              <option value="mineral_ochre">Mineral Volcanic Ochre</option>
              <option value="indigo_ferment">Traditional Indigo Ferment</option>
              <option value="reactive_synthetic">Eco-Certified Low-Impact Reactive</option>
            </select>
          </div>

          {/* Pile Height & Knot Density */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pile Height (mm)
              </label>
              <input
                type="number"
                value={specs.pileHeightMm}
                onChange={(e) => setSpecs({ ...specs, pileHeightMm: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-hidden focus:border-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Knot Density / m²
              </label>
              <input
                type="number"
                value={specs.knotDensityPerSqm}
                onChange={(e) => setSpecs({ ...specs, knotDensityPerSqm: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-hidden focus:border-foreground"
              />
            </div>
          </div>
        </div>

        {/* Cost & Gross Margin Breakdown */}
        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fair-Wage Labor & Raw Materials Cost Architecture
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              Total Estimated Cost: {calculatedCostRwf.toLocaleString()} RWF
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-background p-2.5">
              <span className="text-[10px] text-muted-foreground block font-sans">Highland Wool</span>
              <span className="font-semibold">{specs.rawMaterials.woolKg} kg</span> @ {specs.rawMaterials.woolRateRwfPerKg.toLocaleString()} RWF
            </div>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <span className="text-[10px] text-muted-foreground block font-sans">Weaving Labor</span>
              <span className="font-semibold">{specs.labor.weavingHours} hrs</span> @ {specs.labor.hourlyRateRwf.toLocaleString()} RWF/hr
            </div>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <span className="text-[10px] text-muted-foreground block font-sans">Foundation & Latex</span>
              <span className="font-semibold">{(specs.rawMaterials.foundationClothRwf + specs.rawMaterials.latexRwf).toLocaleString()} RWF</span>
            </div>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <span className="text-[10px] text-muted-foreground block font-sans">Gross Profit</span>
              <span className={`font-semibold ${grossProfitRwf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {grossProfitRwf.toLocaleString()} RWF ({grossMarginPct}%)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bottom Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 flex items-center gap-3 rounded-full border border-border bg-background/95 px-6 py-3 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold hover:underline"
        >
          Cancel
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs font-semibold truncate max-w-[200px]">
          {name || "New Piece"}
        </span>
        <button
          type="button"
          onClick={() => handleFormSubmit()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background shadow-xs hover:opacity-90 disabled:opacity-50 transition"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          <span>{isSaving ? "Saving..." : "Save Product"}</span>
        </button>
      </div>
    </div>
  );
}
