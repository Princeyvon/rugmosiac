import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Nav, Footer, FloatingWhatsApp, resolveImage, WishlistHeart } from "@/components/site-chrome";
import { useCurrency } from "@/lib/currency";

import { listCategories, listProducts } from "@/lib/catalogue.functions";

const catalogueQO = (categorySlug?: string) =>
  queryOptions({
    queryKey: ["catalogue", categorySlug ?? "all"],
    queryFn: async () => {
      const [categories, products] = await Promise.all([
        listCategories(),
        listProducts({ data: { categorySlug } }),
      ]);
      return { categories, products };
    },
  });

type Search = { category?: string; filter?: "new" };

export const Route = createFileRoute("/catalogue/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    filter: s.filter === "new" ? "new" : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(catalogueQO(deps.category)),
  head: () => ({
    meta: [
      { title: "Catalogue — Mosiac" },
      { name: "description", content: "Browse our hand-tufted rug catalogue — sports, cartoon, animals, art, and fully custom pieces." },
      { property: "og:title", content: "Catalogue — Mosiac" },
      { property: "og:description", content: "Hand-tufted rugs made to order in Kigali." },
    ],
  }),
  component: CataloguePage,
});

function CataloguePage() {
  const { category, filter } = Route.useSearch();
  const { data } = useSuspenseQuery(catalogueQO(category));
  const { format } = useCurrency();

  const products = filter === "new"
    ? data.products.filter((p) => ((p.tags ?? []) as string[]).includes("new"))
    : data.products;


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
        <div className="mb-10">
          <span className="eyebrow text-muted-foreground">The catalogue</span>
          <h1 className="mt-3 font-serif text-5xl italic tracking-tight md:text-7xl">Every rug, made for you.</h1>
        </div>
        <div className="mb-12 flex flex-wrap gap-2">
          <Link
            to="/catalogue"
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${!category ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40"}`}
          >
            All
          </Link>
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to="/catalogue"
              search={{ category: c.slug }}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${category === c.slug ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {c.name}
            </Link>
          ))}
          <Link
            to="/catalogue"
            search={{ ...(category ? { category } : {}), filter: "new" as const }}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${filter === "new" ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40"}`}
          >
            New in
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-sm border border-border/60 py-24 text-center">
            <p className="font-serif text-2xl italic">No rugs in this category yet.</p>
            <p className="mt-3 text-muted-foreground">Every design is custom — start yours below.</p>
            <Link to="/custom" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
              Start a custom order →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-8">
            {products.map((p) => (
              <Link
                key={p.id}
                to="/catalogue/$slug"
                params={{ slug: p.slug }}
                className="group block overflow-hidden rounded-2xl bg-muted/40 p-3 md:rounded-none md:bg-transparent md:p-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-background md:rounded-sm md:bg-muted">
                  <WishlistHeart product={{ productId: p.id, slug: p.slug, name: p.name, image: resolveImage(p.main_image_url) }} />
                  {resolveImage(p.main_image_url) && (
                    <img src={resolveImage(p.main_image_url)} alt={p.name} loading="lazy" className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${p.hover_image_url ? "group-hover:opacity-0" : ""}`} />
                  )}
                  {resolveImage(p.hover_image_url) && (
                    <img src={resolveImage(p.hover_image_url)} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  )}
                  <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
                    {((p.tags ?? []) as string[]).includes("new") && (
                      <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                        New
                      </span>
                    )}
                    {p.stock_status === "out_of_stock" && (
                      <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
                        Sold out
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile card copy — name, colour, from-price */}
                <div className="mt-3 md:hidden">
                  <h3 className="truncate font-display text-[17px] font-medium leading-tight">{p.name}</h3>
                  <p className="truncate text-[15px] text-muted-foreground">
                    in {(p.color_palette ?? [])[0] ?? p.category?.name ?? "Wool"}
                  </p>
                  <p className="mt-1 text-[15px] font-medium">
                    From {format({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                  </p>
                </div>

                <div className="mt-5 hidden items-start justify-between gap-4 md:flex">
                  <div>
                    <div className="eyebrow text-muted-foreground">{p.category?.name ?? "Custom"}</div>
                    <h3 className="mt-1.5 font-serif text-2xl">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground italic">
                      {format({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                    </p>
                  </div>
                  <span className="mt-2 text-sm transition-transform group-hover:translate-x-1">View →</span>
                </div>
              </Link>
            ))}
          </div>

        )}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
