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
    const d = data as Partial<ProductInput> & typeof data;
    const row: Record<string, unknown> = {
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
      sku: d.sku ?? null,
      cost_rwf: d.cost_rwf ?? null,
      seo_title: d.seo_title ?? null,
      seo_description: d.seo_description ?? null,
      care_instructions: d.care_instructions ?? null,
      design_style: d.design_style ?? null,
      weight_kg: d.weight_kg ?? null,
      fulfilment_type: d.fulfilment_type ?? "made_to_order",
      stock_qty: d.stock_qty ?? 0,
      low_stock_threshold: d.low_stock_threshold ?? 2,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await supabaseAdmin.from("products").update(row as never).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.from("products").insert(row as never).select("id").single();
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

// ---------------- quick catalogue toggles ----------------

export const adminQuickUpdate = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      is_published?: boolean;
      featured?: boolean;
      stock_status?: "in_stock" | "made_to_order" | "out_of_stock";
      newArrival?: boolean;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.is_published !== undefined) patch.is_published = data.is_published;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.stock_status !== undefined) patch.stock_status = data.stock_status;
    if (data.newArrival !== undefined) {
      const { data: row } = await supabaseAdmin.from("products").select("tags").eq("id", data.id).maybeSingle();
      const tags: string[] = ((row?.tags as string[] | null) ?? []).filter((t) => t !== "new");
      patch.tags = data.newArrival ? [...tags, "new"] : tags;
    }
    const { error } = await supabaseAdmin.from("products").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------------- promotions / coupons ----------------

export type CouponInput = {
  id?: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "amount";
  discount_percent: number;
  discount_amount_rwf: number | null;
  min_order_rwf: number | null;
  usage_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export const adminListCoupons = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("promo_coupons").select("*").order("created_at", { ascending: false });
  return data ?? [];
});

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: CouponInput) => d)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    if (!code) throw new Error("The coupon needs a code.");
    const row = {
      code,
      description: data.description,
      discount_type: data.discount_type,
      discount_percent: data.discount_type === "percent" ? data.discount_percent : 0,
      discount_amount_rwf: data.discount_type === "amount" ? data.discount_amount_rwf : null,
      min_order_rwf: data.min_order_rwf,
      usage_limit: data.usage_limit,
      starts_at: data.starts_at,
      expires_at: data.expires_at,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("promo_coupons").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin.from("promo_coupons").insert(row as never).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------------- orders ----------------

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(id, product_name, size_label, color, qty, unit_price_rwf)")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
});

const STOCK_COMMITTING = ["confirmed", "processing", "in_production", "ready", "shipped", "delivered"];
const STOCK_RELEASING = ["cancelled", "refunded"];

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status?: string; payment_status?: string; internal_notes?: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, logActivity, applyStockChange } = await import("@/lib/admin.server");
    const actor = await requireAdmin("orders");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, inventory_applied, items:order_items(product_id, variant_id, qty, product_name)")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("That order no longer exists.");

    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.payment_status) patch.payment_status = data.payment_status;
    if (data.internal_notes !== undefined) patch.internal_notes = data.internal_notes;

    const nextStatus = data.status ?? before.status;
    const applied = Boolean(before.inventory_applied);
    const items = (before.items ?? []) as Array<{
      product_id: string | null;
      variant_id: string | null;
      qty: number;
      product_name: string;
    }>;

    let stockNote: string | null = null;
    if (!applied && STOCK_COMMITTING.includes(nextStatus)) {
      for (const item of items) {
        if (!item.product_id && !item.variant_id) continue;
        await applyStockChange(supabaseAdmin as never, actor, {
          productId: item.product_id,
          variantId: item.variant_id,
          delta: -Math.abs(item.qty),
          reason: "sale",
          orderId: data.id,
          note: `Order ${before.order_number}`,
        });
      }
      patch.inventory_applied = true;
      stockNote = "stock taken out";
    } else if (applied && STOCK_RELEASING.includes(nextStatus)) {
      for (const item of items) {
        if (!item.product_id && !item.variant_id) continue;
        await applyStockChange(supabaseAdmin as never, actor, {
          productId: item.product_id,
          variantId: item.variant_id,
          delta: Math.abs(item.qty),
          reason: nextStatus === "refunded" ? "return" : "cancellation",
          orderId: data.id,
          note: `Order ${before.order_number}`,
        });
      }
      patch.inventory_applied = false;
      stockNote = "stock put back";
    }

    const { error } = await supabaseAdmin.from("orders").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("order_events").insert({
      order_id: data.id,
      event_type: "update",
      message: `${data.status ? `Status set to ${data.status}. ` : ""}${data.payment_status ? `Payment marked ${data.payment_status}. ` : ""}${stockNote ?? ""}`.trim() ||
        "Order updated",
      actor_name: actor.name,
      meta: {},
    } as never);

    await logActivity(supabaseAdmin as never, actor, {
      action: "order.update",
      entity_type: "order",
      entity_id: data.id,
      summary: `Updated order ${before.order_number}${data.status ? ` → ${data.status}` : ""}${stockNote ? ` (${stockNote})` : ""}`,
      meta: patch,
    });

    return { ok: true as const, stockNote };
  });

// ---------------- team / PIN access ----------------

export type StaffRow = {
  id: string;
  email: string;
  full_name: string;
  job_title: string | null;
  role: string;
  is_active: boolean;
  permissions: Record<string, boolean>;
  last_login_at: string | null;
  created_at: string;
  has_pin: boolean;
};

export const staffLoginPin = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    const { getAdminSession, verifyPassword, normalisePin, effectivePerms, logActivity } = await import(
      "@/lib/admin.server"
    );
    const pin = normalisePin(data.pin);
    if (pin.length !== 6) return { ok: false as const, message: "Enter your six digit PIN." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("staff_accounts")
      .select("id, email, full_name, role, permissions, pin_hash, is_active")
      .eq("is_active", true);

    for (const row of rows ?? []) {
      const hash = (row as { pin_hash: string | null }).pin_hash;
      if (!hash) continue;
      if (!(await verifyPassword(pin, hash))) continue;

      const role = row.role as "owner" | "admin" | "manager" | "sales" | "production" | "staff";
      const perms = effectivePerms(role, (row.permissions ?? {}) as Record<string, boolean>);
      const session = await getAdminSession();
      await session.update({
        admin: true,
        staffId: row.id,
        role,
        name: row.full_name,
        email: row.email,
        perms,
      });
      await supabaseAdmin
        .from("staff_accounts")
        .update({ last_login_at: new Date().toISOString() } as never)
        .eq("id", row.id);
      await logActivity(
        supabaseAdmin as never,
        { id: row.id, name: row.full_name, role, email: row.email, perms },
        { action: "auth.signin", entity_type: "staff", entity_id: row.id, summary: `${row.full_name} signed in` },
      );
      return { ok: true as const };
    }
    return { ok: false as const, message: "That PIN is not recognised." };
  });

export const staffMe = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession, effectivePerms, roleDefaults } = await import("@/lib/admin.server");
  const session = await getAdminSession();
  const d = session.data;
  if (!d.admin && !d.staffId) return { signedIn: false as const };
  const role = (d.role ?? "owner") as "owner" | "admin" | "manager" | "sales" | "production" | "staff";
  return {
    signedIn: true as const,
    staffId: d.staffId ?? null,
    name: d.name ?? "Owner",
    email: d.email ?? null,
    role,
    perms: d.staffId ? effectivePerms(role, d.perms) : roleDefaults("owner"),
  };
});

export const staffChangePin = createServerFn({ method: "POST" })
  .inputValidator((d: { currentPin: string; newPin: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, verifyPassword, hashPassword, normalisePin, logActivity } = await import(
      "@/lib/admin.server"
    );
    const actor = await requireAdmin();
    if (!actor.id) throw new Error("Only team members with a PIN can change it here.");
    const current = normalisePin(data.currentPin);
    const next = normalisePin(data.newPin);
    if (next.length !== 6) throw new Error("Your new PIN must be six digits.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("staff_accounts")
      .select("id, pin_hash, is_active")
      .eq("is_active", true);

    const me = (rows ?? []).find((r) => r.id === actor.id) as { id: string; pin_hash: string | null } | undefined;
    if (!me?.pin_hash || !(await verifyPassword(current, me.pin_hash))) {
      throw new Error("Your current PIN is not right.");
    }
    for (const row of rows ?? []) {
      const hash = (row as { pin_hash: string | null }).pin_hash;
      if (!hash || row.id === actor.id) continue;
      if (await verifyPassword(next, hash)) {
        throw new Error("Someone else already uses that PIN. Please choose another one.");
      }
    }
    const { error } = await supabaseAdmin
      .from("staff_accounts")
      .update({ pin_hash: await hashPassword(next) } as never)
      .eq("id", actor.id);
    if (error) throw new Error(error.message);
    await logActivity(supabaseAdmin as never, actor, {
      action: "staff.pin_changed",
      entity_type: "staff",
      entity_id: actor.id,
      summary: `${actor.name} changed their own PIN`,
    });
    return { ok: true as const };
  });

export const adminListStaff = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin, effectivePerms } = await import("@/lib/admin.server");
  await requireAdmin("staff");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("staff_accounts")
    .select("id, email, full_name, job_title, role, is_active, permissions, pin_hash, last_login_at, created_at")
    .order("created_at");
  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    full_name: r.full_name,
    job_title: (r as { job_title: string | null }).job_title,
    role: r.role,
    is_active: r.is_active,
    permissions: effectivePerms(r.role as never, (r.permissions ?? {}) as Record<string, boolean>),
    last_login_at: r.last_login_at,
    created_at: r.created_at,
    has_pin: Boolean((r as { pin_hash: string | null }).pin_hash),
  })) as StaffRow[];
});

export type StaffInput = {
  id?: string;
  email: string;
  full_name: string;
  job_title: string | null;
  role: "owner" | "admin" | "manager" | "sales" | "production" | "staff";
  is_active: boolean;
  permissions: Record<string, boolean>;
  pin?: string | null;
};

export const adminSaveStaff = createServerFn({ method: "POST" })
  .inputValidator((d: StaffInput) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, hashPassword, verifyPassword, normalisePin, logActivity } = await import(
      "@/lib/admin.server"
    );
    const actor = await requireAdmin("staff");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.full_name.trim()) throw new Error("The team member needs a name.");
    if (!data.email.trim()) throw new Error("The team member needs an email.");

    const row: Record<string, unknown> = {
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim(),
      job_title: data.job_title,
      role: data.role,
      is_active: data.is_active,
      permissions: data.permissions,
    };

    const pin = data.pin ? normalisePin(data.pin) : "";
    if (pin) {
      if (pin.length !== 6) throw new Error("A PIN must be exactly six digits.");
      const { data: others } = await supabaseAdmin.from("staff_accounts").select("id, pin_hash");
      for (const o of others ?? []) {
        const hash = (o as { pin_hash: string | null }).pin_hash;
        if (!hash || o.id === data.id) continue;
        if (await verifyPassword(pin, hash)) throw new Error("That PIN is already taken. Choose another one.");
      }
      row.pin_hash = await hashPassword(pin);
    } else if (!data.id) {
      throw new Error("Give the new team member a six digit PIN.");
    }

    if (data.id) {
      const { error } = await supabaseAdmin.from("staff_accounts").update(row as never).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logActivity(supabaseAdmin as never, actor, {
        action: "staff.update",
        entity_type: "staff",
        entity_id: data.id,
        summary: `Updated team member ${data.full_name} (${data.role})`,
        meta: { permissions: data.permissions, pin_changed: Boolean(pin) },
      });
      return { id: data.id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("staff_accounts")
      .insert(row as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(supabaseAdmin as never, actor, {
      action: "staff.create",
      entity_type: "staff",
      entity_id: created.id as string,
      summary: `Added team member ${data.full_name} as ${data.role}`,
      meta: { permissions: data.permissions },
    });
    return { id: created.id as string };
  });

export const adminDeleteStaff = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin, logActivity } = await import("@/lib/admin.server");
    const actor = await requireAdmin("staff");
    if (actor.id === data.id) throw new Error("You cannot remove your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("staff_accounts")
      .select("full_name")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("staff_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(supabaseAdmin as never, actor, {
      action: "staff.delete",
      entity_type: "staff",
      entity_id: data.id,
      summary: `Removed team member ${row?.full_name ?? ""}`.trim(),
    });
    return { ok: true as const };
  });

// ---------------- activity, notifications, publishing ----------------

export const adminActivity = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  return data ?? [];
});

export const adminNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visitsWeek, visitsToday, orders, subs, messages, customs, settings] = await Promise.all([
    supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabaseAdmin.from("orders").select("id, order_number, customer_name, total_rwf, status, created_at").gte("created_at", since).order("created_at", { ascending: false }),
    supabaseAdmin.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabaseAdmin.from("custom_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabaseAdmin.from("site_settings").select("value").eq("key", "last_published_at").maybeSingle(),
  ]);

  const recent = orders.data ?? [];
  return {
    visitsToday: visitsToday.count ?? 0,
    visitsWeek: visitsWeek.count ?? 0,
    ordersWeek: recent.length,
    salesWeek: recent
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + (o.total_rwf ?? 0), 0),
    subscribersWeek: subs.count ?? 0,
    messagesWeek: messages.count ?? 0,
    customRequestsWeek: customs.count ?? 0,
    recentOrders: recent.slice(0, 6),
    lastPublishedAt: (settings.data?.value as string | null) ?? null,
  };
});

export const adminPublish = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, logActivity } = await import("@/lib/admin.server");
  const actor = await requireAdmin("publish");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const at = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "last_published_at", value: at } as never, { onConflict: "key" });
  if (error) throw new Error(error.message);
  await logActivity(supabaseAdmin as never, actor, {
    action: "site.publish",
    entity_type: "site",
    summary: `${actor.name} pushed the latest changes to the website`,
  });
  return { at };
});

// ---------------- customers & mailing list ----------------

export const adminCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin("customers");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [subs, orders, messages] = await Promise.all([
    supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, coupon_code, welcomed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("orders")
      .select("customer_name, email, phone, total_rwf, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("contact_messages")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const byEmail = new Map<
    string,
    { email: string; name: string; phone: string | null; orders: number; spent: number; last: string }
  >();
  for (const o of orders.data ?? []) {
    const key = (o.email ?? "").toLowerCase();
    if (!key) continue;
    const existing = byEmail.get(key);
    const spent = o.status === "cancelled" ? 0 : (o.total_rwf ?? 0);
    if (existing) {
      existing.orders += 1;
      existing.spent += spent;
    } else {
      byEmail.set(key, {
        email: o.email,
        name: o.customer_name,
        phone: o.phone ?? null,
        orders: 1,
        spent,
        last: o.created_at,
      });
    }
  }

  return {
    subscribers: subs.data ?? [],
    messages: messages.data ?? [],
    customers: [...byEmail.values()].sort((a, b) => b.spent - a.spent),
  };
});

// ---------------- sales analytics ----------------

export const adminAnalytics = createServerFn({ method: "GET" })
  .inputValidator((d: { days?: number } | undefined) => ({ days: d?.days ?? 30 }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin("analytics");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const days = Math.min(365, Math.max(7, data.days));
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    since.setHours(0, 0, 0, 0);

    const [ordersRes, itemsRes, productsRes, visitsRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, order_number, total_rwf, subtotal_rwf, delivery_rwf, discount_rwf, status, payment_status, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at"),
      supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, product_name, qty, unit_price_rwf, created_at")
        .gte("created_at", since.toISOString()),
      supabaseAdmin.from("products").select("id, name, cost_rwf, base_price_rwf"),
      supabaseAdmin.from("site_visits").select("created_at").gte("created_at", since.toISOString()),
    ]);

    const costById = new Map((productsRes.data ?? []).map((p) => [p.id, p.cost_rwf ?? 0]));
    const orders = (ordersRes.data ?? []).filter((o) => o.status !== "cancelled");
    const orderIds = new Set(orders.map((o) => o.id));
    const items = (itemsRes.data ?? []).filter((i) => orderIds.has(i.order_id));

    const costByOrder = new Map<string, number>();
    for (const i of items) {
      const unitCost = costById.get(i.product_id ?? "") ?? 0;
      costByOrder.set(i.order_id, (costByOrder.get(i.order_id) ?? 0) + unitCost * i.qty);
    }

    const dayKey = (iso: string) => iso.slice(0, 10);
    const series = new Map<string, { date: string; revenue: number; profit: number; orders: number; visits: number }>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(since.getTime() + i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      series.set(key, { date: key, revenue: 0, profit: 0, orders: 0, visits: 0 });
    }
    for (const o of orders) {
      const bucket = series.get(dayKey(o.created_at));
      if (!bucket) continue;
      const revenue = o.total_rwf ?? 0;
      bucket.revenue += revenue;
      bucket.profit += revenue - (o.delivery_rwf ?? 0) - (costByOrder.get(o.id) ?? 0);
      bucket.orders += 1;
    }
    for (const v of visitsRes.data ?? []) {
      const bucket = series.get(dayKey(v.created_at));
      if (bucket) bucket.visits += 1;
    }

    const topProducts = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const i of items) {
      const key = i.product_name;
      const entry = topProducts.get(key) ?? { name: key, qty: 0, revenue: 0 };
      entry.qty += i.qty;
      entry.revenue += (i.unit_price_rwf ?? 0) * i.qty;
      topProducts.set(key, entry);
    }

    const statusCounts = new Map<string, number>();
    for (const o of ordersRes.data ?? []) {
      statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
    }

    const revenue = orders.reduce((s, o) => s + (o.total_rwf ?? 0), 0);
    const cost = [...costByOrder.values()].reduce((s, c) => s + c, 0);
    const delivery = orders.reduce((s, o) => s + (o.delivery_rwf ?? 0), 0);
    const discounts = orders.reduce((s, o) => s + (o.discount_rwf ?? 0), 0);
    const visits = (visitsRes.data ?? []).length;

    return {
      days,
      revenue,
      profit: revenue - cost - delivery,
      cost,
      discounts,
      orderCount: orders.length,
      averageOrder: orders.length ? Math.round(revenue / orders.length) : 0,
      visits,
      conversion: visits ? Math.round((orders.length / visits) * 1000) / 10 : 0,
      series: [...series.values()],
      topProducts: [...topProducts.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      statusBreakdown: [...statusCounts.entries()].map(([name, value]) => ({ name, value })),
    };
  });
