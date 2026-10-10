import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/site-chrome";
import { RequestCallback, NewsletterWeekly } from "@/components/blocks";
import { CraftPageContent } from "@/components/craft/CraftPageContent";
import { FaqStructuredData } from "@/components/SeoStructuredData";

export const Route = createFileRoute("/craft")({
  head: () => ({
    meta: [
      { title: "Our Craft & Savoir-Faire | Rug Mosaic Hand-Tufted Rugs Kigali" },
      {
        name: "description",
        content:
          "Discover the architectural craftsmanship behind Rug Mosaic rugs. 100% pure Highland wool, high-density loom tufting, duckbill shear sculptural carving, and botanical vulcanization in Kigali, Rwanda.",
      },
      {
        property: "og:title",
        content: "Our Craft & Savoir-Faire | Rug Mosaic Handcrafted Rugs",
      },
      {
        property: "og:description",
        content:
          "From raw high-altitude fleece to surgical duckbill carving: explore how Rug Mosaic handcrafts bespoke architectural floor art in Kigali.",
      },
      { property: "og:url", content: "https://mosiac.rw/craft" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://mosiac.rw/craft" }],
  }),
  component: CraftPage,
});

const CRAFT_FAQS = [
  {
    question: "What wool does Rug Mosaic use for its hand-tufted rugs?",
    answer:
      "We use 100% natural highland long-staple fleece spun for superior durability, natural lanolin stain resistance, and cloud-soft footfall feel.",
  },
  {
    question: "How long does it take to make a custom hand-tufted rug?",
    answer:
      "Standard atelier turnaround is 10 to 14 business days from design confirmation to final duckbill sculptural beveling and anti-slip backing cure.",
  },
  {
    question: "Can I commission a custom design or non-standard dimension?",
    answer:
      "Yes, Rug Mosaic specializes in bespoke commissions. Any vector illustration, geometric floorplan, or irregular organic shape can be rendered into high-density tufted wool.",
  },
  {
    question: "Where are Rug Mosaic rugs crafted?",
    answer:
      "Every piece is handcrafted in our Kigali atelier in Rwanda by experienced Rwandan master tufters and textile sculptors.",
  },
  {
    question: "What backing materials and finishes are applied?",
    answer:
      "We offer Anti-Slip Natural Latex, Heavy-Duty Floor Felt, and Wall-Art Tapestry Loops for architectural vertical display.",
  },
];

function CraftPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20">
      <FaqStructuredData faqs={CRAFT_FAQS} />
      <Nav />
      <main className="flex-1 w-full overflow-x-clip">
        <CraftPageContent />
        <RequestCallback />
        <NewsletterWeekly />
      </main>
      <Footer />
    </div>
  );
}
