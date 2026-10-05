import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Nav, Footer, resolveImage, WishlistHeart } from "@/components/site-chrome";
import { useCurrency } from "@/lib/currency";
import { listCategories, listProducts } from "@/lib/catalogue.functions";
import { CatalogueFilterBar } from "@/components/catalogue/CatalogueFilterBar";
import {
  type SortKey,
  matchProductColor,
  matchProductShape,
  computeProductRelevance,
} from "@/lib/catalogue-filters";

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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
      { title: "Catalogue | Mosiac" },
      { name: "description", content: "Browse our hand-tufted rug catalogue: sports, cartoon, animals, art, and fully custom pieces." },
      { property: "og:title", content: "Catalogue | Mosiac" },
      { property: "og:description", content: "Hand-tufted rugs made to order in Kigali." },
    ],
  }),
  component: CataloguePage,
});

function CataloguePage() {
  const { category, filter } = Route.useSearch();
  const { data } = useSuspenseQuery(catalogueQO(category));
  const { format } = useCurrency();

  // Filter & Sort State
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>(filter === "new" ? "newest" : "featured");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced Meta Search tracking when shopper searches catalogue
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 3) {
      const timer = setTimeout(() => {
        import("@/lib/meta-client")
          .then(({ trackMetaEvent }) => {
            trackMetaEvent("Search", {
              query: trimmed,
              search_string: trimmed,
              content_type: "product",
            });
          })
          .catch(() => {});
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleToggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    );
  };

  const handleToggleShape = (shapeId: string) => {
    setSelectedShapes((prev) =>
      prev.includes(shapeId) ? prev.filter((id) => id !== shapeId) : [...prev, shapeId]
    );
  };

  const handleResetAll = () => {
    setSelectedColors([]);
    setSelectedShapes([]);
    setSortKey("featured");
    setSearchQuery("");
  };

  // Base list
  const baseProducts = useMemo(() => {
    if (filter === "new") {
      return data.products.filter((p) => ((p.tags ?? []) as string[]).includes("new"));
    }
    return data.products;
  }, [data.products, filter]);

  // Apply filters and sorting dynamically
  const displayedProducts = useMemo(() => {
    let result = baseProducts;

    // 1. Color filter (OR logic across selected colors)
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        selectedColors.some((colorId) => matchProductColor(p, colorId))
      );
    }

    // 2. Shape filter (OR logic across selected shapes)
    if (selectedShapes.length > 0) {
      result = result.filter((p) =>
        selectedShapes.some((shapeId) => matchProductShape(p, shapeId))
      );
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      result = result.filter((p) => computeProductRelevance(p, searchQuery) > 0);
    }

    // 4. Dynamic Sorting
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case "relevance": {
          if (searchQuery.trim()) {
            const scoreA = computeProductRelevance(a, searchQuery);
            const scoreB = computeProductRelevance(b, searchQuery);
            return scoreB - scoreA;
          }
          const orderA = (a as unknown as { featured_order?: number }).featured_order ?? 999;
          const orderB = (b as unknown as { featured_order?: number }).featured_order ?? 999;
          return orderA - orderB;
        }
        case "featured": {
          const orderA = (a as unknown as { featured_order?: number }).featured_order ?? 999;
          const orderB = (b as unknown as { featured_order?: number }).featured_order ?? 999;
          return orderA - orderB;
        }
        case "newest": {
          const dateA = new Date((a as unknown as { created_at?: string }).created_at || 0).getTime();
          const dateB = new Date((b as unknown as { created_at?: string }).created_at || 0).getTime();
          return dateB - dateA;
        }
        case "bestselling": {
          const bestA = (a.tags || []).includes("bestseller") ? 1 : 0;
          const bestB = (b.tags || []).includes("bestseller") ? 1 : 0;
          if (bestA !== bestB) return bestB - bestA;
          const orderA = (a as unknown as { featured_order?: number }).featured_order ?? 999;
          const orderB = (b as unknown as { featured_order?: number }).featured_order ?? 999;
          return orderA - orderB;
        }
        case "alpha_asc":
          return a.name.localeCompare(b.name);
        case "alpha_desc":
          return b.name.localeCompare(a.name);
        case "price_asc": {
          const pA = a.base_price_rwf ?? 0;
          const pB = b.base_price_rwf ?? 0;
          return pA - pB;
        }
        case "price_desc": {
          const pA = a.base_price_rwf ?? 0;
          const pB = b.base_price_rwf ?? 0;
          return pB - pA;
        }
        default:
          return 0;
      }
    });
  }, [baseProducts, selectedColors, selectedShapes, searchQuery, sortKey]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1440px] py-12 md:py-20 w-full max-w-full overflow-x-clip">
        {/* Centered cool header: "All Rugs" */}
        <div className="mb-10 md:mb-12 text-center">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-foreground">
            All Rugs
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground font-mono">
            {displayedProducts.length} {displayedProducts.length === 1 ? "design" : "designs"} · hand-tufted in kigali
          </p>
        </div>

        {/* E-Commerce Filter Bar with COLOR, SORT, and SHAPE controls */}
        <CatalogueFilterBar
          totalCount={baseProducts.length}
          filteredCount={displayedProducts.length}
          selectedColors={selectedColors}
          onToggleColor={handleToggleColor}
          onClearColors={() => setSelectedColors([])}
          selectedShapes={selectedShapes}
          onToggleShape={handleToggleShape}
          onClearShapes={() => setSelectedShapes([])}
          sortKey={sortKey}
          onSelectSort={setSortKey}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onResetAll={handleResetAll}
        />

        {displayedProducts.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-muted/20 py-20 text-center">
            <p className="font-serif text-2xl italic">No rugs match your selected filters.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your color, shape, or search criteria.
            </p>
            <button
              type="button"
              onClick={handleResetAll}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background hover:bg-foreground/90 transition-all"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          /* Responsive Product Grid: 4 products in a row on full desktop view */
          <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 lg:gap-7">
            {displayedProducts.map((p) => (
              <Link
                key={p.id}
                to="/catalogue/$slug"
                params={{ slug: p.slug }}
                className="group block overflow-hidden rounded-2xl bg-muted/40 p-2.5 transition-all md:rounded-xl md:bg-transparent md:p-0"
              >
                {/* Product image container with slight round corners on mobile and desktop */}
                <div className="relative aspect-square overflow-hidden rounded-xl md:rounded-xl bg-background md:bg-muted/70 shadow-xs">
                  <WishlistHeart
                    product={{
                      productId: p.id,
                      slug: p.slug,
                      name: p.name,
                      image: resolveImage(p.main_image_url),
                    }}
                  />
                  {resolveImage(p.main_image_url) && (
                    <img
                      src={resolveImage(p.main_image_url)}
                      alt={p.name}
                      loading="lazy"
                      className={`h-full w-full rounded-xl md:rounded-xl object-cover transition-all duration-700 group-hover:scale-105 ${
                        p.hover_image_url ? "group-hover:opacity-0" : ""
                      }`}
                    />
                  )}
                  {resolveImage(p.hover_image_url) && (
                    <img
                      src={resolveImage(p.hover_image_url)}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full scale-105 rounded-xl md:rounded-xl object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />
                  )}
                  <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
                    {((p.tags ?? []) as string[]).includes("new") && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground shadow-xs">
                        New
                      </span>
                    )}
                    {p.stock_status === "out_of_stock" && (
                      <span className="rounded-full bg-foreground/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-background shadow-xs">
                        Sold out
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile card info */}
                <div className="mt-2.5 md:hidden">
                  <h3 className="truncate font-display text-[15px] font-medium leading-tight">
                    {p.name}
                  </h3>
                  <p className="truncate text-[13px] text-muted-foreground mt-0.5">
                    in {(p.color_palette ?? [])[0] ?? p.category?.name ?? "Wool"}
                  </p>
                  <p className="mt-1 text-[13px] font-medium">
                    From {format({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                  </p>
                </div>

                {/* Desktop card info (balanced for 4-column layout) */}
                <div className="mt-3.5 hidden items-start justify-between gap-3 md:flex">
                  <div className="min-w-0 flex-1">
                    <div className="eyebrow text-[11px] text-muted-foreground truncate">
                      {p.category?.name ?? "Hand-tufted"}
                    </div>
                    <h3 className="mt-1 font-serif text-xl lg:text-[21px] tracking-tight truncate">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground italic">
                      From {format({ rwf: p.base_price_rwf, usd: p.base_price_usd })}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-xs font-medium text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

