import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer, FloatingWhatsApp } from "@/components/site-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Rug Mosiac" },
      { name: "description", content: "From sketch to doorstep. Every Rug Mosiac piece is hand-tufted to order in Kigali — usually ready in 3–4 weeks." },
      { property: "og:title", content: "How It Works — Rug Mosiac" },
      { property: "og:description", content: "Design, tuft, deliver. That's it." },
    ],
  }),
  component: HowPage,
});

const STEPS = [
  { n: "01", t: "Pick your design", d: "Browse the catalogue or bring your own idea — a photo, a logo, a vibe. We'll confirm size, colours, and mockups before anything is made." },
  { n: "02", t: "We craft it by hand", d: "Every rug is hand-tufted in New Zealand wool. Dense pile, hand-cut detail, finished with cotton backing and edge-locked so it lasts decades." },
  { n: "03", t: "Delivered to your door", d: "Rugs shipped or delivered across Kigali, and internationally on request. Most orders ready in 3–4 weeks." },
];

const FAQ = [
  { q: "How long does a custom rug take?", a: "3–4 weeks from design approval to delivery. Complex pieces or larger sizes can take up to 6 weeks — we'll always confirm a timeline before starting." },
  { q: "What does it cost?", a: "Every piece is quoted individually based on size, complexity, and colour count. Small rugs typically start around 750,000 RWF; larger statement pieces 1.5M+." },
  { q: "Can you match a specific colour?", a: "Yes. We keep a wide wool library and can dye custom colours when needed. We'll send you a physical sample before we start." },
  { q: "Do you ship internationally?", a: "Yes. We regularly ship across East Africa, Europe, and the US. Shipping is quoted per order." },
  { q: "What if I don't like it?", a: "We share progress photos throughout production. Every design is signed off before the final piece is finished — no surprises." },
];

function HowPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
          <span className="eyebrow text-muted-foreground">How it works</span>
          <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-7xl">
            From sketch to <em>doorstep</em>.
          </h1>
          <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="font-serif text-6xl italic text-accent/80">{s.n}</div>
                <h3 className="mt-5 font-serif text-2xl">{s.t}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-border/60 py-20 md:py-28">
          <div className="container-x mx-auto max-w-[900px]">
            <h2 className="font-serif text-4xl italic tracking-tight md:text-5xl">Common questions.</h2>
            <div className="mt-10 divide-y divide-border/60">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-xl">
                    {f.q}
                    <span className="text-accent transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-14 flex flex-wrap gap-3">
              <Link to="/custom" className="rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background">Start a custom order →</Link>
              <Link to="/catalogue" className="rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium">Browse the catalogue</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
