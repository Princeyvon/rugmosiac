import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, Ruler, Heart, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Nav,
  Footer,
  FloatingWhatsApp,
  WHATSAPP_URL,
  resolveImage,
} from "@/components/site-chrome";
import { useCurrency } from "@/lib/currency";
import { getProduct } from "@/lib/catalogue.functions";


const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });

export const Route = createFileRoute("/catalogue/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQO(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Mosiac` },
          { name: "description", content: loaderData.short_description ?? "Hand-tufted rug, made to order in Kigali." },
          { property: "og:title", content: `${loaderData.name} — Mosiac` },
          { property: "og:description", content: loaderData.short_description ?? "" },
          ...(loaderData.main_image_url ? [{ property: "og:image", content: loaderData.main_image_url }] : []),
        ]
      : [{ title: "Rug — Mosiac" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="container-x mx-auto max-w-[1400px] py-32 text-center">
        <h1 className="font-serif text-5xl italic">Rug not found.</h1>
        <Link to="/catalogue" className="mt-6 inline-block text-accent">← Back to catalogue</Link>
      </div>
      <Footer />
    </div>
  ),
  component: ProductPage,
});

const COLOR_SWATCHES: Array<{ name: string; gradient: string }> = [
  { name: "Buttermilk", gradient: "linear-gradient(90deg,#f2e6a8,#cfe3d8)" },
  { name: "Moss", gradient: "linear-gradient(90deg,#4a5d34,#e6c9c1)" },
  { name: "Terracotta", gradient: "linear-gradient(90deg,#4a2b17,#a97a5b)" },
  { name: "Sand", gradient: "linear-gradient(90deg,#e9dfc6,#efe6ce)" },
];

const TABS = ["Description", "Find your size", "Care instructions", "Shipping"] as const;
type Tab = (typeof TABS)[number];

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  const { format, currency } = useCurrency();
  if (!p) return null;


  const sizes = useMemo(
    () => (p.sizes ?? []).slice().sort((a, b) => (a as any).sort_order - (b as any).sort_order),
    [p.sizes],
  );
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.id ?? "");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].name);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("Description");

  const images = useMemo(
    () => (p.images ?? []).slice().sort((a, b) => (a as any).sort_order - (b as any).sort_order),
    [p.images],
  );
  const gallery = (images.length > 0 ? images.map((i) => i.url) : p.main_image_url ? [p.main_image_url] : [])
    .map((u) => resolveImage(u))
    .filter((u): u is string => Boolean(u));

  const chosen = sizes.find((s) => s.id === selectedSize);
  const priceLabel = chosen
    ? format({ rwf: chosen.price_rwf, usd: chosen.price_usd })
    : format({ rwf: p.base_price_rwf, usd: p.base_price_usd });
  const shortPrice = priceLabel;
  void currency;


  const waMsg = encodeURIComponent(
    `Hi Mosiac — I'd like to order "${p.name}"${chosen ? ` (${chosen.label})` : ""} in ${selectedColor}, qty ${qty}.`,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1500px] pb-24 pt-8 md:pt-14">
        <Link to="/catalogue" className="eyebrow text-muted-foreground hover:text-accent">
          ← Catalogue
        </Link>

        {/* Top split: info | images | controls */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,320px)] lg:gap-12">
          {/* Left column — sticky info */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="eyebrow text-muted-foreground">{p.category?.name ?? "Rug"}</div>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">{p.name}</h1>
            <div className="mt-4 font-display text-2xl">{priceLabel}</div>
            {p.short_description && (
              <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {p.short_description}
              </p>
            )}
          </aside>

          {/* Center — stacked image cards on soft cream backgrounds */}
          <div className="flex flex-col gap-6">
            {gallery.length === 0 && (
              <div className="aspect-[4/5] rounded-3xl bg-muted" />
            )}
            {gallery.map((src, i) => (
              <div
                key={src}
                className="overflow-hidden rounded-3xl bg-muted"
                style={{ background: i % 2 === 0 ? "#f0eadf" : "#efe6d3" }}
              >
                <img
                  src={src}
                  alt={`${p.name} — view ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-contain aspect-[4/5]"
                />
              </div>
            ))}
          </div>

          {/* Right column — sticky controls */}
          <aside className="lg:sticky lg:top-28 self-start">
            {/* Size */}
            <div>
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-medium">Size</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5" /> Sizing Guide
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(sizes.length > 0
                  ? sizes.map((s) => ({ id: s.id, label: s.label }))
                  : ["S", "M", "L", "XL"].map((l) => ({ id: l, label: l }))
                ).map((s) => {
                  const active = selectedSize === s.id || (sizes.length === 0 && selectedSize === "" && s.id === "S");
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      className={`h-14 rounded-2xl text-sm font-medium transition-all ${
                        active
                          ? "bg-background shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-border"
                          : "bg-[#f0eadf] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-medium">Color</span>
                <span className="text-xs text-muted-foreground">{selectedColor}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((c) => {
                  const active = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      aria-label={c.name}
                      className={`h-6 w-16 rounded-full transition-all ${active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                      style={{ background: c.gradient }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8 flex items-center justify-between">
              <span className="font-display text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease"
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-4 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase"
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to cart (opens WhatsApp for now) */}
            <a
              href={`${WHATSAPP_URL}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex h-14 w-full items-center justify-between rounded-full bg-[#9c8a76] px-6 text-sm font-medium text-background transition-transform hover:scale-[1.01]"
            >
              <span>Add to cart</span>
              <span className="font-display text-base">{shortPrice}</span>
            </a>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
              Only a few remaining
            </div>

            <button className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <Heart className="h-4 w-4" /> Save to wishlist
            </button>

            <ul className="mt-8 space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
              <li className="flex items-center gap-3"><Truck className="h-4 w-4" /> Free worldwide shipping over $500</li>
              <li className="flex items-center gap-3"><RotateCcw className="h-4 w-4" /> 30-day returns on in-stock rugs</li>
              <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> Hand-tufted in Kigali, guaranteed</li>
            </ul>
          </aside>
        </div>

        {/* Tabs section */}
        <section className="mt-28">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-b border-border/60 pb-2">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                  {active && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-foreground" />}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            {tab === "Description" && (
              <p className="font-display text-xl leading-relaxed md:text-2xl">
                {p.description ?? p.short_description ?? "A hand-tufted piece made to order in Kigali — designed to live with you for decades."}
              </p>
            )}
            {tab === "Find your size" && (
              <div className="text-left text-sm text-muted-foreground">
                <p className="text-center font-display text-xl text-foreground">Find your fit.</p>
                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
                  {(sizes.length > 0 ? sizes : [
                    { id: "s", label: "S", width_cm: 120, height_cm: 180 },
                    { id: "m", label: "M", width_cm: 160, height_cm: 230 },
                    { id: "l", label: "L", width_cm: 200, height_cm: 290 },
                    { id: "xl", label: "XL", width_cm: 240, height_cm: 340 },
                  ]).map((s: any) => (
                    <div key={s.id} className="rounded-2xl bg-[#f0eadf] p-4 text-center">
                      <div className="font-display text-lg text-foreground">{s.label}</div>
                      <div className="mt-1 text-xs">{s.width_cm ?? "—"} × {s.height_cm ?? "—"} cm</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Care instructions" && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Vacuum weekly on low suction without a beater bar. Blot spills immediately with a clean, dry cloth — never rub. Rotate 180° every six months for even wear. For deep cleans, book a professional rug cleaner familiar with hand-tufted wool.
              </p>
            )}
            {tab === "Shipping" && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every Mosiac rug is hand-tufted to order in Kigali. Production takes {p.production_time ?? "4–6 weeks"}. We ship worldwide via DHL; you'll receive a tracking link the day it leaves the studio.
              </p>
            )}
          </div>

          {/* Lifestyle image pair */}
          {gallery.length > 0 && (
            <div className="mt-16 grid gap-6 md:grid-cols-2">
              {gallery.slice(0, 2).map((src, i) => (
                <div key={`life-${i}`} className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
