import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Nav, Footer, FloatingWhatsApp, WhatsAppIcon, WHATSAPP_URL, resolveImage } from "@/components/site-chrome";
import { listCategories, listFeatured, listProducts, listReviews } from "@/lib/catalogue.functions";
import catSports from "@/assets/cat-sports.jpg";
import catCartoon from "@/assets/cat-cartoon.jpg";
import catAnimals from "@/assets/cat-animals.jpg";
import catCustom from "@/assets/cat-custom.jpg";
import ig1 from "@/assets/ig-1.jpg";
import ig2 from "@/assets/ig-2.jpg";
import ig3 from "@/assets/ig-3.jpg";
import ig4 from "@/assets/ig-4.jpg";
import ig5 from "@/assets/ig-5.jpg";
import ig6 from "@/assets/ig-6.jpg";

const IG = [ig1, ig2, ig3, ig4, ig5, ig6];
const CATEGORY_IMAGES: Record<string, string> = {
  sports: catSports,
  cartoon: catCartoon,
  animals: catAnimals,
  custom: catCustom,
};

const PRESS = [
  { quote: "Playful, vibrant, and bizarrely compelling — floor art at its most alive.", source: "Kigali Design Weekly" },
  { quote: "A rare thing: rugs that feel like commissioned paintings you can walk on.", source: "East Africa Living" },
  { quote: "Handmade fidelity with an unmistakable point of view.", source: "The Craft Journal" },
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
      { title: "Rug Mosiac — Handmade custom rugs, tufted in Kigali" },
      { name: "description", content: "Any design, yours forever. Hand-tufted wool rugs made to order in Kigali since 2021." },
      { property: "og:title", content: "Rug Mosiac — Handmade custom rugs" },
      { property: "og:description", content: "Any design, yours forever. Hand-tufted wool rugs made to order in Kigali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AnnouncementTicker() {
  const msg = "Any design, yours forever · Handmade in Kigali · Message us on WhatsApp for a custom quote";
  const items = Array.from({ length: 6 });
  return (
    <div className="overflow-hidden border-b border-border/60 bg-accent text-accent-foreground">
      <div className="flex gap-16 whitespace-nowrap py-2.5 animate-[marquee_38s_linear_infinite] will-change-transform">
        {items.map((_, i) => (
          <span key={i} className="eyebrow text-accent-foreground/90">{msg}</span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQO);
  const featured = data.featured.slice(0, 3);
  const cats = data.categories.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementTicker />
      <Nav />
      <main>
        {/* Brand intro */}
        <section className="py-16 md:py-24">
          <div className="container-x mx-auto max-w-[1200px] text-center">
            <p className="mx-auto max-w-2xl font-serif text-2xl leading-snug tracking-tight md:text-4xl">
              Welcome to a new dimension of floor art — Rug Mosiac blends intricate design,
              considered function and luxury wool to transform your home.
            </p>
          </div>
        </section>

        {/* Category grid with counts */}
        <section className="pb-24 md:pb-32">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {cats.map((c) => {
                const count = data.counts[c.slug] ?? 0;
                return (
                  <Link key={c.id} to="/catalogue" search={{ category: c.slug }} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted">
                    <img
                      src={c.image_url || CATEGORY_IMAGES[c.slug] || catCustom}
                      alt={`${c.name} rug`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                      <div>
                        <div className="font-serif text-xl italic md:text-2xl">{c.name}</div>
                        <div className="eyebrow mt-1 text-white/70">{count} {count === 1 ? "piece" : "pieces"}</div>
                      </div>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recognition */}
        <section className="border-y border-border/60 py-20 md:py-28">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="mb-12 text-center">
              <span className="eyebrow text-accent">Recognition</span>
            </div>
            <div className="grid gap-8 md:grid-cols-3 md:gap-12">
              {PRESS.map((p) => (
                <figure key={p.source} className="text-center">
                  <blockquote className="font-serif text-xl italic leading-relaxed md:text-2xl">
                    "{p.quote}"
                  </blockquote>
                  <figcaption className="eyebrow mt-6 text-muted-foreground">— {p.source}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Featured product banners — alternating */}
        {featured.map((p, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <section key={p.id} className="py-20 md:py-28">
              <div className={`container-x mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-2 md:gap-16 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                <Link to="/catalogue/$slug" params={{ slug: p.slug }} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted md:aspect-square">
                    {resolveImage(p.main_image_url) && (
                      <img src={resolveImage(p.main_image_url)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                  </div>
                </Link>
                <div className={reverse ? "md:pr-8" : "md:pl-8"}>
                  <span className="eyebrow text-accent">{idx === 0 ? "New" : idx === 1 ? "Introducing" : "Meet"}</span>
                  <h2 className="mt-4 font-serif text-4xl leading-[1] tracking-tight md:text-6xl">
                    {idx === 0 ? "Meet the" : idx === 1 ? "Introducing the" : "Meet the"} <em>{p.name}</em>.
                  </h2>
                  {p.short_description && (
                    <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">{p.short_description}</p>
                  )}
                  <div className="mt-9">
                    <Link
                      to="/catalogue/$slug"
                      params={{ slug: p.slug }}
                      className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      Shop {p.name.split(" ")[0]}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Dreamscape / Explore CTA */}
        <section className="border-y border-border/60 py-24 md:py-36">
          <div className="container-x mx-auto max-w-[1400px] text-center">
            <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight md:text-7xl">
              Turn your living room into a <em>dreamscape</em>.
            </h2>
            <div className="mt-10">
              <Link
                to="/catalogue"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:bg-accent hover:text-accent-foreground"
              >
                Explore Rug Mosiac
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {data.reviews.length > 0 && (
          <section className="py-24 md:py-32">
            <div className="container-x mx-auto max-w-[1400px]">
              <div className="mb-12 text-center">
                <div className="text-accent text-lg tracking-widest">★★★★★</div>
                <h2 className="mt-3 font-serif text-4xl italic tracking-tight md:text-5xl">Our happy clients.</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                {data.reviews.slice(0, 3).map((r) => (
                  <figure key={r.id} className="flex h-full flex-col justify-between rounded-sm border border-border bg-card p-7">
                    <blockquote className="font-serif text-xl leading-relaxed">"{r.quote}"</blockquote>
                    <figcaption className="mt-8 text-sm">
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-muted-foreground">{r.location}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Instagram / Community */}
        <section className="border-t border-border/60 py-24 md:py-32">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="mb-12 text-center">
              <span className="eyebrow text-accent">Community</span>
              <h2 className="mt-4 font-serif text-4xl italic tracking-tight md:text-6xl">Seeing is believing.</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground leading-relaxed">
                Follow us on Instagram to stay up to date on new drops, custom commissions, and behind-the-scenes tufting.
              </p>
              <div className="mt-8">
                <a
                  href="https://instagram.com/rugmosiac"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Follow us @rugmosiac
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6 md:gap-3">
              {IG.map((src, i) => (
                <a key={i} href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="group aspect-square overflow-hidden rounded-sm bg-muted">
                  <img src={src} alt="Rug Mosiac portfolio" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* WhatsApp lead-capture strip (replaces newsletter hook) */}
        <section className="bg-accent text-accent-foreground py-14">
          <div className="container-x mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl md:text-3xl">Ready to commission a piece?</h3>
              <p className="mt-1 text-sm opacity-90">Send a photo, a sketch, or a colour palette — we'll quote within a day.</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-medium text-foreground transition-transform hover:scale-[1.03]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Start on WhatsApp
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
