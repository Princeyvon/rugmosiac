import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Nav, Footer, FloatingWhatsApp, resolveImage } from "@/components/site-chrome";
import { listCategories, listFeatured, listProducts, listReviews } from "@/lib/catalogue.functions";
import homeHero from "@/assets/home-hero.jpg";
import heritageBanner from "@/assets/heritage-banner.jpg";
import catBrands from "@/assets/cat-brands.jpg";
import catAreaRugs from "@/assets/cat-area-rugs.jpg";
import catRunners from "@/assets/cat-runners.jpg";

const HOME_CATEGORIES = [
  { slug: "brands", name: "Brands", image: catBrands },
  { slug: "area-rugs", name: "Area Rugs", image: catAreaRugs },
  { slug: "runners", name: "Runners", image: catRunners },
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
    return { categories, featured, reviews, counts };
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQO),
  component: Home,
  head: () => ({
    meta: [
      { title: "Mosiac — Handmade custom rugs, tufted in Kigali" },
      { name: "description", content: "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali since 2021." },
      { property: "og:title", content: "Mosiac — Handmade custom rugs" },
      { property: "og:description", content: "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali." },
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

function Home() {
  const { data } = useSuspenseQuery(homeQO);
  const featured = data.featured.slice(0, 3);
  const cats = data.categories;

  const ctaBase =
    "group inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-background transition-all duration-300 hover:bg-background hover:text-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        {/* Brand intro */}
        <section className="py-16 md:py-28">
          <div className="container-x mx-auto max-w-[1100px] text-center">
            <p className="mx-auto max-w-3xl font-display text-2xl font-medium leading-[1.15] tracking-tight md:text-[44px]">
              Welcome to a new dimension of home decor — Mosiac blends intricate design, considered function, and luxury materials to transform your home and awaken your senses.
            </p>
          </div>
        </section>

        {/* Category showcase grid */}
        <section className="pb-20 md:pb-28">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="grid gap-3 md:gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {cats.map((c) => {
                const count = data.counts[c.slug] ?? 0;
                return (
                  <Link
                    key={c.id}
                    to="/catalogue"
                    search={{ category: c.slug }}
                    className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-muted"
                  >
                    <img
                      src={c.image_url || CATEGORY_IMAGES[c.slug] || catCustom}
                      alt={`${c.name} rugs`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                      <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{c.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                        {count} {count === 1 ? "product" : "products"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <RecognitionSlider />

        {/* Featured product hero blocks — alternating */}
        {featured.map((p, idx) => {
          const reverse = idx % 2 === 1;
          const kicker = idx === 0 ? "Meet the" : idx === 1 ? "Introducing the" : "Meet the";
          const shopLabel = `Shop ${p.name.split(" ")[0]}`;
          return (
            <section key={p.id} className="py-20 md:py-28">
              <div className={`container-x mx-auto grid max-w-[1400px] items-stretch gap-10 md:grid-cols-2 md:gap-16 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                <Link to="/catalogue/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-sm bg-muted">
                  <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[5/6]">
                    {resolveImage(p.main_image_url) && (
                      <img
                        src={resolveImage(p.main_image_url)}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                </Link>
                <div className="flex flex-col justify-between py-4 md:py-8">
                  <div>
                    <span className="eyebrow text-muted-foreground">{p.category?.name ?? "Featured"}</span>
                    <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] tracking-tight md:text-6xl">
                      {kicker} <span className="italic">{p.name}</span>
                    </h2>
                    {p.short_description && (
                      <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                        {p.short_description}
                      </p>
                    )}
                  </div>
                  <div className="mt-10 md:mt-0 md:pt-12">
                    <Link to="/catalogue/$slug" params={{ slug: p.slug }} className={ctaBase}>
                      {shopLabel}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Dreamscape / Explore hero */}
        <section className="border-y border-border bg-muted py-28 md:py-40">
          <div className="container-x mx-auto max-w-[1200px] text-center">
            <h2 className="mx-auto max-w-4xl font-display text-4xl font-medium leading-[1.02] tracking-tight md:text-7xl">
              Turn your living room into a <span className="italic">dreamscape</span>.
            </h2>
            <div className="mt-12">
              <Link to="/catalogue" className={ctaBase}>
                Explore Mosiac
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {data.reviews.length > 0 && (
          <section className="py-24 md:py-32">
            <div className="container-x mx-auto max-w-[1400px]">
              <div className="mb-12 text-center">
                <div className="text-accent text-base tracking-[0.4em]">★★★★★</div>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight md:text-5xl">Our happy clients.</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                {data.reviews.slice(0, 3).map((r) => (
                  <figure key={r.id} className="flex h-full flex-col justify-between rounded-sm border border-border bg-card p-8">
                    <blockquote className="font-display text-lg leading-relaxed">"{r.quote}"</blockquote>
                    <figcaption className="mt-8 text-sm">
                      <div className="font-semibold">{r.customer_name}</div>
                      <div className="text-muted-foreground">{r.location}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Social conversion banner */}
        <section className="border-t border-border bg-foreground py-24 text-background md:py-32">
          <div className="container-x mx-auto max-w-[1200px] text-center">
            <h2 className="font-display text-4xl font-medium leading-[1.02] tracking-tight md:text-6xl">
              Seeing is believing.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              Follow us on Instagram to stay up to date on promotions and limited edition releases.
            </p>
            <div className="mt-10">
              <a
                href="https://instagram.com/rugmosiac"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-background bg-background px-8 py-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-transparent hover:text-background"
              >
                Follow us @rugmosiac
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
