import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, Ruler, Heart, Truck, RotateCcw, ShieldCheck, Droplet, Scissors, Sparkles, Wind } from "lucide-react";
import {
  Nav,
  Footer,
  FloatingWhatsApp,
  resolveImage,
} from "@/components/site-chrome";
import { useCurrency } from "@/lib/currency";
import { useCart, useWishlist } from "@/lib/store";
import { getProduct, listRelated, type Product } from "@/lib/catalogue.functions";

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });

const relatedQO = (slug: string) =>
  queryOptions({
    queryKey: ["related", slug],
    queryFn: () => listRelated({ data: { slug } }),
  });

export const Route = createFileRoute("/catalogue/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQO(params.slug));
    if (!p) throw notFound();
    context.queryClient.prefetchQuery(relatedQO(params.slug));
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

type SizeRow = {
  id: string;
  label: string;
  width_cm?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  price_rwf?: number | null;
  price_usd?: number | null;
};

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  const { data: related } = useQuery(relatedQO(slug));
  const { format, currency } = useCurrency();
  const cart = useCart();
  const wishlist = useWishlist();
  if (!p) return null;

  const sizes = useMemo<SizeRow[]>(
    () => ((p.sizes ?? []) as SizeRow[]).slice().sort((a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0)),
    [p.sizes],
  );
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.id ?? "");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].name);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("Description");
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");

  const images = useMemo(
    () => (p.images ?? []).slice().sort((a, b) => (a as any).sort_order - (b as any).sort_order),
    [p.images],
  );
  const gallery = (images.length > 0 ? images.map((i) => i.url) : p.main_image_url ? [p.main_image_url] : [])
    .map((u) => resolveImage(u))
    .filter((u): u is string => Boolean(u));
  const mainImage = gallery[0];

  const chosen = sizes.find((s) => s.id === selectedSize);
  const unitRwf = chosen?.price_rwf ?? p.base_price_rwf;
  const unitUsd = chosen?.price_usd ?? p.base_price_usd;
  const priceLabel = format({ rwf: unitRwf, usd: unitUsd });
  const totalLabel = format({ rwf: unitRwf ? unitRwf * qty : null, usd: unitUsd ? unitUsd * qty : null });
  void currency;

  const isWished = wishlist.has(p.id);

  const handleAddToCart = () => {
    cart.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: mainImage,
      sizeId: chosen?.id,
      sizeLabel: chosen?.label,
      color: selectedColor,
      qty,
      unitPriceUsd: chosen?.price_usd ?? p.base_price_usd,
      unitPriceRwf: chosen?.price_rwf ?? p.base_price_rwf,
    });
  };

  const handleWishlistToggle = () => {
    wishlist.toggle({ productId: p.id, slug: p.slug, name: p.name, image: mainImage });
  };

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
            <h1 className="mt-3 font-display text-2xl font-medium tracking-tight md:text-3xl">{p.name}</h1>
            <div className="mt-3 font-display text-xl">{priceLabel}</div>
            {p.short_description && (
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {p.short_description}
              </p>
            )}
          </aside>

          {/* Center — stacked image cards */}
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
                <button
                  onClick={() => setTab("Find your size")}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Ruler className="h-3.5 w-3.5" /> Sizing Guide
                </button>
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

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className="mt-6 flex h-14 w-full items-center justify-between rounded-full bg-[#9c8a76] px-6 text-sm font-medium text-background transition-transform hover:scale-[1.01]"
            >
              <span>Add to cart</span>
              <span className="font-display text-base">{priceLabel}</span>
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
              Made to order · {p.production_time ?? "3–4 weeks"}
            </div>

            <button
              onClick={handleWishlistToggle}
              className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Heart className={`h-4 w-4 ${isWished ? "fill-current text-accent" : ""}`} />
              {isWished ? "Saved to wishlist" : "Save to wishlist"}
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

          <div className="mx-auto mt-10">
            {tab === "Description" && (
              <p className="mx-auto max-w-3xl text-center font-display text-xl leading-relaxed md:text-2xl">
                {p.description ?? p.short_description ?? "A hand-tufted piece made to order in Kigali — designed to live with you for decades."}
              </p>
            )}

            {tab === "Find your size" && (
              <SizingGuide
                sizes={sizes}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                units={units}
                setUnits={setUnits}
                material={p.material ?? "New Zealand Wool"}
              />
            )}

            {tab === "Care instructions" && (
              <div className="mx-auto max-w-5xl">
                <h3 className="text-center font-display text-xl md:text-2xl">
                  {p.material ?? "New Zealand Wool"} is a naturally self-cleaning fibre.
                </h3>
                <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { Icon: Droplet, text: "Blot spills immediately with a damp cloth or paper towel and clean water — never rub." },
                    { Icon: Wind, text: "Vacuum on a high-pile setting for regular cleaning and maintenance." },
                    { Icon: Sparkles, text: "For a deep clean, consult a local rug-cleaning professional." },
                    { Icon: Scissors, text: "Trim any loose threads with scissors — never pull them out." },
                  ].map(({ Icon, text }, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
                      <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Shipping" && (
              <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
                Every Mosiac rug is hand-tufted to order in Kigali. Production takes {p.production_time ?? "3–4 weeks"}. We ship worldwide via DHL; you'll receive a tracking link the day it leaves the studio.
              </p>
            )}
          </div>

          {/* Related Products */}
          <section className="mt-24">
            <h2 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Related Products</h2>
            {related && related.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
                {related.map((r: Product) => {
                  const img = resolveImage(r.main_image_url);
                  return (
                    <Link
                      key={r.id}
                      to="/catalogue/$slug"
                      params={{ slug: r.slug }}
                      className="group block"
                    >
                      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#f0eadf]">
                        {img && <img src={img} alt={r.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      </div>
                      <div className="mt-3">
                        <div className="font-display text-sm font-medium">{r.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{format({ rwf: r.base_price_rwf, usd: r.base_price_usd })}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-muted-foreground">More rugs coming soon.</p>
            )}
          </section>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

// ---------- Sizing guide ----------

function SizingGuide({
  sizes, selectedSize, setSelectedSize, units, setUnits, material,
}: {
  sizes: SizeRow[];
  selectedSize: string;
  setSelectedSize: (id: string) => void;
  units: "imperial" | "metric";
  setUnits: (u: "imperial" | "metric") => void;
  material: string;
}) {
  const fallbackSizes: SizeRow[] = [
    { id: "s", label: "S", width_cm: 90, height_cm: 150, weight_kg: 3.6 },
    { id: "m", label: "M", width_cm: 160, height_cm: 230, weight_kg: 9.9 },
    { id: "l", label: "L", width_cm: 200, height_cm: 300, weight_kg: 16.2 },
    { id: "xl", label: "XL", width_cm: 240, height_cm: 340, weight_kg: 22 },
  ];
  const list = sizes.length > 0 ? sizes : fallbackSizes;
  const active = list.find((s) => s.id === selectedSize) ?? list[0];
  const wCm = active?.width_cm ?? 160;
  const hCm = active?.height_cm ?? 230;
  const kg = active?.weight_kg ?? 0;

  const cmToIn = (v: number) => Math.round(v / 2.54);
  const kgToLb = (v: number) => Math.round(v * 2.2046 * 10) / 10;

  const wLabel = units === "metric" ? `${wCm} cm` : `${cmToIn(wCm)} in`;
  const hLabel = units === "metric" ? `${hCm} cm` : `${cmToIn(hCm)} in`;
  const weightLabel = units === "metric" ? `${kg.toFixed(2)} kg` : `${kgToLb(kg)} lb`;

  // Scale rug to fit within a viewbox while preserving aspect ratio
  const maxW = 900;
  const maxH = 420;
  const ratio = wCm / hCm;
  const boxRatio = maxW / maxH;
  const rectW = ratio > boxRatio ? maxW : maxH * ratio;
  const rectH = ratio > boxRatio ? maxW / ratio : maxH;
  const cx = 1080 / 2;
  const cy = 560 / 2 + 20;
  const x = cx - rectW / 2;
  const y = cy - rectH / 2;

  return (
    <div className="mx-auto max-w-6xl rounded-3xl bg-[#f4ede2] p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl bg-[#e9dfcc] p-1">
          {(["imperial", "metric"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnits(u)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
                units === u ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="inline-flex gap-2">
          {list.map((s) => {
            const isActive = s.id === active?.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSize(s.id)}
                className={`grid h-12 w-12 place-items-center rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-background shadow-sm" : "bg-[#e9dfcc] text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <svg viewBox="0 0 1080 620" className="w-full h-auto">
          {/* Top dimension label */}
          <text x={cx} y={y - 26} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 22 }}>
            {wLabel}
          </text>
          <line x1={x} x2={x + rectW} y1={y - 12} y2={y - 12} stroke="currentColor" strokeOpacity={0.25} />
          {/* Left dimension label */}
          <text x={x - 28} y={cy + 6} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 22 }}>
            {hLabel}
          </text>
          <line x1={x - 12} x2={x - 12} y1={y} y2={y + rectH} stroke="currentColor" strokeOpacity={0.25} />

          {/* Rug outline sketch — cream fill with subtle irregular notches at the corners */}
          <path
            d={rugPath(x, y, rectW, rectH)}
            fill="#efe6d0"
            stroke="#c9bda2"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Weight</div>
          <div className="mt-1 font-display text-xl">{weightLabel}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Material</div>
          <div className="mt-1 font-display text-xl">{material}</div>
        </div>
      </div>
    </div>
  );
}

// Sketchy rug outline path — rectangle with small irregular "hand-drawn" notches
function rugPath(x: number, y: number, w: number, h: number): string {
  const n = 10; // notch inset
  return [
    `M ${x + 20} ${y}`,
    `L ${x + w * 0.35} ${y}`,
    `L ${x + w * 0.4} ${y + n * 1.4}`,
    `L ${x + w * 0.45} ${y}`,
    `L ${x + w * 0.7} ${y}`,
    `L ${x + w * 0.74} ${y + n * 1.6}`,
    `L ${x + w * 0.8} ${y}`,
    `L ${x + w - 20} ${y}`,
    `L ${x + w} ${y + 20}`,
    `L ${x + w - n * 1.4} ${y + h * 0.4}`,
    `L ${x + w} ${y + h * 0.45}`,
    `L ${x + w} ${y + h - 20}`,
    `L ${x + w - 20} ${y + h}`,
    `L ${x + w * 0.75} ${y + h}`,
    `L ${x + w * 0.7} ${y + h - n * 1.4}`,
    `L ${x + w * 0.65} ${y + h}`,
    `L ${x + w * 0.4} ${y + h}`,
    `L ${x + w * 0.36} ${y + h - n * 1.4}`,
    `L ${x + w * 0.3} ${y + h}`,
    `L ${x + 20} ${y + h}`,
    `L ${x} ${y + h - 20}`,
    `L ${x + n * 1.4} ${y + h * 0.6}`,
    `L ${x} ${y + h * 0.55}`,
    `L ${x} ${y + 20}`,
    `Z`,
  ].join(" ");
}
