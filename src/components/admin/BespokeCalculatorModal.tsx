import React, { useState } from "react";
import { X, Copy, Check, Sparkles, Clock, Calculator, ShieldCheck, ChevronRight } from "lucide-react";
import { cmToFeetInches } from "./types";

interface BespokeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRateRwfPerUsd: number;
  onCreateDraft?: (initialData: any) => void;
}

export function BespokeCalculatorModal({
  isOpen,
  onClose,
  exchangeRateRwfPerUsd,
  onCreateDraft,
}: BespokeCalculatorModalProps) {
  const [shape, setShape] = useState<"rectangle" | "runner" | "circular" | "organic">("rectangle");
  const [widthCm, setWidthCm] = useState<number>(200);
  const [heightCm, setHeightCm] = useState<number>(300);
  const [pileHeightMm, setPileHeightMm] = useState<number>(12);
  const [technique, setTechnique] = useState<"hand_tufted" | "hand_knotted" | "flatweave">("hand_tufted");
  const [isRush, setIsRush] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Area calculation in m²
  let areaM2 = 0;
  if (shape === "circular") {
    const radiusM = widthCm / 200;
    areaM2 = Math.PI * radiusM * radiusM;
  } else {
    areaM2 = (widthCm / 100) * (heightCm / 100);
  }
  areaM2 = Math.round(areaM2 * 100) / 100;
  const areaSqFt = Math.round(areaM2 * 10.7639 * 10) / 10;

  // Wool yarn estimation (kg)
  const woolPerM2 = pileHeightMm >= 16 ? 4.8 : pileHeightMm >= 12 ? 3.8 : 2.9;
  const totalWoolKg = Math.round(areaM2 * woolPerM2 * 10) / 10;

  // Base rate per square meter depending on technique
  const baseRatePerM2Rwf =
    technique === "hand_knotted" ? 420000 : technique === "flatweave" ? 220000 : 310000;

  // Material & labor breakdown
  const rawMaterialCostRwf = Math.round(areaM2 * 95000);
  const estimatedWeavingHours = Math.round(areaM2 * (technique === "hand_knotted" ? 50 : 22));
  const fairWageLaborCostRwf = Math.round(estimatedWeavingHours * 4500);
  const studioOverheadRwf = Math.round(areaM2 * 45000);

  // Subtotal & Final Price
  let basePriceRwf = Math.round(areaM2 * baseRatePerM2Rwf);
  // Ensure minimum order base
  if (basePriceRwf < 180000) basePriceRwf = 180000;
  const rushFeeRwf = isRush ? Math.round(basePriceRwf * 0.25) : 0;
  const finalPriceRwf = Math.round((basePriceRwf + rushFeeRwf) / 5000) * 5000;
  const finalPriceUsd = Math.round(finalPriceRwf / exchangeRateRwfPerUsd);

  // Lead Time generator
  let standardLeadWeeks = "3–4 weeks";
  if (areaM2 > 8) standardLeadWeeks = "6–8 weeks";
  else if (areaM2 > 5) standardLeadWeeks = "4–6 weeks";
  else if (areaM2 <= 1.5) standardLeadWeeks = "2–3 weeks";

  const leadTimeDisplay = isRush
    ? `Expedited Rush: 10–14 days (${standardLeadWeeks} standard)`
    : `Standard Atelier: ${standardLeadWeeks} in Kigali Studio`;

  const quotationText = `--- MOSIAC ATELIER BESPOKE QUOTATION ---
${clientName ? `Client: ${clientName}\n` : ""}Shape: ${shape.toUpperCase()}
Dimensions: ${widthCm} × ${shape === "circular" ? widthCm : heightCm} cm (${cmToFeetInches(widthCm)} × ${cmToFeetInches(shape === "circular" ? widthCm : heightCm)})
Surface Area: ${areaM2} m² (${areaSqFt} sq ft)
Craft Technique: ${technique.replace("_", " ").toUpperCase()}
Pile Height: ${pileHeightMm}mm plush
Highland Wool Yarn: ~${totalWoolKg} kg
Lead Time: ${leadTimeDisplay}
Atelier Price: RWF ${finalPriceRwf.toLocaleString()} (≈ $${finalPriceUsd.toLocaleString()} USD)
Includes master artisan fair-wage labor, organic cotton backing, and studio certificate of authenticity.
--------------------------------------`;

  function handleCopyQuote() {
    navigator.clipboard.writeText(quotationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCreateDraft() {
    if (onCreateDraft) {
      onCreateDraft({
        name: clientName ? `Custom Rug: ${clientName}` : `Bespoke Custom Rug ${widthCm}×${heightCm}cm`,
        shape,
        material: "100% Rwandan Highland Wool on Organic Cotton Base",
        production_time: leadTimeDisplay,
        base_price_rwf: finalPriceRwf,
        cost_rwf: rawMaterialCostRwf + fairWageLaborCostRwf,
        stock_status: "made_to_order",
        fulfilment_type: "custom",
        tags: ["custom", "bespoke", shape],
        notes: JSON.stringify({
          provenanceBackstory: `Commissioned bespoke architectural rug for ${clientName || "private residence"}.`,
          constructionTechnique: technique,
          pileHeightMm,
          knotDensityPerSqm: technique === "hand_knotted" ? 120000 : 88000,
          rawMaterials: {
            woolKg: totalWoolKg,
            woolRateRwfPerKg: 14000,
            foundationClothRwf: Math.round(areaM2 * 15000),
            latexRwf: Math.round(areaM2 * 12000),
            edgeBindingRwf: Math.round(areaM2 * 8000),
          },
          labor: {
            weavingHours: estimatedWeavingHours,
            hourlyRateRwf: 4500,
          },
          rushFeePercent: isRush ? 25 : 0,
        }),
        sizes: [
          {
            label: "Custom Commission",
            width_cm: widthCm,
            height_cm: shape === "circular" ? widthCm : heightCm,
            price_rwf: finalPriceRwf,
            weight_kg: totalWoolKg,
            sort_order: 0,
          },
        ],
      });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Bespoke Commission & Lead Time Engine
            </h2>
            <p className="text-xs text-muted-foreground">
              Instant metric area, raw material consumption, fair-wage labor & client quotation.
            </p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="mt-6 space-y-5">
          {/* Client Reference */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client / Project Reference
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Kigali Villa Master Suite / Studio Arch"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-foreground"
            />
          </div>

          {/* Shape Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shape & Geometry
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(["rectangle", "runner", "circular", "organic"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  className={`rounded-xl border py-2 text-xs font-medium capitalize transition ${
                    shape === s
                      ? "border-foreground bg-foreground text-background font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Width (CM)
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {cmToFeetInches(widthCm)}
                </span>
              </div>
              <input
                type="number"
                min={50}
                max={1200}
                step={10}
                value={widthCm}
                onChange={(e) => setWidthCm(Math.max(10, Number(e.target.value)))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-foreground"
              />
            </div>

            {shape !== "circular" ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Length / Depth (CM)
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {cmToFeetInches(heightCm)}
                  </span>
                </div>
                <input
                  type="number"
                  min={50}
                  max={1500}
                  step={10}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(10, Number(e.target.value)))}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-foreground"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Diameter (CM)
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {cmToFeetInches(widthCm)}
                  </span>
                </div>
                <div className="mt-1.5 flex h-[42px] items-center rounded-xl border border-dashed border-border px-3.5 text-xs text-muted-foreground">
                  Equal to width ({widthCm} cm)
                </div>
              </div>
            )}
          </div>

          {/* Technique & Pile Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Craft Technique
              </label>
              <select
                value={technique}
                onChange={(e) => setTechnique(e.target.value as any)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-foreground"
              >
                <option value="hand_tufted">Hand-Tufted Plush</option>
                <option value="hand_knotted">Hand-Knotted Heritage</option>
                <option value="flatweave">Flatweave Kilim</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pile Height
              </label>
              <select
                value={pileHeightMm}
                onChange={(e) => setPileHeightMm(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-foreground"
              >
                <option value={8}>8mm Low Profile / Carved</option>
                <option value={12}>12mm Standard Plush</option>
                <option value={16}>16mm High-Shag Berber</option>
              </select>
            </div>
          </div>

          {/* Expedited Rush Toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background/60 p-3.5 transition hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Expedited Workshop Rush (+25%)
                </span>
                <p className="text-xs text-muted-foreground">
                  Prioritizes loom frame scheduling to deliver in 10–14 days.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRush}
              onChange={(e) => setIsRush(e.target.checked)}
              className="h-4 w-4 rounded border-border text-foreground accent-foreground"
            />
          </label>

          {/* Calculated Readout Card */}
          <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
            <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Surface Area
                </span>
                <div className="mt-1 font-mono text-sm font-semibold">{areaM2} m²</div>
                <div className="text-[10px] text-muted-foreground">{areaSqFt} sq ft</div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Highland Wool
                </span>
                <div className="mt-1 font-mono text-sm font-semibold">~{totalWoolKg} kg</div>
                <div className="text-[10px] text-muted-foreground">Scoured & spun</div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Artisan Labor
                </span>
                <div className="mt-1 font-mono text-sm font-semibold">~{estimatedWeavingHours} hrs</div>
                <div className="text-[10px] text-muted-foreground">Fair-wage rate</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between border-t border-border pt-4">
              <div>
                <span className="text-xs text-muted-foreground">Calculated Atelier Quote:</span>
                <div className="font-display text-2xl font-bold sm:text-3xl">
                  {finalPriceRwf.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">RWF</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-muted-foreground">Dual USD Value</span>
                <div className="font-display text-lg font-medium text-foreground">
                  ${finalPriceUsd.toLocaleString()} USD
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>{leadTimeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCopyQuote}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold transition hover:bg-muted"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied Quote!" : "Copy Client Quotation"}
          </button>
          {onCreateDraft && (
            <button
              type="button"
              onClick={handleCreateDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Create Catalogue Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
