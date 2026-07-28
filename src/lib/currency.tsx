import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CURRENCIES = ["USD", "RWF", "EUR", "GBP", "KES"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  RWF: "RWF ",
  EUR: "€",
  GBP: "£",
  KES: "KSh ",
};

// Fallback rates (per 1 USD) used until the live fetch resolves.
const FALLBACK: Record<Currency, number> = {
  USD: 1,
  RWF: 1380,
  EUR: 0.92,
  GBP: 0.78,
  KES: 129,
};

const CACHE_KEY = "mosiac.fx.v1";
const STORAGE_KEY = "mosiac.currency";
const DAY_MS = 24 * 60 * 60 * 1000;

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<Currency, number>;
  format: (p: { rwf?: number | null; usd?: number | null }) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

async function fetchRates(): Promise<Record<Currency, number> | null> {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!r.ok) return null;
    const j = await r.json();
    const src = j?.rates;
    if (!src) return null;
    const out = { ...FALLBACK };
    for (const c of CURRENCIES) if (typeof src[c] === "number") out[c] = src[c];
    return out;
  } catch {
    return null;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (saved && (CURRENCIES as readonly string[]).includes(saved)) setCurrencyState(saved);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { at, rates: r } = JSON.parse(cached) as { at: number; rates: Record<Currency, number> };
        if (r) setRates({ ...FALLBACK, ...r });
        if (Date.now() - at < DAY_MS) return;
      }
    } catch {}
    fetchRates().then((r) => {
      if (!r) return;
      setRates(r);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rates: r }));
      } catch {}
    });
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  const value = useMemo<Ctx>(() => {
    const format = ({ rwf, usd }: { rwf?: number | null; usd?: number | null }) => {
      // Derive a USD base price. If only RWF is set, convert using the live RWF rate.
      let baseUsd: number | null = null;
      if (typeof usd === "number" && usd > 0) baseUsd = Number(usd);
      else if (typeof rwf === "number" && rwf > 0) baseUsd = Number(rwf) / (rates.RWF || FALLBACK.RWF);
      if (baseUsd == null) return "Price on request";
      const converted = baseUsd * (rates[currency] || 1);
      const rounded = currency === "RWF" || currency === "KES" ? Math.round(converted) : Math.round(converted * 100) / 100;
      const formatted = rounded.toLocaleString(undefined, {
        minimumFractionDigits: currency === "RWF" || currency === "KES" ? 0 : 0,
        maximumFractionDigits: currency === "RWF" || currency === "KES" ? 0 : 2,
      });
      return `${SYMBOLS[currency]}${formatted}`;
    };
    return { currency, setCurrency, rates, format };
  }, [currency, rates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback when provider isn't mounted (SSR of isolated components)
    return {
      currency: "USD" as Currency,
      setCurrency: () => {},
      rates: FALLBACK,
      format: ({ rwf, usd }: { rwf?: number | null; usd?: number | null }) => {
        if (typeof usd === "number" && usd > 0) return `$${Number(usd).toLocaleString()}`;
        if (typeof rwf === "number" && rwf > 0) return `${Number(rwf).toLocaleString()} RWF`;
        return "Price on request";
      },
    };
  }
  return ctx;
}
