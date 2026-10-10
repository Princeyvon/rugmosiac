import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Product } from "./catalogue.functions";
import type { ProductInput } from "./admin.server";
import { fallbackCategories, fallbackProducts } from "./fallback-catalogue";
import { validateUploadBuffer } from "./security.server";

export interface ActivityEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type?: string;
  entity_id?: string | null;
  summary: string;
  meta?: unknown;
  created_at: string;
}

export interface StudioCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface StudioStoreData {
  version: number;
  last_published_at: string | null;
  products: any[];
  categories: StudioCategory[];
  promo_coupons: any[];
  activity_log: ActivityEntry[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "studio-store.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

let inMemoryStore: StudioStoreData | null = null;
let inMemoryLoadedAt = 0;

const USD_PER_RWF = 1 / 1460;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Initializes or loads the store from local disk.
 * If disk file doesn't exist yet, seeds from Supabase or fallback data.
 */
export async function getStore(): Promise<StudioStoreData> {
  ensureDirs();

  // Database is the source of truth (server workers are stateless); short in-memory cache only.
  if (inMemoryStore && Date.now() - inMemoryLoadedAt < 10_000) {
    return inMemoryStore;
  }
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cloud } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "studio_catalogue_store")
      .maybeSingle();
    const v = cloud?.value as any;
    if (v && typeof v === "object" && Array.isArray(v.products) && v.products.length > 0) {
      inMemoryStore = v as StudioStoreData;
      inMemoryLoadedAt = Date.now();
      return inMemoryStore;
    }
  } catch {
    // fall through to local cache
  }
  if (inMemoryStore) return inMemoryStore;

  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        inMemoryStore = parsed;
        return parsed;
      }
    } catch (e) {
      console.error("[studio-store] Error reading store from disk, reseeding:", e);
    }
  }

  // Seed store: Try Supabase first, then fallback
  let seededProducts: any[] = [];
  let seededCategories: StudioCategory[] = fallbackCategories;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check if a persisted full studio catalogue was saved in Supabase site_settings
    const { data: cloudStore } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "studio_catalogue_store")
      .maybeSingle();

    if (
      cloudStore?.value &&
      typeof cloudStore.value === "object" &&
      Array.isArray((cloudStore.value as any).products) &&
      (cloudStore.value as any).products.length > 0
    ) {
      inMemoryStore = cloudStore.value as unknown as StudioStoreData;
      // Write to local disk cache for fast offline reads
      const tmpFile = `${STORE_FILE}.${Date.now()}.init.tmp`;
      try {
        fs.writeFileSync(tmpFile, JSON.stringify(inMemoryStore, null, 2), "utf8");
        fs.renameSync(tmpFile, STORE_FILE);
      } catch {}
      return inMemoryStore;
    }

    const [pRes, cRes] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select(
          "*, category:categories(slug, name), sizes:product_sizes(id, label, width_cm, height_cm, price_rwf, price_usd, weight_kg, sort_order), images:product_images(id, url, alt, sort_order, colorway_id)",
        )
        .order("featured_order"),
      supabaseAdmin.from("categories").select("id, slug, name, description, image_url, sort_order").order("sort_order"),
    ]);

    if (!pRes.error && pRes.data && pRes.data.length > 0) {
      seededProducts = pRes.data;
    }
    if (!cRes.error && cRes.data && cRes.data.length > 0) {
      seededCategories = cRes.data;
    }
  } catch {
    // Supabase read failed, fallback to defaults
  }

  if (seededProducts.length === 0) {
    seededProducts = JSON.parse(JSON.stringify(fallbackProducts));
  }

  const initialStore: StudioStoreData = {
    version: 1,
    last_published_at: new Date().toISOString(),
    products: seededProducts,
    categories: seededCategories,
    promo_coupons: [],
    activity_log: [
      {
        id: randomUUID(),
        actor_name: "System",
        actor_role: "system",
        action: "site.init",
        summary: "Studio catalogue initialized",
        created_at: new Date().toISOString(),
      },
    ],
  };

  inMemoryStore = initialStore;
  await persistStore(initialStore);
  return initialStore;
}

/**
 * Atomically writes the store to disk using a temporary file.
 */
export async function persistStore(store: StudioStoreData): Promise<void> {
  ensureDirs();
  inMemoryStore = store;
  inMemoryLoadedAt = Date.now();
  const tmpFile = `${STORE_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), "utf8");
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error("[studio-store] Failed to atomically persist store:", err);
    try {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }

  // Save to the database and wait for it, so changes survive across server instances.
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert(
      { key: "studio_catalogue_store", value: store as never, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
  } catch (err) {
    inMemoryStore = null;
    inMemoryLoadedAt = 0;
    throw new Error("The catalogue could not be saved. Please try again.", { cause: err });
  }
}

// ---------------- Catalogue Accessors ----------------

export async function listAllProducts(): Promise<any[]> {
  const store = await getStore();
  return store.products;
}

export async function listAllCategories(): Promise<StudioCategory[]> {
  const store = await getStore();
  return store.categories;
}

export async function listPublicProducts(categorySlug?: string): Promise<Product[]> {
  const store = await getStore();
  let list = store.products.filter(
    (p) => p.is_published !== false && !p.archived_at,
  );

  if (categorySlug) {
    list = list.filter((p) => {
      const slug = p.category?.slug || store.categories.find((c) => c.id === p.category_id)?.slug;
      return slug === categorySlug;
    });
  }

  // Sort by featured_order, then name
  list.sort((a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99));
  return list;
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  const store = await getStore();
  const found = store.products.find(
    (p) => p.slug === slug && p.is_published !== false && !p.archived_at,
  );
  if (!found) return null;

  // Ensure category is populated
  if (!found.category && found.category_id) {
    const cat = store.categories.find((c) => c.id === found.category_id);
    if (cat) found.category = { slug: cat.slug, name: cat.name };
  }

  return found;
}

export async function listFeaturedProducts(): Promise<Product[]> {
  const store = await getStore();
  return store.products
    .filter((p) => p.is_published !== false && !p.archived_at && p.featured)
    .sort((a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99))
    .slice(0, 8);
}

export async function listRelatedProducts(currentSlug: string): Promise<Product[]> {
  const store = await getStore();
  const current = store.products.find((p) => p.slug === currentSlug);
  return store.products
    .filter(
      (p) =>
        p.is_published !== false &&
        !p.archived_at &&
        p.slug !== currentSlug &&
        (!current || !current.category_id || p.category_id === current.category_id),
    )
    .slice(0, 4);
}

// ---------------- Product Mutations ----------------

export async function saveProductToStore(
  data: ProductInput,
  actor = { name: "Studio Staff", role: "staff" },
): Promise<{ id: string; slug: string }> {
  const store = await getStore();
  const slug = generateSlug(data.slug || data.name);
  let productId = data.id;

  const category = store.categories.find((c) => c.id === data.category_id);

  // Normalize sizes
  const sizes = (data.sizes || []).map((s, i) => ({
    id: s.id || randomUUID(),
    label: s.label,
    width_cm: s.width_cm,
    height_cm: s.height_cm,
    price_rwf: s.price_rwf,
    price_usd: s.price_rwf ? Math.round(s.price_rwf * USD_PER_RWF * 100) / 100 : null,
    weight_kg: s.weight_kg ?? null,
    sort_order: s.sort_order ?? i,
  }));

  // Normalize images
  const images = (data.images || []).map((img, i) => ({
    id: (img as any).id || randomUUID(),
    url: img.url,
    alt: img.alt || null,
    sort_order: i,
    colorway_id: img.colorway_id || null,
  }));

  const base_price_rwf = data.base_price_rwf ?? (sizes[0]?.price_rwf ?? null);
  const base_price_usd = base_price_rwf ? Math.round(base_price_rwf * USD_PER_RWF * 100) / 100 : null;

  const productData: any = {
    ...data,
    id: productId || randomUUID(),
    slug,
    name: data.name.trim(),
    category_id: data.category_id || null,
    category: category ? { slug: category.slug, name: category.name } : null,
    shape: data.shape || "rectangle",
    short_description: data.short_description || null,
    description: data.description || null,
    care_instructions: data.care_instructions || null,
    design_style: data.design_style || null,
    material: data.material || null,
    production_time: data.production_time || null,
    stock_status: data.stock_status || "made_to_order",
    fulfilment_type: data.fulfilment_type || "made_to_order",
    stock_qty: data.stock_qty ?? 0,
    low_stock_threshold: data.low_stock_threshold ?? 2,
    weight_kg: data.weight_kg ?? sizes[0]?.weight_kg ?? null,
    featured: Boolean(data.featured),
    featured_order: data.featured_order ?? 99,
    is_published: data.is_published !== false,
    main_image_url: data.main_image_url || images[0]?.url || null,
    hover_image_url: data.hover_image_url || images[1]?.url || images[0]?.url || null,
    color_palette: data.color_palette || [],
    colorways: data.colorways || [],
    tags: data.tags || [],
    base_price_rwf,
    base_price_usd,
    cost_rwf: data.cost_rwf ?? null,
    sku: data.sku || null,
    size_guide_svg: data.size_guide_svg || null,
    sizes,
    images,
    notes: data.notes || null,
    archived_at: data.archived_at || null,
    updated_at: new Date().toISOString(),
  };

  if (!productId) {
    productData.created_at = new Date().toISOString();
    productId = productData.id;
    store.products.unshift(productData);
    logActivityToStore(store, {
      actor_name: actor.name,
      actor_role: actor.role,
      action: "product.create",
      entity_type: "product",
      entity_id: productId,
      summary: `${actor.name} created artisanal piece "${productData.name}"`,
    });
  } else {
    const idx = store.products.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      productData.created_at = store.products[idx].created_at || new Date().toISOString();
      store.products[idx] = productData;
    } else {
      productData.created_at = new Date().toISOString();
      store.products.unshift(productData);
    }
    logActivityToStore(store, {
      actor_name: actor.name,
      actor_role: actor.role,
      action: "product.update",
      entity_type: "product",
      entity_id: productId,
      summary: `${actor.name} updated piece "${productData.name}"`,
    });
  }

  await persistStore(store);

  // Background sync to Supabase if available (fire-and-forget, ignore RLS errors)
  await syncProductToSupabaseAsync(productData).catch(() => {});

  return { id: productId as string, slug };
}

export async function quickUpdateStoreProduct(
  patch: {
    id: string;
    is_published?: boolean;
    featured?: boolean;
    stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
    newArrival?: boolean;
    base_price_rwf?: number | null;
    cost_rwf?: number | null;
    stock_qty?: number;
    sku?: string | null;
    archived_at?: string | null;
  },
  actor = { name: "Studio Staff", role: "staff" },
): Promise<any> {
  const store = await getStore();
  const idx = store.products.findIndex((p) => p.id === patch.id);
  if (idx === -1) throw new Error("Product not found");

  const product = { ...store.products[idx] };
  if (patch.is_published !== undefined) product.is_published = patch.is_published;
  if (patch.featured !== undefined) product.featured = patch.featured;
  if (patch.stock_status !== undefined) product.stock_status = patch.stock_status;
  if (patch.base_price_rwf !== undefined) {
    product.base_price_rwf = patch.base_price_rwf;
    product.base_price_usd = patch.base_price_rwf
      ? Math.round(patch.base_price_rwf * USD_PER_RWF * 100) / 100
      : null;
  }
  if (patch.cost_rwf !== undefined) product.cost_rwf = patch.cost_rwf;
  if (patch.stock_qty !== undefined) product.stock_qty = patch.stock_qty;
  if (patch.sku !== undefined) product.sku = patch.sku;
  if (patch.archived_at !== undefined) product.archived_at = patch.archived_at;
  if (patch.newArrival !== undefined) {
    const currentTags = Array.isArray(product.tags) ? product.tags : [];
    const withoutNew = currentTags.filter((t: string) => t !== "new");
    product.tags = patch.newArrival ? [...withoutNew, "new"] : withoutNew;
  }
  product.updated_at = new Date().toISOString();

  store.products[idx] = product;

  logActivityToStore(store, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "product.quick_update",
    entity_type: "product",
    entity_id: patch.id,
    summary: `${actor.name} updated ${product.name} (${
      patch.is_published !== undefined ? (patch.is_published ? "Published" : "Draft") : "Settings"
    })`,
  });

  await persistStore(store);
  syncProductToSupabaseAsync(product).catch(() => {});
  return product;
}

export async function deleteStoreProduct(
  id: string,
  actor = { name: "Studio Staff", role: "staff" },
): Promise<{ ok: true }> {
  const store = await getStore();
  const target = store.products.find((p) => p.id === id);
  store.products = store.products.filter((p) => p.id !== id);

  logActivityToStore(store, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "product.delete",
    entity_type: "product",
    entity_id: id,
    summary: `${actor.name} deleted piece "${target?.name || id}"`,
  });

  await persistStore(store);

  // Background Supabase cleanup
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => {
      supabaseAdmin.from("product_images").delete().eq("product_id", id).then(undefined, () => {});
      supabaseAdmin.from("product_sizes").delete().eq("product_id", id).then(undefined, () => {});
      supabaseAdmin.from("products").delete().eq("id", id).then(undefined, () => {});
    })
    .catch(() => {});

  return { ok: true };
}

export async function duplicateStoreProduct(
  id: string,
  actor = { name: "Studio Staff", role: "staff" },
): Promise<{ id: string; slug: string }> {
  const store = await getStore();
  const source = store.products.find((p) => p.id === id);
  if (!source) throw new Error("Piece to duplicate not found.");

  const newId = randomUUID();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const newName = `${source.name} (Copy)`;
  const newSlug = `${source.slug}-copy-${randomSuffix}`;
  const newSku = source.sku ? `${source.sku}-CPY` : `MOS-${randomSuffix.toUpperCase()}`;

  const cloned = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    name: newName,
    slug: newSlug,
    sku: newSku,
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.products.unshift(cloned);

  logActivityToStore(store, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "product.duplicate",
    entity_type: "product",
    entity_id: newId,
    summary: `${actor.name} duplicated "${source.name}" as "${newName}"`,
  });

  await persistStore(store);
  return { id: newId, slug: newSlug };
}

export async function bulkUpdateStoreProducts(
  patch: {
    ids: string[];
    price_percent?: number;
    category_id?: string | null;
    stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
    is_published?: boolean;
    archived_at?: string | null;
  },
  actor = { name: "Studio Staff", role: "staff" },
): Promise<{ count: number }> {
  const store = await getStore();
  let count = 0;

  for (let i = 0; i < store.products.length; i++) {
    const p = store.products[i];
    if (!patch.ids.includes(p.id)) continue;

    if (patch.is_published !== undefined) p.is_published = patch.is_published;
    if (patch.stock_status !== undefined) p.stock_status = patch.stock_status;
    if (patch.archived_at !== undefined) p.archived_at = patch.archived_at;
    if (patch.category_id !== undefined) {
      p.category_id = patch.category_id;
      const cat = store.categories.find((c) => c.id === patch.category_id);
      p.category = cat ? { slug: cat.slug, name: cat.name } : null;
    }
    if (patch.price_percent && p.base_price_rwf) {
      p.base_price_rwf = Math.round(p.base_price_rwf * (1 + patch.price_percent / 100));
      p.base_price_usd = Math.round(p.base_price_rwf * USD_PER_RWF * 100) / 100;
    }
    p.updated_at = new Date().toISOString();
    count++;
  }

  logActivityToStore(store, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "product.bulk_update",
    summary: `${actor.name} updated ${count} piece(s) in bulk`,
  });

  await persistStore(store);
  return { count };
}

// ---------------- Publish & Pending Changes ----------------

export async function publishStore(
  actor = { name: "Studio Staff", role: "staff" },
): Promise<{ at: string }> {
  const store = await getStore();
  const at = new Date().toISOString();
  store.last_published_at = at;

  logActivityToStore(store, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "site.publish",
    entity_type: "site",
    summary: `${actor.name} published the latest changes to the live website`,
  });

  await persistStore(store);

  // Background attempt to update Supabase site_settings
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => {
      supabaseAdmin
        .from("site_settings")
        .upsert({ key: "last_published_at", value: at } as never, { onConflict: "key" })
        .then(undefined, () => {});
    })
    .catch(() => {});

  return { at };
}

export async function getStorePendingChanges(): Promise<{
  lastPublishedAt: string | null;
  count: number;
  changes: ActivityEntry[];
}> {
  const store = await getStore();
  const lastPublishedAt = store.last_published_at;

  const rows = store.activity_log.filter((r) => {
    if (String(r.action ?? "").startsWith("auth.") || r.action === "site.publish" || r.action === "site.init") {
      return false;
    }
    if (!lastPublishedAt) return true;
    return r.created_at > lastPublishedAt;
  });

  return {
    lastPublishedAt,
    count: rows.length,
    changes: rows.slice(0, 8),
  };
}

// ---------------- Image Uploading ----------------

export async function saveUploadedImageFile(
  filename: string,
  buffer: Uint8Array,
): Promise<string> {
  const validated = validateUploadBuffer(buffer as Buffer, ["image", "pdf"], { filename });
  const { storeUpload } = await import("@/lib/media-storage.server");
  const name = await storeUpload(
    validated.sanitizedFilename,
    buffer,
    validated.mimeType || "image/jpeg",
  );
  return `/api/public/img/${name}`;
}

export async function saveUploadedPdfFile(
  filename: string,
  buffer: Uint8Array,
): Promise<string> {
  const validated = validateUploadBuffer(buffer as Buffer, ["pdf"], { filename });
  const { storeUpload } = await import("@/lib/media-storage.server");
  const name = await storeUpload(validated.sanitizedFilename, buffer, "application/pdf", "lookbook-");
  return `/api/public/img/${name}`;
}

// ---------------- Helpers ----------------

function logActivityToStore(
  store: StudioStoreData,
  entry: Omit<ActivityEntry, "id" | "created_at">,
) {
  const item: ActivityEntry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...entry,
  };
  store.activity_log.unshift(item);
  if (store.activity_log.length > 200) {
    store.activity_log = store.activity_log.slice(0, 200);
  }
}

async function syncProductToSupabaseAsync(product: any) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      slug: product.slug,
      name: product.name,
      category_id: product.category_id,
      shape: product.shape,
      short_description: product.short_description,
      description: product.description,
      stock_status: product.stock_status,
      production_time: product.production_time,
      material: product.material,
      featured: product.featured,
      featured_order: product.featured_order,
      is_published: product.is_published,
      main_image_url: product.main_image_url,
      hover_image_url: product.hover_image_url,
      color_palette: product.color_palette,
      tags: product.tags,
      base_price_rwf: product.base_price_rwf,
      base_price_usd: product.base_price_usd,
      sku: product.sku,
      cost_rwf: product.cost_rwf,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      care_instructions: product.care_instructions,
      design_style: product.design_style,
      weight_kg: product.weight_kg,
      fulfilment_type: product.fulfilment_type,
      stock_qty: product.stock_qty,
      low_stock_threshold: product.low_stock_threshold,
      notes: product.notes,
      archived_at: product.archived_at,
    };
    await supabaseAdmin.from("products").upsert({ id: product.id, ...row } as never);
  } catch {
    // Ignore Supabase RLS failure
  }
}
