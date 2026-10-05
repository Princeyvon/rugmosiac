import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Grid,
  Table as TableIcon,
  Plus,
  Copy,
  Archive,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Layers,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { CatalogueKpiRibbon } from "./CatalogueKpiRibbon";
import { BulkActionsBar } from "./BulkActionsBar";
import { BespokeCalculatorModal } from "./BespokeCalculatorModal";
import { ArtisanalProductForm, ArtisanalProductDraft } from "./ArtisanalProductForm";
import { parseArtisanalSpecs } from "./types";

interface CatalogueManagementProps {
  products: any[];
  categories: Array<{ id: string; name: string; slug: string }>;
  exchangeRateRwfPerUsd: number;
  onQuickUpdate: (patch: {
    id: string;
    is_published?: boolean;
    featured?: boolean;
    stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
    newArrival?: boolean;
    base_price_rwf?: number | null;
    cost_rwf?: number | null;
    stock_qty?: number;
    sku?: string | null;
    archived_at?: string | null;
  }) => Promise<void>;
  onBulkUpdate: (patch: {
    ids: string[];
    price_percent?: number;
    category_id?: string | null;
    stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
    is_published?: boolean;
    archived_at?: string | null;
  }) => Promise<void>;
  onDuplicateProduct: (id: string) => Promise<void>;
  onSaveProduct: (draft: ArtisanalProductDraft) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
  onRefreshCatalogue: () => Promise<void>;
}

export function CatalogueManagement({
  products,
  categories,
  exchangeRateRwfPerUsd,
  onQuickUpdate,
  onBulkUpdate,
  onDuplicateProduct,
  onSaveProduct,
  onDeleteProduct,
  onUploadFile,
  onRefreshCatalogue,
}: CatalogueManagementProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTechnique, setSelectedTechnique] = useState<string>("all");
  const [selectedFiber, setSelectedFiber] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBespokeModalOpen, setIsBespokeModalOpen] = useState(false);
  const [initialDraftData, setInitialDraftData] = useState<any | null>(null);
  const [inlinePriceDraft, setInlinePriceDraft] = useState<Record<string, number>>({});
  const [inlineStockDraft, setInlineStockDraft] = useState<Record<string, number>>({});
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Text Search across Title, SKU, Weaver, Tags, Material
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const specs = parseArtisanalSpecs(p.notes);
        const matchTitle = (p.name || "").toLowerCase().includes(q);
        const matchSku = (p.sku || "").toLowerCase().includes(q);
        const matchMaterial = (p.material || "").toLowerCase().includes(q);
        const matchWeaver = (specs.masterWeaver || "").toLowerCase().includes(q);
        const matchSeries = (specs.capsuleSeries || "").toLowerCase().includes(q);
        const matchTags = (p.tags || []).some((t: string) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSku && !matchMaterial && !matchWeaver && !matchSeries && !matchTags) {
          return false;
        }
      }

      // 2. Collection
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
        return false;
      }

      // 3. Stock Status
      if (selectedStatus === "in_stock" && p.stock_status !== "in_stock") return false;
      if (selectedStatus === "made_to_order" && p.stock_status !== "made_to_order") return false;
      if (selectedStatus === "out_of_stock" && p.stock_status !== "out_of_stock") return false;
      if (selectedStatus === "low_stock") {
        const qty = p.stock_qty ?? 0;
        const threshold = p.low_stock_threshold ?? 2;
        if (qty > threshold || p.stock_status === "out_of_stock") return false;
      }
      if (selectedStatus === "archived" && !p.archived_at) return false;

      // 4. Technique
      if (selectedTechnique !== "all") {
        const specs = parseArtisanalSpecs(p.notes);
        if (specs.constructionTechnique !== selectedTechnique && p.design_style !== selectedTechnique) {
          return false;
        }
      }

      // 5. Fiber Composition
      if (selectedFiber !== "all") {
        const specs = parseArtisanalSpecs(p.notes);
        const comb = `${specs.fiberComposition} ${p.material}`.toLowerCase();
        if (!comb.includes(selectedFiber.toLowerCase())) {
          return false;
        }
      }

      // 6. Max Price Slider
      if (p.base_price_rwf && p.base_price_rwf > maxPrice) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedTechnique, selectedFiber, maxPrice]);

  // Bulk Selection Toggles
  function handleToggleSelect(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function handleSelectAll() {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  }

  // Inline Operations
  async function handleSaveInlinePrice(id: string) {
    const nextPrice = inlinePriceDraft[id];
    if (nextPrice === undefined) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, base_price_rwf: nextPrice });
      const nextDraft = { ...inlinePriceDraft };
      delete nextDraft[id];
      setInlinePriceDraft(nextDraft);
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleSaveInlineStock(id: string) {
    const nextStock = inlineStockDraft[id];
    if (nextStock === undefined) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, stock_qty: nextStock });
      const nextDraft = { ...inlineStockDraft };
      delete nextDraft[id];
      setInlineStockDraft(nextDraft);
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleTogglePublished(id: string, current: boolean) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, is_published: !current });
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, featured: !current });
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleToggleNewArrival(id: string, tags: string[] = []) {
    const isNew = tags.includes("new");
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, newArrival: !isNew });
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleDuplicate(id: string) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onDuplicateProduct(id);
      await onRefreshCatalogue();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this piece? It will be preserved in records but hidden from storefront.")) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onQuickUpdate({ id, is_published: false, archived_at: new Date().toISOString() });
      await onRefreshCatalogue();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  // Full-page Product Creation and Editing view (Page, NOT a popup, fits on 1 page with no subtabs)
  if (isCreating || editingProduct) {
    return (
      <div className="min-w-0">
        <ArtisanalProductForm
          initialData={editingProduct || initialDraftData}
          categories={categories}
          exchangeRateRwfPerUsd={exchangeRateRwfPerUsd}
          onSave={async (draft) => {
            await onSaveProduct(draft);
            setIsCreating(false);
            setEditingProduct(null);
            setInitialDraftData(null);
            await onRefreshCatalogue();
          }}
          onClose={() => {
            setIsCreating(false);
            setEditingProduct(null);
            setInitialDraftData(null);
          }}
          onDelete={async (id) => {
            await onDeleteProduct(id);
            setIsCreating(false);
            setEditingProduct(null);
            await onRefreshCatalogue();
          }}
          onUploadFile={onUploadFile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top-Level Metrics & Catalogue KPI Ribbon */}
      <CatalogueKpiRibbon
        products={products}
        exchangeRateRwfPerUsd={exchangeRateRwfPerUsd}
        onOpenBespokeCalc={() => setIsBespokeModalOpen(true)}
      />

      {/* 2. Global Catalogue Action Toolbar & Search Controls */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Instant Fuzzy Search Bar */}
          <div className="relative min-w-[280px] flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, SKU, weaver, yarn blend, tags..."
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs outline-hidden focus:border-foreground transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Actions: Bespoke Calculator, Add Piece, Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBespokeModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Bespoke Sizing Engine</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialDraftData(null);
                setIsCreating(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Studio Piece</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                showFiltersDrawer || selectedCategory !== "all" || selectedStatus !== "all" || selectedTechnique !== "all"
                  ? "border-foreground bg-foreground/5 text-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Visual Card Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Tier Filter Controls Drawer */}
        {showFiltersDrawer && (
          <div className="border-t border-border pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Category / Capsule */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Collection / Capsule
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
              >
                <option value="all">All Capsules & Collections</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (Ready to Ship)</option>
                <option value="low_stock">Low Stock (Safety Threshold)</option>
                <option value="made_to_order">Made to Order / Bespoke</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="archived">Archived / Delisted</option>
              </select>
            </div>

            {/* Construction & Technique */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Technique
              </label>
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
              >
                <option value="all">All Techniques</option>
                <option value="hand_tufted">Hand-Tufted</option>
                <option value="hand_knotted">Hand-Knotted</option>
                <option value="flatweave_kilim">Flatweave Kilims</option>
                <option value="relief_carved">Relief Carved</option>
                <option value="loop_cut_pile">Loop & Cut Pile</option>
              </select>
            </div>

            {/* Material Fiber */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fiber Composition
              </label>
              <select
                value={selectedFiber}
                onChange={(e) => setSelectedFiber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-hidden focus:border-foreground"
              >
                <option value="all">All Fibers</option>
                <option value="Highland Wool">Rwandan Highland Wool</option>
                <option value="Bamboo Silk">Botanical Bamboo Silk</option>
                <option value="Merino">New Zealand Merino</option>
                <option value="Cotton">Organic Cotton Base</option>
              </select>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Price Range
                </label>
                <span className="text-[11px] font-mono font-semibold">
                  {(maxPrice / 1000).toLocaleString()}k RWF
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={3000000}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-foreground cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Results Count & Select All */}
        <div className="flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border-border accent-foreground"
              />
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Select All ({filteredProducts.length})
              </span>
            </label>
            {selectedIds.length > 0 && (
              <span className="font-medium text-foreground">
                · {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div>
            Showing {filteredProducts.length} of {products.length} archival pieces
          </div>
        </div>
      </div>

      {/* 3. VIEW MODE A: HIGH-DENSITY SPREADSHEET INVENTORY TABLE */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 rounded border-border accent-foreground"
                    />
                  </th>
                  <th className="py-3 px-4">Piece / SKU</th>
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">Price (RWF / USD)</th>
                  <th className="py-3 px-4">Stock / Units</th>
                  <th className="py-3 px-4">Status & Toggles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const isBusy = busyIds[p.id];
                    const specs = parseArtisanalSpecs(p.notes);
                    const isLowStock =
                      p.stock_status !== "out_of_stock" &&
                      (p.stock_qty ?? 0) <= (p.low_stock_threshold ?? 2);
                    const isNewArrival = (p.tags || []).includes("new");

                    // Current inline draft values
                    const displayPrice =
                      inlinePriceDraft[p.id] !== undefined
                        ? inlinePriceDraft[p.id]
                        : p.base_price_rwf ?? 0;
                    const displayStock =
                      inlineStockDraft[p.id] !== undefined
                        ? inlineStockDraft[p.id]
                        : p.stock_qty ?? 0;

                    const usdPrice = displayPrice ? Math.round(displayPrice / exchangeRateRwfPerUsd) : 0;
                    const catObj = categories.find((c) => c.id === p.category_id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition hover:bg-muted/20 ${isSelected ? "bg-foreground/5" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="h-3.5 w-3.5 rounded border-border accent-foreground"
                          />
                        </td>

                        {/* Title, Thumbnail, SKU & Series */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                              {p.main_image_url ? (
                                <img
                                  src={p.main_image_url}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
                                  No Img
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                <span>{p.name}</span>
                                {specs.romanSequence && (
                                  <span className="font-serif text-[10px] text-muted-foreground">
                                    ({specs.romanSequence})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                <span>{p.sku || "NO-SKU"}</span>
                                <span>·</span>
                                <span className="capitalize">{p.shape}</span>
                              </div>
                              {p.colorways && p.colorways.length > 0 && (
                                <div className="mt-1 flex items-center gap-1">
                                  {p.colorways.slice(0, 4).map((cw: any, i: number) => {
                                    const bg =
                                      cw.gradient ||
                                      (Array.isArray(cw.hexes) && cw.hexes.length > 1
                                        ? `linear-gradient(135deg, ${cw.hexes.join(", ")})`
                                        : (cw.hex || (cw.hexes && cw.hexes[0]) || "#ccc"));
                                    return (
                                      <span
                                        key={i}
                                        className="h-2.5 w-2.5 rounded-full border border-border shadow-2xs"
                                        style={{ background: bg }}
                                        title={cw.name}
                                      />
                                    );
                                  })}
                                  {p.colorways.length > 4 && (
                                    <span className="text-[9px] text-muted-foreground font-mono">
                                      +{p.colorways.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Collection */}
                        <td className="py-3 px-4">
                          <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium">
                            {catObj?.name || "Unassigned"}
                          </span>
                          <div className="mt-1 text-[10px] text-muted-foreground capitalize">
                            {specs.constructionTechnique.replace("_", " ")}
                          </div>
                        </td>

                        {/* Price with Inline Edit */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={5000}
                              value={displayPrice}
                              onChange={(e) =>
                                setInlinePriceDraft((prev) => ({
                                  ...prev,
                                  [p.id]: Number(e.target.value) || 0,
                                }))
                              }
                              className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-xs font-mono font-semibold focus:border-foreground outline-hidden"
                            />
                            {inlinePriceDraft[p.id] !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleSaveInlinePrice(p.id)}
                                disabled={isBusy}
                                className="rounded bg-foreground px-1.5 py-1 text-[10px] font-semibold text-background"
                              >
                                Save
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ≈ ${usdPrice.toLocaleString()} USD
                          </span>
                        </td>

                        {/* Stock with Inline Edit */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={displayStock}
                              onChange={(e) =>
                                setInlineStockDraft((prev) => ({
                                  ...prev,
                                  [p.id]: Number(e.target.value) || 0,
                                }))
                              }
                              className={`w-16 rounded-lg border px-2 py-1 text-xs font-mono font-semibold focus:border-foreground outline-hidden ${
                                isLowStock
                                  ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                                  : "border-border bg-background"
                              }`}
                            />
                            {inlineStockDraft[p.id] !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleSaveInlineStock(p.id)}
                                disabled={isBusy}
                                className="rounded bg-foreground px-1.5 py-1 text-[10px] font-semibold text-background"
                              >
                                Save
                              </button>
                            )}
                          </div>
                          {isLowStock && (
                            <span className="block mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              Safety Threshold
                            </span>
                          )}
                        </td>

                        {/* Status & Inline Toggles */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {/* Published Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTogglePublished(p.id, p.is_published)}
                              disabled={isBusy}
                              title={p.is_published ? "Storefront: Live" : "Storefront: Hidden"}
                              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                                p.is_published
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {p.is_published ? "Live" : "Draft"}
                            </button>

                            {/* Featured Star */}
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(p.id, p.featured)}
                              disabled={isBusy}
                              title="Toggle Featured on homepage"
                              className={`rounded-lg p-1 transition ${
                                p.featured
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${p.featured ? "fill-current" : ""}`} />
                            </button>

                            {/* New Arrival Tag */}
                            <button
                              type="button"
                              onClick={() => handleToggleNewArrival(p.id, p.tags)}
                              disabled={isBusy}
                              title="Toggle New Arrival badge"
                              className={`rounded-lg p-1 transition ${
                                isNewArrival
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span className="text-[10px]">NEW</span>
                            </button>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Modal */}
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              title="Open Full Specification Model"
                              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            {/* Duplicate Piece */}
                            <button
                              type="button"
                              onClick={() => handleDuplicate(p.id)}
                              disabled={isBusy}
                              title="Duplicate Piece & Specs"
                              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Archive / Delist */}
                            <button
                              type="button"
                              onClick={() => handleArchive(p.id)}
                              disabled={isBusy}
                              title="Archive / Delist"
                              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No catalogue pieces match the selected multi-axis filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE B: VISUAL CARD GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const specs = parseArtisanalSpecs(p.notes);
            const usdPrice = p.base_price_rwf
              ? Math.round(p.base_price_rwf / exchangeRateRwfPerUsd)
              : 0;

            return (
              <div
                key={p.id}
                className={`group relative overflow-hidden rounded-2xl border bg-card transition-all hover:border-foreground/40 hover:shadow-md ${
                  isSelected ? "border-foreground ring-2 ring-foreground/20" : "border-border"
                }`}
              >
                {/* Select Checkbox on Card */}
                <div className="absolute left-3 top-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(p.id)}
                    className="h-4 w-4 rounded border-border accent-foreground shadow-xs cursor-pointer"
                  />
                </div>

                {/* Status Badges */}
                <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
                  {p.featured && (
                    <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                      Featured
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-xs shadow-xs ${
                      p.is_published
                        ? "bg-emerald-500/90 text-white"
                        : "bg-black/60 text-white"
                    }`}
                  >
                    {p.is_published ? "Live" : "Draft"}
                  </span>
                </div>

                {/* Card Media Preview with Hover Zoom */}
                <div className="aspect-4/3 w-full overflow-hidden bg-muted relative">
                  {p.main_image_url ? (
                    <img
                      src={p.main_image_url}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                      No Media
                    </div>
                  )}

                  {/* Swatches preview pill with multi-color gradient support */}
                  {p.colorways && p.colorways.length > 0 && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-xs">
                      {p.colorways.slice(0, 4).map((cw: any, i: number) => {
                        const bg =
                          cw.gradient ||
                          (Array.isArray(cw.hexes) && cw.hexes.length > 1
                            ? `linear-gradient(135deg, ${cw.hexes.join(", ")})`
                            : (cw.hex || (cw.hexes && cw.hexes[0]) || "#ccc"));
                        return (
                          <div
                            key={i}
                            className="h-3 w-3 rounded-full border border-white/40 shadow-2xs"
                            style={{ background: bg }}
                            title={cw.name}
                          />
                        );
                      })}
                      {p.colorways.length > 4 && (
                        <span className="text-[9px] text-white/80 font-mono">
                          +{p.colorways.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-display text-sm font-semibold truncate">{p.name}</h4>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      {p.sku || "NO-SKU"}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground truncate">
                    {specs.masterWeaver || specs.capsuleSeries || "Highland Atelier"}
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border pt-2">
                    <div>
                      <div className="font-display text-base font-bold">
                        {(p.base_price_rwf || 0).toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">RWF</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ≈ ${usdPrice.toLocaleString()} USD
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase">Stock</span>
                      <div className="font-mono text-xs font-semibold">
                        {p.stock_qty ?? 0} units
                      </div>
                    </div>
                  </div>

                  {/* Quick Card Toolbar */}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    >
                      <Edit className="h-3 w-3" /> Edit Specs
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p.id)}
                        title="Duplicate piece"
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(p.id)}
                        title="Archive piece"
                        className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Floating Bulk Actions Bar when items are checked */}
      <BulkActionsBar
        selectedIds={selectedIds}
        categories={categories}
        onClearSelection={() => setSelectedIds([])}
        onBulkUpdate={async (patch) => {
          await onBulkUpdate({ ids: selectedIds, ...patch });
          setSelectedIds([]);
          await onRefreshCatalogue();
        }}
        products={products}
      />

      {/* 6. Bespoke Commission & Lead Time Engine Modal */}
      <BespokeCalculatorModal
        isOpen={isBespokeModalOpen}
        onClose={() => setIsBespokeModalOpen(false)}
        exchangeRateRwfPerUsd={exchangeRateRwfPerUsd}
        onCreateDraft={(draftData) => {
          setInitialDraftData(draftData);
          setIsCreating(true);
        }}
      />
    </div>
  );
}
