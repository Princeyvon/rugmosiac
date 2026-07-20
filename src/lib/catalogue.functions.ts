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
      .select("id, slug, name, short_description, main_image_url, base_price_rwf, base_price_usd, stock_status, shape, tags, category:categories(slug, name)")
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
    .select("id, slug, name, short_description, main_image_url, base_price_rwf, base_price_usd, stock_status, tags, category:categories(slug, name)")
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
