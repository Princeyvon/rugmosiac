import React from "react";
import { Package, AlertTriangle, Sparkles, Layers, DollarSign, ArrowUpRight, RefreshCw } from "lucide-react";

interface CatalogueKpiRibbonProps {
  products: any[];
  exchangeRateRwfPerUsd: number;
  onOpenBespokeCalc: () => void;
  onRefreshExchangeRate?: () => void;
}

export function CatalogueKpiRibbon({
  products,
  exchangeRateRwfPerUsd,
  onOpenBespokeCalc,
  onRefreshExchangeRate,
}: CatalogueKpiRibbonProps) {
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.is_published && !p.archived_at).length;
  const outOfStockCount = products.filter(
    (p) => p.stock_status === "out_of_stock" || (p.fulfilment_type === "ready_to_ship" && (p.stock_qty ?? 0) <= 0),
  ).length;
  const lowStockItems = products.filter((p) => {
    const qty = p.stock_qty ?? 0;
    const threshold = p.low_stock_threshold ?? 2;
    return p.stock_status !== "out_of_stock" && qty <= threshold && qty > 0;
  });
  const bespokeCount = products.filter(
    (p) => p.fulfilment_type === "custom" || p.stock_status === "made_to_order",
  ).length;

  // Valuation: Total Stock Value at wholesale cost vs retail list value
  const totalStockQuantity = products.reduce((sum, p) => sum + (p.stock_qty ?? 0), 0);
  const wholesaleValuationRwf = products.reduce((sum, p) => {
    const cost = p.cost_rwf || (p.base_price_rwf ? p.base_price_rwf * 0.45 : 0);
    return sum + cost * Math.max(1, p.stock_qty ?? 1);
  }, 0);
  const retailValuationRwf = products.reduce((sum, p) => {
    const price = p.base_price_rwf || 0;
    return sum + price * Math.max(1, p.stock_qty ?? 1);
  }, 0);

  const wholesaleValuationUsd = Math.round(wholesaleValuationRwf / exchangeRateRwfPerUsd);
  const retailValuationUsd = Math.round(retailValuationRwf / exchangeRateRwfPerUsd);

  return (
    <div className="space-y-3">
      {/* Critical Shortage Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold uppercase tracking-wider">Restock Alert:</span>
            <span>
              {lowStockItems.length} piece{lowStockItems.length > 1 ? "s" : ""} at or below studio safety threshold (
              {lowStockItems.map((p) => p.name).slice(0, 3).join(", ")}
              {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ""}).
            </span>
          </div>
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono font-medium">
            Pending Studio Restock
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Archive */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Archive
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground/5 text-foreground">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold sm:text-3xl">{activeCount}</span>
            <span className="text-xs text-muted-foreground">/ {totalCount} total</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>{outOfStockCount} out of stock · {totalStockQuantity} units</span>
          </div>
        </div>

        {/* Bespoke & Made-to-Order */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bespoke & Commissions
            </span>
            <button
              onClick={onOpenBespokeCalc}
              title="Open Lead Time & Sizing Calculator"
              className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent transition-transform hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold sm:text-3xl">{bespokeCount}</span>
            <span className="text-xs text-muted-foreground">tufted to order</span>
          </div>
          <button
            onClick={onOpenBespokeCalc}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
          >
            Open Bespoke Sizing Engine <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Inventory Wholesale Valuation */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Wholesale Stock Cost
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground/5 text-foreground">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-xl font-semibold sm:text-2xl">
              {wholesaleValuationRwf.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">RWF</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              ≈ ${wholesaleValuationUsd.toLocaleString()} USD
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Material, labor & foundation cost
          </div>
        </div>

        {/* Retail List Valuation & FX Engine */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Retail Asset Value
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground/5 text-foreground">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-xl font-semibold sm:text-2xl">
              {retailValuationRwf.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">RWF</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              ≈ ${retailValuationUsd.toLocaleString()} USD
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Rate: 1$ = {exchangeRateRwfPerUsd.toLocaleString()} RWF</span>
            {onRefreshExchangeRate && (
              <button
                onClick={onRefreshExchangeRate}
                title="Sync daily rate"
                className="hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
