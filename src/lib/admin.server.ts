import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminSession = { admin?: boolean };

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

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.data.admin) throw new Error("Not authorised. Sign in to the dashboard first.");
  return session;
}

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

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  category_id: string | null;
  shape: "rectangle" | "circular" | "runner" | "organic";
  short_description: string | null;
  description: string | null;
  stock_status: "in_stock" | "made_to_order" | "out_of_stock";
  production_time: string | null;
  material: string | null;
  featured: boolean;
  featured_order: number;
  is_published: boolean;
  main_image_url: string | null;
  hover_image_url: string | null;
  color_palette: string[];
  tags: string[];
  base_price_rwf: number | null;
  sizes: SizeInput[];
  images: Array<{ url: string; alt: string | null }>;
};

export const USD_PER_RWF = 1 / 1460;
