import { createServerFn } from "@tanstack/react-start";
import type { ProductInput } from "@/lib/admin.server";

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession } = await import("@/lib/admin.server");
  const session = await getAdminSession();
  return { signedIn: Boolean(session.data.admin) };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const { getAdminSession, passwordMatches } = await import("@/lib/admin.server");
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("Dashboard password is not configured yet.");
    if (!passwordMatches(data.password, expected)) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("@/lib/admin.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminLoadCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "*, sizes:product_sizes(id, label, width_cm, height_cm, price_rwf, price_usd, weight_kg, sort_order), images:product_images(id, url, alt, sort_order)",
      )
      .order("featured_order"),
    supabaseAdmin.from("categories").select("id, slug, name").order("sort_order"),
  ]);
  return { products: products ?? [], categories: categories ?? [] };
});

export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string; dataUrl: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, slugify } = await import("@/lib/admin.server");
    await requireAdmin();
    const match = /^data:([^;]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("That file could not be read. Try a JPG, PNG or WebP.");
    const contentType = match[1];
    if (!contentType.startsWith("image/")) throw new Error("Only image files can be uploaded.");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.byteLength > 8_000_000) throw new Error("Image is larger than 8MB. Please compress it first.");
    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${Date.now()}-${slugify(data.filename.replace(/\.[^.]+$/, "")) || "image"}.${ext || "jpg"}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/img/${path}` };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: ProductInput) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, slugify, USD_PER_RWF } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.name.trim()) throw new Error("The rug needs a name.");
    const slug = slugify(data.slug || data.name);
    const row = {
      slug,
      name: data.name.trim(),
      category_id: data.category_id,
      shape: data.shape,
      short_description: data.short_description,
      description: data.description,
      stock_status: data.stock_status,
      production_time: data.production_time,
      material: data.material,
      featured: data.featured,
      featured_order: data.featured_order,
      is_published: data.is_published,
      main_image_url: data.main_image_url,
      hover_image_url: data.hover_image_url,
      color_palette: data.color_palette,
      tags: data.tags,
      base_price_rwf: data.base_price_rwf,
      base_price_usd: data.base_price_rwf ? Math.round(data.base_price_rwf * USD_PER_RWF * 100) / 100 : null,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await supabaseAdmin.from("products").update(row).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.from("products").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      productId = created.id as string;
    }

    await supabaseAdmin.from("product_sizes").delete().eq("product_id", productId);
    if (data.sizes.length > 0) {
      const { error } = await supabaseAdmin.from("product_sizes").insert(
        data.sizes.map((s, i) => ({
          product_id: productId,
          label: s.label,
          width_cm: s.width_cm,
          height_cm: s.height_cm,
          price_rwf: s.price_rwf,
          price_usd: s.price_rwf ? Math.round(s.price_rwf * USD_PER_RWF * 100) / 100 : null,
          weight_kg: s.weight_kg,
          sort_order: s.sort_order ?? i,
        })),
      );
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("product_images").delete().eq("product_id", productId);
    if (data.images.length > 0) {
      const { error } = await supabaseAdmin.from("product_images").insert(
        data.images.map((img, i) => ({ product_id: productId, url: img.url, alt: img.alt, sort_order: i })),
      );
      if (error) throw new Error(error.message);
    }

    return { id: productId, slug };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("product_images").delete().eq("product_id", data.id);
    await supabaseAdmin.from("product_sizes").delete().eq("product_id", data.id);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
