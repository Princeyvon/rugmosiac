import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
const IP_GEO_KEY = "mosiac.ip_geo";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface IpGeoInfo {
  ip?: string;
  countryCode: string;
  countryName: string;
  currency: Currency;
  detectedAt: number;
}

const EUROZONE_CODES = new Set([
  "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "HR"
]);

const COUNTRY_NAMES: Record<string, string> = {
  RW: "Rwanda",
  KE: "Kenya",
  UG: "Uganda",
  TZ: "Tanzania",
  GB: "United Kingdom",
  US: "United States",
  CA: "Canada",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  ZA: "South Africa",
  AE: "United Arab Emirates",
};

/** Determine target currency from detected country code */
export function currencyFromCountry(code: string): Currency {
  const upper = (code || "").toUpperCase().trim();
  if (upper === "RW") return "RWF";
  if (upper === "KE" || upper === "UG" || upper === "TZ") return "KES";
  if (upper === "GB" || upper === "UK") return "GBP";
  if (EUROZONE_CODES.has(upper)) return "EUR";
  return "USD";
}

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency, manualOverride?: boolean) => void;
  rates: Record<Currency, number>;
  format: (p: number | { rwf?: number | null; usd?: number | null }) => string;
  ipGeo: IpGeoInfo | null;
  isIpSynced: boolean;
  syncToIp: () => void;
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

/** Detect user's IP and country with multi-provider fallback */
async function detectIpLocation(): Promise<IpGeoInfo | null> {
  // Provider 1: api.country.is (ultra fast, CORS enabled)
  try {
    const res = await fetch("https://api.country.is", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string; country?: string };
      const code = (data.country || "RW").toUpperCase();
      const curr = currencyFromCountry(code);
      return {
        ip: data.ip,
        countryCode: code,
        countryName: COUNTRY_NAMES[code] || code,
        currency: curr,
        detectedAt: Date.now(),
      };
    }
  } catch {
    /* try fallback */
  }

  // Provider 2: ipwho.is fallback
  try {
    const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string; country_code?: string; country?: string };
      const code = (data.country_code || "RW").toUpperCase();
      const curr = currencyFromCountry(code);
      return {
        ip: data.ip,
        countryCode: code,
        countryName: data.country || COUNTRY_NAMES[code] || code,
        currency: curr,
        detectedAt: Date.now(),
      };
    }
  } catch {
    /* fallback to default */
  }

  // Fallback defaults to Rwanda studio location
  return {
    countryCode: "RW",
    countryName: "Rwanda",
    currency: "RWF",
    detectedAt: Date.now(),
  };
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("RWF");
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK);
  const [ipGeo, setIpGeo] = useState<IpGeoInfo | null>(null);

  // Hydrate from localStorage and enforce IP sync
  useEffect(() => {
    let savedCurrency: Currency | null = null;
    try {
      savedCurrency = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (savedCurrency && (CURRENCIES as readonly string[]).includes(savedCurrency)) {
        setCurrencyState(savedCurrency);
      }
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { at, rates: r } = JSON.parse(cached) as { at: number; rates: Record<Currency, number> };
        if (r) setRates({ ...FALLBACK, ...r });
      }

      const cachedGeo = localStorage.getItem(IP_GEO_KEY);
      if (cachedGeo) {
        const parsed = JSON.parse(cachedGeo) as IpGeoInfo;
        setIpGeo(parsed);
        // If user hasn't explicitly set a custom currency or if IP sync was previously matched, enforce IP currency
        if (!savedCurrency && parsed.currency) {
          setCurrencyState(parsed.currency);
        }
      }
    } catch {}

    // 1. Fetch live exchange rates
    fetchRates().then((r) => {
      if (!r) return;
      setRates(r);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rates: r }));
      } catch {}
    });

    // 2. Enforce IP currency detection & auto-sync
    detectIpLocation().then((geo) => {
      if (!geo) return;
      setIpGeo(geo);
      try {
        localStorage.setItem(IP_GEO_KEY, JSON.stringify(geo));
      } catch {}

      // Automatically sync currency to detected IP if no manual override exists
      // or if current currency is the initial default
      try {
        const hasManualChoice = Boolean(localStorage.getItem(STORAGE_KEY));
        if (!hasManualChoice) {
          setCurrencyState(geo.currency);
          localStorage.setItem(STORAGE_KEY, geo.currency);
        }
      } catch {}
    });
  }, []);

  const setCurrency = useCallback((c: Currency, _manual = true) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }, []);

  const syncToIp = useCallback(() => {
    if (ipGeo?.currency) {
      setCurrency(ipGeo.currency);
    } else {
      detectIpLocation().then((geo) => {
        if (geo) {
          setIpGeo(geo);
          setCurrency(geo.currency);
        }
      });
    }
  }, [ipGeo?.currency, setCurrency]);

  const isIpSynced = Boolean(ipGeo && ipGeo.currency === currency);

  const value = useMemo<Ctx>(() => {
    const format = (price: number | { rwf?: number | null; usd?: number | null }) => {
      const rwf = typeof price === "number" ? price : price?.rwf;
      const usd = typeof price === "number" ? null : price?.usd;

      // RWF is the catalogue's source of truth: show the exact listed price.
      if (currency === "RWF" && typeof rwf === "number" && rwf > 0) {
        return `${SYMBOLS.RWF}${Math.round(rwf).toLocaleString()}`;
      }
      // Derive a USD base price. If only RWF is set, convert using the live RWF rate.
      let baseUsd: number | null = null;
      if (typeof usd === "number" && usd > 0) baseUsd = Number(usd);
      else if (typeof rwf === "number" && rwf > 0) baseUsd = Number(rwf) / (rates.RWF || FALLBACK.RWF);
      if (baseUsd == null) return "Price on request";
      const converted = baseUsd * (rates[currency] || 1);
      // Round up so a converted price never undercuts the RWF list price.
      const whole = currency === "RWF" || currency === "KES";
      const rounded = whole ? Math.ceil(converted) : Math.ceil(converted * 100) / 100;
      const formatted = rounded.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: whole ? 0 : 2,
      });
      return `${SYMBOLS[currency]}${formatted}`;
    };

    return {
      currency,
      setCurrency,
      rates,
      format,
      ipGeo,
      isIpSynced,
      syncToIp,
    };
  }, [currency, rates, ipGeo, isIpSynced, syncToIp, setCurrency]);

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
      format: (price: number | { rwf?: number | null; usd?: number | null }) => {
        const rwf = typeof price === "number" ? price : price?.rwf;
        const usd = typeof price === "number" ? null : price?.usd;
        if (typeof usd === "number" && usd > 0) return `$${Number(usd).toLocaleString()}`;
        if (typeof rwf === "number" && rwf > 0) return `${Number(rwf).toLocaleString()} RWF`;
        return "Price on request";
      },
      ipGeo: null,
      isIpSynced: true,
      syncToIp: () => {},
    };
  }
  return ctx;
}
