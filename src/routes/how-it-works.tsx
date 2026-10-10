import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/site-chrome";
import { RequestCallback, NewsletterWeekly } from "@/components/blocks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_SECTIONS, SUPPORT_EMAIL } from "@/lib/faq-content";
import { Sparkles, ShieldCheck, Feather, Truck, ArrowRight, HelpCircle, Scissors, RefreshCw } from "lucide-react";
import { useFeaturedImage } from "@/lib/site-images-client";
import craftRoseTufting from "@/assets/craft-rose-tufting.jpg";
import craftBlueScallop from "@/assets/craft-blue-scallop.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "About & Atelier Method | Mosiac Handcrafted Rugs" },
      { name: "description", content: "Discover how Mosiac hand-tufts one-of-one rugs in Kigali. Pure Highland wool, artisanal hand-carving, and bespoke delivery in 3 to 4 weeks." },
      { property: "og:title", content: "About & Atelier Method | Mosiac" },
      { property: "og:description", content: "From sketch to doorstep: the craft of Rwandan hand-tufted floor art." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowPage,
});

const PILLARS = [
  {
    icon: Feather,
    title: "100% Highland Wool",
    desc: "Sourced from pure high-altitude fleece for high resilience, natural lanolin stain repellency, and dense tactile warmth underfoot.",
  },
  {
    icon: Sparkles,
    title: "Sculptural Micro-Carving",
    desc: "Every outline and curve is sheared by hand using duckbill scissors, creating multi-dimensional shadows and textural relief.",
  },
  {
    icon: ShieldCheck,
    title: "Organic Cotton & Latex",
    desc: "Secured with natural botanical latex and a heavy unbleached cotton backing, finished with studio-locked hand stitching.",
  },
  {
    icon: Truck,
    title: "Doorstep Delivery",
    desc: "Meticulously rolled, wrapped in breathable canvas, and dispatched with care: hand-delivered in Kigali or worldwide via DHL Express.",
  },
];

const STEPS = [
  {
    step: "01",
    phase: "The Concept & Palette",
    title: "Translating your vision",
    desc: "Browse our catalogue or commission a custom silhouette. Our design team matches your room scheme to hand-dyed wool pom-poms, calibrates exact dimensions, and produces a scaled digital render before any yarn is threaded.",
  },
  {
    step: "02",
    phase: "The Loom & Tufting",
    title: "Handcrafted strand by strand",
    desc: "Over stretched primary monk's cloth, artisans tuft individual wool loops using pneumatic and hand tufting tools. With over 50,000 tufts per square meter, the resulting pile is dense, plush, and structurally unyielding.",
  },
  {
    step: "03",
    phase: "Finishing & Hand-Carving",
    title: "Sculptural contour relief",
    desc: "Once vulcanized with organic natural latex, the rug is hand-sheared across varying pile heights. Our master artisans bevel every border by hand, turning flat patterns into tactile architectural terrain.",
  },
  {
    step: "04",
    phase: "Inspection & White-Glove Dispatch",
    title: "Ready for decades of living",
    desc: "Each piece receives our signature twill edge-lock, archival label, and thorough quality inspection. Most custom rugs are completed and delivered to your space in 3 to 4 weeks.",
  },
];

function HowPage() {
  const [activeGuidance, setActiveGuidance] = useState<string>("care");
  const craftRoseImg = useFeaturedImage("craft_rose_tufting", craftRoseTufting);
  const craftBlueImg = useFeaturedImage("craft_blue_scallop", craftBlueScallop);

  const guidanceTabs = [
    { id: "care", label: "Care & Longevity" },
    { id: "custom", label: "Custom & Bespoke" },
    { id: "general", label: "Materials & Craft" },
    { id: "shipping", label: "Shipping & Delivery" },
  ];

  const currentSection =
    FAQ_SECTIONS.find((s) => s.id === activeGuidance) || FAQ_SECTIONS[0];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="w-full max-w-full overflow-x-clip">
        {/* HERO SECTION: Editorial Atelier Statement */}
        <section className="container-x mx-auto max-w-[1300px] pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <span className="eyebrow text-accent font-medium tracking-[0.24em]">
              L'Atelier Mosiac · Kigali, Rwanda
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-foreground leading-[1.08]">
              The Art of the <span className="font-serif italic font-normal">Hand-Tufted</span> Rug.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-light">
              We believe a rug is an architectural anchor: an art object meant to be walked on, lived with, and passed down. Every piece is crafted to order in our Kigali studio from pure Highland wool, sculpted by artisans, and finished entirely by hand.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/custom"
                className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all inline-flex items-center gap-2"
              >
                <span>Commission Bespoke</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/craft"
                className="rounded-full border border-border/80 bg-background px-6 py-3 text-xs uppercase tracking-widest font-semibold text-foreground hover:bg-muted/50 transition-all inline-flex items-center gap-1.5"
              >
                <span>Explore Our Craft</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent" />
              </Link>
              <Link
                to="/catalogue"
                className="rounded-full border border-border/80 bg-background px-6 py-3 text-xs uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Explore Catalogue
              </Link>
            </div>
          </div>
        </section>

        {/* ATELIER PILLARS: Minimal Chic Row */}
        <section className="border-y border-border/60 bg-muted/20 py-16 md:py-20">
          <div className="container-x mx-auto max-w-[1300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {PILLARS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="flex flex-col items-start">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-background border border-border/80 text-foreground shadow-2xs mb-4">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <h2 className="font-display text-base sm:text-lg font-medium tracking-tight text-foreground">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* THE ATELIER PROCESS: High-End Editorial Sequence */}
        <section className="py-20 md:py-32">
          <div className="container-x mx-auto max-w-[1300px]">
            <div className="max-w-2xl mb-16 md:mb-24">
              <span className="eyebrow text-muted-foreground">The Four Stages</span>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-normal tracking-tight">
                From sketch to <span className="font-serif italic">doorstep</span>.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Our bespoke process marries digital rendering precision with time-honored tufting techniques. No assembly lines, no industrial shortcuts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-border/70 bg-card p-7 sm:p-9 shadow-xs hover:border-border transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-baseline justify-between border-b border-border/40 pb-4 mb-6">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Phase {s.step}
                      </span>
                      <span className="font-serif text-3xl italic text-accent/80 font-normal">
                        {s.step}
                      </span>
                    </div>
                    <span className="eyebrow text-accent">{s.phase}</span>
                    <h3 className="mt-2 font-display text-xl sm:text-2xl font-medium tracking-tight text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground font-light">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EDITORIAL OUR CRAFT SHOWCASE FEATURE */}
        <section className="border-t border-border/60 bg-[#FAF8F5] dark:bg-[#0E0E10] py-20 md:py-28">
          <div className="container-x mx-auto max-w-[1300px]">
            <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 md:p-16 shadow-xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Deep-Dive Savoir-Faire</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground leading-[1.1]">
                    The Discipline of the Hand. <span className="font-serif italic font-light text-accent">Explore Our Craft</span>.
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                    Every Mosiac rug is an architectural sandwich engineered for decades of living: 100% pure high-altitude Highland wool, high-density stretched loom tufting, botanical vulcanized rubber milk, and hand-carved duckbill shear reliefs that cast 3D shadows under natural light.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-border/70 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Material</span>
                      <span className="font-semibold text-foreground">100% Wool</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Density</span>
                      <span className="font-semibold text-foreground">50k+ Tufts/m²</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Technique</span>
                      <span className="font-semibold text-foreground">3D Beveling</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Origin</span>
                      <span className="font-semibold text-foreground">Kigali Studio</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3 items-center">
                    <Link
                      to="/craft"
                      className="rounded-full bg-foreground px-6 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2 shadow cursor-pointer"
                    >
                      <span>Explore Our Craft &amp; Savoir-Faire</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/lookbook"
                      className="rounded-full border border-border bg-background px-5 py-3.5 text-xs uppercase tracking-widest font-semibold text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                    >
                      View Lookbook Monograph
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-border/80 relative bg-neutral-900 group shadow-md">
                    <img
                      src={craftRoseImg}
                      alt="Artisan tufting on vertical loom in Kigali studio"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-[10px] font-mono text-white/90 uppercase tracking-widest">
                      Loom Tufting
                    </span>
                  </div>

                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-border/80 relative bg-neutral-900 group shadow-md mt-6">
                    <img
                      src={craftBlueImg}
                      alt="Duckbill shear micro-carving detail"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-[10px] font-mono text-white/90 uppercase tracking-widest">
                      Duckbill Beveling
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ATELIER GUIDANCE & INQUIRIES (REORGANIZED CHIC ACCORDION & TOPIC SELECTOR) */}
        <section className="border-t border-border/60 py-20 md:py-28 bg-background">
          <div className="container-x mx-auto max-w-[1100px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-border/60">
              <div>
                <span className="eyebrow text-muted-foreground">Studio Guidance</span>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight">
                  Care, Craftsmanship, & <span className="font-serif italic font-normal">Commissions</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground font-light">
                  Key atelier guidance on living with pure Highland wool, custom dimensions, and express delivery.
                </p>
              </div>
              <Link
                to="/faq"
                className="self-start md:self-auto text-xs font-semibold uppercase tracking-wider text-foreground hover:text-accent underline underline-offset-4"
              >
                Open Full Knowledge Base →
              </Link>
            </div>

            {/* Reorganized Topic Selector Tabs */}
            <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {guidanceTabs.map((tab) => {
                const isActive = activeGuidance === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveGuidance(tab.id)}
                    className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-foreground text-background shadow-2xs"
                        : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Active Topic Q&A (Default Collapsed, Chic & Focused) */}
            <div className="mt-8">
              {currentSection.subtitle && (
                <p className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {currentSection.subtitle}
                </p>
              )}

              <Accordion type="single" collapsible className="space-y-3">
                {currentSection.items.map((it, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`${currentSection.id}-${idx}`}
                    className="rounded-2xl border border-border/70 bg-card px-5 sm:px-6 shadow-2xs hover:border-border transition-colors"
                  >
                    <AccordionTrigger className="text-left text-sm sm:text-base font-medium py-4.5 text-foreground hover:no-underline">
                      {it.q}
                    </AccordionTrigger>
                    <AccordionContent className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground pb-5 font-light">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Refined Concierge Card */}
            <div className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="max-w-xl text-center sm:text-left">
                <p className="font-display text-xl sm:text-2xl font-medium text-foreground">
                  Need personalized advice?
                </p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                  Speak with a studio specialist about sizing recommendations, custom palettes, or commissioning an exclusive design. You can also write to us directly at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4 hover:text-accent">
                    {SUPPORT_EMAIL}
                  </a>.
                </p>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <RequestCallback className="w-full sm:w-auto" />
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <Link to="/custom" className="rounded-full bg-foreground px-7 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all">
                Start a custom order →
              </Link>
              <Link to="/catalogue" className="rounded-full border border-border/80 px-7 py-3.5 text-xs uppercase tracking-widest font-semibold text-foreground hover:bg-muted/40 transition-all">
                Browse catalogue
              </Link>
            </div>
          </div>
        </section>

        <NewsletterWeekly />
      </main>
      <Footer />
    </div>
  );
}
