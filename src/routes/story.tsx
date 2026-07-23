import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import craft1 from "@/assets/craft-1.jpg";
import craft2 from "@/assets/craft-2.jpg";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story — Mosiac" },
      { name: "description", content: "Since 2021, Mosiac has been turning ideas into floor art — hand-tufted in Kigali, built to last." },
      { property: "og:title", content: "Our Story — Mosiac" },
      { property: "og:description", content: "The Kigali studio hand-tufting one-of-one rugs." },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section className="container-x mx-auto max-w-[1100px] py-16 md:py-24">
          <span className="eyebrow text-accent">Our craft</span>
          <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-7xl">
            Every rug is a <em>one-of-a-kind</em>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Mosiac started in 2021 in a small Kigali studio, with a tufting gun, a few kilos of wool,
            and a stubborn idea: that a rug should be a piece of art, not a filler. Four years later,
            we're still hand-tufting every piece ourselves — no factories, no shortcuts.
          </p>
        </section>
        <section className="border-y border-border/60 py-20 md:py-28">
          <div className="container-x mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-2 md:gap-20">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <img src={craft1} alt="Hand tufting" width={900} height={1100} className="aspect-[3/4] w-full rounded-sm object-cover" />
              <img src={craft2} alt="Finished rug" width={900} height={1100} className="mt-10 aspect-[3/4] w-full rounded-sm object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-4xl tracking-tight md:text-5xl">Hand-tufted, wool through and through.</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                We work with New Zealand wool — the good stuff — and hand-cut every design for depth and texture.
                Every rug is finished with cotton backing and edge-locked so it stays sharp for decades, not seasons.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                No two rugs are the same. Every piece is signed, dated, and made for one person.
              </p>
            </div>
          </div>
        </section>
        <section className="container-x mx-auto max-w-[900px] py-20 text-center md:py-28">
          <h2 className="font-serif text-4xl italic tracking-tight md:text-6xl">Ready to design yours?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/custom" className="rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background">Start a custom order →</Link>
            <Link to="/catalogue" className="rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium">Browse the catalogue</Link>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
