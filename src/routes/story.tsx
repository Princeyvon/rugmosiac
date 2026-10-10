import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/site-chrome";
import { RequestCallback, NewsletterWeekly } from "@/components/blocks";
import { CraftPageContent } from "@/components/craft/CraftPageContent";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story & Craft | Mosiac Hand-Tufted Rugs Kigali" },
      {
        name: "description",
        content:
          "Since 2021, Mosiac has transformed ideas into architectural floor art, hand-tufted in Kigali, Rwanda from pure Highland wool, sculpted by master artisans, built to last decades.",
      },
      {
        property: "og:title",
        content: "Our Story & Craft | Mosiac Kigali",
      },
      {
        property: "og:description",
        content:
          "The Kigali atelier hand-tufting one-of-one rugs: pure Highland fleece, vertical looms, botanical vulcanization, and sculptural duckbill hand-carving.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20">
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
