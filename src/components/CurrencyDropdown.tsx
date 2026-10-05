import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";

export const CURRENCY_DETAILS: Record<
  Currency,
  {
    code: Currency;
    symbol: string;
    label: string;
    fullName: string;
    flag: string;
  }
> = {
  USD: {
    code: "USD",
    symbol: "$",
    label: "USD ($)",
    fullName: "US Dollar",
    flag: "🇺🇸",
  },
  RWF: {
    code: "RWF",
    symbol: "Frw",
    label: "RWF (Frw)",
    fullName: "Rwandan Franc",
    flag: "🇷🇼",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "EUR (€)",
    fullName: "Euro",
    flag: "🇪🇺",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "GBP (£)",
    fullName: "British Pound",
    flag: "🇬🇧",
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    label: "KES (KSh)",
    fullName: "Kenyan Shilling",
    flag: "🇰🇪",
  },
};

export interface CurrencyDropdownProps {
  variant?: "pill" | "footer" | "compact" | "minimal";
  placement?: "up" | "down";
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  showFlag?: boolean;
  showFullName?: boolean;
  showIpSyncBadge?: boolean;
  onSelect?: (currency: Currency) => void;
}

export function CurrencyDropdown({
  variant = "pill",
  placement = variant === "footer" ? "up" : "down",
  align = "right",
  className = "",
  triggerClassName = "",
  showFlag = true,
  showFullName = false,
  showIpSyncBadge = true,
  onSelect,
}: CurrencyDropdownProps) {
  const { currency, setCurrency, ipGeo, isIpSynced, syncToIp } = useCurrency();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentMeta = CURRENCY_DETAILS[currency] || {
    code: currency,
    symbol: "",
    label: currency,
    fullName: currency,
    flag: "🌐",
  };

  const handleSelect = (c: Currency) => {
    setCurrency(c);
    setOpen(false);
    onSelect?.(c);
  };

  // Trigger button styling based on variant
  const getTriggerClass = () => {
    if (triggerClassName) return triggerClassName;

    switch (variant) {
      case "footer":
        return "inline-flex items-center justify-between gap-2.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:border-foreground/40 hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring";
      case "compact":
        return "inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 text-[11px] font-medium text-foreground transition-all duration-200 hover:border-foreground/40 hover:bg-muted/40 focus:outline-none";
      case "minimal":
        return "inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors hover:text-foreground/70 focus:outline-none";
      case "pill":
      default:
        return "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-foreground/50 hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      {/* Custom Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select currency"
        onClick={() => setOpen((prev) => !prev)}
        className={getTriggerClass()}
      >
        <span className="flex items-center gap-1.5">
          {showFlag && <span className="text-xs">{currentMeta.flag}</span>}
          <span>{showFullName ? currentMeta.label : currentMeta.code}</span>
        </span>

        {showIpSyncBadge && isIpSynced && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"
            title="Auto-detected from your region"
          />
        )}

        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          aria-label="Available currencies"
          className={`absolute z-[90] min-w-[13.5rem] rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xl shadow-black/10 backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150 ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "left" ? "left-0" : "right-0"}`}
        >
          {/* Menu Header */}
          <div className="px-2.5 py-1.5 border-b border-border/50 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Select Currency</span>
            <span className="text-[9px] font-normal lowercase tracking-normal text-muted-foreground/80">
              live fx
            </span>
          </div>

          {/* Currencies List */}
          <div className="py-1 space-y-0.5">
            {CURRENCIES.map((c) => {
              const meta = CURRENCY_DETAILS[c];
              const isSelected = c === currency;
              return (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 ${
                    isSelected
                      ? "bg-muted font-semibold text-foreground"
                      : "text-foreground/90 hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left min-w-0">
                    <span className="text-base leading-none">{meta.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{meta.code}</span>
                        <span className="text-muted-foreground text-[11px]">
                          ({meta.symbol})
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {meta.fullName}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-foreground shrink-0 stroke-[2.25]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* IP Detection Footer helper if detected */}
          {ipGeo && (
            <div className="mt-1 pt-2 pb-1 px-2.5 border-t border-border/60 text-[10px] text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 truncate">
                  <Globe className="h-3 w-3 shrink-0" />
                  <span className="truncate">{ipGeo.countryName}</span>
                </span>
                {isIpSynced ? (
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-medium shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Auto-synced
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      syncToIp();
                      setOpen(false);
                    }}
                    className="text-accent underline font-semibold hover:text-foreground shrink-0"
                  >
                    Sync to {ipGeo.currency}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
