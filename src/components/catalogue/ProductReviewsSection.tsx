import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  ShieldCheck,
  Sparkles,
  MessageSquareQuote,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { VerifiedReview } from "@/lib/tracking-and-reviews.types";

interface ProductReviewsSectionProps {
  productName: string;
  productSlug: string;
  reviews: VerifiedReview[];
  averageRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}

export function ProductReviewsSection({
  productName,
  productSlug,
  reviews,
  averageRating,
  totalCount,
  distribution,
}: ProductReviewsSectionProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const displayReviews = filterRating
    ? reviews.filter((r) => Math.round(r.rating) === filterRating)
    : reviews;

  return (
    <section className="mt-20 border-t border-border/80 pt-16" id="verified-reviews">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Verified Studio Collector Reviews</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            Craftsmanship &amp; Wool Feedback
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Reviews are strictly limited to verified buyers who have commissioned and received their handmade rugs from our Kigali atelier.
          </p>
        </div>

        {/* Access link for verified buyers */}
        <div className="rounded-2xl border border-border bg-card p-4 text-xs space-y-2 shrink-0 max-w-sm">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Commissioned this rug?</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Only verified purchasers can submit feedback. Use the private tracking link emailed with your receipt.
          </p>
          <Link
            to="/track-order"
            search={{ review: true }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline pt-0.5"
          >
            <span>Access Verified Review Portal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Ratings & Breakdown Card */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xs">
        {/* Overall score */}
        <div className="flex flex-col justify-center items-center text-center p-4 border-b md:border-b-0 md:border-r border-border/60">
          <div className="font-display text-5xl md:text-6xl font-bold text-foreground">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-5 w-5 ${
                  s <= Math.round(averageRating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2">
            Based on {totalCount} verified collector {totalCount === 1 ? "review" : "reviews"}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> 100% Verified Purchases
          </span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="space-y-2.5 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isFilterActive = filterRating === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(isFilterActive ? null : star)}
                className={`flex items-center gap-3 text-xs w-full group text-left rounded-lg p-1 transition-colors ${
                  isFilterActive ? "bg-muted font-bold" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-muted-foreground font-mono">
                  <span>{star}</span>
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-10 text-right text-muted-foreground font-mono text-[11px]">
                  {count}
                </div>
              </button>
            );
          })}

          {filterRating && (
            <button
              type="button"
              onClick={() => setFilterRating(null)}
              className="text-[11px] text-muted-foreground underline hover:text-foreground self-start mt-1"
            >
              Clear filter ({filterRating} Stars)
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-10 space-y-6">
        {displayReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            No reviews match the selected filter.
          </div>
        ) : (
          displayReviews.map((rev) => (
            <article
              key={rev.id}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {rev.customer_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Buyer</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{rev.customer_location}</span>
                    <span>·</span>
                    <span>Order #{rev.order_number}</span>
                    <span>·</span>
                    <span>
                      {new Date(rev.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= rev.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Specific attribute badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {rev.craftsmanship_rating && (
                  <span className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-muted-foreground">
                    Craftsmanship: <strong className="text-foreground">{rev.craftsmanship_rating}/5</strong>
                  </span>
                )}
                {rev.softness_rating && (
                  <span className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-muted-foreground">
                    Wool Pile Softness: <strong className="text-foreground">{rev.softness_rating}/5</strong>
                  </span>
                )}
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground">
                  {rev.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              {/* Atelier Staff Reply */}
              {rev.admin_reply && (
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Rug Mosaic Atelier Response:</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {rev.admin_reply}
                  </p>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
