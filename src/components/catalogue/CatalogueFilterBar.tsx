import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  COLOR_SWATCHES,
  SHAPE_OPTIONS,
  SORT_OPTIONS,
  type SortKey,
} from "@/lib/catalogue-filters";

interface CatalogueFilterBarProps {
  totalCount: number;
  filteredCount: number;
  selectedColors: string[];
  onToggleColor: (colorId: string) => void;
  onClearColors: () => void;
  selectedShapes: string[];
  onToggleShape: (shapeId: string) => void;
  onClearShapes: () => void;
  sortKey: SortKey;
  onSelectSort: (sortKey: SortKey) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onResetAll: () => void;
}

export function CatalogueFilterBar({
  filteredCount,
  selectedColors,
  onToggleColor,
  onClearColors,
  selectedShapes,
  onToggleShape,
  onClearShapes,
  sortKey,
  onSelectSort,
  onResetAll,
}: CatalogueFilterBarProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
      if (shapeRef.current && !shapeRef.current.contains(e.target as Node)) {
        setShapeOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setColorOpen(false);
        setShapeOpen(false);
        setSortOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeSortOption =
    SORT_OPTIONS.find((s) => s.id === sortKey) || SORT_OPTIONS[0];
  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedShapes.length > 0 ||
    sortKey !== "featured";

  // Split color swatches into exactly 3 rows covering the full spectrum (5 pills per row)
  const colorRow1 = COLOR_SWATCHES.slice(0, 5);
  const colorRow2 = COLOR_SWATCHES.slice(5, 10);
  const colorRow3 = COLOR_SWATCHES.slice(10, 15);

  return (
    <div className="relative z-40 mb-8 sm:mb-10 w-full max-w-full">
      {/* Minimal Centered Filter Bar: Floating clean controls centered in the viewport */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 md:gap-8 py-1 px-2 max-w-full">
        {/* Centered Triggers (COLOR, SHAPE, SORT) */}
          {/* 1. COLOR FILTER TRIGGER */}
          <div className="relative" ref={colorRef}>
            <button
              type="button"
              id="filter-color-trigger"
              onClick={() => {
                setColorOpen((prev) => !prev);
                setShapeOpen(false);
                setSortOpen(false);
              }}
              aria-expanded={colorOpen}
              className={`group inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-all py-1.5 px-3 rounded-full border border-border/50 bg-card/50 sm:border-transparent sm:bg-transparent sm:p-1 ${
                selectedColors.length > 0 || colorOpen
                  ? "text-foreground font-semibold border-foreground/30 bg-muted/60"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {/* Minimal filter icon */}
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:scale-105"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <line x1="2.5" y1="5.5" x2="13.5" y2="5.5" />
                <line x1="4.5" y1="10.5" x2="11.5" y2="10.5" />
              </svg>
              <span>Color</span>
              {selectedColors.length > 0 && (
                <span className="ml-0.5 rounded-full bg-foreground px-1.5 py-0.2 text-[10px] font-bold text-background leading-none">
                  {selectedColors.length}
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  colorOpen ? "rotate-180 text-foreground" : ""
                }`}
              />
            </button>

            {/* MINIMAL COLOR DROPDOWN PANEL */}
            {colorOpen && (
              <div
                id="filter-color-menu"
                className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full z-[70] mt-2 w-auto max-w-[calc(100vw-24px)] rounded-2xl border border-border/50 bg-background/98 p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-2">
                  {/* Row 1: Neutrals & Monochromes (5 pills) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    {colorRow1.map((swatch) => {
                      const isSelected = selectedColors.includes(swatch.id);
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          title={swatch.label}
                          onClick={() => onToggleColor(swatch.id)}
                          className={`relative h-5 w-7 sm:w-9 rounded-full transition-all hover:scale-105 ${
                            isSelected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105 shadow-sm"
                              : "hover:ring-1 hover:ring-border"
                          }`}
                          style={{
                            backgroundColor: swatch.hex,
                            borderColor: swatch.border,
                            borderWidth: 1,
                            borderStyle: "solid",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Row 2: Warm Spectrum (Pinks, Reds, Wines, Oranges, Yellows) (5 pills) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    {colorRow2.map((swatch) => {
                      const isSelected = selectedColors.includes(swatch.id);
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          title={swatch.label}
                          onClick={() => onToggleColor(swatch.id)}
                          className={`relative h-5 w-7 sm:w-9 rounded-full transition-all hover:scale-105 ${
                            isSelected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105 shadow-sm"
                              : "hover:ring-1 hover:ring-border"
                          }`}
                          style={{
                            backgroundColor: swatch.hex,
                            borderColor: swatch.border,
                            borderWidth: 1,
                            borderStyle: "solid",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Row 3: Cool Spectrum (Greens, Blues, Indigos, Violets) (5 pills) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    {colorRow3.map((swatch) => {
                      const isSelected = selectedColors.includes(swatch.id);
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          title={swatch.label}
                          onClick={() => onToggleColor(swatch.id)}
                          className={`relative h-5 w-7 sm:w-9 rounded-full transition-all hover:scale-105 ${
                            isSelected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105 shadow-sm"
                              : "hover:ring-1 hover:ring-border"
                          }`}
                          style={{
                            backgroundColor: swatch.hex,
                            borderColor: swatch.border,
                            borderWidth: 1,
                            borderStyle: "solid",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {selectedColors.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {selectedColors.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={onClearColors}
                      className="text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SHAPE FILTER TRIGGER */}
          <div className="relative" ref={shapeRef}>
            <button
              type="button"
              id="filter-shape-trigger"
              onClick={() => {
                setShapeOpen((prev) => !prev);
                setColorOpen(false);
                setSortOpen(false);
              }}
              aria-expanded={shapeOpen}
              className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-all py-1.5 px-3 rounded-full border border-border/50 bg-card/50 sm:border-transparent sm:bg-transparent sm:p-1 ${
                selectedShapes.length > 0 || shapeOpen
                  ? "text-foreground font-semibold border-foreground/30 bg-muted/60"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <span>Shape</span>
              {selectedShapes.length > 0 && (
                <span className="ml-0.5 rounded-full bg-foreground px-1.5 py-0.2 text-[10px] font-bold text-background leading-none">
                  {selectedShapes.length}
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  shapeOpen ? "rotate-180 text-foreground" : ""
                }`}
              />
            </button>

            {/* MINIMAL SHAPE DROPDOWN PANEL */}
            {shapeOpen && (
              <div
                id="filter-shape-menu"
                className="absolute left-0 top-full z-[70] mt-2 w-48 max-w-[calc(100vw-24px)] rounded-2xl border border-border/50 bg-background/98 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-0.5">
                  {SHAPE_OPTIONS.map((shape) => {
                    const isSelected = selectedShapes.includes(shape.id);
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => onToggleShape(shape.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <span>{shape.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
                {selectedShapes.length > 0 && (
                  <div className="mt-1 pt-1.5 border-t border-border/40 px-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {selectedShapes.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={onClearShapes}
                      className="text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. SORT DROPDOWN TRIGGER */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              id="filter-sort-trigger"
              onClick={() => {
                setSortOpen((prev) => !prev);
                setColorOpen(false);
                setShapeOpen(false);
              }}
              aria-expanded={sortOpen}
              className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-all py-1.5 px-3 rounded-full border border-border/50 bg-card/50 sm:border-transparent sm:bg-transparent sm:p-1 ${
                sortOpen || sortKey !== "featured"
                  ? "text-foreground font-semibold border-foreground/30 bg-muted/60"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <span>SORT</span>
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  sortOpen ? "rotate-180 text-foreground" : ""
                }`}
              />
              <span className="normal-case font-normal text-muted-foreground ml-0.5 truncate max-w-[90px] sm:max-w-none">
                {activeSortOption.shortLabel ?? activeSortOption.label}
              </span>
            </button>

            {/* MINIMAL SORT DROPDOWN PANEL - Anchored to right on mobile so it stays within viewport */}
            {sortOpen && (
              <div
                id="filter-sort-menu"
                className="absolute right-0 left-auto top-full z-[70] mt-2 w-48 max-w-[calc(100vw-24px)] rounded-2xl border border-border/50 bg-background/98 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = opt.id === sortKey;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onSelectSort(opt.id);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-foreground stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reset button when filters are active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetAll}
              title="Reset all filters"
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all py-1.5 px-3 rounded-full border border-border/40 bg-card/30 sm:border-0 sm:bg-transparent sm:underline sm:p-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
      </div>
    </div>
  );
}
