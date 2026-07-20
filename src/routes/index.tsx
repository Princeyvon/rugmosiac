import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Nav, Footer, FloatingWhatsApp, WhatsAppIcon, WHATSAPP_URL, formatPrice } from "@/components/site-chrome";
import { listCategories, listFeatured, listReviews } from "@/lib/catalogue.functions";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import catSports from "@/assets/cat-sports.jpg";
import catCartoon from "@/assets/cat-cartoon.jpg";
import catAnimals from "@/assets/cat-animals.jpg";
import catCustom from "@/assets/cat-custom.jpg";
import craft1 from "@/assets/craft-1.jpg";
import craft2 from "@/assets/craft-2.jpg";
import ig1 from "@/assets/ig-1.jpg";
import ig2 from "@/assets/ig-2.jpg";
import ig3 from "@/assets/ig-3.jpg";
import ig4 from "@/assets/ig-4.jpg";
import ig5 from "@/assets/ig-5.jpg";
import ig6 from "@/assets/ig-6.jpg";

const HERO_IMAGES = [hero1, hero2, hero3];
const IG = [ig1, ig2, ig3, ig4, ig5, ig6];
const CATEGORY_IMAGES: Record<string, string> = {
  sports: catSports,
  cartoon: catCartoon,
  animals: catAnimals,
  custom: catCustom,
};

const homeQO = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [categories, featured, reviews] = await Promise.all([
      listCategories(),
      listFeatured(),
      listReviews(),
    ]);
    return { categories, featured, reviews };
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQO),
  component: Home,
});

function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % HERO_IMAGES.length), 5500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="relative -mt-[73px] h-[92vh] min-h-[640px] w-full overflow-hidden">
      {HERO_IMAGES.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      <div className="absolute inset-0 flex items-end">
        <div className="container-x mx-auto max-w-[1400px] pb-16 md:pb-24">
          <span className="eyebrow inline-block rounded-full border border-foreground/25 px-3 py-1.5 text-foreground/90 backdrop-blur-sm">
            Made in Kigali · Since 2021
          </span>
          <h1 className="mt-6 font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
            Floor art,
            <br />
            <span className="italic">made for you.</span>
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/catalogue" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]">
              Explore the catalogue
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium backdrop-blur-sm hover:bg-foreground/10">
              <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQO);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav transparent />
      <main>
        <Hero />

        <section className="py-24 md:py-32">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Shop by style.</h2>
              <Link to="/catalogue" className="hidden text-sm text-muted-foreground hover:text-accent md:inline">All collections →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {data.categories.slice(0, 4).map((c) => (
                <Link key={c.id} to="/catalogue" search={{ category: c.slug }} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted">
                  <img
                    src={c.image_url || CATEGORY_IMAGES[c.slug] || catCustom}
                    alt={`${c.name} rug`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                    <span className="font-serif text-xl italic md:text-2xl">{c.name}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 py-24 md:py-32">
          <div className="container-x mx-auto max-w-[1400px]">
            <span className="eyebrow text-muted-foreground">How it works</span>
            <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-tight md:text-6xl">
              Simple, from sketch to <em>doorstep</em>.
            </h2>
            <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
              {[
                { n: "01", t: "Pick your design", d: "Browse the catalogue or bring your own idea — a photo, a logo, a vibe." },
                { n: "02", t: "We craft it by hand", d: "Every rug is hand-tufted in wool. We'll confirm size, colours, and timeline before we start." },
                { n: "03", t: "Delivered to your door", d: "Rugs shipped or delivered across Kigali. Most orders ready in 3–4 weeks." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="font-serif text-5xl italic text-accent/80">{s.n}</div>
                  <h3 className="mt-5 font-serif text-2xl">{s.t}</h3>
                  <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link to="/how-it-works" className="text-sm text-accent border-b border-accent/40 pb-1 hover:text-foreground">
                Read the full process →
              </Link>
            </div>
          </div>
        </section>

        {data.featured.length > 0 && (
          <section className="py-24 md:py-32">
            <div className="container-x mx-auto max-w-[1400px]">
              <div className="mb-14 flex items-end justify-between gap-6">
                <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Made-to-order pieces.</h2>
                <Link to="/catalogue" className="hidden text-sm text-muted-foreground hover:text-accent md:inline">
                  All commissions →
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                {data.featured.slice(0, 3).map((p) => (
                  <Link key={p.id} to="/catalogue/$slug" params={{ slug: p.slug }} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                      {p.main_image_url && (
                        <img src={p.main_image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="eyebrow text-muted-foreground">{p.category?.name}</div>
                        <h3 className="mt-1.5 font-serif text-2xl">{p.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground italic">
                          {formatPrice({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                        </p>
                      </div>
                      <span className="mt-2 text-sm transition-transform group-hover:translate-x-1">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-24 md:py-32">
          <div className="container-x mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-2 md:gap-20">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <img src={craft1} alt="Hand tufting a rug" loading="lazy" className="aspect-[3/4] w-full rounded-sm object-cover" />
              <img src={craft2} alt="Finished rug" loading="lazy" className="mt-10 aspect-[3/4] w-full rounded-sm object-cover" />
            </div>
            <div>
              <span className="eyebrow text-accent">Our craft</span>
              <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
                Every rug is a <em>one-of-a-kind</em>.
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
                Since 2021, we've been turning ideas into floor art — hand-tufted in wool, built to last, designed to stop people in their tracks.
              </p>
              <Link to="/story" className="mt-8 inline-flex items-center gap-2 text-sm border-b border-foreground/30 pb-1 hover:border-accent hover:text-accent transition-colors">
                Read our story →
              </Link>
            </div>
          </div>
        </section>

        {data.reviews.length > 0 && (
          <section className="border-y border-border/60 bg-muted/30 py-24 md:py-32">
            <div className="container-x mx-auto max-w-[1400px]">
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-accent text-lg tracking-widest">★★★★★</div>
                  <h2 className="mt-3 font-serif text-4xl italic tracking-tight md:text-6xl">Our happy clients.</h2>
                </div>
              </div>
              <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
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

        <section className="py-24 md:py-32">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Follow the work.</h2>
              <a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-sm hover:border-accent hover:text-accent">
                @rugmosiac on Instagram →
              </a>
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
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
