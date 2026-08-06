import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Nav, Footer, FloatingWhatsApp, resolveImage, WishlistHeart } from "@/components/site-chrome";
import { NewsletterWeekly } from "@/components/blocks";
import { useCurrency } from "@/lib/currency";
import { listExploreShots } from "@/lib/catalogue.functions";

const exploreQO = queryOptions({
  queryKey: ["explore-shots"],
  queryFn: () => listExploreShots(),
});


export const Route = createFileRoute("/explore")({
  loader: ({ context }) => context.queryClient.ensureQueryData(exploreQO),
  head: () => ({
    meta: [
      { title: "Explore — Mosiac Hand-Tufted Rugs" },
      { name: "description", content: "Browse the full Mosiac gallery of hand-tufted rugs — every piece made to order in Kigali." },
      { property: "og:title", content: "Explore — Mosiac Hand-Tufted Rugs" },
      { property: "og:description", content: "A visual gallery of Mosiac rugs, shot in real homes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
  errorComponent: ({ error }) => <div role="alert" className="p-16 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-16 text-center">Nothing to explore yet.</div>,
});

function ExplorePage() {
  const { data: products } = useSuspenseQuery(exploreQO);
  const { format } = useCurrency();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section className="container-x mx-auto max-w-[1400px] pt-12 pb-10 md:pt-16">
          <span className="eyebrow text-muted-foreground">Explore</span>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            Every rug we've made, in <span className="italic">real rooms</span>.
          </h1>
          <p className="mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
            Tap any piece to see its full story, sizing guide, and price.
          </p>
        </section>

        <section className="container-x mx-auto max-w-[1400px] pb-20">
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
            {products.map((p, i) => {
              const img = resolveImage(p.main_image_url);
              const ratio = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[4/3]", "aspect-[5/6]", "aspect-[2/3]"][i % 6];
              return (
                <Link
                  key={p.id}
                  to="/catalogue/$slug"
                  params={{ slug: p.slug }}
                  className="group block break-inside-avoid"
                >
                  <div className={`relative ${ratio} overflow-hidden rounded-xl bg-muted`}>
                    <WishlistHeart product={{ productId: p.id, slug: p.slug, name: p.name, image: img }} />
                    {img && (
                      <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-10 md:p-4 md:pt-14">
                      <h2 className="font-display text-sm font-medium leading-tight text-white md:text-base">{p.name}</h2>
                      <p className="mt-0.5 text-[11px] text-white/80 md:text-xs">
                        Starting from {format({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <NewsletterWeekly />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
