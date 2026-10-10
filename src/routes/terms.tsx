import * as React from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  Tag,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Nav, Footer, WHATSAPP_URL } from "@/components/site-chrome";

export const Route = createFileRoute("/terms")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Terms & Policies | Mosiac Rugs Kigali" },
      {
        name: "description",
        content:
          "Official terms of service, privacy policy, shipping, bespoke commission agreements, and artisan warranties for Mosiac handcrafted rugs in Kigali, Rwanda.",
      },
      { property: "og:title", content: "Terms & Policies | Mosiac Rugs Kigali" },
      {
        property: "og:description",
        content:
          "Official terms of service, privacy policy, shipping, bespoke commission agreements, and artisan warranties for Mosiac handcrafted rugs in Kigali, Rwanda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

type PolicyTab = "terms" | "privacy" | "shipping" | "bespoke" | "returns" | "vouchers";

interface PolicySectionInfo {
  id: PolicyTab;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  summary: string;
}

const SECTIONS: PolicySectionInfo[] = [
  {
    id: "terms",
    title: "Terms of Service",
    shortTitle: "Terms",
    icon: <ShieldCheck className="h-4 w-4" />,
    summary: "Atelier purchase terms, lead times, artisan variations, and payment policies.",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    icon: <Lock className="h-4 w-4" />,
    summary: "How we protect your personal contact, delivery details, and studio communication.",
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    shortTitle: "Shipping",
    icon: <Truck className="h-4 w-4" />,
    summary: "Kigali local courier, East African transit, and global DHL Express air freight.",
  },
  {
    id: "bespoke",
    title: "Bespoke & Custom Orders",
    shortTitle: "Bespoke",
    icon: <Sparkles className="h-4 w-4" />,
    summary: "Yarn swatches, dimension approval, 50% deposit, and custom weaving schedules.",
  },
  {
    id: "returns",
    title: "Returns & Artisan Warranty",
    shortTitle: "Returns & Warranty",
    icon: <RotateCcw className="h-4 w-4" />,
    summary: "1-year tufting structural warranty, inspection upon delivery, and exchange terms.",
  },
  {
    id: "vouchers",
    title: "Atelier Credits & Vouchers",
    shortTitle: "Credits & Vouchers",
    icon: <Tag className="h-4 w-4" />,
    summary: "Rules for our 55,000 RWF studio voucher, promotional credits, and code usage.",
  },
];

function TermsPage() {
  const search = useSearch({ from: "/terms" });
  const [activeTab, setActiveTab] = React.useState<PolicyTab>(() => {
    const valid = SECTIONS.some((s) => s.id === search.tab);
    return valid ? (search.tab as PolicyTab) : "terms";
  });

  React.useEffect(() => {
    if (search.tab && SECTIONS.some((s) => s.id === search.tab)) {
      setActiveTab(search.tab as PolicyTab);
    }
  }, [search.tab]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/20">
      <Nav />

      <main className="flex-1 pb-20 pt-28 sm:pt-32">
        {/* HEADER SECTION */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-border/60 pb-8 sm:pb-12">
            <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Studio Legal &amp; Client Standards</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Terms &amp; Policies
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground font-light">
              Transparent, fair commitments for every collector, interior designer, and atelier patron.
              Handcrafted in Kigali, Rwanda with enduring artisan integrity.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground/80">
              <span>Effective Date: January 1, 2026</span>
              <span>•</span>
              <span>Governing Jurisdiction: Kigali, Rwanda</span>
              <span>•</span>
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent("Hello Mosiac Studio, I have a question regarding your atelier terms and policies.")}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline hover:text-foreground inline-flex items-center gap-1"
              >
                Inquire via WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* TAB SELECTOR (DESKTOP & MOBILE SCROLLABLE) */}
          <div className="mt-8 border-b border-border/60 pb-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              {SECTIONS.map((sec) => {
                const isActive = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-foreground text-background shadow-xs scale-[1.02]"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {sec.icon}
                    <span>{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT SIDEBAR NAVIGATION / SUMMARY (DESKTOP ONLY) */}
            <aside className="hidden lg:block lg:col-span-4 space-y-4">
              <div className="sticky top-32 rounded-3xl border border-border/60 bg-muted/15 p-6 space-y-4">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Policy Navigator
                </span>
                <nav className="space-y-1.5">
                  {SECTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveTab(sec.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                        activeTab === sec.id
                          ? "bg-muted font-bold text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {sec.icon}
                        <span>{sec.shortTitle}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </button>
                  ))}
                </nav>

                <div className="pt-4 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-foreground block mb-1">
                    Need immediate assistance?
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    Our atelier concierge is available daily to assist with custom commissions, lead times, and courier logistics.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
                  >
                    Contact Atelier
                  </Link>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT DISPLAY */}
            <div className="lg:col-span-8 space-y-12">
              {/* TAB 1: TERMS OF SERVICE */}
              {activeTab === "terms" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Terms of Service
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      By viewing our catalogue, placing an order, or commissioning a bespoke rug through Mosiac Studio (Kigali, Rwanda), you agree to the following terms and artisan standards.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        1. Artisan Handcraft &amp; Natural Variations
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Every Mosiac piece is hand-tufted by master craftspeople using pure Rwandan and New Zealand wool yarns. Because our pieces are genuinely handmade rather than mass machine-produced, minor variations in pile height (±2mm), subtle yarn dye depth, and organic edge contouring are authentic characteristics of heirloom craft, not defects.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        2. Lead Times &amp; Atelier Production
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Ready-to-ship stock rugs are dispatched from our Kigali studio within 24–48 hours. Made-to-order catalog pieces require approximately <strong>2 to 4 weeks</strong> for tufting, latex backing, shearing, and hand-carving. Bespoke large-format commissions typically require <strong>3 to 6 weeks</strong>. We provide photo &amp; video loom progress updates directly via WhatsApp upon request.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        3. Pricing, Currencies &amp; Payment Options
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Prices are listed in Rwandan Francs (RWF) and United States Dollars (USD). We accept Rwandan Mobile Money (MTN MoMo), Airtel Money, international Credit/Debit cards (Visa, MasterCard), and direct Bank Wire transfers. All orders must be settled in full prior to physical dispatch, except for verified 50% bespoke commission deposits.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        4. Intellectual Property &amp; Designs
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        All original rug compositions, visual assets, photography, and lookbook monograph publications are the exclusive intellectual property of Mosiac Studio. Custom client commissions remain co-protected against commercial reproduction without written studio authorization.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 2: PRIVACY POLICY */}
              {activeTab === "privacy" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Privacy Policy
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      We treat our collectors&apos; personal data with the same uncompromising care and discretion that goes into our handcrafted rugs.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        1. Data We Collect
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        When you place an order, claim an atelier voucher, or request a custom commission, we collect your name, email address, WhatsApp / phone number, and physical delivery address. We never collect or store raw payment card data on our servers; card transactions are processed securely through certified banking gateways.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        2. How We Use Your Information
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Your contact details are used exclusively to:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <li>Fulfill and deliver your handcrafted rug orders.</li>
                        <li>Send your requested 55,000 RWF atelier voucher directly to your inbox.</li>
                        <li>Provide real-time WhatsApp updates on loom shearing and courier dispatch.</li>
                        <li>Occasionally notify you of seasonal collection drops (you may opt out at any time).</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        3. Zero Third-Party Selling
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        We never sell, rent, or monetize client data to third-party advertisers or brokers. Your details are shared solely with verified logistics partners (such as DHL Express or local Kigali couriers) strictly to ensure safe doorstep delivery.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        4. Marketing Attribution, Cookies &amp; Meta Conversions API (CAPI)
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        To accurately evaluate our advertising effectiveness on Meta (Facebook &amp; Instagram) and Google, our website employs modern first-party measurement technologies:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <li><strong>First-Party Cookies (_fbp &amp; _fbc):</strong> Standard first-party identifiers stored locally for up to 90 days to attribute website visits to specific campaign clicks.</li>
                        <li><strong>Meta Conversions API (CAPI):</strong> Server-to-server conversion measurement. When a commission inquiry or purchase occurs, contact identifiers are strictly normalized and irreversibly hashed using SHA-256 cryptographic standards before transmission. Raw PII is never transmitted.</li>
                        <li><strong>Deduplication &amp; Privacy Consent:</strong> Dual browser and server signals are matched via unique event IDs to prevent duplicate counting. We strictly honor your privacy consent preferences: no marketing tracking triggers if you select Essential Only.</li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 3: SHIPPING & DELIVERY */}
              {activeTab === "shipping" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Shipping &amp; Delivery Policy
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Safe, insured white-glove transport from our Kigali workshop to your doorstep across Rwanda, East Africa, and worldwide.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Kigali Metro Delivery &amp; Showroom Pickup
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Within Kigali City limits, delivery is handled via our private studio courier for <strong>5,000 RWF</strong>, or completely free for orders over 250,000 RWF. Complimentary in-person collection is also available at our Kigali workshop by appointment.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Rwanda Regional &amp; East African Corridor
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        For provincial Rwanda (Musanze, Rubavu, Huye) and neighboring East African capitals (Nairobi, Kampala, Dar es Salaam), rugs are rolled in breathable waterproof canvas wraps and dispatched with regional registered overland express couriers.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Worldwide DHL Express Air Freight
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        International deliveries to North America, Europe, the Middle East, and Asia are shipped via fully tracked DHL Express air freight (estimated 4–7 business days transit). Tracking numbers and insurance documents are emailed immediately upon courier pickup.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 4: BESPOKE & CUSTOM ORDERS */}
              {activeTab === "bespoke" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Bespoke &amp; Custom Orders
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Custom rug commissions are the beating heart of Mosiac. Here is how we ensure seamless creative collaboration.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        1. Design Consultation &amp; Color Approvals
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Before commencing yarn dyeing or frame mounting, our design team prepares a scale digital rendering and confirms your desired color palette against physical wool swatches. We require your explicit sign-off on dimensions and colors.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        2. 50% Deposit &amp; Balance Settlement
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Custom commissions require an initial <strong>50% deposit</strong> to procure wool lots and begin tufting. The remaining 50% balance is payable upon completion, once we share high-resolution studio photos of the finished piece.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        3. Custom Cancellation Terms
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Because bespoke pieces are tailored to unique dimensions and color specifications, the 50% deposit becomes non-refundable once tufting has commenced on the loom. Modifications can be accommodated during the initial swatch consultation phase.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 5: RETURNS & ARTISAN WARRANTY */}
              {activeTab === "returns" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Returns &amp; Artisan Warranty
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      We stand firmly behind the structural longevity and craftsmanship of every tuft that leaves our Kigali loom.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        1-Year Structural Craftsmanship Warranty
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        All Mosiac rugs carry a comprehensive <strong>1-Year Warranty</strong> covering yarn tuft integrity, backing adhesion, and edge binding. If any unexpected unraveling occurs under ordinary residential use, our atelier will repair or rebind the rug free of charge.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Inspection Upon Delivery
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Please unroll and inspect your piece within <strong>7 days</strong> of delivery. In the rare event of transit damage or an incorrect size dispatch, contact our studio immediately with photographs, and we will arrange an expedited collection and replacement.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 6: ATELIER CREDITS & VOUCHERS */}
              {activeTab === "vouchers" && (
                <section className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      Atelier Credit &amp; Voucher Terms
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Terms governing our welcome gift credits and promotional voucher codes.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-light">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        55,000 RWF Atelier Welcome Credit
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Our 55,000 RWF welcome voucher is manually issued to new patrons subscribing to the studio monograph and atelier updates. The voucher is single-use, non-transferable, and applicable toward any catalog rug or custom commission with an order value of 250,000 RWF or higher.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Manual Dispatch Verification
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        To prevent automated bot abuse, each voucher code is reviewed and manually emailed by our Kigali atelier team within 24 hours of form submission. Only one voucher may be applied per customer order.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* BOTTOM CALL TO ACTION */}
              <div className="rounded-3xl border border-border/80 bg-muted/30 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Have questions about an upcoming commission?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
                    Speak directly with our Kigali atelier director regarding yarn options, delivery logistics, or trade terms.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent("Hello Mosiac, I'd like to ask a question about your terms and ordering.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
                  >
                    WhatsApp Studio <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    to="/catalogue"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Browse Rugs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
