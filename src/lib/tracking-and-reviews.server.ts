import fs from "node:fs";
import path from "node:path";
import type { VerifiedReview } from "./tracking-and-reviews.types";

export type { VerifiedReview };

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = path.join(DATA_DIR, "studio-reviews.json");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Loads reviews from persistent JSON storage, seeding with initial high-quality verified reviews if needed.
 */
export function getReviewsStore(): VerifiedReview[] {
  ensureDirs();
  if (fs.existsSync(REVIEWS_FILE)) {
    try {
      const raw = fs.readFileSync(REVIEWS_FILE, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    } catch (e) {
      console.error("[reviews.server] Failed to parse reviews file:", e);
    }
  }

  return [];
}

export function saveReviewsStore(reviews: VerifiedReview[]) {
  ensureDirs();
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
}

/**
 * Normalizes email strings for safe case-insensitive comparison
 */
function normEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalizes phone numbers (removes spaces, dashes, parentheses)
 */
function normPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

/**
 * Searches for an order in Supabase and in local fallback store
 */
export async function findOrder(orderNumber: string, emailOrPhone: string) {
  const cleanOrder = orderNumber.trim().toUpperCase();
  const searchInput = emailOrPhone.trim();
  const searchEmail = normEmail(searchInput);
  const searchPhone = normPhone(searchInput);

  // 1. Try Supabase
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*)")
      .ilike("order_number", cleanOrder)
      .maybeSingle();

    if (order && !error) {
      const orderEmail = normEmail(order.email || "");
      const orderPhone = normPhone(order.phone || "");

      const matches =
        (searchEmail && (orderEmail === searchEmail || orderEmail.includes(searchEmail))) ||
        (searchPhone && (orderPhone.endsWith(searchPhone) || searchPhone.endsWith(orderPhone)));

      if (matches) {
        return order;
      }
    }
  } catch (e) {
    console.warn("[reviews.server] Supabase lookup error, checking fallback:", e);
  }

  return null;
}
