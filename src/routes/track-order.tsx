import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Nav, Footer, WHATSAPP_URL, resolveImage } from "@/components/site-chrome";
import {
  trackOrderLookup,
  submitVerifiedReview,
  type OrderTrackingResult,
} from "@/lib/tracking-and-reviews.functions";
import { useCurrency } from "@/lib/currency";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Package,
  Scissors,
  ShieldCheck,
  Truck,
  ExternalLink,
  MessageCircle,
  Copy,
  Star,
  ArrowRight,
  Lock,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Palette,
} from "lucide-react";

export const Route = createFileRoute("/track-order")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    review: search.review === true || search.review === "true",
  }),
  head: () => ({
    meta: [
      { title: "Order Tracking Portal | Rug Mosaic" },
      {
        name: "description",
        content:
          "Private self-service artisan tufting timeline and order tracker for Rug Mosaic collectors and clients.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Track Your Order | Mosiac" },
      { property: "og:description", content: "Private order tracking for Mosiac customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackOrderPage,
});

const TIMELINE_STAGES = [
  {
    stage: 1,
    title: "1. Yarns Dyed & Allocated",
    shortTitle: "Yarns Allocated",
    icon: Palette,
    desc: "Premium 100% New Zealand wool yarn dyed in custom lots and primary cotton-poly backing canvas cut in our Kigali studio.",
  },
  {
    stage: 2,
    title: "2. Framed & Hand-Tufting",
    shortTitle: "Hand-Tufting",
    icon: Scissors,
    desc: "Canvas tensioned on vertical frames; master tufters meticulously shoot wool pile thread by thread following your design blueprint.",
  },
  {
    stage: 3,
    title: "3. 3D Carving & Backing",
    shortTitle: "Carving & Backing",
    icon: Layers,
    desc: "Hand-shearing with angled carvers to create tactile relief, followed by vulcanized natural latex and selected backing underlay.",
  },
  {
    stage: 4,
    title: "4. Quality Inspection",
    shortTitle: "Quality Check",
    icon: ShieldCheck,
    desc: "Rigorous pile tension inspection, lint shearing, vacuuming, and studio certification by master weavers.",
  },
  {
    stage: 5,
    title: "5. Dispatched / Delivered",
    shortTitle: "Dispatched",
    icon: Truck,
    desc: "Rolled in protective moisture-barrier canvas; out for white glove doorstep delivery in Kigali or international express air freight.",
  },
];

function TrackOrderPage() {
  const search = Route.useSearch();
  const lookupFn = useServerFn(trackOrderLookup);
  const submitReviewFn = useServerFn(submitVerifiedReview);
  const { format } = useCurrency();

  const [orderNumberInput, setOrderNumberInput] = useState(search.order || "");
  const [emailInput, setEmailInput] = useState(search.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review modal state
  const [reviewOpen, setReviewOpen] = useState(search.review || false);
  const [reviewSelectedProduct, setReviewSelectedProduct] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewCraftRating, setReviewCraftRating] = useState(5);
  const [reviewSoftRating, setReviewSoftRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const doLookup = useCallback(
    async (orderNum: string, emailOrPh: string) => {
      if (!orderNum.trim() || !emailOrPh.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await lookupFn({
          data: { orderNumber: orderNum.trim(), emailOrPhone: emailOrPh.trim() },
        });
        setResult(res);
        if (!res.found && res.error) {
          setError(res.error);
        } else if (res.found && res.order?.items?.[0]) {
          setReviewSelectedProduct(res.order.items[0].product_slug || "arc");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to lookup order.");
      } finally {
        setLoading(false);
      }
    },
    [lookupFn],
  );

  // Auto-search if query parameters are present in URL
  useEffect(() => {
    if (search.order && search.email) {
      doLookup(search.order, search.email);
    }
  }, [search.order, search.email, doLookup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(orderNumberInput, emailInput);
  };

  const copyDirectTrackingLink = () => {
    if (!result?.order) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/track-order?order=${encodeURIComponent(result.order.order_number)}&email=${encodeURIComponent(result.order.email)}`;
    if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(url);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result?.order) return;
    setReviewSubmitting(true);
    setReviewError(null);

    const activeItem = result.order.items.find(
      (it) => it.product_slug === reviewSelectedProduct,
    ) || result.order.items[0];

    try {
      await submitReviewFn({
        data: {
          orderNumber: result.order.order_number,
          email: result.order.email,
          productSlug: activeItem?.product_slug || "arc",
          productName: activeItem?.product_name || "Bespoke Rug",
          rating: reviewRating,
          craftsmanshipRating: reviewCraftRating,
          softnessRating: reviewSoftRating,
          title: reviewTitle.trim() || "Exquisite Wool Tufting",
          comment: reviewComment.trim(),
          customerLocation: `${result.order.city}, ${result.order.country}`,
        },
      });
      setReviewSuccess(true);
    } catch (err: any) {
      setReviewError(err?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const order = result?.order;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />

      <main className="flex-1 py-12 md:py-20">
        <div className="container-x mx-auto max-w-[960px]">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-medium text-foreground">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>Verified Buyer Portal</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              Artisan Tufting Timeline &amp; Order Tracker
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track your handmade New Zealand wool rug through every stage of atelier creation in Kigali. Access is private and reserved exclusively for studio purchasers.
            </p>
          </div>

          {/* Lookup Input Form */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Order Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your order number"
                    value={orderNumberInput}
                    onChange={(e) => setOrderNumberInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono focus:border-foreground focus:outline-hidden"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Found on your order receipt / confirmation email
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email or Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your checkout email or phone"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground focus:outline-hidden"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Used during checkout for verification
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>Checking Atelier Records…</span>
                    </>
                  ) : (
                    <>
                      <span>View Tufting Progress</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Order Details & Visual Timeline */}
          {order && (
            <div className="mt-8 space-y-8 animate-in fade-in duration-300">
              {/* Order Status Ribbon */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-lg font-bold text-foreground">
                      {order.order_number}
                    </span>
                    <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground uppercase">
                      Payment {order.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placed by <strong className="text-foreground">{order.customer_name}</strong> on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyDirectTrackingLink}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
                    title="Copy direct permanent tracking URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedLink ? "Link Copied!" : "Copy Private Link"}</span>
                  </button>

                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                      `Hello Rug Mosaic, I am inquiring regarding the status of my order ${order.order_number} (${order.customer_name}).`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp Atelier</span>
                  </a>
                </div>
              </div>

              {/* 5-Stage Interactive Timeline */}
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground" />
                    <h2 className="text-base font-semibold text-foreground">
                      Bespoke 5-Stage Creation Progress
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Target Delivery: <strong className="text-foreground">{order.estimated_delivery}</strong></span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                  {TIMELINE_STAGES.map((s) => {
                    const isCompleted = order.current_stage > s.stage;
                    const isCurrent = order.current_stage === s.stage;
                    const Icon = s.icon;

                    return (
                      <div
                        key={s.stage}
                        className={`rounded-2xl border p-4 transition-all ${
                          isCurrent
                            ? "border-foreground bg-muted/60 shadow-xs"
                            : isCompleted
                            ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                            : "border-border/60 bg-background/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`h-8 w-8 rounded-full grid place-items-center ${
                              isCurrent
                                ? "bg-foreground text-background"
                                : isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          {isCurrent && (
                            <span className="rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-background animate-pulse">
                              In Progress
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              Completed
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-foreground">
                          {s.shortTitle}
                        </h3>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Verified Review CTA */}
                <div className="rounded-2xl bg-muted/50 border border-border/80 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span>Verified Collector Review</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Have you inspected or received your rug? Share your feedback on wool density and craftsmanship for other discerning collectors.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewOpen(true);
                      setReviewSuccess(false);
                    }}
                    className="rounded-full border border-foreground bg-foreground text-background hover:bg-foreground/90 px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Leave Verified Review</span>
                  </button>
                </div>
              </div>

              {/* Order Items & Destination Details */}
              <div className="grid gap-6 md:grid-cols-[1fr_340px]">
                {/* Items */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Commissioned Pieces ({order.items.length})</span>
                  </h3>

                  <div className="divide-y divide-border/60">
                    {order.items.map((it) => (
                      <div key={it.id} className="py-3.5 flex items-center gap-4">
                        {it.image_url ? (
                          <img
                            src={resolveImage(it.image_url)}
                            alt={it.product_name}
                            className="h-16 w-16 rounded-xl object-cover border border-border/80 bg-muted shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-muted grid place-items-center text-muted-foreground shrink-0">
                            <Layers className="h-6 w-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {it.product_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {it.size_label || "Bespoke Size"} {it.color ? `· ${it.color}` : ""}
                          </p>
                          <span className="text-xs text-muted-foreground">Qty: {it.qty}</span>
                        </div>

                        <div className="text-right text-xs font-semibold text-foreground">
                          {format(it.unit_price_rwf ? it.unit_price_rwf * it.qty : 0)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{format(order.subtotal_rwf)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery (Kigali White Glove)</span>
                      <span>{order.delivery_rwf === 0 ? "Complimentary" : format(order.delivery_rwf)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/40">
                      <span>Total</span>
                      <span>{format(order.total_rwf)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Studio Instructions */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Delivery Destination</span>
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      <p>{order.address}</p>
                      <p>{order.city}, {order.country}</p>
                      <p className="pt-1 text-foreground font-mono">{order.phone}</p>
                      <p className="text-foreground">{order.email}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Commission Notes
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Verified Review Dialog */}
      {reviewOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl text-foreground">
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {reviewSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-display">Review Published!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Thank you, {order.customer_name}. Your verified review has been submitted to the atelier and will appear on the catalogue page with your verified buyer badge.
                </p>
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="rounded-full bg-foreground text-background px-6 py-2 text-xs font-semibold"
                >
                  Return to Tracker
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verified Purchase · Order {order.order_number}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold">
                    Collector Craftsmanship Review
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Only clients with an official studio order can submit. Your review helps support our Kigali master tufters.
                  </p>
                </div>

                {reviewError && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    {reviewError}
                  </div>
                )}

                {order.items.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Select Piece to Review
                    </label>
                    <select
                      value={reviewSelectedProduct}
                      onChange={(e) => setReviewSelectedProduct(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    >
                      {order.items.map((it) => (
                        <option key={it.id} value={it.product_slug}>
                          {it.product_name} ({it.size_label})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Overall Rating */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Overall Experience
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            s <= reviewRating ? "fill-amber-500" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold ml-2">{reviewRating} / 5 Stars</span>
                  </div>
                </div>

                {/* Sub-ratings */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-[11px] text-muted-foreground mb-1">
                      Craftsmanship &amp; Detail
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewCraftRating(s)}
                          className={`h-6 w-6 rounded text-xs font-semibold ${
                            s <= reviewCraftRating
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-muted-foreground mb-1">
                      Wool Softness &amp; Pile
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewSoftRating(s)}
                          className={`h-6 w-6 rounded text-xs font-semibold ${
                            s <= reviewSoftRating
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Review Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stunning wool density and rich custom colors"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Your Feedback *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share how the piece feels underfoot, its colors in natural light, and the atelier process..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewOpen(false)}
                    className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="rounded-full bg-foreground text-background px-6 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Publishing Review…" : "Submit Verified Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
