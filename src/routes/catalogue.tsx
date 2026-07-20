import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Nav, Footer, FloatingWhatsApp, formatPrice } from "@/components/site-chrome";
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

type Search = { category?: string };

export const Route = createFileRoute("/catalogue")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(catalogueQO(deps.category)),
  head: () => ({
    meta: [
      { title: "Catalogue — Rug Mosiac" },
      { name: "description", content: "Browse our hand-tufted rug catalogue — sports, cartoon, animals, art, and fully custom pieces." },
      { property: "og:title", content: "Catalogue — Rug Mosiac" },
      { property: "og:description", content: "Hand-tufted rugs made to order in Kigali." },
    ],
  }),
  component: CataloguePage,
});

function CataloguePage() {
  const { category } = Route.useSearch();
  const { data } = useSuspenseQuery(catalogueQO(category));
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
        </div>
        {data.products.length === 0 ? (
          <div className="rounded-sm border border-border/60 py-24 text-center">
            <p className="font-serif text-2xl italic">No rugs in this category yet.</p>
            <p className="mt-3 text-muted-foreground">Every design is custom — start yours below.</p>
            <Link to="/custom" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
              Start a custom order →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {data.products.map((p) => (
              <Link key={p.id} to="/catalogue/$slug" params={{ slug: p.slug }} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                  {p.main_image_url && (
                    <img src={p.main_image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow text-muted-foreground">{p.category?.name ?? "Custom"}</div>
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
        )}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
