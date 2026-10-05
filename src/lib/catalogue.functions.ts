import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import {
  fallbackCategories,
  fallbackProducts,
  fallbackReviews,
} from "./fallback-catalogue";

function getClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type Product = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  main_image_url: string | null;
  hover_image_url: string | null;
  base_price_rwf: number | null;
  base_price_usd: number | null;
  stock_status: string;
  shape: string;
  material: string | null;
  production_time: string | null;
  color_palette: string[];
  colorways?: Array<{ id?: string; name: string; colors?: string; hex?: string }>;
  tags: string[];
  size_guide_svg?: string | null;
  category?: { slug: string; name: string } | null;
  sizes?: Array<{
    id: string;
    label: string;
    price_rwf: number | null;
    price_usd: number | null;
  }>;
  images?: Array<{ id?: string; url: string; alt?: string | null; sort_order?: number; colorway_id?: string | null }>;
};

export const listCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { listAllCategories } = await import("./studio-store.server");
      const cats = await listAllCategories();
      if (cats && cats.length > 0) return cats;
    } catch {
      // ignore
    }
    return fallbackCategories;
  },
);

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { categorySlug?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { listPublicProducts } = await import("./studio-store.server");
      const products = await listPublicProducts(data.categorySlug);
      if (products && products.length > 0) return products;
    } catch {
      // ignore
    }

    if (data.categorySlug) {
      return fallbackProducts.filter(
        (p) => p.category?.slug === data.categorySlug,
      );
    }
    return fallbackProducts;
  });

export const listFeatured = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { listFeaturedProducts } = await import("./studio-store.server");
      const featured = await listFeaturedProducts();
      if (featured && featured.length > 0) return featured;
    } catch {
      // ignore
    }
    return fallbackProducts.slice(0, 8);
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { getPublicProductBySlug } = await import("./studio-store.server");
      const p = await getPublicProductBySlug(data.slug);
      if (p) return p;
    } catch {
      // ignore
    }
    const found = fallbackProducts.find((item) => item.slug === data.slug);
    return found ?? null;
  });

let cachedReviews: Array<{ id: string; customer_name: string; location: string | null; rating: number; quote: string }> | null = null;
let cachedReviewsTimestamp = 0;
const REVIEWS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const listReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    const now = Date.now();
    if (cachedReviews && now - cachedReviewsTimestamp < REVIEWS_CACHE_TTL_MS) {
      return cachedReviews;
    }
    try {
      const s = getClient();
      const { data, error } = await s
        .from("reviews")
        .select("id, customer_name, location, rating, quote")
        .eq("is_visible", true)
        .order("sort_order");
      if (error || !data || data.length === 0) {
        cachedReviews = fallbackReviews;
        cachedReviewsTimestamp = now;
        return fallbackReviews;
      }
      cachedReviews = data;
      cachedReviewsTimestamp = now;
      return data;
    } catch {
      cachedReviews = fallbackReviews;
      cachedReviewsTimestamp = now;
      return fallbackReviews;
    }
  },
);

export const listRelated = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { listRelatedProducts } = await import("./studio-store.server");
      const related = await listRelatedProducts(data.slug);
      if (related && related.length > 0) return related;
    } catch {
      // ignore
    }
    return fallbackProducts.filter((p) => p.slug !== data.slug).slice(0, 4);
  });

export type ExploreShot = {
  key: string;
  url: string;
  slug: string;
  name: string;
  productId: string;
  base_price_rwf: number | null;
  base_price_usd: number | null;
};

export const listExploreShots = createServerFn({ method: "GET" }).handler(
  async () => {
    let sourceData: any[] = [];
    try {
      const { listPublicProducts } = await import("./studio-store.server");
      const products = await listPublicProducts();
      if (products && products.length > 0) {
        sourceData = products;
      } else {
        sourceData = fallbackProducts as any[];
      }
    } catch {
      sourceData = fallbackProducts as any[];
    }

    const shots: ExploreShot[] = [];
    const seen = new Set<string>();
    for (const p of sourceData) {
      const urls = [
        p.main_image_url,
        p.hover_image_url,
        ...((p.images ?? []) as any[])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i) => i.url),
      ].filter(Boolean) as string[];
      for (const url of urls) {
        if (seen.has(url)) continue;
        seen.add(url);
        shots.push({
          key: `${p.slug}-${shots.length}`,
          url,
          slug: p.slug,
          name: p.name,
          productId: p.id,
          base_price_rwf: p.base_price_rwf,
          base_price_usd: p.base_price_usd,
        });
      }
    }

    // Deterministic scatter so the same rug's photos don't stack together.
    const byProduct = new Map<string, ExploreShot[]>();
    for (const sh of shots) {
      const arr = byProduct.get(sh.slug) ?? [];
      arr.push(sh);
      byProduct.set(sh.slug, arr);
    }
    const buckets = [...byProduct.values()];
    const scattered: ExploreShot[] = [];
    let round = 0;
    while (scattered.length < shots.length) {
      for (let b = 0; b < buckets.length; b++) {
        const list = buckets[(b + round) % buckets.length];
        const item = list[round];
        if (item) scattered.push(item);
      }
      round++;
      if (round > 50) break;
    }
    return scattered;
  },
);
