import type { Product } from "@/lib/catalogue.functions";

export interface ColorSwatch {
  id: string;
  label: string;
  hex: string;
  border: string;
  textColor?: string;
  words: string[];
  hexes: string[];
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  // --- ROW 1: Neutrals, Monochromes & Earth (5) ---
  {
    id: "off-white",
    label: "Off-White & Cream",
    hex: "#F6F1EA",
    border: "#DDD5C8",
    textColor: "#1A1A1A",
    words: ["cream", "white", "off-white", "ecru", "ivory", "neutral", "linen", "chalk"],
    hexes: ["#f", "#e8d", "#ece", "#f2", "#f0", "#f4", "#f6", "#fff"],
  },
  {
    id: "taupe",
    label: "Taupe & Sand",
    hex: "#C5B39F",
    border: "#A89683",
    textColor: "#1A1A1A",
    words: ["taupe", "sand", "beige", "tan", "camel", "wheat", "khaki"],
    hexes: ["#c5b", "#b9a", "#c7b", "#d2b", "#bca", "#8a5", "#b8a"],
  },
  {
    id: "grey",
    label: "Grey & Slate",
    hex: "#7A8089",
    border: "#5F656D",
    textColor: "#FFFFFF",
    words: ["grey", "gray", "slate", "silver", "ash", "stone", "graphite", "heather"],
    hexes: ["#7a8", "#888", "#999", "#5f6", "#6c7", "#5c3", "#707"],
  },
  {
    id: "black",
    label: "Black & Charcoal",
    hex: "#1A1A1A",
    border: "#1A1A1A",
    textColor: "#FFFFFF",
    words: ["black", "monochrome", "charcoal", "dark", "ebony", "noir", "onyx"],
    hexes: ["#1a", "#11", "#00", "#22", "#0f", "#262"],
  },
  {
    id: "terracotta",
    label: "Terracotta & Rust",
    hex: "#C25737",
    border: "#A74325",
    textColor: "#FFFFFF",
    words: ["terracotta", "rust", "clay", "brick", "copper", "cinnamon", "sienna", "earth"],
    hexes: ["#c25", "#c05", "#b43", "#a54", "#c65", "#d06"],
  },

  // --- ROW 2: Warm Spectrum - Pinks, Reds, Wines, Oranges, Yellows (5) ---
  {
    id: "pink",
    label: "Pink & Rose",
    hex: "#F4BEC4",
    border: "#E29DA5",
    textColor: "#1A1A1A",
    words: ["pink", "rose", "blush", "rubber", "salmon", "coral", "pastel pink", "powder pink"],
    hexes: ["#f4b", "#e8b", "#f5c", "#f2a", "#fab", "#f6c"],
  },
  {
    id: "red",
    label: "Crimson & Red",
    hex: "#B42B28",
    border: "#961F1D",
    textColor: "#FFFFFF",
    words: ["red", "crimson", "scarlet", "ruby", "cherry", "vermilion"],
    hexes: ["#b42", "#c63", "#c45", "#b82", "#d32", "#a92"],
  },
  {
    id: "burgundy",
    label: "Burgundy & Wine",
    hex: "#5C1929",
    border: "#47101E",
    textColor: "#FFFFFF",
    words: ["burgundy", "wine", "maroon", "bordeaux", "merlot", "oxblood", "cabernet"],
    hexes: ["#5c1", "#471", "#5f1", "#4a1", "#6b1", "#541"],
  },
  {
    id: "orange",
    label: "Orange & Ochre",
    hex: "#DF7627",
    border: "#BF5E14",
    textColor: "#FFFFFF",
    words: ["orange", "ochre", "burnt orange", "tangerine", "apricot", "peach", "amber"],
    hexes: ["#df7", "#e07", "#d97", "#e68", "#f08"],
  },
  {
    id: "mustard",
    label: "Mustard & Gold",
    hex: "#D6A638",
    border: "#B7861E",
    textColor: "#1A1A1A",
    words: ["mustard", "gold", "yellow", "amber", "golden", "saffron", "honey"],
    hexes: ["#d6a", "#c08", "#e5b", "#e8a", "#d9b", "#f3b"],
  },

  // --- ROW 3: Cool Spectrum - Greens, Blues, Indigos, Violets (5) ---
  {
    id: "sage",
    label: "Sage & Olive",
    hex: "#9EAC84",
    border: "#85936B",
    textColor: "#1A1A1A",
    words: ["sage", "olive", "pistachio", "light green", "moss", "khaki green", "celadon"],
    hexes: ["#9ea", "#d1e", "#8e9", "#7db", "#cbe", "#859"],
  },
  {
    id: "forest-green",
    label: "Green & Emerald",
    hex: "#1E7D38",
    border: "#16642B",
    textColor: "#FFFFFF",
    words: ["green", "forest green", "turf", "emerald", "hunter", "pine", "botanical", "moss"],
    hexes: ["#1e7", "#1f7", "#166", "#246", "#1e8", "#226"],
  },
  {
    id: "sky-blue",
    label: "Sky & Cerulean",
    hex: "#78BDE0",
    border: "#56A3C8",
    textColor: "#FFFFFF",
    words: ["blue", "sky", "cyan", "powder blue", "baby blue", "azure", "ice blue"],
    hexes: ["#78b", "#88c", "#64b", "#4a9", "#90c"],
  },
  {
    id: "navy",
    label: "Navy & Cobalt",
    hex: "#1D3866",
    border: "#132647",
    textColor: "#FFFFFF",
    words: ["navy", "cobalt", "indigo", "midnight blue", "royal blue", "deep blue", "ocean"],
    hexes: ["#1d3", "#132", "#0da", "#1b2", "#112", "#234"],
  },
  {
    id: "purple",
    label: "Purple & Lavender",
    hex: "#8B6B99",
    border: "#72537E",
    textColor: "#FFFFFF",
    words: ["purple", "violet", "lavender", "lilac", "plum", "amethyst", "mauve", "eggplant"],
    hexes: ["#8b6", "#725", "#9b7", "#6b4", "#7b5"],
  },
];

export interface ShapeOption {
  id: string;
  label: string;
  description: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: "circular",
    label: "Circular",
    description: "Round, oval, and curved designs",
  },
  {
    id: "rectangular",
    label: "Rectangular",
    description: "Traditional 4-corner, square, and rectangular mats",
  },
  {
    id: "runner",
    label: "Runner",
    description: "Long, narrow accent dimensions",
  },
  {
    id: "irregular",
    label: "Irregular / Organic",
    description: "Freeform, wavy, abstract",
  },
];

export type SortKey =
  | "featured"
  | "newest"
  | "relevance"
  | "bestselling"
  | "alpha_asc"
  | "alpha_desc"
  | "price_asc"
  | "price_desc";

export interface SortOption {
  id: SortKey;
  label: string;
  shortLabel?: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "featured", label: "Featured", shortLabel: "Featured" },
  { id: "newest", label: "Newest", shortLabel: "Newest" },
  { id: "relevance", label: "Most relevant", shortLabel: "Relevant" },
  { id: "bestselling", label: "Best selling", shortLabel: "Best selling" },
  { id: "alpha_asc", label: "Alphabetical: A–Z", shortLabel: "A–Z" },
  { id: "alpha_desc", label: "Alphabetical: Z–A", shortLabel: "Z–A" },
  { id: "price_asc", label: "Price: Low to high", shortLabel: "Price ↑" },
  { id: "price_desc", label: "Price: High to low", shortLabel: "Price ↓" },
];

export function matchProductColor(p: Product, colorId: string): boolean {
  const def = COLOR_SWATCHES.find((c) => c.id === colorId);
  if (!def) return false;

  const tags = (p.tags || []).map((t) => t.toLowerCase());
  const name = (p.name || "").toLowerCase();
  const desc = (
    (p.short_description || "") +
    " " +
    (p.description || "")
  ).toLowerCase();
  const colorwayNames = (p.colorways || [])
    .map((cw) => (cw.name || "").toLowerCase())
    .join(" ");
  const text = `${name} ${desc} ${tags.join(" ")} ${colorwayNames}`;

  for (const w of def.words) {
    const rx = new RegExp(`\\b${w}\\b`, "i");
    if (rx.test(text)) return true;
  }

  const palette = (p.color_palette || []).map((c) => c.toLowerCase());
  for (const h of palette) {
    if (def.hexes.some((pref) => h.startsWith(pref))) return true;
  }

  return false;
}

export function matchProductShape(p: Product, shapeId: string): boolean {
  const s = (p.shape || "").toLowerCase();
  const tags = (p.tags || []).map((t) => t.toLowerCase());
  const name = (p.name || "").toLowerCase();
  const categorySlug = (p.category?.slug || "").toLowerCase();

  switch (shapeId) {
    case "circular":
      return (
        s === "circular" ||
        s === "round" ||
        s === "oval" ||
        tags.includes("circular") ||
        tags.includes("round") ||
        name.includes("circle") ||
        name.includes("enso")
      );
    case "rectangular":
      return (
        s === "rectangle" ||
        s === "rectangular" ||
        s === "square" ||
        tags.includes("rectangle") ||
        tags.includes("rectangular")
      );
    case "runner":
      return (
        s === "runner" ||
        tags.includes("runner") ||
        categorySlug === "runners" ||
        name.includes("runner") ||
        Boolean(
          p.sizes?.some(
            (sz: { label?: string; width_cm?: number; height_cm?: number }) =>
              sz.label?.toLowerCase().includes("runner") ||
              (sz.width_cm &&
                sz.height_cm &&
                (sz.height_cm / sz.width_cm >= 2.2 ||
                  sz.width_cm / sz.height_cm >= 2.2)),
          ),
        )
      );
    case "irregular":
      return (
        s === "irregular" ||
        s === "organic" ||
        tags.includes("irregular") ||
        tags.includes("organic") ||
        tags.includes("abstract") ||
        name.toLowerCase().includes("melt")
      );
    default:
      return false;
  }
}

export function computeProductRelevance(p: Product, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  const name = (p.name || "").toLowerCase();
  const shortDesc = (p.short_description || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const tags = (p.tags || []).map((t) => t.toLowerCase());
  const material = (p.material || "").toLowerCase();

  for (const t of terms) {
    if (name === t) score += 100;
    else if (name.startsWith(t)) score += 60;
    else if (name.includes(t)) score += 35;

    if (tags.includes(t)) score += 25;
    else if (tags.some((tag) => tag.includes(t))) score += 15;

    if (shortDesc.includes(t)) score += 10;
    if (desc.includes(t)) score += 5;
    if (material.includes(t)) score += 10;
  }
  return score;
}
