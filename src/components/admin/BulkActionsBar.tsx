import React, { useState } from "react";
import { Download, Tag, DollarSign, Archive, Eye, EyeOff, CheckSquare, X, ChevronDown, RefreshCw } from "lucide-react";

interface BulkActionsBarProps {
  selectedIds: string[];
  categories: Array<{ id: string; name: string; slug: string }>;
  onClearSelection: () => void;
  onBulkUpdate: (patch: {
    price_percent?: number;
    category_id?: string | null;
    stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
    is_published?: boolean;
    archived_at?: string | null;
  }) => Promise<void>;
  products: any[];
}

export function BulkActionsBar({
  selectedIds,
  categories,
  onClearSelection,
  onBulkUpdate,
  products,
}: BulkActionsBarProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [pricePct, setPricePct] = useState<number>(10);

  if (selectedIds.length === 0) return null;

  async function handlePriceAdjust(pct: number) {
    if (!confirm(`Apply ${pct > 0 ? "+" : ""}${pct}% price adjustment to ${selectedIds.length} piece(s)?`)) return;
    setIsBusy(true);
    try {
      await onBulkUpdate({ price_percent: pct });
      setActiveMenu(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCategoryAssign(categoryId: string) {
    setIsBusy(true);
    try {
      await onBulkUpdate({ category_id: categoryId });
      setActiveMenu(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStatusChange(status: "in_stock" | "made_to_order" | "out_of_stock") {
    setIsBusy(true);
    try {
      await onBulkUpdate({ stock_status: status });
      setActiveMenu(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVisibility(publish: boolean) {
    setIsBusy(true);
    try {
      await onBulkUpdate({ is_published: publish });
      setActiveMenu(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleArchive() {
    if (!confirm(`Archive ${selectedIds.length} piece(s)? They will be hidden from storefront but preserved.`)) return;
    setIsBusy(true);
    try {
      await onBulkUpdate({ is_published: false, archived_at: new Date().toISOString() });
      setActiveMenu(null);
    } finally {
      setIsBusy(false);
    }
  }

  function handleExportCsv() {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    const headers = [
      "SKU",
      "Title",
      "Price_RWF",
      "Price_USD",
      "Cost_RWF",
      "Stock_Qty",
      "Stock_Status",
      "Shape",
      "Material",
      "Published",
    ];
    const rows = selected.map((p) => [
      `"${p.sku || ""}"`,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      p.base_price_rwf || 0,
      p.base_price_usd || 0,
      p.cost_rwf || 0,
      p.stock_qty || 0,
      `"${p.stock_status || ""}"`,
      `"${p.shape || ""}"`,
      `"${(p.material || "").replace(/"/g, '""')}"`,
      p.is_published ? "YES" : "NO",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mosiac-catalogue-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportJson() {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    const jsonContent = JSON.stringify(selected, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mosiac-catalogue-manifest-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        {/* Count Badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <CheckSquare className="h-4 w-4 text-foreground" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {selectedIds.length} Selected
          </span>
          <button
            onClick={onClearSelection}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Deselect all"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Price Adjuster Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "price" ? null : "price")}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Adjust Price</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {activeMenu === "price" && (
            <div className="absolute bottom-full mb-2 left-0 w-52 rounded-2xl border border-border bg-card p-3 shadow-xl space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Batch Inflation / Sale %
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePriceAdjust(10)}
                  className="rounded-lg border border-border py-1 text-xs hover:bg-muted"
                >
                  +10% Raw Cost
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceAdjust(5)}
                  className="rounded-lg border border-border py-1 text-xs hover:bg-muted"
                >
                  +5% Atelier
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceAdjust(-10)}
                  className="rounded-lg border border-border py-1 text-xs hover:bg-muted"
                >
                  -10% Archival
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceAdjust(-15)}
                  className="rounded-lg border border-border py-1 text-xs hover:bg-muted"
                >
                  -15% Seasonal
                </button>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <input
                  type="number"
                  value={pricePct}
                  onChange={(e) => setPricePct(Number(e.target.value))}
                  placeholder="Custom %"
                  className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handlePriceAdjust(pricePct)}
                  className="rounded bg-foreground px-2.5 py-1 text-xs text-background font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collection Reassignment */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "category" ? null : "category")}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Collection</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {activeMenu === "category" && (
            <div className="absolute bottom-full mb-2 left-0 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl space-y-1">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Move to Capsule
              </span>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryAssign(c.id)}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted truncate"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stock Status Toggles */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "status" ? null : "status")}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Stock Status</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {activeMenu === "status" && (
            <div className="absolute bottom-full mb-2 left-0 w-44 rounded-2xl border border-border bg-card p-2 shadow-xl space-y-1">
              <button
                type="button"
                onClick={() => handleStatusChange("in_stock")}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                In Stock (Ready)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("made_to_order")}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                Made to Order
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("out_of_stock")}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                Archived / Out of Stock
              </button>
            </div>
          )}
        </div>

        {/* Visibility */}
        <button
          type="button"
          onClick={() => handleVisibility(true)}
          disabled={isBusy}
          title="Publish selected to storefront"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
        >
          <Eye className="h-3.5 w-3.5 text-emerald-500" />
          <span>Publish</span>
        </button>

        <button
          type="button"
          onClick={() => handleVisibility(false)}
          disabled={isBusy}
          title="Hide selected from storefront"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
        >
          <EyeOff className="h-3.5 w-3.5 text-amber-500" />
          <span>Unpublish</span>
        </button>

        {/* Archive */}
        <button
          type="button"
          onClick={handleArchive}
          disabled={isBusy}
          title="Archive pieces"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted text-destructive transition"
        >
          <Archive className="h-3.5 w-3.5" />
          <span>Archive</span>
        </button>

        {/* Export CSV & JSON */}
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <button
            type="button"
            onClick={handleExportCsv}
            title="Download CSV manifest"
            className="inline-flex items-center gap-1 rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            title="Download JSON manifest"
            className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition"
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  );
}
