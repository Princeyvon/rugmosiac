import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Nav, Footer, FloatingWhatsApp, WhatsAppIcon, WHATSAPP_URL, formatPrice } from "@/components/site-chrome";
import { getProduct } from "@/lib/catalogue.functions";

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });

export const Route = createFileRoute("/catalogue/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQO(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Rug Mosiac` },
          { name: "description", content: loaderData.short_description ?? "Hand-tufted rug, made to order in Kigali." },
          { property: "og:title", content: `${loaderData.name} — Rug Mosiac` },
          { property: "og:description", content: loaderData.short_description ?? "" },
          ...(loaderData.main_image_url ? [{ property: "og:image", content: loaderData.main_image_url }] : []),
        ]
      : [{ title: "Rug — Rug Mosiac" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="container-x mx-auto max-w-[1400px] py-32 text-center">
        <h1 className="font-serif text-5xl italic">Rug not found.</h1>
        <Link to="/catalogue" className="mt-6 inline-block text-accent">← Back to catalogue</Link>
      </div>
      <Footer />
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  if (!p) return null;
  const sizes = (p.sizes ?? []).slice().sort((a, b) => (a as any).sort_order - (b as any).sort_order);
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.id ?? "");
  const images = (p.images ?? []).slice().sort((a, b) => (a as any).sort_order - (b as any).sort_order);
  const gallery = images.length > 0 ? images.map((i) => i.url) : p.main_image_url ? [p.main_image_url] : [];
  const [active, setActive] = useState(0);
  const chosen = sizes.find((s) => s.id === selectedSize);
  const price = chosen
    ? formatPrice({ rwf: chosen.price_rwf, usd: chosen.price_usd })
    : formatPrice({ rwf: p.base_price_rwf, usd: p.base_price_usd });

  const waMsg = encodeURIComponent(
    `Hi Rug Mosiac — I'm interested in "${p.name}"${chosen ? ` (${chosen.label})` : ""}. Can we chat?`,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1400px] py-12 md:py-16">
        <Link to="/catalogue" className="eyebrow text-muted-foreground hover:text-accent">← Catalogue</Link>
        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
              {gallery[active] && <img src={gallery[active]} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <button key={src} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-sm border ${i === active ? "border-accent" : "border-transparent"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">{p.category?.name}</div>
            <h1 className="mt-2 font-serif text-5xl italic tracking-tight md:text-6xl">{p.name}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{p.short_description}</p>
            <div className="mt-6 font-serif text-3xl">{price}</div>
            {sizes.length > 0 && (
              <div className="mt-8">
                <div className="eyebrow mb-3 text-muted-foreground">Size</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      className={`rounded-sm border px-4 py-2.5 text-sm transition-colors ${selectedSize === s.id ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={`${WHATSAPP_URL}?text=${waMsg}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-medium text-whatsapp-foreground">
                <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
              </a>
              <Link to="/custom" className="inline-flex items-center gap-2 rounded-full border border-foreground/40 px-6 py-3.5 text-sm font-medium hover:bg-foreground/10">
                Customise this design
              </Link>
            </div>
            {p.description && (
              <div className="mt-12 border-t border-border/60 pt-8">
                <div className="eyebrow mb-3 text-muted-foreground">Details</div>
                <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            )}
            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {p.material && (<><dt className="text-muted-foreground">Material</dt><dd>{p.material}</dd></>)}
              {p.production_time && (<><dt className="text-muted-foreground">Lead time</dt><dd>{p.production_time}</dd></>)}
              <dt className="text-muted-foreground">Shape</dt><dd className="capitalize">{p.shape}</dd>
              <dt className="text-muted-foreground">Availability</dt><dd className="capitalize">{p.stock_status.replace(/_/g, " ")}</dd>
            </dl>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
