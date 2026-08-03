import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import { NewsletterWeekly, RequestCallback } from "@/components/blocks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { FAQ_SECTIONS as SECTIONS, SUPPORT_EMAIL as EMAIL } from "@/lib/faq-content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Mosiac" },
      { name: "description", content: "Answers to common questions about Mosiac rugs, orders, shipping, and care." },
      { property: "og:title", content: "FAQ — Mosiac" },
      { property: "og:description", content: "Answers to common questions about Mosiac rugs, orders, shipping, and care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-3xl px-6 pb-24 pt-16 md:pt-20">
        <header className="text-center">
          <div className="eyebrow text-muted-foreground">Help</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl tracking-tight">FAQ</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Answers to the most common questions about our rugs, orders, shipments, and payments.
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl">{section.title}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {section.items.map((it, idx) => (
                <AccordionItem key={idx} value={`${section.title}-${idx}`}>
                  <AccordionTrigger className="text-left text-base md:text-lg font-medium">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <p className="mt-16 text-center text-sm text-muted-foreground">
          Still need help? Email <a className="text-accent underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
        <div className="mt-8 flex justify-center"><RequestCallback /></div>
      </main>
      <NewsletterWeekly />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
