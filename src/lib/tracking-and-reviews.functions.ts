import { createServerFn } from "@tanstack/react-start";
import type {
  VerifiedReview,
  OrderTrackingResult,
  PublicReviewsResult,
} from "./tracking-and-reviews.types";

export type { VerifiedReview, OrderTrackingResult, PublicReviewsResult };

/**
 * Calculates the tufting timeline stage and estimated delivery
 */
function calculateTimeline(status: string, createdAt: string) {
  let stage = 1;
  const s = (status || "pending").toLowerCase();

  if (s === "delivered") {
    stage = 5;
  } else if (s === "shipped" || s === "dispatched" || s === "out_for_delivery") {
    stage = 5;
  } else if (s === "ready" || s === "quality_check") {
    stage = 4;
  } else if (s === "in_production" || s === "processing" || s === "tufting") {
    stage = 2; // Frame stretched & Tufting or Carving
  } else if (s === "confirmed") {
    stage = 1; // Order confirmed & yarns allocated
  } else {
    stage = 1;
  }

  // Estimated delivery is typically 3 to 4 weeks after order placement
  const orderDate = new Date(createdAt);
  const estDate = new Date(orderDate.getTime() + 24 * 24 * 60 * 60 * 1000); // +24 days
  const estFormatted = estDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return { stage, estFormatted };
}

/**
 * Self-Service Order Tracking Lookup
 * ONLY returns data if Order Number AND Email/Phone match a legitimate order.
 */
export const trackOrderLookup = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { orderNumber: string; emailOrPhone: string }) => d,
  )
  .handler(async ({ data }): Promise<OrderTrackingResult> => {
    if (!data.orderNumber || !data.orderNumber.trim()) {
      return { found: false, error: "Please provide an order number (e.g. MSC-8921)." };
    }
    if (!data.emailOrPhone || !data.emailOrPhone.trim()) {
      return {
        found: false,
        error: "Please enter the email address or phone number used during checkout.",
      };
    }

    const { findOrder } = await import("./tracking-and-reviews.server");
    const order = await findOrder(data.orderNumber, data.emailOrPhone);
    if (!order) {
      return {
        found: false,
        error:
          "No order was found matching that order number and contact information. Please check your confirmation email or contact the atelier.",
      };
    }

    const { stage, estFormatted } = calculateTimeline(order.status, order.created_at);

    return {
      found: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        email: order.email,
        phone: order.phone,
        address: order.address ?? "",
        city: order.city ?? "",
        country: order.country ?? "",
        status: order.status || "confirmed",
        payment_status: order.payment_status || "paid",
        payment_method: order.payment_method || "momo",
        subtotal_rwf: order.subtotal_rwf || order.total_rwf,
        delivery_rwf: order.delivery_rwf || 0,
        total_rwf: order.total_rwf,
        created_at: order.created_at,
        estimated_delivery: estFormatted,
        current_stage: stage,
        notes: order.notes,
        items: (order.items || []).map((it: any, idx: number) => ({
          id: it.id || `item-${idx}`,
          product_name: it.product_name,
          product_slug: it.product_slug || it.product_name.toLowerCase().split(" ")[0],
          size_label: it.size_label,
          color: it.color,
          qty: it.qty || 1,
          unit_price_rwf: it.unit_price_rwf,
          image_url: it.image_url,
        })),
      },
    };
  });

/**
 * Public accessor for approved customer reviews on a specific rug
 */
export const getProductReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { productSlug: string }) => d)
  .handler(async ({ data }): Promise<PublicReviewsResult> => {
    const { getReviewsStore } = await import("./tracking-and-reviews.server");
    const all = await getReviewsStore();
    const approved = all.filter(
      (r) => r.product_slug === data.productSlug && r.status === "approved",
    );

    const count = approved.length;
    const avg =
      count > 0
        ? Math.round(
            (approved.reduce((acc, r) => acc + (r.rating || 5), 0) / count) * 10,
          ) / 10
        : 0;

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of approved) {
      const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      distribution[star] = (distribution[star] || 0) + 1;
    }

    return {
      reviews: approved,
      totalCount: count,
      averageRating: avg,
      distribution,
    };
  });

/**
 * Verified Review Submission:
 * Strictly verifies that the customer has placed an order before accepting review!
 */
export const submitVerifiedReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      orderNumber: string;
      email: string;
      productSlug: string;
      productName: string;
      rating: number;
      craftsmanshipRating?: number;
      softnessRating?: number;
      title: string;
      comment: string;
      customerLocation?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    if (!data.orderNumber || !data.email) {
      throw new Error("Only verified purchasers can submit a review. Order number and email required.");
    }

    const { findOrder, getReviewsStore, saveReviewsStore } = await import(
      "./tracking-and-reviews.server"
    );
    const { randomUUID } = await import("node:crypto");

    // 1. Verify that order exists and belongs to this email
    const order = await findOrder(data.orderNumber, data.email);
    if (!order) {
      throw new Error("We could not verify a studio purchase matching this order number and email.");
    }

    // 2. Validate input contents
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error("Please select a rating between 1 and 5 stars.");
    }
    if (!data.comment || data.comment.trim().length < 10) {
      throw new Error("Please share a few words about your rug craftsmanship (minimum 10 characters).");
    }

    const reviews = await getReviewsStore();

    // Check if review already submitted for this order and product
    const existing = reviews.find(
      (r) =>
        r.order_number.toUpperCase() === data.orderNumber.toUpperCase() &&
        r.product_slug === data.productSlug,
    );
    if (existing) {
      throw new Error("A review for this rug has already been recorded for your order. Thank you!");
    }

    const newReview: VerifiedReview = {
      id: randomUUID(),
      order_id: order.id,
      order_number: order.order_number,
      product_slug: data.productSlug,
      product_name: data.productName,
      customer_name: order.customer_name || "Verified Collector",
      customer_email: order.email,
      customer_location:
        data.customerLocation?.trim() || `${order.city || "Kigali"}, ${order.country || "Rwanda"}`,
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      craftsmanship_rating: data.craftsmanshipRating || 5,
      softness_rating: data.softnessRating || 5,
      title: data.title.trim() || "Exceptional Artisanal Craftsmanship",
      comment: data.comment.trim(),
      verified_buyer: true,
      status: "approved", // Auto-approved for verified purchasers, editable in admin
      created_at: new Date().toISOString(),
      admin_reply: null,
    };

    reviews.unshift(newReview);
    await saveReviewsStore(reviews);

    return {
      success: true,
      review: newReview,
      message: "Thank you! Your verified collector review has been published.",
    };
  });

/**
 * Admin: List all reviews for moderation in Studio Dashboard
 */
export const adminListAllReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<VerifiedReview[]> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    const { getReviewsStore } = await import("./tracking-and-reviews.server");
    return getReviewsStore();
  },
);

/**
 * Admin: Moderate review (Approve, Reject, or post Studio Atelier reply)
 */
export const adminModerateReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      status: "approved" | "pending" | "rejected";
      adminReply?: string | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const { getReviewsStore, saveReviewsStore } = await import(
      "./tracking-and-reviews.server"
    );
    const reviews = await getReviewsStore();
    const idx = reviews.findIndex((r) => r.id === data.id);
    if (idx === -1) throw new Error("Review not found.");

    reviews[idx].status = data.status;
    if (data.adminReply !== undefined) {
      reviews[idx].admin_reply = data.adminReply;
    }
    await saveReviewsStore(reviews);

    return { success: true, review: reviews[idx] };
  });

/**
 * Admin: Delete review
 */
export const adminDeleteReview = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const { getReviewsStore, saveReviewsStore } = await import(
      "./tracking-and-reviews.server"
    );
    let reviews = await getReviewsStore();
    reviews = reviews.filter((r) => r.id !== data.id);
    await saveReviewsStore(reviews);

    return { success: true };
  });
