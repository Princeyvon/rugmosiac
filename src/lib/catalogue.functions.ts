import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
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
  tags: string[];
  category?: { slug: string; name: string } | null;
  sizes?: Array<{ id: string; label: string; price_rwf: number | null; price_usd: number | null }>;
  images?: Array<{ id: string; url: string; alt: string | null }>;
};

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const s = getClient();
  const { data, error } = await s
    .from("categories")
    .select("id, slug, name, description, image_url, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { categorySlug?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const s = getClient();
    let q = s
      .from("products")
      .select("id, slug, name, short_description, main_image_url, hover_image_url, color_palette, base_price_rwf, base_price_usd, stock_status, shape, tags, category:categories(slug, name)")
      .eq("is_published", true)
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data.categorySlug) {
      const { data: cat } = await s.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Product[];
  });

export const listFeatured = createServerFn({ method: "GET" }).handler(async () => {
  const s = getClient();
  const { data, error } = await s
    .from("products")
    .select("id, slug, name, short_description, main_image_url, hover_image_url, color_palette, base_price_rwf, base_price_usd, stock_status, tags, category:categories(slug, name)")
    .eq("is_published", true)
    .eq("featured", true)
    .order("featured_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Product[];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const s = getClient();
    const { data: p, error } = await s
      .from("products")
      .select("*, category:categories(slug, name), sizes:product_sizes(id, label, width_cm, height_cm, price_rwf, price_usd, sort_order), images:product_images(id, url, alt, sort_order)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return p as unknown as Product | null;
  });

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  const s = getClient();
  const { data, error } = await s
    .from("reviews")
    .select("id, customer_name, location, rating, quote")
    .eq("is_visible", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listRelated = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const s = getClient();
    const { data: current } = await s.from("products").select("id, category_id").eq("slug", data.slug).maybeSingle();
    if (!current) return [] as Product[];
    let q = s
      .from("products")
      .select("id, slug, name, short_description, main_image_url, hover_image_url, color_palette, base_price_rwf, base_price_usd, stock_status, tags, category:categories(slug, name)")
      .eq("is_published", true)
      .neq("id", current.id)
      .limit(4);
    if (current.category_id) q = q.eq("category_id", current.category_id);
    const { data: rows } = await q;
    if (rows && rows.length > 0) return rows as unknown as Product[];
    // Fallback: any other 4 rugs
    const { data: fallback } = await s
      .from("products")
      .select("id, slug, name, short_description, main_image_url, hover_image_url, color_palette, base_price_rwf, base_price_usd, stock_status, tags, category:categories(slug, name)")
      .eq("is_published", true)
      .neq("id", current.id)
      .limit(4);
    return (fallback ?? []) as unknown as Product[];
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

export const listExploreShots = createServerFn({ method: "GET" }).handler(async () => {
  const s = getClient();
  const { data, error } = await s
    .from("products")
    .select("id, slug, name, main_image_url, hover_image_url, base_price_rwf, base_price_usd, images:product_images(url, sort_order)")
    .eq("is_published", true);
  if (error) throw new Error(error.message);

  const shots: ExploreShot[] = [];
  const seen = new Set<string>();
  for (const p of (data ?? []) as any[]) {
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
});
