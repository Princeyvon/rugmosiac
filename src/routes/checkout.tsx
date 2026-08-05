import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Nav, Footer, WHATSAPP_URL } from "@/components/site-chrome";
import { useCart } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Mosiac Handmade Rugs" },
      { name: "description", content: "Complete your Mosiac order. Hand-tufted rugs made to order in Kigali, delivered across Rwanda and worldwide." },
      { property: "og:title", content: "Checkout | Mosiac Handmade Rugs" },
      { property: "og:description", content: "Complete your Mosiac order. Hand-tufted rugs made to order in Kigali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const DELIVERY = {
  kigali: { label: "Kigali delivery", price: 0, note: "Free hand delivery inside Kigali" },
  rwanda: { label: "Elsewhere in Rwanda", price: 15000, note: "2–4 days by courier" },
  international: { label: "International", price: 0, note: "Quoted by our team after you order" },
} as const;
type Zone = keyof typeof DELIVERY;

const PAYMENTS = [
  { id: "momo", label: "MTN Mobile Money", note: "We send a payment prompt to your number" },
  { id: "bank", label: "Bank transfer", note: "Account details sent with your invoice" },
  { id: "cash", label: "Cash on delivery", note: "Kigali only, 50% deposit required" },
] as const;

function CheckoutPage() {
  const { items, setQty, remove, clear } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [zone, setZone] = useState<Zone>("kigali");
  const [payment, setPayment] = useState<string>("momo");
  const [form, setForm] = useState({
    customer_name: "", email: "", phone: "", address: "", city: "Kigali", country: "Rwanda", notes: "",
  });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.unitPriceRwf ?? 0) * i.qty, 0),
    [items],
  );
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const delivery = DELIVERY[zone].price;
  const total = Math.max(0, subtotal - discount) + delivery;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError(null);
    if (!code) return;
    const { data } = await supabase
      .from("promo_coupons")
      .select("code, discount_percent")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) {
      setCoupon(null);
      setCouponError("That code isn't valid or has expired.");
      return;
    }
    setCoupon({ code: data.code, percent: data.discount_percent });
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country,
          notes: form.notes || null,
          currency: "RWF",
          subtotal_rwf: subtotal,
          delivery_rwf: delivery,
          discount_rwf: discount,
          total_rwf: total,
          coupon_code: coupon?.code ?? null,
          payment_method: payment,
        })
        .select("id, order_number")
        .single();
      if (orderError || !order) throw orderError ?? new Error("Could not create order");

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          product_slug: i.slug,
          size_label: i.sizeLabel ?? null,
          color: i.color ?? null,
          qty: i.qty,
          unit_price_rwf: i.unitPriceRwf ?? null,
          image_url: i.image ?? null,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      setPlaced(order.order_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="container-x mx-auto max-w-[720px] py-24 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-foreground text-background">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl md:text-4xl">Order received</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your reference is <strong className="text-foreground">{placed}</strong>. Our studio will confirm your
            tufting slot and payment details by email within one working day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/catalogue" className="rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background">
              Keep browsing
            </Link>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hi Mosiac, I just placed order ${placed}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider"
            >
              Message the studio
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1200px] pb-24 pt-10 md:pt-16">
        <h1 className="font-display text-3xl md:text-5xl">Checkout</h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Every Mosiac rug is tufted to order. Place your order here and the studio confirms payment, timeline and
          delivery with you directly.
        </p>

        {items.length === 0 ? (
          <div className="mt-16 rounded-3xl bg-muted/50 p-12 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <button
              onClick={() => navigate({ to: "/catalogue" })}
              className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background"
            >
              Browse the catalogue
            </button>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            {/* Details */}
            <div className="space-y-10">
              <section>
                <h2 className="eyebrow text-muted-foreground">1. Your details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required value={form.customer_name} onChange={set("customer_name")} />
                  <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
                  <Field label="Phone" required value={form.phone} onChange={set("phone")} placeholder="+250 …" />
                  <Field label="City" value={form.city} onChange={set("city")} />
                  <div className="sm:col-span-2">
                    <Field label="Delivery address" value={form.address} onChange={set("address")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Country" value={form.country} onChange={set("country")} />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="eyebrow text-muted-foreground">2. Delivery</h2>
                <div className="mt-4 space-y-3">
                  {(Object.keys(DELIVERY) as Zone[]).map((z) => (
                    <label
                      key={z}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${
                        zone === z ? "border-foreground" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span>
                        <input type="radio" name="zone" className="sr-only" checked={zone === z} onChange={() => setZone(z)} />
                        <span className="block text-sm font-medium">{DELIVERY[z].label}</span>
                        <span className="block text-xs text-muted-foreground">{DELIVERY[z].note}</span>
                      </span>
                      <span className="font-display text-sm">
                        {z === "international" ? "Quoted" : DELIVERY[z].price === 0 ? "Free" : format({ rwf: DELIVERY[z].price })}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="eyebrow text-muted-foreground">3. Payment</h2>
                <div className="mt-4 space-y-3">
                  {PAYMENTS.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${
                        payment === p.id ? "border-foreground" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span>
                        <input type="radio" name="payment" className="sr-only" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                        <span className="block text-sm font-medium">{p.label}</span>
                        <span className="block text-xs text-muted-foreground">{p.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Order notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
                    placeholder="Colour tweaks, delivery timing, anything else"
                  />
                </div>
              </section>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 self-start rounded-3xl bg-muted/40 p-6 md:p-8">
              <h2 className="font-display text-xl">Order summary</h2>
              <ul className="mt-5 divide-y divide-border">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-3 py-4">
                    {i.image && <img src={i.image} alt={i.name} className="h-20 w-16 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate text-sm font-medium">{i.name}</div>
                        <button type="button" onClick={() => remove(i.key)} aria-label="Remove">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {[i.sizeLabel, i.color].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setQty(i.key, Math.max(1, i.qty - 1))} aria-label="Decrease">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm tabular-nums">{i.qty}</span>
                          <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-display text-sm">{format({ rwf: (i.unitPriceRwf ?? 0) * i.qty })}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code"
                  className="h-11 flex-1 rounded-full border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
                />
                <button type="button" onClick={applyCoupon} className="h-11 rounded-full border border-foreground px-5 text-xs font-semibold uppercase tracking-wider">
                  Apply
                </button>
              </div>
              {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
              {coupon && <p className="mt-2 text-xs text-muted-foreground">{coupon.code} applied — {coupon.percent}% off.</p>}

              <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <Row label="Subtotal" value={format({ rwf: subtotal })} />
                {discount > 0 && <Row label="Discount" value={`− ${format({ rwf: discount })}`} />}
                <Row label="Delivery" value={zone === "international" ? "Quoted" : delivery === 0 ? "Free" : format({ rwf: delivery })} />
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="font-display text-base">Total</dt>
                  <dd className="font-display text-lg">{format({ rwf: total })}</dd>
                </div>
              </dl>

              {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-xs font-semibold uppercase tracking-wider text-background disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Placing order" : "Place order"}
              </button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                No card is charged here. The studio confirms your total and payment link before production begins.
              </p>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({
  label, ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-2 h-12 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
