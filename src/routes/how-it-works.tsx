import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import { FaqBlock, NewsletterWeekly } from "@/components/blocks";
import { FAQ_SECTIONS, SUPPORT_EMAIL } from "@/lib/faq-content";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Mosiac" },
      { name: "description", content: "From sketch to doorstep. Every Mosiac piece is hand-tufted to order in Kigali — usually ready in 3–4 weeks." },
      { property: "og:title", content: "How It Works — Mosiac" },
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
        <div className="border-t border-border/60 pt-14">
          <div className="container-x mx-auto max-w-[900px]">
            <span className="eyebrow text-muted-foreground">Everything else</span>
            <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Questions, answered.</h2>
          </div>
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} className="container-x mx-auto mt-10 max-w-[900px]">
              <h3 className="font-display text-2xl">{section.title}</h3>
              <FaqBlock items={section.items} />
            </div>
          ))}
          <p className="container-x mx-auto mt-10 max-w-[900px] text-sm text-muted-foreground">
            Still need help? Email{" "}
            <a className="text-accent underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </div>
        <div className="container-x mx-auto max-w-[900px] pb-4 flex flex-wrap gap-3">
          <Link to="/custom" className="rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background">Start a custom order →</Link>
          <Link to="/catalogue" className="rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium">Browse the catalogue</Link>
        </div>
        <NewsletterWeekly />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
