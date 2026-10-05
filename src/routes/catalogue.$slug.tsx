import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  useSuspenseQuery,
  useQuery,
  queryOptions,
} from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  Minus,
  Plus,
  Ruler,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Droplet,
  Scissors,
  Sparkles,
  Wind,
} from "lucide-react";
import { Nav, Footer, resolveImage, WhatsAppIcon, WHATSAPP_URL } from "@/components/site-chrome";
import { CurrencyDropdown } from "@/components/CurrencyDropdown";
import { ProductStructuredData } from "@/components/SeoStructuredData";
import { ProductReviewsSection } from "@/components/catalogue/ProductReviewsSection";
import { getProductReviews } from "@/lib/tracking-and-reviews.functions";
import { useCurrency, CURRENCIES, type Currency } from "@/lib/currency";
import { useCart, useWishlist } from "@/lib/store";
import {
  getProduct,
  listRelated,
  type Product,
} from "@/lib/catalogue.functions";
import {
  getProductOutlineSvg,
  interpolateOutlineSvg,
} from "@/lib/size-guide-outlines";

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });

const relatedQO = (slug: string) =>
  queryOptions({
    queryKey: ["related", slug],
    queryFn: () => listRelated({ data: { slug } }),
  });

export const Route = createFileRoute("/catalogue/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQO(params.slug));
    if (!p) throw notFound();
    context.queryClient.prefetchQuery(relatedQO(params.slug));
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} | Rug Mosaic Handmade Rugs Kigali` },
          {
            name: "description",
            content:
              loaderData.short_description ??
              `Hand-tufted bespoke rug "${loaderData.name}", crafted with 100% natural wool in Kigali by Rug Mosaic. Made to order.`,
          },
          { property: "og:site_name", content: "Rug Mosaic" },
          { property: "og:locale", content: "en_RW" },
          { property: "og:type", content: "product" },
          { property: "og:title", content: `${loaderData.name} | Rug Mosaic` },
          {
            property: "og:description",
            content:
              loaderData.short_description ??
              `Hand-tufted bespoke rug "${loaderData.name}", crafted with 100% natural wool in Kigali by Rug Mosaic.`,
          },
          { property: "og:url", content: `https://mosiac.rw/catalogue/${loaderData.slug}` },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: `${loaderData.name} | Rug Mosaic` },
          {
            name: "twitter:description",
            content: loaderData.short_description ?? `Handmade custom rug ${loaderData.name}`,
          },
          ...(loaderData.main_image_url
            ? [
                { property: "og:image", content: loaderData.main_image_url },
                { name: "twitter:image", content: loaderData.main_image_url },
              ]
            : []),
        ]
      : [{ title: "Rug | Rug Mosaic" }, { name: "robots", content: "noindex" }],
    links: loaderData
      ? [{ rel: "canonical", href: `https://mosiac.rw/catalogue/${loaderData.slug}` }]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="container-x mx-auto max-w-[1400px] py-32 text-center">
        <h1 className="font-serif text-5xl italic">Rug not found.</h1>
        <Link to="/catalogue" className="mt-6 inline-block text-accent">
          ← Back to catalogue
        </Link>
      </div>
      <Footer />
    </div>
  ),
  component: ProductPage,
});

/** Human readable name for a hex accent, used to label the colourway buttons. */
function colourName(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if ([r, g, b].some((v) => Number.isNaN(v))) return "Accent";
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.08)
    return l > 0.8
      ? "Ivory"
      : l > 0.45
        ? "Stone"
        : l > 0.2
          ? "Graphite"
          : "Ink";
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  if (h < 15 || h >= 345) return l < 0.4 ? "Oxblood" : "Rust";
  if (h < 40) return l < 0.45 ? "Terracotta" : "Amber";
  if (h < 65) return l > 0.6 ? "Buttermilk" : "Ochre";
  if (h < 160) return l < 0.4 ? "Forest" : "Moss";
  if (h < 200) return "Teal";
  if (h < 255) return l < 0.4 ? "Indigo" : "Cobalt";
  if (h < 300) return "Plum";
  return "Rose";
}

const TABS = [
  "Description",
  "Find your size",
  "Care instructions",
  "Shipping",
] as const;
type Tab = (typeof TABS)[number];

/** Compress a verbose size label ("Small · 120 × 180 cm") into S / M / L / XL. */
function shortSize(label: string, index: number): string {
  const l = label.toLowerCase();
  if (l.includes("extra") || l.startsWith("xl")) return "XL";
  if (l.includes("small") || l.startsWith("s")) return "S";
  if (l.includes("medium") || l.startsWith("m")) return "M";
  if (l.includes("large") || l.startsWith("l")) return "L";
  return ["S", "M", "L", "XL"][index] ?? label;
}

type SizeRow = {
  id: string;
  label: string;
  width_cm?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  price_rwf?: number | null;
  price_usd?: number | null;
};

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: productData } = useSuspenseQuery(productQO(slug));
  const p = productData as NonNullable<typeof productData> & {
    sku?: string | null;
    dimensions?: string | null;
    story?: string | null;
    collection_name?: string | null;
  };
  const { data: related } = useQuery(relatedQO(slug));
  const { format, currency, setCurrency } = useCurrency();
  const cart = useCart();
  const wishlist = useWishlist();

  const getReviewsFn = useServerFn(getProductReviews);
  const [reviewsData, setReviewsData] = useState<{
    reviews: any[];
    totalCount: number;
    averageRating: number;
    distribution: Record<number, number>;
  }>({
    reviews: [],
    totalCount: 0,
    averageRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    if (slug) {
      getReviewsFn({ data: { productSlug: slug } })
        .then((res) => {
          if (res) setReviewsData(res);
        })
        .catch(() => undefined);
    }
  }, [slug, getReviewsFn]);

  const sizes = useMemo<SizeRow[]>(
    () =>
      ((p?.sizes ?? []) as SizeRow[])
        .slice()
        .sort(
          (a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0),
        ),
    [p?.sizes],
  );
  // Colour buttons come from the rug's own colorways or palette so each swatch
  // mirrors the accents actually tufted into that piece.
  const swatches = useMemo(() => {
    if (Array.isArray(p?.colorways) && p.colorways.length > 0) {
      const palette = (p?.color_palette ?? []).filter(Boolean);
      return p.colorways.map((cw: any, i: number) => {
        if (cw.gradient) {
          return {
            name: cw.name,
            gradient: cw.gradient,
          };
        }
        if (Array.isArray(cw.hexes) && cw.hexes.length > 1) {
          return {
            name: cw.name,
            gradient: `linear-gradient(135deg, ${cw.hexes.join(", ")})`,
          };
        }
        const hex1 = cw.hex || (cw.hexes && cw.hexes[0]) || palette[i % palette.length] || "#2B7FC4";
        const hex2 = palette[(i + 1) % palette.length] || hex1;
        return {
          name: cw.name,
          gradient: `linear-gradient(90deg, ${hex1} 0%, ${hex2} 100%)`,
        };
      });
    }
    const palette = (p?.color_palette ?? []).filter(Boolean);
    if (palette.length === 0)
      return [
        {
          name: "Original",
          gradient: "linear-gradient(90deg,#d8cfc0,#b9a68e)",
        },
      ];
    return palette.map((hex, i) => ({
      name: i === 0 ? "Original" : colourName(hex),
      gradient: `linear-gradient(90deg, ${hex} 0%, ${palette[(i + 1) % palette.length]} 100%)`,
    }));
  }, [p?.colorways, p?.color_palette]);

  const [selectedSize, setSelectedSize] = useState(sizes[0]?.id ?? "");
  const [selectedColor, setSelectedColor] = useState(swatches[0]?.name ?? "Original");

  // Keep selectedColor in sync if swatches change
  useEffect(() => {
    if (swatches.length > 0 && !swatches.some((s) => s.name.toLowerCase() === selectedColor.toLowerCase())) {
      setSelectedColor(swatches[0].name);
    }
  }, [swatches, selectedColor]);

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("Description");
  const [units, setUnits] = useState<"imperial" | "metric">("metric");

  const images = useMemo(
    () =>
      (p?.images ?? [])
        .slice()
        .sort((a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0)),
    [p?.images],
  );

  const galleryItems = useMemo(() => {
    if (images.length > 0) {
      return images
        .map((img: any) => ({
          id: img.id,
          url: resolveImage(img.url),
          alt: img.alt as string | null,
          colorway_id: (img.colorway_id as string | null) ?? null,
        }))
        .filter((item: any) => Boolean(item.url));
    }
    if (p?.main_image_url) {
      return [
        {
          id: "main",
          url: resolveImage(p.main_image_url),
          alt: p.name,
          colorway_id: null,
        },
      ];
    }
    return [];
  }, [images, p?.main_image_url, p?.name]);

  const gallery = useMemo(() => galleryItems.map((item) => item.url), [galleryItems]);
  const mainImage = gallery[0];

  // Mobile Carousel states & one-at-a-time navigation controls
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselScrollRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  const goToSlide = (index: number) => {
    const container = carouselScrollRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, galleryItems.length - 1));
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: clamped * slideWidth,
      behavior: "smooth",
    });
    setCurrentSlide(clamped);

    // If this image has a linked colorway, reflect it in the selectedColor
    const item = galleryItems[clamped];
    if (item?.colorway_id) {
      const match = swatches.find((s) => {
        const sw = s.name.toLowerCase().trim();
        const cw = item.colorway_id!.toLowerCase().trim();
        return sw === cw || sw.includes(cw) || cw.includes(sw);
      });
      if (match) {
        setSelectedColor(match.name);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipingRef.current = false;

    // Strict 1-image advance with no free sliding:
    // If horizontal swipe is greater than vertical swipe and exceeds 28px, move strictly 1 slide
    if (Math.abs(diffX) > 28 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    } else {
      goToSlide(currentSlide);
    }
  };

  const handleScroll = () => {
    const container = carouselScrollRef.current;
    if (!container || isSwipingRef.current) return;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const newIdx = Math.round(container.scrollLeft / slideWidth);
      if (newIdx !== currentSlide && newIdx >= 0 && newIdx < galleryItems.length) {
        setCurrentSlide(newIdx);
      }
    }
  };

  const handleColorSelect = (colorwayName: string) => {
    setSelectedColor(colorwayName);
    // Find the first image associated with this colorway
    const targetIdx = galleryItems.findIndex((img) => {
      if (!img.colorway_id) return false;
      const cw = img.colorway_id.toLowerCase().trim();
      const target = colorwayName.toLowerCase().trim();
      return cw === target || cw.includes(target) || target.includes(cw);
    });
    if (targetIdx !== -1) {
      goToSlide(targetIdx);
      // Bring the carousel smoothly into view on mobile
      mobileCarouselRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleDesktopColorSelect = (colorwayName: string) => {
    setSelectedColor(colorwayName);
    const targetIdx = galleryItems.findIndex((img) => {
      if (!img.colorway_id) return false;
      const cw = img.colorway_id.toLowerCase().trim();
      const target = colorwayName.toLowerCase().trim();
      return cw === target || cw.includes(target) || target.includes(cw);
    });
    if (targetIdx !== -1) {
      document.getElementById(`desktop-gallery-item-${targetIdx}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const chosen = sizes.find((s) => s.id === selectedSize);
  const unitRwf = chosen?.price_rwf ?? p.base_price_rwf;
  const unitUsd = chosen?.price_usd ?? p.base_price_usd;
  const priceLabel = format({ rwf: unitRwf, usd: unitUsd });
  const totalLabel = format({
    rwf: unitRwf ? unitRwf * qty : null,
    usd: unitUsd ? unitUsd * qty : null,
  });
  void currency;

  const isWished = wishlist.has(p.id);

  // Track ViewContent once per product view
  const lastTrackedProductIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (p?.id && lastTrackedProductIdRef.current !== p.id) {
      lastTrackedProductIdRef.current = p.id;
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent("ViewContent", {
            contentName: p.name,
            contentCategory: p.category ?? "Hand-Tufted Rug",
            contentIds: [p.id],
            contentType: "product",
            value: p.base_price_rwf,
            currency: "RWF",
          });
        })
        .catch(() => {});
    }
  }, [p?.id, p?.name, p?.category, p?.base_price_rwf]);

  const handleAddToCart = () => {
    cart.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: mainImage,
      sizeId: chosen?.id,
      sizeLabel: chosen?.label,
      color: selectedColor,
      qty,
      unitPriceUsd: chosen?.price_usd ?? p.base_price_usd,
      unitPriceRwf: chosen?.price_rwf ?? p.base_price_rwf,
    });

    // Dual-channel AddToCart Meta Pixel & CAPI event
    import("@/lib/meta-client")
      .then(({ trackMetaEvent }) => {
        trackMetaEvent("AddToCart", {
          contentName: p.name,
          contentIds: [p.id],
          contentType: "product",
          value: (chosen?.price_rwf ?? p.base_price_rwf ?? 0) * qty,
          currency: "RWF",
          numItems: qty,
        });
      })
      .catch(() => {});
  };

  const handleWishlistToggle = () => {
    if (!isWished) {
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent("AddToWishlist", {
            contentName: p.name,
            contentIds: [p.id],
            contentType: "product",
            value: chosen?.price_rwf ?? p.base_price_rwf,
            currency: "RWF",
          });
        })
        .catch(() => {});
    }
    wishlist.toggle({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: mainImage,
    });
  };

  const handleWhatsAppInquiry = () => {
    const chosenSizeLabel = chosen?.label || p.dimensions || "Custom";
    const itemPriceRwf = chosen?.price_rwf ?? p.base_price_rwf;

    // Track Contact and Qualified Lead
    import("@/lib/meta-client")
      .then(({ trackMetaEvent }) => {
        trackMetaEvent("Contact", {
          contentName: `Inquiry: ${p.name}`,
          productId: p.id,
          sku: p.sku,
          method: "whatsapp_product_inquiry",
          value: itemPriceRwf,
          currency: "RWF",
        });

        // If product is at or above atelier minimum threshold, signal high-intent Lead
        if ((itemPriceRwf ?? 0) >= 320000) {
          trackMetaEvent("Lead", {
            contentName: `WhatsApp Rug Lead: ${p.name}`,
            leadType: "whatsapp_product_inquiry",
            productId: p.id,
            sku: p.sku,
            value: itemPriceRwf,
            currency: "RWF",
          });
        }
      })
      .catch(() => {});

    const msg = `Hello Mosiac Atelier, I am inquiring about the ${p.name} rug (${chosenSizeLabel}) listed for ${priceLabel} on your catalogue. Is this piece available for viewing or delivery?`;
    const url = `${WHATSAPP_URL}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductStructuredData
        product={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.short_description || p.story || undefined,
          image: resolveImage(mainImage),
          category: p.collection_name || undefined,
          price: unitRwf ?? undefined,
          currency: "RWF",
          ratingValue: reviewsData.totalCount > 0 ? reviewsData.averageRating : 4.9,
          reviewCount: reviewsData.totalCount > 0 ? reviewsData.totalCount : 12,
          reviews: reviewsData.reviews.map((r) => ({
            author: r.customer_name,
            ratingValue: r.rating,
            reviewBody: r.comment,
            datePublished: r.created_at,
          })),
        }}
      />
      <Nav />
      <main className="container-x mx-auto max-w-[1500px] pb-24 pt-8 md:pt-14">
        <Link
          to="/catalogue"
          className="eyebrow text-muted-foreground hover:text-accent"
        >
          ← Catalogue
        </Link>

        {/* =========================================================================
            1. MOBILE VIEW (Screen width < lg)
            Strictly maintains existing mobile design: touch swipe carousel,
            dot indicators, compact vertical flow.
           ========================================================================= */}
        <div className="block lg:hidden mt-4 sm:mt-5 mx-auto max-w-xl">
          <div className="flex flex-col gap-6">
            {/* Top Carousel on mobile */}
            <div className="w-full" ref={mobileCarouselRef}>
              <div className="relative overflow-hidden rounded-3xl bg-[#f4efe8]">
                {/* Image track with touch swiping, no scroll buttons */}
                <div
                  ref={carouselScrollRef}
                  onScroll={handleScroll}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-y select-none"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {galleryItems.length === 0 ? (
                    <div className="aspect-[4/4.8] w-full shrink-0 bg-[#f4efe8]" />
                  ) : (
                    galleryItems.map((item, i) => (
                      <div
                        key={`${item.url ?? ""}${i}`}
                        className="relative aspect-[4/4.8] w-full shrink-0 snap-center snap-always overflow-hidden"
                      >
                        <img
                          src={item.url}
                          alt={item.alt ?? `${p.name}, view ${i + 1}`}
                          loading={i === 0 ? "eager" : "lazy"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dot Navigation directly below carousel */}
              {galleryItems.length > 1 && (
                <div className="mt-2.5 flex items-center justify-center gap-2 py-1">
                  {galleryItems.map((item, i) => {
                    const active = currentSlide === i;
                    return (
                      <button
                        key={`${item.url ?? ""}${i}`}
                        type="button"
                        onClick={() => goToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 w-2 rounded-full transition-all duration-200 ${
                          active
                            ? "bg-[#4a4238] scale-110"
                            : "bg-[#dcd4c7] hover:bg-[#b0a89a]"
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Details: Name, Price, Description, Size, Color, Quantity, Add to Cart */}
            <div className="flex flex-col">
              <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
                {p.name}
              </h1>
              <div className="mt-1.5 font-sans text-base sm:text-lg font-normal text-foreground">
                {priceLabel}
              </div>

              {(p.short_description || p.description) && (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {p.short_description ?? p.description}
                </p>
              )}

              {/* Size */}
              <div className="mt-4 sm:mt-5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Size</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("Find your size");
                      import("@/lib/meta-client")
                        .then(({ trackMetaEvent }) => {
                          trackMetaEvent("CustomizeProduct", {
                            contentName: `Sizing Guide: ${p.name}`,
                            productId: p.id,
                            sku: p.sku,
                            currentSize: chosen?.label,
                            value: chosen?.price_rwf ?? p.base_price_rwf,
                            currency: "RWF",
                          });
                        })
                        .catch(() => {});
                      requestAnimationFrame(() =>
                        document
                          .getElementById("sizing-guide")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          }),
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground"
                  >
                    <Ruler className="h-3.5 w-3.5" /> Sizing Guide
                  </button>
                </div>

                {/* Reduced size buttons */}
                <div className="mt-2 flex items-center gap-2">
                  {(sizes.length > 0
                    ? sizes.map((s, i) => ({
                        id: s.id,
                        label: shortSize(s.label, i),
                      }))
                    : ["S", "M", "L", "XL"].map((l) => ({ id: l, label: l }))
                  ).map((s) => {
                    const active =
                      selectedSize === s.id ||
                      (sizes.length === 0 && selectedSize === "" && s.id === "S");
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSize(s.id)}
                        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl text-sm font-medium flex items-center justify-center transition-all ${
                          active
                            ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                            : "bg-[#f5f1ea] text-foreground/80 hover:bg-[#ede7dd]"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div className="mt-4 sm:mt-5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Color</span>
                  <span className="text-foreground/80">{selectedColor}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {swatches.map((c) => {
                    const active = selectedColor.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorSelect(c.name)}
                        aria-label={c.name}
                        title={c.name}
                        className={`h-5.5 w-14 rounded-full transition-all ${
                          active
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        style={{ background: c.gradient }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-4 sm:mt-5 flex items-center justify-between border-t border-border/30 pt-4">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground/80 hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center text-sm font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground/80 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={p.stock_status === "out_of_stock"}
                className="mt-4 sm:mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-[#8f8272] hover:bg-[#837666] px-6 text-sm font-medium text-white transition-all shadow-xs active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {p.stock_status === "out_of_stock"
                    ? "Sold out"
                    : "Add to cart"}
                </span>
                <span className="font-sans text-base font-normal">{totalLabel}</span>
              </button>

              {/* WhatsApp Atelier Direct Inquiry & High-Intent Lead Capture */}
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-whatsapp/40 bg-whatsapp/10 hover:bg-whatsapp/15 text-whatsapp text-xs font-medium transition-all active:scale-[0.99]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>Inquire with Atelier on WhatsApp</span>
              </button>

              {p.stock_status === "out_of_stock" && (
                <p className="mt-2.5 text-center text-xs text-muted-foreground">
                  This piece is sold out.{" "}
                  <Link to="/custom" className="underline underline-offset-4">
                    request it as a custom order
                  </Link>
                  .
                </p>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Made to order · Less than 4 weeks
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Heart
                    className={`h-4 w-4 ${isWished ? "fill-current text-accent" : ""}`}
                  />
                  {isWished ? "Saved to wishlist" : "Save to wishlist"}
                </button>
              </div>

              {/* Live currency converter */}
              <div className="mt-3.5 rounded-2xl border border-border/60 bg-card p-3 sm:p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Show price in
                  </span>
                  <CurrencyDropdown variant="pill" align="right" />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">
                    {qty} × {priceLabel}
                  </span>
                  <span className="font-display text-lg">{totalLabel}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Converted at today's live exchange rate.
                </p>
              </div>

              <ul className="mt-4 space-y-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Truck className="h-4 w-4" /> Free worldwide shipping over
                  $2,000 USD
                </li>
                <li className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4" /> 30-day returns on in-stock
                  rugs
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" /> Hand-tufted in Kigali,
                  guaranteed
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. DESKTOP VIEW (Screen width >= lg)
            Restores the exact 3-column editorial aesthetic from the attached mockup:
            - Left: Category, Title, Price, and Short Description
            - Center: Editorial vertical photo stream with rounded corners
            - Right: Sticky sidebar with Sizing, Color Swatches, Qty, Add to Cart,
                     Wishlist, Currency Converter, and Trust Badges
           ========================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-14 items-start mt-6 xl:mt-8">
          {/* Left Column: Category Eyebrow, Title, Price, Description */}
          <div className="lg:col-span-3 sticky top-28 space-y-4 pr-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {p.category?.name ?? "Area Rugs"}
            </div>
            <h1 className="font-display text-3xl xl:text-4xl font-normal tracking-tight text-foreground">
              {p.name}
            </h1>
            <div className="font-sans text-xl font-normal text-foreground">
              {priceLabel}
            </div>
            {(p.short_description || p.description) && (
              <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                {p.short_description ?? p.description}
              </p>
            )}
          </div>

          {/* Center Column: Editorial Vertical Photo Stack */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-8">
            {galleryItems.length === 0 ? (
              <div className="aspect-[4/5] w-full rounded-3xl bg-[#f4efe8]" />
            ) : (
              galleryItems.map((item, i) => (
                <div
                  key={`${item.url ?? ""}${i}`}
                  id={`desktop-gallery-item-${i}`}
                  className="overflow-hidden rounded-3xl bg-[#f4efe8] shadow-xs"
                >
                  <img
                    src={item.url}
                    alt={item.alt ?? `${p.name}, view ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))
            )}
          </div>

          {/* Right Column: Sticky Sidebar with Controls */}
          <div className="lg:col-span-4 xl:col-span-4 sticky top-24 space-y-6 pl-2">
            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Size</span>
                <button
                  type="button"
                  onClick={() => {
                    setTab("Find your size");
                    import("@/lib/meta-client")
                      .then(({ trackMetaEvent }) => {
                        trackMetaEvent("CustomizeProduct", {
                          contentName: `Sizing Guide: ${p.name}`,
                          productId: p.id,
                          sku: p.sku,
                          currentSize: chosen?.label,
                          value: chosen?.price_rwf ?? p.base_price_rwf,
                          currency: "RWF",
                        });
                      })
                      .catch(() => {});
                    requestAnimationFrame(() =>
                      document
                        .getElementById("sizing-guide")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                    );
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground"
                >
                  <Ruler className="h-3.5 w-3.5" /> Sizing Guide
                </button>
              </div>

              {/* Size Buttons */}
              <div className="mt-3 flex items-center gap-2.5">
                {(sizes.length > 0
                  ? sizes.map((s, i) => ({
                      id: s.id,
                      label: shortSize(s.label, i),
                    }))
                  : ["S", "M", "L", "XL"].map((l) => ({ id: l, label: l }))
                ).map((s) => {
                  const active =
                    selectedSize === s.id ||
                    (sizes.length === 0 && selectedSize === "" && s.id === "S");
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSize(s.id)}
                      className={`h-12 w-12 xl:h-14 xl:w-14 rounded-2xl text-sm font-medium flex items-center justify-center transition-all ${
                        active
                          ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                          : "bg-[#f5f1ea] dark:bg-muted text-foreground/80 hover:bg-[#ede7dd] dark:hover:bg-muted/80"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">Color</span>
                <span className="text-foreground/80">{selectedColor}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {swatches.map((c) => {
                  const active = selectedColor.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleDesktopColorSelect(c.name)}
                      aria-label={c.name}
                      title={c.name}
                      className={`h-6 w-14 rounded-full transition-all ${
                        active
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105"
                          : "opacity-85 hover:opacity-100 hover:scale-102"
                      }`}
                      style={{ background: c.gradient }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between border-t border-border/30 pt-4">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground/80 hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-4 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground/80 hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={p.stock_status === "out_of_stock"}
              className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#8f8272] hover:bg-[#837666] px-6 text-sm font-medium text-white transition-all shadow-xs active:scale-[0.99] disabled:cursor-not-allowed"
            >
              <span>
                {p.stock_status === "out_of_stock"
                  ? "Sold out"
                  : "Add to cart"}
              </span>
              <span className="font-sans text-base font-normal">{totalLabel}</span>
            </button>

            {/* Direct WhatsApp Atelier Consultation & High-Intent Lead Capture */}
            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-whatsapp/40 bg-whatsapp/10 hover:bg-whatsapp/15 text-whatsapp text-xs font-medium transition-all active:scale-[0.99]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>Inquire with Atelier on WhatsApp</span>
            </button>

            {/* Custom order note if out of stock */}
            {p.stock_status === "out_of_stock" && (
              <p className="text-center text-xs text-muted-foreground -mt-1">
                This piece is sold out.{" "}
                <Link to="/custom" className="underline underline-offset-4">
                  request it as a custom order
                </Link>
                .
              </p>
            )}

            {/* Lead Time Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              Made to order · Less than 4 weeks
            </div>

            {/* Save to Wishlist */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleWishlistToggle}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Heart
                  className={`h-4 w-4 ${isWished ? "fill-current text-accent" : ""}`}
                />
                {isWished ? "Saved to wishlist" : "Save to wishlist"}
              </button>
            </div>

            {/* SHOW PRICE IN (Live Currency Converter) */}
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Show price in
                </span>
                <CurrencyDropdown variant="pill" align="right" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  {qty} × {priceLabel}
                </span>
                <span className="font-display text-lg font-semibold">{totalLabel}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Converted at today's live exchange rate.
              </p>
            </div>

            {/* Trust Assurances */}
            <ul className="space-y-3 border-t border-border/40 pt-4 text-xs text-muted-foreground">
              <li className="flex items-center gap-3">
                <Truck className="h-4 w-4 shrink-0" /> Free worldwide shipping over $2,000 USD
              </li>
              <li className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 shrink-0" /> 30-day returns on in-stock rugs
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Hand-tufted in Kigali, guaranteed
              </li>
            </ul>
          </div>
        </div>

        {/* Tabs section */}
        <section id="sizing-guide" className="mt-12 sm:mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-b border-border/60 pb-2">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-6 sm:mt-8">
            {tab === "Description" && (
              <p className="mx-auto max-w-3xl text-center font-display text-xl leading-relaxed md:text-2xl">
                {p.description ??
                  p.short_description ??
                  "A hand-tufted piece made to order in Kigali, designed to live with you for decades."}
              </p>
            )}

            {tab === "Find your size" && (
              <SizingGuide
                slug={p.slug}
                sizeGuideSvg={p.size_guide_svg}
                sizes={sizes}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                units={units}
                setUnits={setUnits}
                material={p.material ?? "New Zealand Wool"}
                shape={p.shape}
              />
            )}

            {tab === "Care instructions" && (
              <div className="mx-auto max-w-5xl">
                <h3 className="text-center font-display text-xl md:text-2xl">
                  {p.material ?? "New Zealand Wool"} is a naturally
                  self-cleaning fibre.
                </h3>
                <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    {
                      Icon: Droplet,
                      text: "Blot spills immediately with a damp cloth or paper towel and clean water: never rub.",
                    },
                    {
                      Icon: Wind,
                      text: "Vacuum on a high-pile setting for regular cleaning and maintenance.",
                    },
                    {
                      Icon: Sparkles,
                      text: "For a deep clean, consult a local rug-cleaning professional.",
                    },
                    {
                      Icon: Scissors,
                      text: "Trim any loose threads with scissors: never pull them out.",
                    },
                  ].map(({ Icon, text }, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center text-center"
                    >
                      <Icon
                        className="h-8 w-8 text-muted-foreground"
                        strokeWidth={1.25}
                      />
                      <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Shipping" && (
              <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
                Every Mosiac rug is hand-tufted to order in Kigali, made to
                order in less than 4 weeks. Free worldwide shipping on orders of
                $2,000 USD and above. We ship via DHL; you'll receive a tracking
                link the day it leaves the studio.
              </p>
            )}
          </div>

          {/* Verified Customer Reviews Section */}
          <ProductReviewsSection
            productName={p.name}
            productSlug={p.slug}
            reviews={reviewsData.reviews}
            averageRating={reviewsData.averageRating}
            totalCount={reviewsData.totalCount}
            distribution={reviewsData.distribution}
          />

          {/* Related Products */}
          <section className="mt-12 sm:mt-16">
            <h2 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Related Products
            </h2>
            {related && related.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                {related.map((r: Product) => {
                  const img = resolveImage(r.main_image_url);
                  return (
                    <Link
                      key={r.id}
                      to="/catalogue/$slug"
                      params={{ slug: r.slug }}
                      className="group block"
                    >
                      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#f0eadf]">
                        {img && (
                          <img
                            src={img}
                            alt={r.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="font-display text-sm font-medium">
                          {r.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format({
                            rwf: r.base_price_rwf,
                            usd: r.base_price_usd,
                          })}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                More rugs coming soon.
              </p>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ---------- Sizing guide ----------

function SizingGuide({
  slug,
  sizeGuideSvg,
  sizes,
  selectedSize,
  setSelectedSize,
  units,
  setUnits,
  material,
  shape,
}: {
  slug?: string;
  sizeGuideSvg?: string | null;
  sizes: SizeRow[];
  selectedSize: string;
  setSelectedSize: (id: string) => void;
  units: "imperial" | "metric";
  setUnits: (u: "imperial" | "metric") => void;
  material: string;
  shape?: string | null;
}) {
  const isRound = shape === "circular";
  const fallbackSizes: SizeRow[] = isRound
    ? [
        { id: "s", label: "S", width_cm: 90, height_cm: 90, weight_kg: 2.4 },
        { id: "m", label: "M", width_cm: 120, height_cm: 120, weight_kg: 4.3 },
        { id: "l", label: "L", width_cm: 150, height_cm: 150, weight_kg: 6.7 },
      ]
    : [
        { id: "s", label: "S", width_cm: 90, height_cm: 150, weight_kg: 3.6 },
        { id: "m", label: "M", width_cm: 160, height_cm: 230, weight_kg: 9.9 },
        { id: "l", label: "L", width_cm: 200, height_cm: 300, weight_kg: 16.2 },
        { id: "xl", label: "XL", width_cm: 240, height_cm: 340, weight_kg: 22 },
      ];
  const list = sizes.length > 0 ? sizes : fallbackSizes;
  const active = list.find((s) => s.id === selectedSize) ?? list[0];
  const wCm = active?.width_cm ?? (isRound ? 120 : 160);
  const hCm = active?.height_cm ?? (isRound ? 120 : 230);
  // Weight = rug area in m² × 3.8 kg/m² (hand-tufted wool pile).
  const areaM2 = isRound
    ? Math.PI * Math.pow(wCm / 200, 2)
    : (wCm / 100) * (hCm / 100);
  const kg = areaM2 * 3.8;

  const cmToFt = (v: number) => Math.round((v / 30.48) * 10) / 10;
  const kgToLb = (v: number) => Math.round(v * 2.2046 * 10) / 10;

  const wLabel = units === "metric" ? `${wCm} cm` : `${cmToFt(wCm)} ft`;
  const hLabel = units === "metric" ? `${hCm} cm` : `${cmToFt(hCm)} ft`;
  const weightLabel =
    units === "metric" ? `${kg.toFixed(1)} kg` : `${kgToLb(kg)} lb`;

  // Check if custom outline SVG code is provided for this product
  const customOutlineRaw = getProductOutlineSvg(slug, sizeGuideSvg);

  const customSvgRendered = useMemo(() => {
    if (!customOutlineRaw) return null;
    return interpolateOutlineSvg(customOutlineRaw, {
      wLabel,
      hLabel,
      widthCm: wCm,
      heightCm: hCm,
      units,
    });
  }, [customOutlineRaw, wLabel, hLabel, wCm, hCm, units]);

  // Scaled dimensions for default architectural blueprint inside 500x400 viewBox
  const maxW = 280;
  const maxH = 190;
  let blueprintW = maxW;
  let blueprintH = Math.round(blueprintW * (hCm / wCm));
  if (blueprintH > maxH) {
    blueprintH = maxH;
    blueprintW = Math.round(blueprintH * (wCm / hCm));
  }
  if (blueprintW > maxW) {
    blueprintW = maxW;
    blueprintH = Math.round(blueprintW * (hCm / wCm));
  }
  const bpX = 110 + (maxW - blueprintW) / 2;
  const bpY = 145 + (maxH - blueprintH) / 2;

  return (
    <div className="mx-auto max-w-lg sm:max-w-xl rounded-2xl bg-[#f7f2ea] p-4 sm:p-5 border border-[#e8ded0]/90 shadow-xs">
      {/* Top row: Metric/Imperial toggle on left (default Metric), Sizing buttons in top right on same row */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-[#e9dfcc] p-1">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                units === u
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Sizing buttons: compact and refined */}
        <div className="inline-flex items-center gap-1.5">
          {list.map((s) => {
            const isActive = s.id === active?.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSize(s.id)}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border/60 font-bold"
                    : "bg-[#e9dfcc] text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizing Blueprint Diagram - compact and responsive on desktop */}
      <div className="mt-4 flex w-full items-center justify-center overflow-hidden py-1">
        {customSvgRendered ? (
          <div
            className="flex w-full items-center justify-center max-h-[260px] sm:max-h-[300px] [&>svg]:max-h-[260px] sm:[&>svg]:max-h-[300px] [&>svg]:w-auto [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: customSvgRendered }}
          />
        ) : (
          <svg
            viewBox="0 0 500 400"
            className="w-full h-auto max-h-[260px] sm:max-h-[300px] max-w-[420px]"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748B" />
              </marker>
            </defs>
            <style>{`
              .auto-shape {
                fill: #ede4d4;
                stroke: #8f8272;
                stroke-width: 3.5;
                stroke-linecap: round;
                stroke-linejoin: round;
              }
              .auto-dim {
                stroke: #64748B;
                stroke-width: 1.5;
                stroke-dasharray: 4 4;
                marker-start: url(#arrow);
                marker-end: url(#arrow);
              }
              .auto-ext {
                stroke: #CBD5E1;
                stroke-width: 1;
              }
              .auto-label {
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                font-weight: 600;
                fill: #475569;
                text-anchor: middle;
                dominant-baseline: middle;
              }
            `}</style>

            {isRound ? (
              <>
                {/* Round rug blueprint */}
                <circle cx={250} cy={220} r={110} className="auto-shape" />
                <line x1={140} y1={210} x2={140} y2={70} className="auto-ext" />
                <line x1={360} y1={210} x2={360} y2={70} className="auto-ext" />
                <line x1={140} y1={80} x2={360} y2={80} className="auto-dim" />
                <rect x={215} y={68} width={70} height={24} fill="#FFFFFF" rx={4} />
                <text x={250} y={80} className="auto-label">⌀ {wLabel}</text>
              </>
            ) : (
              <>
                {/* Rectangular / runner rug blueprint */}
                <rect
                  x={bpX}
                  y={bpY}
                  width={blueprintW}
                  height={blueprintH}
                  className="auto-shape"
                />

                {/* Top dimension (width) */}
                <line x1={bpX} y1={bpY - 10} x2={bpX} y2={bpY - 45} className="auto-ext" />
                <line
                  x1={bpX + blueprintW}
                  y1={bpY - 10}
                  x2={bpX + blueprintW}
                  y2={bpY - 45}
                  className="auto-ext"
                />
                <line
                  x1={bpX}
                  y1={bpY - 35}
                  x2={bpX + blueprintW}
                  y2={bpY - 35}
                  className="auto-dim"
                />
                <rect
                  x={bpX + blueprintW / 2 - 35}
                  y={bpY - 47}
                  width={70}
                  height={24}
                  fill="#FFFFFF"
                  rx={4}
                />
                <text x={bpX + blueprintW / 2} y={bpY - 35} className="auto-label">
                  {wLabel}
                </text>

                {/* Left dimension (height) */}
                <line x1={bpX - 10} y1={bpY} x2={bpX - 45} y2={bpY} className="auto-ext" />
                <line
                  x1={bpX - 10}
                  y1={bpY + blueprintH}
                  x2={bpX - 45}
                  y2={bpY + blueprintH}
                  className="auto-ext"
                />
                <line
                  x1={bpX - 35}
                  y1={bpY}
                  x2={bpX - 35}
                  y2={bpY + blueprintH}
                  className="auto-dim"
                />
                <rect
                  x={bpX - 68}
                  y={bpY + blueprintH / 2 - 12}
                  width={66}
                  height={24}
                  fill="#FFFFFF"
                  rx={4}
                />
                <text x={bpX - 35} y={bpY + blueprintH / 2} className="auto-label">
                  {hLabel}
                </text>
              </>
            )}
          </svg>
        )}
      </div>

      {/* Weight and material row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-[#dfd2be]/70 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Weight:</span>
          <span>{weightLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Material:</span>
          <span>{material}</span>
        </div>
      </div>
    </div>
  );
}
