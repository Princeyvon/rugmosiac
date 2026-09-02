import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual, randomBytes } from "node:crypto";

export type StaffRole = "owner" | "admin" | "manager" | "sales" | "production" | "staff";

export type AdminSession = {
  admin?: boolean;
  staffId?: string;
  role?: StaffRole;
  name?: string;
  email?: string;
  perms?: Record<string, boolean>;
};

function sessionConfig() {
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "mosiac-admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

/** Constant-time compare of two arbitrary-length strings. */
export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

// ---------- staff password hashing (PBKDF2 via WebCrypto) ----------

export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex ?? randomBytes(16).toString("hex");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: Uint8Array.from(Buffer.from(salt, "hex")), iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return `${salt}:${Buffer.from(bits).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const candidate = await hashPassword(password, salt);
  const a = Buffer.from(candidate.split(":")[1], "hex");
  const b = Buffer.from(digest, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- permissions ----------

export type Capability =
  | "catalogue"
  | "inventory"
  | "orders"
  | "customers"
  | "discounts"
  | "content"
  | "analytics"
  | "staff"
  | "settings"
  | "destroy";

const MATRIX: Record<StaffRole, Capability[]> = {
  owner: [
    "catalogue",
    "inventory",
    "orders",
    "customers",
    "discounts",
    "content",
    "analytics",
    "staff",
    "settings",
    "destroy",
  ],
  admin: ["catalogue", "inventory", "orders", "customers", "discounts", "content", "analytics", "settings", "destroy"],
  manager: ["catalogue", "inventory", "orders", "customers", "discounts", "analytics", "content"],
  staff: ["orders", "inventory", "customers"],
};

export function can(role: StaffRole, capability: Capability): boolean {
  return MATRIX[role]?.includes(capability) ?? false;
}

export type Actor = { id: string | null; name: string; role: StaffRole; email: string | null };

export async function requireAdmin(capability?: Capability): Promise<Actor> {
  const session = await getAdminSession();
  const data = session.data;
  if (!data.admin && !data.staffId) throw new Error("Not authorised. Sign in to the dashboard first.");
  const role: StaffRole = data.role ?? "owner";
  if (capability && !can(role, capability)) {
    throw new Error("Your role does not have permission for this action.");
  }
  return { id: data.staffId ?? null, name: data.name ?? "Owner", role, email: data.email ?? null };
}

// ---------- audit log ----------

type AnyClient = { from: (t: string) => any };

export async function logActivity(
  db: AnyClient,
  actor: Actor,
  entry: { action: string; entity_type?: string; entity_id?: string | null; summary: string; meta?: unknown },
) {
  try {
    await db.from("activity_log").insert({
      actor_name: actor.name,
      actor_role: actor.role,
      action: entry.action,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      summary: entry.summary,
      meta: entry.meta ?? {},
    });
  } catch {
    /* logging must never break an operation */
  }
}

// ---------- inventory ----------

export const MOVEMENT_REASONS = [
  "sale",
  "cancellation",
  "return",
  "damaged",
  "lost",
  "stock_received",
  "production_completed",
  "manual_correction",
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export type StockLevel = { stock_qty: number; reserved_qty: number; low_stock_threshold: number };

export function stockState(row: StockLevel & { fulfilment_type?: string | null }) {
  const available = Math.max(0, row.stock_qty - row.reserved_qty);
  if (row.fulfilment_type && row.fulfilment_type !== "ready_to_ship") {
    return { available, label: row.fulfilment_type === "custom" ? "Custom" : "Made to order", tone: "info" as const };
  }
  if (available <= 0) return { available, label: "Out of stock", tone: "danger" as const };
  if (available <= row.low_stock_threshold) return { available, label: "Low stock", tone: "warn" as const };
  return { available, label: "In stock", tone: "ok" as const };
}

/** Applies a stock change and always writes an immutable movement record. */
export async function applyStockChange(
  db: AnyClient,
  actor: Actor,
  opts: {
    productId?: string | null;
    variantId?: string | null;
    delta?: number;
    setTo?: number;
    reason: MovementReason;
    note?: string | null;
    orderId?: string | null;
  },
) {
  const table = opts.variantId ? "product_variants" : "products";
  const id = opts.variantId ?? opts.productId;
  if (!id) throw new Error("Nothing to adjust.");

  const { data: row, error } = await db.from(table).select("id, stock_qty").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("That item no longer exists.");

  const previous = Number(row.stock_qty ?? 0);
  const target = opts.setTo != null ? opts.setTo : previous + (opts.delta ?? 0);
  const next = Math.max(0, Math.round(target));
  if (next === previous && opts.setTo == null) return { previous, next };

  const { error: upErr } = await db.from(table).update({ stock_qty: next }).eq("id", id);
  if (upErr) throw new Error(upErr.message);

  await db.from("inventory_movements").insert({
    product_id: opts.variantId ? null : opts.productId,
    variant_id: opts.variantId ?? null,
    order_id: opts.orderId ?? null,
    reason: opts.reason,
    delta: next - previous,
    previous_qty: previous,
    new_qty: next,
    note: opts.note ?? null,
    actor_name: actor.name,
    actor_role: actor.role,
  });

  return { previous, next };
}

// ---------- misc ----------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type SizeInput = {
  id?: string;
  label: string;
  width_cm: number | null;
  height_cm: number | null;
  price_rwf: number | null;
  weight_kg: number | null;
  sort_order: number;
};

export type VariantInput = {
  id?: string;
  sku: string | null;
  size_label: string | null;
  color: string | null;
  price_rwf: number | null;
  cost_rwf: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
};

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  collection_ids: string[];
  shape: "rectangle" | "circular" | "runner" | "organic";
  short_description: string | null;
  description: string | null;
  stock_status: "in_stock" | "made_to_order" | "out_of_stock";
  fulfilment_type: "ready_to_ship" | "made_to_order" | "custom";
  production_time: string | null;
  material: string | null;
  design_style: string | null;
  care_instructions: string | null;
  weight_kg: number | null;
  seo_title: string | null;
  seo_description: string | null;
  featured: boolean;
  featured_order: number;
  is_published: boolean;
  main_image_url: string | null;
  hover_image_url: string | null;
  color_palette: string[];
  tags: string[];
  base_price_rwf: number | null;
  cost_rwf: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  sizes: SizeInput[];
  variants: VariantInput[];
  images: Array<{ url: string; alt: string | null }>;
};

export const USD_PER_RWF = 1 / 1460;
