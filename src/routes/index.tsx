import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Nav, Footer, FloatingWhatsApp, resolveImage, WishlistHeart } from "@/components/site-chrome";
import { useCurrency } from "@/lib/currency";
import { listCategories, listFeatured, listProducts, listReviews, type Product } from "@/lib/catalogue.functions";
import homeHero from "@/assets/home-hero.jpg";
import heritageBanner from "@/assets/heritage-banner.jpg";
import heritage2 from "@/assets/heritage-2.jpg";
import heritage3 from "@/assets/heritage-3.jpg";
import catWallArt from "@/assets/cat-wall-art.jpg";
import catAreaRugs from "@/assets/cat-area-rugs.jpg";
import catCustom from "@/assets/cat-custom.jpg";
import ig1 from "@/assets/ig-1.jpg";
import ig2 from "@/assets/ig-2.jpg";
import ig3 from "@/assets/ig-3.jpg";
import ig4 from "@/assets/ig-4.jpg";

const IG_GRID: string[] = [ig1, ig2, ig3, ig4];

const HOME_CATEGORIES = [
  { slug: "area-rugs", name: "Area rugs", image: catAreaRugs },
  { slug: "wall-art", name: "Wall art pieces", image: catWallArt },
  { slug: "custom", name: "Custom rugs", image: catCustom },
];

const HERITAGE_SLIDES = [
  {
    image: heritageBanner,
    kicker: "New collection",
    title: "Introducing the",
    italic: "Heritage",
    suffix: "rugs",
  },
  {
    image: heritage2,
    kicker: "Traditional patterns",
    title: "Woven with",
    italic: "intention",
    suffix: "",
  },
  {
    image: heritage3,
    kicker: "Made in Kigali",
    title: "Tufted by",
    italic: "hand",
    suffix: "",
  },
];


const PRESS = [
  { quote: "Playful, vibrant, and bizarrely compelling.", source: "Kigali Design Weekly" },
  { quote: "Rugs that feel like commissioned paintings you can walk on.", source: "East Africa Living" },
  { quote: "Handmade fidelity with an unmistakable point of view.", source: "The Craft Journal" },
  { quote: "The most exciting floor art coming out of East Africa right now.", source: "Continent Quarterly" },
];

const homeQO = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [categories, featured, reviews, allProducts] = await Promise.all([
      listCategories(),
      listFeatured(),
      listReviews(),
      listProducts(),
    ]);
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      const slug = p.category?.slug;
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
    }
    const pool = [...featured, ...allProducts.filter((p) => !featured.some((f) => f.id === p.id))];
    return { categories, featured, reviews, counts, slider: pool.slice(0, 10) };
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQO),
  component: Home,
  head: () => ({
    meta: [
      { title: "Mosiac — Handmade custom rugs, tufted in Kigali" },
      { name: "description", content: "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali since 2021." },
      { property: "og:title", content: "Mosiac — Handmade custom rugs, tufted in Kigali" },
      { property: "og:description", content: "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali since 2021." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RecognitionSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % PRESS.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="border-y border-border py-20 md:py-24">
      <div className="container-x mx-auto max-w-[1200px]">
        <div className="mb-10 text-center">
          <span className="eyebrow text-muted-foreground">Recognition</span>
        </div>
        <div className="relative min-h-[140px] md:min-h-[120px]">
          {PRESS.map((p, idx) => (
            <figure
              key={p.source}
              className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <blockquote className="font-display text-2xl font-medium leading-snug tracking-tight md:text-4xl">
                "{p.quote}"
              </blockquote>
              <figcaption className="eyebrow mt-6 text-muted-foreground">— {p.source}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          {PRESS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Show quote ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-foreground" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HeritageSlider() {
  const [i, setI] = useState(0);
  const total = HERITAGE_SLIDES.length;
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);
  const prev = () => setI((v) => (v - 1 + total) % total);
  const next = () => setI((v) => (v + 1) % total);
  return (
    <section className="pb-20 md:pb-28">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="group relative overflow-hidden rounded-2xl bg-muted">
          <div className="relative aspect-[21/10] w-full md:aspect-[24/9]">
            {HERITAGE_SLIDES.map((s, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === idx ? "opacity-100" : "opacity-0"}`}
                aria-hidden={i !== idx}
              >
                <img
                  src={s.image}
                  alt={`Heritage rug slide ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
                <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center p-6 text-white md:p-14">
                  <span className="eyebrow text-white/80">{s.kicker}</span>
                  <h2 className="mt-3 font-display text-4xl font-medium leading-[1.02] tracking-tight md:text-6xl">
                    {s.title} <span className="italic">{s.italic}</span>
                    {s.suffix ? ` ${s.suffix}` : ""}
                  </h2>
                  <div className="mt-8">
                    <Link
                      to="/catalogue"
                      className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-transparent hover:text-white"
                    >
                      Explore Heritage
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls — bottom left, close together */}
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 md:bottom-8 md:left-8">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="ml-3 text-xs font-semibold uppercase tracking-wider text-white/80">
              {String(i + 1).padStart(2, "0")}
              <span className="mx-1.5 opacity-50">/</span>
              {String(total).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Featured rugs — sticky horizontal scroll-jack through 10 rugs. */
function FeaturedRugsSticky({ items }: { items: Product[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const { format } = useCurrency();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      setP(Math.max(0, Math.min(1, -rect.top / total)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section ref={wrapRef} className="relative" style={{ height: `${items.length * 45 + 100}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-x mx-auto mb-8 flex max-w-[1400px] items-end justify-between">
          <div>
            <span className="eyebrow text-muted-foreground">Featured rugs</span>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight md:text-5xl">
              Ten pieces we're <span className="italic">obsessed</span> with.
            </h2>
          </div>
          <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">
            {String(Math.min(items.length, Math.floor(p * items.length) + 1)).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <div
          className="flex gap-6 pl-[max(1.5rem,calc((100vw-1400px)/2))] will-change-transform"
          style={{ transform: `translate3d(${-p * (items.length - 1) * 340}px,0,0)` }}
        >
          {items.map((r) => {
            const img = resolveImage(r.main_image_url);
            return (
              <Link
                key={r.id}
                to="/catalogue/$slug"
                params={{ slug: r.slug }}
                className="group block w-[300px] shrink-0 md:w-[320px]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                  <WishlistHeart product={{ productId: r.id, slug: r.slug, name: r.name, image: img }} />
                  {img && (
                    <img src={img} alt={r.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-medium">{r.name}</h3>
                  <span className="text-sm text-muted-foreground">{format({ rwf: r.base_price_rwf, usd: r.base_price_usd })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQO);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        {/* Hero card — top padding is tuned to the nav wordmark scroll range so the card
            rises directly beneath "Mosiac" with no dead whitespace mid-transition. */}
        <section className="pt-[13rem] md:pt-[15rem]">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <div className="relative aspect-[16/12] w-full md:aspect-[16/9]">
                <img
                  src={homeHero}
                  alt="A hand-tufted Mosiac rug anchoring a modern living room"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-12">
                  <span className="eyebrow text-white/80">Hand-tufted in Kigali</span>
                  <h1 className="mt-3 max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-tight md:text-6xl">
                    Floor art, <span className="italic">made to order</span>.
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand intro beneath hero — smaller, still visible */}
        <section className="py-14 md:py-20">
          <div className="container-x mx-auto max-w-[900px] text-center">
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Welcome to a new dimension of home decor — Mosiac blends intricate design, considered function, and luxury materials to transform your home and awaken your senses.
            </p>
          </div>
        </section>

        {/* Featured rugs — sticky horizontal scroll-jack */}
        <FeaturedRugsSticky items={data.slider as Product[]} />

        {/* Three category cards */}
        <section className="pb-16 md:pb-24">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {HOME_CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to="/catalogue"
                  search={{ category: c.slug }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
                >
                  <img
                    src={c.image}
                    alt={`${c.name} rugs`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                    <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{c.name}</h3>
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Heritage slideshow — 3 slides with paired controls */}
        <HeritageSlider />

        <RecognitionSlider />

        {/* Seeing is believing — editorial banner + Instagram grid */}
        <section className="relative overflow-hidden border-t border-border bg-foreground py-24 text-background md:py-32">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
          />
          <div className="container-x relative mx-auto grid max-w-[1300px] items-center gap-14 lg:grid-cols-[1fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="eyebrow text-background/60">@rugmosiac on Instagram</span>
              <h2 className="mt-5 font-display text-5xl font-medium leading-[1.0] tracking-tight md:text-7xl">
                Seeing is <span className="italic">believing</span>.
              </h2>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-background/70 md:text-lg lg:mx-0">
                Follow along for behind-the-scenes tufting, finished commissions in real homes, and first looks at limited drops.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href="https://instagram.com/rugmosiac"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-background bg-background px-8 py-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-transparent hover:text-background"
                >
                  Follow @rugmosiac
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </a>
                <Link
                  to="/catalogue"
                  className="group inline-flex items-center gap-2 rounded-full border border-background/40 px-8 py-4 text-xs font-semibold uppercase tracking-wider text-background transition-all duration-300 hover:border-background hover:bg-background hover:text-foreground"
                >
                  Explore Mosaic
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* 2 × 3 Instagram grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {IG_GRID.map((src, i) => (
                <a
                  key={i}
                  href="https://instagram.com/rugmosiac"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl bg-background/10"
                >
                  <img
                    src={src}
                    alt="Mosiac rug on Instagram"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

