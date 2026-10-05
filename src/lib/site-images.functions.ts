import { createServerFn } from "@tanstack/react-start";
import fs from "fs";
import path from "path";
import {
  DEFAULT_FEATURED_SLOTS,
  type FeaturedImageSlot,
  type SiteImagesConfig,
  type StudioLibraryItem,
} from "./site-images";

const CONFIG_DISK_PATH = path.resolve(process.cwd(), "public/site-featured-images.json");

// In-memory cache for fast SSR and hot reload consistency
let cachedConfig: SiteImagesConfig = {
  overrides: {},
  meta: {},
};

function readDiskConfig(): SiteImagesConfig | null {
  try {
    if (fs.existsSync(CONFIG_DISK_PATH)) {
      const raw = fs.readFileSync(CONFIG_DISK_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Ignore fallback
  }
  return null;
}

function writeDiskConfig(cfg: SiteImagesConfig) {
  try {
    const dir = path.dirname(CONFIG_DISK_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_DISK_PATH, JSON.stringify(cfg, null, 2), "utf-8");
  } catch {
    // Ignore fallback
  }
}

/**
 * Public & Admin Server Function: Load all featured image slots with active overrides.
 */
export const getSiteImagesData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    slots: FeaturedImageSlot[];
    overrides: Record<string, string>;
  }> => {
    // 1. Try Supabase site_settings
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "site_featured_images")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as any;
        cachedConfig = {
          overrides: val.overrides || {},
          meta: val.meta || {},
        };
        writeDiskConfig(cachedConfig);
      } else {
        const disk = readDiskConfig();
        if (disk) cachedConfig = disk;
      }
    } catch {
      const disk = readDiskConfig();
      if (disk) cachedConfig = disk;
    }

    // Merge default slots with current overrides
    const slots = DEFAULT_FEATURED_SLOTS.map((slot) => {
      const customUrl = cachedConfig.overrides[slot.id] || null;
      const meta = cachedConfig.meta?.[slot.id];
      return {
        ...slot,
        customUrl,
        updatedAt: meta?.updatedAt || null,
        updatedBy: meta?.updatedBy || null,
      };
    });

    return {
      slots,
      overrides: cachedConfig.overrides,
    };
  }
);

/**
 * Admin Server Function: Replace a featured image for a given slot.
 */
export const saveSiteImageSlot = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { slotId: string; customUrl: string | null; updatedBy?: string }) => d
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    const actor = await requireAdmin();

    const { slotId, customUrl } = data;
    const actorName = data.updatedBy || actor.name || "Studio Admin";

    // 1. Update in-memory state
    if (!cachedConfig.overrides) cachedConfig.overrides = {};
    if (!cachedConfig.meta) cachedConfig.meta = {};

    if (customUrl) {
      cachedConfig.overrides[slotId] = customUrl;
      cachedConfig.meta[slotId] = {
        updatedAt: new Date().toISOString(),
        updatedBy: actorName,
      };
    } else {
      delete cachedConfig.overrides[slotId];
      delete cachedConfig.meta[slotId];
    }

    // 2. Persist to disk
    writeDiskConfig(cachedConfig);

    // 3. Persist to Supabase site_settings
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_settings").upsert(
        {
          key: "site_featured_images",
          value: cachedConfig as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch (err) {
      console.warn("[saveSiteImageSlot] Supabase save warning:", err);
    }

    // 4. Log admin activity
    try {
      const { logActivity } = await import("@/lib/admin.server");
      const targetSlot = DEFAULT_FEATURED_SLOTS.find((s) => s.id === slotId);
      await logActivity(
        "content",
        customUrl
          ? `Updated featured image for "${targetSlot?.title || slotId}"`
          : `Reset featured image to default for "${targetSlot?.title || slotId}"`,
        actorName
      );
    } catch {
      // Ignore
    }

    return {
      ok: true,
      overrides: cachedConfig.overrides,
    };
  });

/**
 * Admin Server Function: Reset all featured image slots to studio defaults.
 */
export const resetAllSiteImages = createServerFn({ method: "POST" }).handler(
  async () => {
    const { requireAdmin, logActivity } = await import("@/lib/admin.server");
    const actor = await requireAdmin();

    cachedConfig = {
      overrides: {},
      meta: {},
    };

    writeDiskConfig(cachedConfig);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_settings").upsert(
        {
          key: "site_featured_images",
          value: cachedConfig as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch {
      // Ignore
    }

    try {
      await logActivity(
        "content",
        "Reset all website featured images to studio defaults",
        actor.name || "Studio Admin"
      );
    } catch {
      // Ignore
    }

    return { ok: true, overrides: {} };
  }
);

/**
 * Public & Admin Server Function: Retrieve all studio library images,
 * including product photography, studio archival assets, editorial assets, and uploaded media.
 */
export const getStudioLibraryImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<StudioLibraryItem[]> => {
    const items: StudioLibraryItem[] = [];
    const seenUrls = new Set<string>();

    const add = (item: StudioLibraryItem) => {
      if (!item.url || seenUrls.has(item.url)) return;
      seenUrls.add(item.url);
      items.push(item);
    };

    // 1. Gather all product images from catalogue
    try {
      let products: any[] = [];
      try {
        const { listAllProducts } = await import("@/lib/studio-store.server");
        products = (await listAllProducts()) || [];
      } catch {
        // Fallback
      }
      if (!products || products.length === 0) {
        const { fallbackProducts } = await import("@/lib/fallback-catalogue");
        products = fallbackProducts;
      }

      for (const p of products) {
        if (p.main_image_url) {
          add({
            id: `prod_${p.id || p.slug}_main`,
            url: p.main_image_url,
            title: `${p.name} · Primary Cover`,
            category: "product",
            categoryLabel: "Product Photography",
            productName: p.name,
            productSlug: p.slug,
            sku: p.sku,
            role: "Main Cover",
            source: "Catalogue Store",
          });
        }
        if (p.hover_image_url) {
          add({
            id: `prod_${p.id || p.slug}_hover`,
            url: p.hover_image_url,
            title: `${p.name} · Lifestyle Perspective`,
            category: "product",
            categoryLabel: "Product Photography",
            productName: p.name,
            productSlug: p.slug,
            sku: p.sku,
            role: "Hover Perspective",
            source: "Catalogue Store",
          });
        }
        if (Array.isArray(p.images)) {
          p.images.forEach((img: any, idx: number) => {
            if (img.url) {
              add({
                id: `prod_${p.id || p.slug}_gal_${idx}`,
                url: img.url,
                title: `${p.name} · Detail Angle ${idx + 1}`,
                category: "product",
                categoryLabel: "Product Photography",
                productName: p.name,
                productSlug: p.slug,
                sku: p.sku,
                role: img.is_primary ? "Primary Detail" : "Gallery Shot",
                source: "Catalogue Store",
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("[getStudioLibraryImages] Product load error:", err);
    }

    // 2. Scan public/__l5e/assets-v1 for all archival studio photography
    try {
      const l5eDir = path.resolve(process.cwd(), "public/__l5e/assets-v1");
      if (fs.existsSync(l5eDir)) {
        const subdirs = fs.readdirSync(l5eDir);
        for (const sub of subdirs) {
          const subPath = path.join(l5eDir, sub);
          if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            for (const file of files) {
              if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                const url = `/__l5e/assets-v1/${sub}/${file}`;
                const baseName = path.parse(file).name.replace(/[-_]/g, " ");
                const cleanTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);
                add({
                  id: `archival_${sub}_${file}`,
                  url,
                  title: `Studio Archival · ${cleanTitle}`,
                  category: "archival",
                  categoryLabel: "Studio Archival Assets",
                  role: "Studio Photography",
                  source: "Studio Local Asset Archive",
                });
              }
            }
          }
        }
      }
    } catch {
      // Ignore
    }

    // 3. Scan public/assets for editorial and category assets
    try {
      const assetsDir = path.resolve(process.cwd(), "public/assets");
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
            const url = `/assets/${file}`;
            const baseName = path.parse(file).name.replace(/[-_]/g, " ");
            const cleanTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            add({
              id: `asset_${file}`,
              url,
              title: `Editorial Asset · ${cleanTitle}`,
              category: "editorial",
              categoryLabel: "Editorial & Styling",
              role: "Editorial Visual",
              source: "Public Assets",
            });
          }
        }
      }
    } catch {
      // Ignore
    }

    return items;
  }
);
