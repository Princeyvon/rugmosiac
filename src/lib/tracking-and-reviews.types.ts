export interface VerifiedReview {
  id: string;
  order_id?: string;
  order_number: string;
  product_id?: string;
  product_slug: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  customer_location: string;
  rating: number; // 1 to 5
  craftsmanship_rating?: number; // 1 to 5
  softness_rating?: number; // 1 to 5
  title: string;
  comment: string;
  verified_buyer: boolean;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  admin_reply?: string | null;
}

export interface OrderTrackingResult {
  found: boolean;
  order?: {
    id: string;
    order_number: string;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: string;
    payment_status: string;
    payment_method: string;
    subtotal_rwf: number;
    delivery_rwf: number;
    total_rwf: number;
    created_at: string;
    estimated_delivery: string;
    current_stage: number; // 1 to 5
    notes?: string | null;
    items: Array<{
      id: string;
      product_name: string;
      product_slug?: string;
      size_label?: string;
      color?: string;
      qty: number;
      unit_price_rwf?: number;
      image_url?: string;
    }>;
  };
  error?: string;
}

export interface PublicReviewsResult {
  reviews: VerifiedReview[];
  totalCount: number;
  averageRating: number;
  distribution: Record<number, number>;
}
