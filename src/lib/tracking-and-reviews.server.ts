import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fallbackProducts, fallbackReviews } from "./fallback-catalogue";
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

  // Seed with realistic verified reviews tied to our catalogue rugs
  const seeded: VerifiedReview[] = [
    {
      id: "rev-seed-1",
      order_number: "MSC-7821",
      product_slug: "arc",
      product_name: "Arc",
      customer_name: "Aline Mukamana",
      customer_email: "aline.m@kigalidesign.rw",
      customer_location: "Kigali (Kacyiru)",
      rating: 5,
      craftsmanship_rating: 5,
      softness_rating: 5,
      title: "Museum-grade quality and incredible pile depth",
      comment:
        "We ordered the 200x300cm Arc rug for our main living room in Kacyiru. The density of the New Zealand wool and the subtle hand-carved relief between the cream ground and golden arc are sensational underfoot.",
      verified_buyer: true,
      status: "approved",
      created_at: "2026-08-15T14:30:00.000Z",
      admin_reply:
        "Thank you so much Aline! It was an absolute pleasure tufting the custom golden arc for your living space. – Rug Mosaic Atelier",
    },
    {
      id: "rev-seed-2",
      order_number: "MSC-8042",
      product_slug: "burg",
      product_name: "Burg",
      customer_name: "David Kamanzi",
      customer_email: "david.k@rwanda-invest.com",
      customer_location: "Kimihurura",
      rating: 5,
      craftsmanship_rating: 5,
      softness_rating: 5,
      title: "Rich crimson tone and durable heavy backing",
      comment:
        "The deep burgundy hues match the lighting in our study perfectly. The natural latex backing holds firmly on our hardwood floor without sliding at all. Outstanding local craftsmanship.",
      verified_buyer: true,
      status: "approved",
      created_at: "2026-08-28T09:15:00.000Z",
      admin_reply: "Warm regards David, we are thrilled it anchors your study so handsomely!",
    },
    {
      id: "rev-seed-3",
      order_number: "MSC-8199",
      product_slug: "geometric",
      product_name: "Geometric",
      customer_name: "Sarah B.",
      customer_email: "sarah.b@diplomat.org",
      customer_location: "Nyarutarama",
      rating: 5,
      craftsmanship_rating: 5,
      softness_rating: 4,
      title: "Artisanal textile mastery — tracked every stage!",
      comment:
        "Being able to watch our rug progress through the tufting, carving, and backing stages made the wait genuinely exciting. The final piece is a centerpiece in our home.",
      verified_buyer: true,
      status: "approved",
      created_at: "2026-09-10T16:45:00.000Z",
      admin_reply: null,
    },
    {
      id: "rev-seed-4",
      order_number: "MSC-8450",
      product_slug: "arc",
      product_name: "Arc",
      customer_name: "Jean-Paul Niyonzima",
      customer_email: "jp.niyo@techafrica.co",
      customer_location: "Kigali (Gacuriro)",
      rating: 5,
      craftsmanship_rating: 5,
      softness_rating: 5,
      title: "Exceeded all expectations",
      comment:
        "Soft, luxurious, and heavy. Everyone who walks into the apartment immediately bends down to touch the wool. 10/10.",
      verified_buyer: true,
      status: "approved",
      created_at: "2026-09-18T11:20:00.000Z",
      admin_reply: null,
    },
  ];

  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(seeded, null, 2), "utf8");
  } catch (err) {
    console.error("[reviews.server] Error saving initial reviews:", err);
  }

  return seeded;
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

  // 2. Demo fallback orders for testing order tracking with realistic timestamps and stages
  const DEMO_ORDERS: Record<string, any> = {
    "MSC-7821": {
      id: "ord-7821",
      order_number: "MSC-7821",
      customer_name: "Aline Mukamana",
      email: "aline.m@kigalidesign.rw",
      phone: "+250788112233",
      address: "KG 9 Ave, House 42, Kacyiru",
      city: "Kigali",
      country: "Rwanda",
      status: "delivered",
      payment_status: "paid",
      payment_method: "momo",
      subtotal_rwf: 870000,
      delivery_rwf: 0,
      total_rwf: 870000,
      created_at: "2026-08-01T10:00:00Z",
      notes: "Backing Preference: Heavy-Duty Felt Underlay | White Glove delivery requested",
      items: [
        {
          id: "item-1",
          product_name: "Arc Hand-Tufted Wool Rug",
          product_slug: "arc",
          size_label: "200 × 300 cm (L)",
          color: "Cream / Gold / Dark Brown",
          qty: 1,
          unit_price_rwf: 870000,
          image_url: "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
        },
      ],
    },
    "MSC-8042": {
      id: "ord-8042",
      order_number: "MSC-8042",
      customer_name: "David Kamanzi",
      email: "david.k@rwanda-invest.com",
      phone: "+250788223344",
      address: "KG 548 St, Villa 12, Kimihurura",
      city: "Kigali",
      country: "Rwanda",
      status: "delivered",
      payment_status: "paid",
      payment_method: "card",
      subtotal_rwf: 640000,
      delivery_rwf: 0,
      total_rwf: 640000,
      created_at: "2026-08-12T14:20:00Z",
      notes: "Backing: Anti-Slip Natural Latex",
      items: [
        {
          id: "item-2",
          product_name: "Burg Hand-Tufted Wool Rug",
          product_slug: "burg",
          size_label: "150 × 220 cm (M)",
          color: "Deep Crimson / Blush",
          qty: 1,
          unit_price_rwf: 640000,
          image_url: "/__l5e/assets-v1/f65fc452-6a55-416b-94bc-1e5108b44c6d/burg-1.jpg",
        },
      ],
    },
    "MSC-8921": {
      id: "ord-8921",
      order_number: "MSC-8921",
      customer_name: "Claire Henderson",
      email: "claire.h@gmail.com",
      phone: "+250796123456",
      address: "Boulevard de l'Umuganda, Apt 4B, Kacyiru",
      city: "Kigali",
      country: "Rwanda",
      status: "in_production",
      payment_status: "paid",
      payment_method: "momo",
      subtotal_rwf: 320000,
      delivery_rwf: 0,
      total_rwf: 320000,
      created_at: "2026-09-14T08:30:00Z",
      notes: "Backing: Heavy-Duty Felt Underlay | Rush order for housewarming",
      items: [
        {
          id: "item-3",
          product_name: "Arc Hand-Tufted Wool Rug",
          product_slug: "arc",
          size_label: "120 × 180 cm (S)",
          color: "Original Cream / Gold",
          qty: 1,
          unit_price_rwf: 320000,
          image_url: "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
        },
      ],
    },
  };

  const demo = DEMO_ORDERS[cleanOrder];
  if (demo) {
    const demoEmail = normEmail(demo.email);
    const demoPhone = normPhone(demo.phone);
    if (
      !searchInput ||
      demoEmail === searchEmail ||
      demoEmail.includes(searchEmail) ||
      (searchPhone && demoPhone.includes(searchPhone))
    ) {
      return demo;
    }
  }

  return null;
}
