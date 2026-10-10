import { matchesOrderContact } from "./order-contact";
import type { VerifiedReview } from "./tracking-and-reviews.types";

export type { VerifiedReview };

/**
 * Cloud storage is authoritative; never seed synthetic verified purchasers.
 */
export async function getReviewsStore(): Promise<VerifiedReview[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("site_settings")
    .select("value").eq("key", "verified_reviews").maybeSingle();
  if (error) throw new Error("Reviews could not be loaded.");
  return Array.isArray(data?.value) ? data.value as unknown as VerifiedReview[] : [];
}

export async function saveReviewsStore(reviews: VerifiedReview[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("site_settings").upsert({
    key: "verified_reviews", value: reviews as never, updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) throw new Error("Reviews could not be saved.");
}

/**
 * Searches for an order in Supabase and in local fallback store
 */
export async function findOrder(orderNumber: string, emailOrPhone: string) {
  const cleanOrder = orderNumber.trim().toUpperCase();
  const searchInput = emailOrPhone.trim();

  // 1. Try Supabase
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*)")
      .ilike("order_number", cleanOrder)
      .maybeSingle();

    if (order && !error) {
      if (matchesOrderContact(searchInput, order.email || "", order.phone || "")) {
        return order;
      }
    }
  } catch (e) {
    console.warn("[reviews.server] Supabase lookup error, checking fallback:", e);
  }

  return null;
}
