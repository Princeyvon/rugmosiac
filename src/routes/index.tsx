import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import catSports from "@/assets/cat-sports.jpg";
import catCartoon from "@/assets/cat-cartoon.jpg";
import catAnimals from "@/assets/cat-animals.jpg";
import catCustom from "@/assets/cat-custom.jpg";
import rug1 from "@/assets/rug-1.jpg";
import rug2 from "@/assets/rug-2.jpg";
import rug3 from "@/assets/rug-3.jpg";
import craft1 from "@/assets/craft-1.jpg";
import craft2 from "@/assets/craft-2.jpg";
import ig1 from "@/assets/ig-1.jpg";
import ig2 from "@/assets/ig-2.jpg";
import ig3 from "@/assets/ig-3.jpg";
import ig4 from "@/assets/ig-4.jpg";
import ig5 from "@/assets/ig-5.jpg";
import ig6 from "@/assets/ig-6.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const WHATSAPP_URL = "https://wa.me/250780000000";
const HERO_IMAGES = [hero1, hero2, hero3];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.51-8.413z" />
    </svg>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <div className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container-x mx-auto max-w-[1400px] py-2.5 text-center">
          <p className="eyebrow text-muted-foreground">
            Handmade in Kigali · Made to order · Any design, yours forever
          </p>
        </div>
      </div>
      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur border-b border-border/60" : "bg-transparent"
        }`}
      >
        <div className="container-x mx-auto flex max-w-[1400px] items-center justify-between py-5">
          <a href="/" className="font-serif text-2xl italic tracking-tight">
            Rug Mosiac
          </a>
          <nav className="hidden items-center gap-9 text-sm md:flex">
            <a href="#catalogue" className="hover:text-accent transition-colors">Catalogue</a>
            <a href="#how" className="hover:text-accent transition-colors">How It Works</a>
            <a href="#story" className="hover:text-accent transition-colors">Our Story</a>
            <a href="#contact" className="hover:text-accent transition-colors">Contact</a>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground transition-transform hover:scale-[1.03]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Order on WhatsApp</span>
            <span className="sm:hidden">Order</span>
          </a>
        </div>
      </header>
    </>
  );
}

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
          width={1920}
          height={1280}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      <div className="absolute inset-0 flex items-end">
        <div className="container-x mx-auto max-w-[1400px] pb-16 md:pb-24">
          <span className="eyebrow inline-block rounded-full border border-foreground/25 px-3 py-1.5 text-foreground/90 backdrop-blur-sm">
            Made in Kigali · Since 2021
          </span>
          <h1 className="mt-6 font-serif text-6xl leading-[0.95] tracking-tight text-foreground md:text-8xl">
            Floor art,
            <br />
            <span className="italic">made for you.</span>
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#catalogue"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Explore the catalogue
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-foreground/10"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Order on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORIES = [
  { name: "Sports", img: catSports },
  { name: "Cartoon", img: catCartoon },
  { name: "Animals", img: catAnimals },
  { name: "Custom", img: catCustom },
];

function Categories() {
  return (
    <section id="catalogue" className="py-24 md:py-32">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Shop by style.</h2>
          <span className="eyebrow hidden text-muted-foreground md:block">Four collections</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {CATEGORIES.map((c) => (
            <a
              key={c.name}
              href={WHATSAPP_URL}
              className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted"
            >
              <img
                src={c.img}
                alt={`${c.name} rug`}
                loading="lazy"
                width={900}
                height={1100}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                <span className="font-serif text-xl italic text-foreground md:text-2xl">
                  {c.name}
                </span>
                <span className="text-foreground transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", t: "Pick your design", d: "Browse the catalogue or bring your own idea — a photo, a logo, a vibe." },
  { n: "02", t: "We craft it by hand", d: "Every rug is hand-tufted in wool. We'll confirm size, colours, and timeline before we start." },
  { n: "03", t: "Delivered to your door", d: "Rugs shipped or delivered across Kigali. Most orders ready in 3–4 weeks." },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y border-border/60 py-24 md:py-32">
      <div className="container-x mx-auto max-w-[1400px]">
        <span className="eyebrow text-muted-foreground">How it works</span>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-tight md:text-6xl">
          Simple, from sketch to <em>doorstep</em>.
        </h2>
        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-serif text-5xl italic text-accent/80">{s.n}</div>
              <h3 className="mt-5 font-serif text-2xl">{s.t}</h3>
              <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const RUGS = [
  { name: "Constellation", tag: "Art", img: rug1 },
  { name: "Bengal", tag: "Animals", img: rug2 },
  { name: "The Crest", tag: "Sports", img: rug3 },
];

function Featured() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="mb-14 flex items-end justify-between gap-6">
          <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Made-to-order pieces.</h2>
          <a href={WHATSAPP_URL} className="hidden text-sm text-muted-foreground hover:text-accent md:inline">
            All commissions →
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {RUGS.map((r) => (
            <a key={r.name} href={WHATSAPP_URL} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                <img
                  src={r.img}
                  alt={r.name}
                  loading="lazy"
                  width={1000}
                  height={1000}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow text-muted-foreground">{r.tag}</div>
                  <h3 className="mt-1.5 font-serif text-2xl">{r.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground italic">Price on request</p>
                </div>
                <span className="mt-2 text-sm transition-transform group-hover:translate-x-1">View →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="story" className="py-24 md:py-32">
      <div className="container-x mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-2 md:gap-20">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <img src={craft1} alt="Hand tufting a rug" loading="lazy" width={900} height={1100} className="aspect-[3/4] w-full rounded-sm object-cover" />
          <img src={craft2} alt="Finished rug in a room" loading="lazy" width={900} height={1100} className="mt-10 aspect-[3/4] w-full rounded-sm object-cover" />
        </div>
        <div>
          <span className="eyebrow text-accent">Our craft</span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
            Every rug is a <em>one-of-a-kind</em>.
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
            Since 2021, we've been turning ideas into floor art — hand-tufted in wool, built to last,
            designed to stop people in their tracks.
          </p>
          <a href="#story" className="mt-8 inline-flex items-center gap-2 text-sm text-foreground border-b border-foreground/30 pb-1 hover:border-accent hover:text-accent transition-colors">
            Read our story →
          </a>
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { quote: "I brought them a doodle of my dog and they turned it into a rug that stops every guest in their tracks. Unreal craftsmanship.", name: "Aline M.", place: "Kigali" },
  { quote: "The colours are richer than I imagined, and it feels dense and heavy in the best way. Worth every franc.", name: "David K.", place: "Kimihurura" },
  { quote: "From the first WhatsApp to delivery was three weeks. They confirmed every detail. Genuinely thoughtful people.", name: "Sarah B.", place: "Nyarutarama" },
];

function Reviews() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-24 md:py-32">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-accent text-lg tracking-widest">★★★★★</div>
            <h2 className="mt-3 font-serif text-4xl italic tracking-tight md:text-6xl">Our happy clients.</h2>
          </div>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="flex h-full flex-col justify-between rounded-sm border border-border bg-card p-7">
              <blockquote className="font-serif text-xl leading-relaxed">"{r.quote}"</blockquote>
              <figcaption className="mt-8 text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">{r.place}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const IG = [ig1, ig2, ig3, ig4, ig5, ig6];

function Instagram() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Follow the work.</h2>
          <a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-sm hover:border-accent hover:text-accent transition-colors">
            @rugmosiac on Instagram →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6 md:gap-3">
          {IG.map((src, i) => (
            <a key={i} href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="group aspect-square overflow-hidden rounded-sm bg-muted">
              <img src={src} alt="Rug Mosiac portfolio" loading="lazy" width={800} height={800} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-border/60 py-16">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="text-center">
          <a href="/" className="font-serif text-3xl italic">Rug Mosiac</a>
        </div>
        <div className="mt-14 grid gap-10 text-sm md:grid-cols-4">
          <div>
            <div className="eyebrow text-muted-foreground">Shop</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#catalogue" className="hover:text-accent">Catalogue</a></li>
              <li><a href="#catalogue" className="hover:text-accent">Sports</a></li>
              <li><a href="#catalogue" className="hover:text-accent">Cartoon</a></li>
              <li><a href="#catalogue" className="hover:text-accent">Custom</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Company</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#story" className="hover:text-accent">Our Story</a></li>
              <li><a href="#how" className="hover:text-accent">How It Works</a></li>
              <li><a href="#contact" className="hover:text-accent">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Connect</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="hover:text-accent">Instagram</a></li>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-accent">+250 780 000 000</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Order</div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              All orders placed via WhatsApp. We'll confirm size, design, and delivery before we begin.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-xs font-medium text-whatsapp-foreground">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Start an order
            </a>
          </div>
        </div>
        <div className="mt-14 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © 2025 Rug Mosiac · Kigali, Rwanda
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Order on WhatsApp" className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-2xl shadow-black/40 transition-transform hover:scale-110">
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Categories />
        <HowItWorks />
        <Featured />
        <Story />
        <Reviews />
        <Instagram />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
