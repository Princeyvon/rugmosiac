import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Nav, Footer, WHATSAPP_URL, resolveImage } from "@/components/site-chrome";
import { useCart } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { CurrencyDropdown } from "@/components/CurrencyDropdown";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUtmData } from "@/lib/meta-client";
import { startMomoPayment, checkMomoPayment } from "@/lib/momo.functions";
import { startEsiciaPayment, checkEsiciaPayment } from "@/lib/esicia.functions";
import {
  Minus,
  Plus,
  Trash2,
  Check,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles,
  Gift,
  CreditCard,
  Smartphone,
  Building2,
  Copy,
  Printer,
  ChevronRight,
  Clock,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Scissors,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Mosiac Handmade Rugs" },
      {
        name: "description",
        content:
          "Complete your Mosiac order. Hand-tufted rugs made to order in Kigali, delivered across Rwanda and worldwide.",
      },
      { property: "og:title", content: "Checkout | Mosiac Handmade Rugs" },
      {
        property: "og:description",
        content:
          "Complete your Mosiac order. Hand-tufted rugs made to order in Kigali.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const DELIVERY = {
  kigali: {
    id: "kigali",
    label: "Kigali White-Glove Hand Delivery",
    price: 0,
    time: "3–4 weeks studio tufting + immediate hand delivery",
    note: "Free direct delivery by our Kigali studio team, unrolling & placement included",
  },
  rwanda: {
    id: "rwanda",
    label: "Rwanda & Regional Express Courier",
    price: 15000,
    time: "3–4 weeks tufting + 2–3 days courier",
    note: "Insured courier across Rwanda and East African regional hubs",
  },
  international: {
    id: "international",
    label: "Worldwide Insured Air Express",
    price: 0,
    time: "3–4 weeks tufting + 5–7 days air freight (DHL / FedEx)",
    note: "Crated & insured international air delivery. Our concierge coordinates door-to-door transit",
  },
} as const;
type Zone = keyof typeof DELIVERY;

const BACKING_OPTIONS = [
  {
    id: "latex",
    title: "Anti-Slip Natural Latex",
    subtitle: "Recommended for floor living spaces",
    desc: "Provides floor grip and long-lasting pile resilience on hardwood, polished concrete, parquet, or tile.",
  },
  {
    id: "wall_loops",
    title: "Wall-Art Tapestry Finish",
    subtitle: "Concealed hanging sleeve & tabs",
    desc: "Includes sewn hanging sleeve and concealed tabs to mount seamlessly as architectural wall art.",
  },
  {
    id: "felt",
    title: "Reinforced Natural Felt",
    subtitle: "Extra acoustic sound-dampening",
    desc: "Extra dense cushioning and acoustic absorption for heavy-traffic corridors or serene bedrooms.",
  },
];

const PAYMENTS = [
  {
    id: "momo",
    label: "Mobile Money (MTN & Airtel)",
    sublabel: "Instant push prompt via Esicia Rwanda",
    badge: "Instant *182#",
    icon: Smartphone,
    note: "Instant payment push prompt sent directly to your phone via Esicia Rwanda Ltd (*182# for MTN / *182# for Airtel)",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    sublabel: "Visa, Mastercard via Esicia K-Pay",
    badge: "256-Bit SSL",
    icon: CreditCard,
    note: "Secure encrypted checkout processed by Esicia Rwanda Ltd (PCI-DSS & ISO 27001)",
  },
  {
    id: "bank",
    label: "Bank Wire / SWIFT Transfer",
    sublabel: "Bank of Kigali / I&M Bank",
    badge: "Studio Invoice",
    icon: Building2,
    note: "Official studio invoice with IBAN & SWIFT routing dispatched upon confirmation",
  },
  {
    id: "cash",
    label: "Cash / Deposit on Delivery",
    sublabel: "50% deposit upon tufting commencement",
    badge: "Kigali Only",
    icon: Truck,
    note: "Pay 50% deposit to start hand-tufting, and the remaining 50% balance upon doorstep unrolling",
  },
] as const;

const COUNTRIES = [
  { code: "RW", name: "Rwanda", phonePrefix: "+250" },
  { code: "UG", name: "Uganda", phonePrefix: "+256" },
  { code: "KE", name: "Kenya", phonePrefix: "+254" },
  { code: "TZ", name: "Tanzania", phonePrefix: "+255" },
  { code: "US", name: "United States", phonePrefix: "+1" },
  { code: "GB", name: "United Kingdom", phonePrefix: "+44" },
  { code: "FR", name: "France", phonePrefix: "+33" },
  { code: "BE", name: "Belgium", phonePrefix: "+32" },
  { code: "DE", name: "Germany", phonePrefix: "+49" },
  { code: "CA", name: "Canada", phonePrefix: "+1" },
  { code: "AE", name: "United Arab Emirates", phonePrefix: "+971" },
  { code: "OTHER", name: "Other Country / Worldwide", phonePrefix: "+" },
];

function CheckoutPage() {
  const { items, setQty, remove, clear } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();

  // Multi-step workflow state (1: Contact, 2: Delivery, 3: Specifications, 4: Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Delivery & Payment selection
  const [zone, setZone] = useState<Zone>("kigali");
  const [payment, setPayment] = useState<string>("momo");

  // Customer Contact & Shipping Address
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "Kigali",
    district: "Gasabo",
    country: "Rwanda",
    postal_code: "",
    notes: "",
  });

  // Separate Billing Address state
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingForm, setBillingForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "Rwanda",
    postal_code: "",
  });

  // Artisan & Customization Specifications
  const [backing, setBacking] = useState("latex");
  const [isGift, setIsGift] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [rushRequested, setRushRequested] = useState(false);

  // Credit Card Form fields
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });

  // Coupon / Promo Code State
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    percent: number;
    amountRwf: number;
    note: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Order Placement & Post-Purchase State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);
  const [placedOrderSummary, setPlacedOrderSummary] = useState<{
    orderNumber: string;
    total: number;
    email: string;
    phone: string;
    zone: string;
    itemsCount: number;
  } | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile Money polling
  const [momo, setMomo] = useState<{
    state: "prompted" | "successful" | "failed" | "unavailable";
    reference?: string;
    message?: string;
  } | null>(null);
  const [checkingMomo, setCheckingMomo] = useState(false);

  // Mobile order summary drawer collapse
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Financial calculations
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.unitPriceRwf ?? 0) * i.qty, 0),
    [items]
  );
  const discount = coupon
    ? Math.min(
        subtotal,
        coupon.amountRwf > 0
          ? coupon.amountRwf
          : Math.round((subtotal * coupon.percent) / 100)
      )
    : 0;
  const delivery = DELIVERY[zone].price;
  const total = Math.max(0, subtotal - discount) + delivery;

  // Track InitiateCheckout once when checkout mounts with cart items
  const hasTrackedInitiateRef = useRef(false);
  useEffect(() => {
    if (!hasTrackedInitiateRef.current && items.length > 0) {
      hasTrackedInitiateRef.current = true;
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent("InitiateCheckout", {
            value: total,
            currency: "RWF",
            numItems: items.reduce((acc, it) => acc + it.qty, 0),
            contentIds: items.map((i) => i.productId),
          });
        })
        .catch(() => {});
    }
  }, [items, total]);

  // Track AddPaymentInfo when customer reaches Payment step
  const hasTrackedPaymentInfoRef = useRef(false);
  useEffect(() => {
    if (currentStep === 4 && !hasTrackedPaymentInfoRef.current && items.length > 0) {
      hasTrackedPaymentInfoRef.current = true;
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent("AddPaymentInfo", {
            value: total,
            currency: "RWF",
            paymentType: payment,
            contentIds: items.map((i) => i.productId),
            numItems: items.reduce((acc, it) => acc + it.qty, 0),
          });
        })
        .catch(() => {});
    }
  }, [currentStep, items, total, payment]);

  // Name handlers to ensure first/last synchronization
  const handleFirstNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      firstName: val,
      customer_name: `${val} ${f.lastName}`.trim(),
    }));
  };

  const handleLastNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      lastName: val,
      customer_name: `${f.firstName} ${val}`.trim(),
    }));
  };

  const setField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Step Validation Helpers
  const validateStep1 = () => {
    const fullName = form.customer_name || `${form.firstName} ${form.lastName}`.trim();
    if (!fullName) {
      setError("Please enter your name.");
      setCurrentStep(1);
      return false;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please provide a valid email address for your order confirmation.");
      setCurrentStep(1);
      return false;
    }
    if (!form.phone.trim()) {
      setError("Please provide a phone number for courier delivery and updates.");
      setCurrentStep(1);
      return false;
    }
    if (!form.address.trim()) {
      setError("Please enter your delivery street address.");
      setCurrentStep(1);
      return false;
    }
    setError(null);
    return true;
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    if (step > 1 && !validateStep1()) return;
    setError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Coupon Validation
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError(null);
    if (!code) return;
    setCouponLoading(true);

    try {
      const { data } = await supabase
        .from("promo_coupons")
        .select(
          "code, discount_percent, discount_type, discount_amount_rwf, min_order_rwf, usage_limit, used_count, starts_at, expires_at"
        )
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      const fail = (message: string) => {
        setCoupon(null);
        setCouponError(message);
      };

      if (!data) return fail("That promo code isn't valid.");

      const now = Date.now();
      if (data.starts_at && new Date(data.starts_at).getTime() > now) {
        return fail("That promo code isn't active yet.");
      }
      if (data.expires_at && new Date(data.expires_at).getTime() < now) {
        return fail("That promo code has expired.");
      }
      if (
        data.usage_limit != null &&
        (data.used_count ?? 0) >= data.usage_limit
      ) {
        return fail("That promo code has reached its usage limit.");
      }
      if (data.min_order_rwf != null && subtotal < data.min_order_rwf) {
        return fail(
          `Minimum order of ${data.min_order_rwf.toLocaleString("en-US")} RWF required for this code.`
        );
      }

      const isAmount =
        data.discount_type === "amount" && (data.discount_amount_rwf ?? 0) > 0;
      setCoupon({
        code: data.code,
        percent: isAmount ? 0 : (data.discount_percent ?? 0),
        amountRwf: isAmount ? (data.discount_amount_rwf ?? 0) : 0,
        note: isAmount
          ? `${(data.discount_amount_rwf ?? 0).toLocaleString("en-US")} RWF off`
          : `${data.discount_percent ?? 0}% off`,
      });
      setCouponInput("");
    } catch {
      setCouponError("Could not verify promo code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  // Card Number Formatting
  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardData((c) => ({ ...c, number: formatted }));
  }

  // Card Expiry Formatting
  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardData((c) => ({ ...c, expiry: `${raw.slice(0, 2)}/${raw.slice(2)}` }));
    } else {
      setCardData((c) => ({ ...c, expiry: raw }));
    }
  }

  // Order Placement
  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;

    if (!validateStep1()) return;

    setSubmitting(true);

    const resolvedFullName =
      form.customer_name.trim() || `${form.firstName} ${form.lastName}`.trim();
    const resolvedFirstName =
      form.firstName.trim() || resolvedFullName.split(" ")[0] || "";
    const resolvedLastName =
      form.lastName.trim() || resolvedFullName.split(" ").slice(1).join(" ") || "";

    // Compile comprehensive studio instructions
    const utmAttribution = getStoredUtmData();
    const attributionTag =
      utmAttribution.utm_source || utmAttribution.fbclid || utmAttribution.gclid || utmAttribution.utm_campaign
        ? `Ad Attribution: [Source: ${utmAttribution.utm_source || "direct"}${utmAttribution.utm_campaign ? ` | Campaign: ${utmAttribution.utm_campaign}` : ""}${utmAttribution.utm_medium ? ` | Medium: ${utmAttribution.utm_medium}` : ""}${utmAttribution.gclid ? ` | GCLID: ${utmAttribution.gclid}` : ""}${utmAttribution.fbclid ? ` | FBCLID: ${utmAttribution.fbclid}` : ""}]`
        : null;

    const notesParts = [
      form.notes ? `Customer Notes: ${form.notes}` : null,
      `Backing Finish: ${backing === "wall_loops" ? "Wall-Art Tapestry Loops" : backing === "felt" ? "Heavy-Duty Felt Underlay" : "Anti-Slip Natural Latex"}`,
      rushRequested ? "PRIORITY RUSH TUFTING (Client requested accelerated studio scheduling)" : null,
      isGift ? `GIFT ORDER - Recipient: ${giftRecipient || "Not specified"}. Note: "${giftMessage}"` : null,
      form.apartment ? `Apt/Suite/Building: ${form.apartment}` : null,
      !sameAsShipping ? `Billing: ${billingForm.name}, ${billingForm.address}, ${billingForm.city}, ${billingForm.country}` : null,
      payment === "card" && cardData.number ? `Card ending in ${cardData.number.slice(-4)}` : null,
      attributionTag,
    ].filter(Boolean);

    const compiledNotes = notesParts.join(" | ");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: resolvedFullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.apartment ? `${form.address}, ${form.apartment}` : form.address,
          city: form.city,
          country: form.country,
          notes: compiledNotes || null,
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

      if (orderError || !order)
        throw orderError ?? new Error("Could not create order");

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
        }))
      );
      if (itemsError) throw itemsError;

      setPlacedOrderSummary({
        orderNumber: order.order_number,
        total,
        email: form.email,
        phone: form.phone,
        zone: DELIVERY[zone].label,
        itemsCount: items.reduce((acc, it) => acc + it.qty, 0),
      });

      clear();
      setPlaced(order.order_number);

      // Dual-channel Meta Pixel & Conversions API Purchase Event
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent(
            "Purchase",
            {
              value: total,
              currency: "RWF",
              orderId: order.order_number,
              numItems: items.reduce((acc, it) => acc + it.qty, 0),
              contentIds: items.map((i) => i.productId),
              contentType: "product",
            },
            {
              email: form.email || undefined,
              phone: form.phone || undefined,
              firstName: resolvedFirstName || undefined,
              lastName: resolvedLastName || undefined,
              city: form.city || undefined,
              country: form.country === "Rwanda" ? "rw" : "rw",
            }
          );
        })
        .catch(() => {});

      // Sync customer purchase and multi-touch attribution to CRM server-side
      try {
        const { getAttributionPayload } = await import("@/lib/attribution");
        const attr = getAttributionPayload();
        fetch("/api/crm-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: order.order_number,
            name: resolvedFullName,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            email: form.email,
            phone: form.phone,
            channel: "order",
            revenue: total,
            currency: "RWF",
            message: `Order #${order.order_number} placed for ${items.length} item(s) (${DELIVERY[zone].label})`,
            firstTouch: attr.firstTouch,
            lastTouch: attr.lastTouch,
            fbp: attr.fbp,
            fbc: attr.fbc,
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      } catch {}

      if (payment === "momo" || payment === "card") {
        try {
          const esiciaRes = await startEsiciaPayment({
            data: {
              orderNumber: order.order_number,
              phone: form.phone,
              amountRwf: total,
              method: payment === "card" ? "card" : "momo",
              customerName: resolvedFullName,
              customerEmail: form.email,
            },
          });
          if (esiciaRes.ok) {
            setMomo({ state: "prompted", reference: esiciaRes.referenceId });
          } else {
            const fallback = await startMomoPayment({
              data: {
                orderNumber: order.order_number,
                phone: form.phone,
                amountRwf: total,
              },
            });
            if (fallback.ok) setMomo({ state: "prompted", reference: fallback.referenceId });
            else setMomo({ state: "prompted", reference: `ESICIA-${order.order_number}` });
          }
        } catch {
          setMomo({ state: "prompted", reference: `ESICIA-${order.order_number}` });
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while processing your order. Please try again or reach out on WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshMomo() {
    if (!momo?.reference) return;
    setCheckingMomo(true);
    try {
      if (momo.reference.startsWith("ESICIA-")) {
        const esiciaStatus = await checkEsiciaPayment({
          data: { referenceId: momo.reference },
        });
        if (esiciaStatus.status === "SUCCESSFUL") {
          setMomo({ ...momo, state: "successful" });
          return;
        } else if (esiciaStatus.status === "FAILED") {
          setMomo({
            ...momo,
            state: "failed",
            message: esiciaStatus.reason || "Payment was declined or cancelled on your phone.",
          });
          return;
        }
      }
      const res = await checkMomoPayment({
        data: { referenceId: momo.reference },
      });
      if (res.status === "SUCCESSFUL")
        setMomo({ ...momo, state: "successful" });
      else if (res.status === "FAILED")
        setMomo({
          ...momo,
          state: "failed",
          message: "Payment was declined or cancelled on your phone.",
        });
    } finally {
      setCheckingMomo(false);
    }
  }

  function copyBankDetails() {
    const text =
      "Mosiac Studio Ltd\nBank of Kigali (BOK)\nAccount: 00040-12345678-90\nSWIFT: BOKIRWRW\nCurrency: RWF / USD\nReference: " +
      (placed || "ORDER-REF");
    navigator.clipboard?.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  }

  function copyTrackingLink() {
    if (!placed) return;
    const url = `${window.location.origin}/track-order?order=${encodeURIComponent(placed)}&email=${encodeURIComponent(placedOrderSummary?.email ?? form.email)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // =========================================================================
  // VIEW: POST-PURCHASE RECEIPT & ORDER CONFIRMATION
  // =========================================================================
  if (placed) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="container-x mx-auto max-w-[860px] py-14 md:py-20">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-12 text-center shadow-xs">
            {/* Success Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium tracking-wide">Studio Order Confirmed · Made to Order in Kigali</span>
            </div>

            <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl italic font-normal tracking-tight">
              Thank you for your commission
            </h1>

            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Your order number is{" "}
              <span className="font-mono font-bold text-foreground">{placed}</span>.
              A detailed confirmation invoice and studio schedule have been sent to{" "}
              <strong className="text-foreground">{placedOrderSummary?.email ?? form.email}</strong>.
            </p>

            {/* 4-Stage Atelier Tufting Timeline */}
            <div className="mt-10 rounded-2xl border border-border bg-background p-5 md:p-6 text-left shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Artisan Tufting Timeline
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Estimated 3–4 weeks
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-l-2 md:border-l-0 md:border-t-2 border-foreground pl-3 md:pl-0 md:pt-3">
                  <span className="text-xs font-bold text-foreground">1. Yarns Allocated</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Natural Highland &amp; NZ wool dyed to spec
                  </p>
                </div>
                <div className="border-l-2 md:border-l-0 md:border-t-2 border-border pl-3 md:pl-0 md:pt-3">
                  <span className="text-xs font-medium text-muted-foreground">2. Frame &amp; Canvas</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Monk's cloth stretched onto master frame
                  </p>
                </div>
                <div className="border-l-2 md:border-l-0 md:border-t-2 border-border pl-3 md:pl-0 md:pt-3">
                  <span className="text-xs font-medium text-muted-foreground">3. Hand-Tufting</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Relief carving, shearing &amp; contour work
                  </p>
                </div>
                <div className="border-l-2 md:border-l-0 md:border-t-2 border-border pl-3 md:pl-0 md:pt-3">
                  <span className="text-xs font-medium text-muted-foreground">4. QC &amp; Dispatch</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    White-glove delivery &amp; certificate seal
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Specific Status Card */}
            {payment === "momo" && (
              <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Mobile Money Verification · Esicia Rwanda Ltd
                    </h3>
                  </div>
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-amber-700">
                    K-Pay Gateway
                  </span>
                </div>
                {momo?.state === "prompted" ? (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We sent an instant Mobile Money push payment request for{" "}
                      <strong className="text-foreground">
                        {format({ rwf: placedOrderSummary?.total ?? total })}
                      </strong>{" "}
                      to <strong className="text-foreground">{placedOrderSummary?.phone ?? form.phone}</strong> via Esicia Rwanda Ltd.
                      Please enter your PIN on your phone to approve.
                    </p>
                    {momo.reference && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Reference:</span>
                        <code className="rounded bg-background px-2 py-0.5 font-mono text-xs text-foreground border border-border">
                          {momo.reference}
                        </code>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={refreshMomo}
                      disabled={checkingMomo}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background disabled:opacity-60 transition-all hover:bg-foreground/90"
                    >
                      {checkingMomo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Check Payment Approval Status
                    </button>
                  </div>
                ) : momo?.state === "successful" ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Payment confirmed via Esicia Rwanda Ltd! Wool reservation locked.</span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    If you did not see the prompt on your phone, dial{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">*182*7*1#</code> (MTN) or{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">*182*5#</code> (Airtel)
                    to approve pending requests, or contact our team via WhatsApp.
                  </p>
                )}
              </div>
            )}

            {payment === "card" && (
              <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Card Processing · Esicia K-Pay
                    </h3>
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase font-medium text-muted-foreground">
                    256-Bit SSL
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Your payment authorization has been initialized through Esicia Rwanda Ltd. Our atelier concierge will confirm wool batch reservation and charge upon final tufting inspection.
                </p>
                {momo?.reference && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Transaction ID:</span>
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                      {momo.reference}
                    </code>
                  </div>
                )}
              </div>
            )}

            {payment === "bank" && (
              <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Bank Wire &amp; SWIFT Transfer Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={copyBankDetails}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedAccount ? "Copied!" : "Copy banking details"}</span>
                  </button>
                </div>
                <div className="mt-3 grid gap-2.5 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-foreground">Bank:</span> Bank of Kigali (BOK)
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Account Name:</span> Mosiac Studio Ltd
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Account Number:</span> 00040-12345678-90
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">SWIFT:</span> BOKIRWRW
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-foreground">Payment Reference:</span>{" "}
                    <code className="font-mono font-bold text-foreground">{placed}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Self-Service Order Tracking Portal Card */}
            <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-left shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Private Loom Tracking &amp; Collector Portal
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Instant Access Link
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can bookmark your private tracking portal to watch your piece progress through every tufting stage in our Kigali atelier, view loom photographs, and submit your verified buyer review upon white-glove delivery.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/track-order"
                  search={{
                    order: placed,
                    email: placedOrderSummary?.email ?? form.email,
                    review: false,
                  }}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Launch Tracking Portal</span>
                </Link>

                <button
                  type="button"
                  onClick={copyTrackingLink}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedLink ? "Link Copied!" : "Copy Tracker Link"}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/catalogue"
                className="rounded-xl border border-border bg-background px-6 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                Continue Browsing
              </Link>
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                  `Hi Mosiac Studio, I just placed order ${placed}. Could you share an update on tufting scheduling?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all"
              >
                <span>WhatsApp Studio Concierge</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // VIEW: ACTIVE CHECKOUT
  // =========================================================================
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="container-x mx-auto max-w-[1240px] pb-24 pt-8 md:pt-12">
        {/* Step Navigation Bar */}
        <nav aria-label="Checkout steps" className="mb-8 border-b border-border pb-4">
          <div className="flex items-center justify-between sm:justify-start gap-2 overflow-x-auto text-xs no-scrollbar">
            {/* Step 1 Tab */}
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
                currentStep === 1
                  ? "font-semibold text-foreground"
                  : currentStep > 1
                  ? "text-foreground hover:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  currentStep === 1
                    ? "bg-foreground text-background"
                    : currentStep > 1
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 1 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "1"}
              </span>
              <span>1. Contact &amp; Shipping</span>
            </button>

            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

            {/* Step 2 Tab */}
            <button
              type="button"
              onClick={() => goToStep(2)}
              className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
                currentStep === 2
                  ? "font-semibold text-foreground"
                  : currentStep > 2
                  ? "text-foreground hover:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  currentStep === 2
                    ? "bg-foreground text-background"
                    : currentStep > 2
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 2 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "2"}
              </span>
              <span>2. Delivery &amp; Timeline</span>
            </button>

            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

            {/* Step 3 Tab */}
            <button
              type="button"
              onClick={() => goToStep(3)}
              className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
                currentStep === 3
                  ? "font-semibold text-foreground"
                  : currentStep > 3
                  ? "text-foreground hover:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  currentStep === 3
                    ? "bg-foreground text-background"
                    : currentStep > 3
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 3 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "3"}
              </span>
              <span>3. Studio Specifications</span>
            </button>

            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

            {/* Step 4 Tab */}
            <button
              type="button"
              onClick={() => goToStep(4)}
              className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
                currentStep === 4
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  currentStep === 4
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                4
              </span>
              <span>4. Payment &amp; Review</span>
            </button>
          </div>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
          <div>
            <span className="eyebrow text-accent">Direct Studio Commission</span>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl md:text-5xl italic font-normal tracking-tight">
              Order your hand-tufted rug
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Hand-tufted in Kigali · Authentic Highland Wool</span>
          </div>
        </div>

        {/* Empty Cart Warning */}
        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-serif text-2xl italic">Your bag is currently empty.</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Explore our ready catalogue to select a piece or configure a bespoke dimension with our Kigali studio.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/catalogue" })}
              className="mt-6 inline-flex rounded-xl bg-foreground px-6 py-3 text-xs font-semibold text-background hover:opacity-90 transition-all"
            >
              Explore Catalogue
            </button>
          </div>
        ) : (
          <form
            onSubmit={placeOrder}
            className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]"
          >
            {/* Left Column: Multi-Step Interactive Sections */}
            <div className="space-y-6">
              {/* ============================================================= */}
              {/* STEP 1: CONTACT & SHIPPING ADDRESS                            */}
              {/* ============================================================= */}
              <section
                className={`rounded-2xl border transition-all ${
                  currentStep === 1
                    ? "border-foreground/30 bg-card p-6 md:p-8 shadow-sm"
                    : "border-border bg-card/60 p-5"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        currentStep === 1
                          ? "bg-foreground text-background"
                          : currentStep > 1
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > 1 ? <Check className="h-4 w-4 stroke-[3]" /> : "1"}
                    </span>
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">
                        Customer Contact &amp; Shipping
                      </h2>
                      {currentStep > 1 && (
                        <p className="text-xs text-muted-foreground truncate max-w-sm">
                          {form.customer_name || `${form.firstName} ${form.lastName}`.trim()} ·{" "}
                          {form.address}, {form.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {currentStep === 1 && (
                  <div className="mt-6 space-y-4 animate-in fade-in duration-200">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="First Name"
                        required
                        placeholder="e.g. Marie Claire"
                        value={form.firstName}
                        onChange={(e) => handleFirstNameChange(e.target.value)}
                      />
                      <Field
                        label="Last Name"
                        required
                        placeholder="e.g. Uwase"
                        value={form.lastName}
                        onChange={(e) => handleLastNameChange(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Email Address"
                        type="email"
                        required
                        placeholder="name@domain.com"
                        value={form.email}
                        onChange={setField("email")}
                        helper="Order confirmation and loom update photos will be sent here."
                      />

                      <Field
                        label="Phone / WhatsApp"
                        type="tel"
                        required
                        placeholder="+250 788 123 456"
                        value={form.phone}
                        onChange={setField("phone")}
                        helper="For courier dispatch and Mobile Money prompt."
                      />
                    </div>

                    <Field
                      label="Street Address / Residence"
                      required
                      placeholder="e.g. KG 9 Ave, Nyarutarama or Villa gate number"
                      value={form.address}
                      onChange={setField("address")}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                            Country / Territory
                          </span>
                          <select
                            value={form.country}
                            onChange={(e) => {
                              const selectedCountry = e.target.value;
                              setForm((f) => ({
                                ...f,
                                country: selectedCountry,
                                city: selectedCountry === "Rwanda" ? "Kigali" : f.city,
                              }));
                              if (selectedCountry === "Rwanda") {
                                setZone("kigali");
                              } else {
                                setZone("international");
                              }
                            }}
                            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm outline-none focus:border-foreground"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <Field
                        label="City / Town"
                        placeholder="e.g. Kigali or Nairobi"
                        value={form.city}
                        onChange={setField("city")}
                      />

                      <Field
                        label="Apartment / Villa (Optional)"
                        placeholder="e.g. Apt 4B, Gate 2"
                        value={form.apartment}
                        onChange={setField("apartment")}
                      />
                    </div>

                    {/* Separate Billing Address Toggle */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={sameAsShipping}
                          onChange={(e) => setSameAsShipping(e.target.checked)}
                          className="h-4 w-4 rounded border-border accent-foreground"
                        />
                        <span className="text-foreground">
                          Billing address matches shipping address
                        </span>
                      </label>

                      {!sameAsShipping && (
                        <div className="mt-3.5 grid gap-3 sm:grid-cols-2 rounded-xl border border-border bg-muted/30 p-4 animate-in fade-in duration-150">
                          <div className="sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                              Separate Billing Details
                            </span>
                          </div>
                          <Field
                            label="Billing Name"
                            value={billingForm.name}
                            onChange={(e) =>
                              setBillingForm((b) => ({ ...b, name: e.target.value }))
                            }
                          />
                          <Field
                            label="Billing Country"
                            value={billingForm.country}
                            onChange={(e) =>
                              setBillingForm((b) => ({ ...b, country: e.target.value }))
                            }
                          />
                          <div className="sm:col-span-2">
                            <Field
                              label="Billing Street Address"
                              value={billingForm.address}
                              onChange={(e) =>
                                setBillingForm((b) => ({ ...b, address: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <span>Continue to Delivery</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ============================================================= */}
              {/* STEP 2: DELIVERY METHOD & PRODUCTION SCHEDULE                 */}
              {/* ============================================================= */}
              <section
                className={`rounded-2xl border transition-all ${
                  currentStep === 2
                    ? "border-foreground/30 bg-card p-6 md:p-8 shadow-sm"
                    : "border-border bg-card/60 p-5"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        currentStep === 2
                          ? "bg-foreground text-background"
                          : currentStep > 2
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > 2 ? <Check className="h-4 w-4 stroke-[3]" /> : "2"}
                    </span>
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">
                        Delivery Method &amp; Timeline
                      </h2>
                      {currentStep > 2 && (
                        <p className="text-xs text-muted-foreground">
                          {DELIVERY[zone].label} · {DELIVERY[zone].price === 0 ? "Free" : format({ rwf: DELIVERY[zone].price })}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentStep > 2 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {currentStep === 2 && (
                  <div className="mt-6 space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-3">
                      {(Object.keys(DELIVERY) as Zone[]).map((z) => {
                        const isSelected = zone === z;
                        return (
                          <label
                            key={z}
                            className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                              isSelected
                                ? "border-foreground bg-muted/40 shadow-xs"
                                : "border-border hover:border-foreground/40 bg-background/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="delivery_zone"
                                className="mt-1 h-4 w-4 accent-foreground"
                                checked={isSelected}
                                onChange={() => setZone(z)}
                              />
                              <div>
                                <span className="text-sm font-semibold text-foreground">
                                  {DELIVERY[z].label}
                                </span>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {DELIVERY[z].note}
                                </p>
                                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-foreground/80">
                                  <Clock className="h-3 w-3 text-accent" />
                                  {DELIVERY[z].time}
                                </span>
                              </div>
                            </div>

                            <div className="text-right sm:pl-4 shrink-0">
                              <span className="font-display text-sm font-bold">
                                {z === "international"
                                  ? "Quoted upon dispatch"
                                  : DELIVERY[z].price === 0
                                  ? "Free Delivery"
                                  : format({ rwf: DELIVERY[z].price })}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Studio Priority Rush Scheduling */}
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rushRequested}
                          onChange={(e) => setRushRequested(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
                        />
                        <div>
                          <span className="text-xs font-semibold text-foreground">
                            Request Priority Rush Scheduling
                          </span>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Have an event deadline or housewarming move-in date? Check this and note your target date below. Our atelier manager will prioritize your loom allocation.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <span>Continue to Specifications</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ============================================================= */}
              {/* STEP 3: STUDIO SPECIFICATIONS & CUSTOMIZATION                 */}
              {/* ============================================================= */}
              <section
                className={`rounded-2xl border transition-all ${
                  currentStep === 3
                    ? "border-foreground/30 bg-card p-6 md:p-8 shadow-sm"
                    : "border-border bg-card/60 p-5"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        currentStep === 3
                          ? "bg-foreground text-background"
                          : currentStep > 3
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > 3 ? <Check className="h-4 w-4 stroke-[3]" /> : "3"}
                    </span>
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">
                        Artisan Backing &amp; Personalization
                      </h2>
                      {currentStep > 3 && (
                        <p className="text-xs text-muted-foreground">
                          {backing === "latex" ? "Anti-Slip Latex" : backing === "wall_loops" ? "Wall Tapestry Loops" : "Reinforced Felt"}
                          {isGift ? " · Gift card included" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentStep > 3 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {currentStep === 3 && (
                  <div className="mt-6 space-y-5 animate-in fade-in duration-200">
                    {/* Rug Backing Preference */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                        Rug Backing &amp; Installation Finish
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {BACKING_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBacking(opt.id)}
                            className={`rounded-xl border p-4 text-left transition-all flex flex-col justify-between ${
                              backing === opt.id
                                ? "border-foreground bg-muted/40 shadow-xs"
                                : "border-border hover:border-foreground/40 bg-background/60"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                  {opt.title}
                                </span>
                                {backing === opt.id && (
                                  <Check className="h-3.5 w-3.5 text-foreground" />
                                )}
                              </div>
                              <span className="text-[11px] text-accent block mt-0.5">
                                {opt.subtitle}
                              </span>
                              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Complimentary Handwritten Gift Card */}
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGift}
                          onChange={(e) => setIsGift(e.target.checked)}
                          className="h-4 w-4 rounded border-border accent-foreground"
                        />
                        <div className="flex items-center gap-1.5">
                          <Gift className="h-4 w-4 text-accent" />
                          <span className="text-xs font-semibold text-foreground">
                            Complimentary Handwritten Studio Gift Note
                          </span>
                        </div>
                      </label>

                      {isGift && (
                        <div className="mt-3.5 grid gap-3 sm:grid-cols-2 pt-3 border-t border-border animate-in fade-in duration-150">
                          <Field
                            label="Recipient Name"
                            placeholder="e.g. Kalisa & Aline"
                            value={giftRecipient}
                            onChange={(e) => setGiftRecipient(e.target.value)}
                          />
                          <div className="sm:col-span-2">
                            <label className="block">
                              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                Personal Handwritten Message
                              </span>
                              <textarea
                                rows={2}
                                value={giftMessage}
                                onChange={(e) => setGiftMessage(e.target.value)}
                                placeholder="Write a note to be hand-penned on heavy cotton cardstock by our Kigali team..."
                                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-foreground"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Atelier Notes */}
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">
                        Atelier Tufting Notes / Placement Details (Optional)
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={setField("notes")}
                        rows={3}
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-foreground"
                        placeholder="Specific yarn nuances, gate codes for delivery, custom orientation, etc."
                      />
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(4)}
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ============================================================= */}
              {/* STEP 4: PAYMENT METHOD                                        */}
              {/* ============================================================= */}
              <section
                className={`rounded-2xl border transition-all ${
                  currentStep === 4
                    ? "border-foreground/30 bg-card p-6 md:p-8 shadow-sm"
                    : "border-border bg-card/60 p-5"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        currentStep === 4
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      4
                    </span>
                    <h2 className="font-display text-base font-semibold text-foreground">
                      Payment Method
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Encrypted &amp; Secure
                  </span>
                </div>

                {currentStep === 4 && (
                  <div className="mt-6 space-y-3 animate-in fade-in duration-200">
                    {PAYMENTS.map((p) => {
                      const isSelected = payment === p.id;
                      const IconComponent = p.icon;
                      return (
                        <div key={p.id}>
                          <label
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                              isSelected
                                ? "border-foreground bg-muted/40 shadow-xs"
                                : "border-border hover:border-foreground/40 bg-background/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="payment_choice"
                                className="h-4 w-4 accent-foreground"
                                checked={isSelected}
                                onChange={() => setPayment(p.id)}
                              />
                              <IconComponent className="h-5 w-5 text-foreground shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {p.label}
                                  </span>
                                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    {p.badge}
                                  </span>
                                </div>
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  {p.sublabel}
                                </span>
                              </div>
                            </div>
                          </label>

                          {/* Sub-Panel for MoMo */}
                          {isSelected && p.id === "momo" && (
                            <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                              <p className="font-semibold text-foreground">
                                Mobile Money Push Prompt
                              </p>
                              <p>
                                Upon clicking <strong className="text-foreground">Place Order</strong>, an instant push approval prompt for{" "}
                                <strong className="text-foreground">{format({ rwf: total })}</strong> will be routed directly to{" "}
                                <span className="font-mono text-foreground font-semibold">
                                  {form.phone || "(your phone number)"}
                                </span>.
                              </p>
                            </div>
                          )}

                          {/* Sub-Panel for Credit Card */}
                          {isSelected && p.id === "card" && (
                            <div className="mt-2 rounded-xl border border-border bg-background p-4 sm:p-5 space-y-3">
                              <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                                Card Details · Esicia K-Pay
                              </span>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="block">
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                      Card Number
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="4000 1234 5678 9010"
                                      value={cardData.number}
                                      onChange={handleCardNumberChange}
                                      className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-foreground"
                                    />
                                  </label>
                                </div>
                                <Field
                                  label="Cardholder Name"
                                  placeholder="Name on card"
                                  value={cardData.name}
                                  onChange={(e) =>
                                    setCardData((c) => ({ ...c, name: e.target.value }))
                                  }
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="block">
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                      Expires
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="MM/YY"
                                      value={cardData.expiry}
                                      onChange={handleExpiryChange}
                                      className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-foreground text-center"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                      CVC
                                    </span>
                                    <input
                                      type="password"
                                      maxLength={4}
                                      placeholder="•••"
                                      value={cardData.cvc}
                                      onChange={(e) =>
                                        setCardData((c) => ({
                                          ...c,
                                          cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                                        }))
                                      }
                                      className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-foreground text-center"
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>256-bit SSL encrypted. Payment tokenized upon studio confirmation.</span>
                              </div>
                            </div>
                          )}

                          {/* Sub-Panel for Bank Wire */}
                          {isSelected && p.id === "bank" && (
                            <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                              <p className="font-semibold text-foreground">
                                Direct Studio Wire Transfer
                              </p>
                              <p>
                                You will receive an official invoice with Bank of Kigali &amp; I&amp;M Bank routing details immediately upon submitting your order.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Sticky Order Summary */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <h2 className="font-display text-base font-semibold">
                    Order Summary
                  </h2>
                  <div className="flex items-center gap-2">
                    <CurrencyDropdown variant="compact" placement="down" align="right" />
                    <span className="text-xs text-muted-foreground">
                      {items.reduce((acc, it) => acc + it.qty, 0)}{" "}
                      {items.reduce((acc, it) => acc + it.qty, 0) === 1 ? "piece" : "pieces"}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <ul className="mt-4 divide-y divide-border/60 max-h-[340px] overflow-y-auto pr-1">
                  {items.map((i) => (
                    <li key={i.key} className="flex gap-3 py-3.5">
                      {i.image && (
                        <img
                          src={resolveImage(i.image)}
                          alt={i.name}
                          className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="truncate text-xs font-semibold text-foreground">
                              {i.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => remove(i.key)}
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {[i.sizeLabel, i.color].filter(Boolean).join(" · ")}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-0.5 bg-background">
                            <button
                              type="button"
                              onClick={() => setQty(i.key, Math.max(1, i.qty - 1))}
                              aria-label="Decrease quantity"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-semibold tabular-nums px-1">
                              {i.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(i.key, i.qty + 1)}
                              aria-label="Increase quantity"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-display text-xs font-semibold text-foreground">
                            {format({ rwf: (i.unitPriceRwf ?? 0) * i.qty })}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Promo Code Input */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo or Studio Voucher"
                      className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-foreground uppercase placeholder:normal-case"
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponInput.trim()}
                      onClick={applyCoupon}
                      className="h-10 rounded-xl border border-foreground bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                    </button>
                  </div>

                  {couponError && (
                    <p className="mt-1.5 text-xs text-destructive">{couponError}</p>
                  )}
                  {coupon && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="font-medium">
                        {coupon.code} applied ({coupon.note})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCoupon(null)}
                        className="hover:opacity-75"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Financial Breakdown */}
                <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-medium">{format({ rwf: subtotal })}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium">
                      <span>Promo Discount ({coupon?.code})</span>
                      <span>− {format({ rwf: discount })}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Delivery ({DELIVERY[zone].label.split(" ")[0]})</span>
                    <span className="text-foreground font-medium">
                      {zone === "international"
                        ? "Quoted"
                        : delivery === 0
                        ? "Free"
                        : format({ rwf: delivery })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                    <dt className="text-sm font-display">Total</dt>
                    <dd className="font-display text-base text-foreground">
                      {format({ rwf: total })}
                    </dd>
                  </div>
                </dl>

                {error && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Place Order CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-xs font-bold uppercase tracking-wider text-background hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing Order…</span>
                    </>
                  ) : (
                    <span>Place Order · {format({ rwf: total })}</span>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                  By placing your order, you agree to Mosiac's{" "}
                  <Link to="/terms" target="_blank" className="underline hover:text-foreground">
                    Terms &amp; Policies
                  </Link>{" "}
                  and authorize Mosiac Studio to hand-tuft your pieces made to order in Kigali.
                </p>
              </div>

              {/* Studio Guarantees */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Mosiac Atelier Guarantees</span>
                </div>
                <ul className="space-y-1.5 text-[11px] leading-relaxed pl-1">
                  <li>• 100% hand-tufted in Kigali with Highland &amp; New Zealand wool</li>
                  <li>• Signed Certificate of Authenticity with unique serial number</li>
                  <li>• Private live tracking portal with loom photographs</li>
                  <li>• Dedicated WhatsApp concierge for questions anytime</li>
                </ul>
              </div>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  helper,
  ...props
}: {
  label: string;
  helper?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label} {props.required && <span className="text-destructive">*</span>}
      </span>
      <input
        {...props}
        className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm outline-none focus:border-foreground"
      />
      {helper && <span className="mt-1 block text-[11px] text-muted-foreground">{helper}</span>}
    </label>
  );
}
