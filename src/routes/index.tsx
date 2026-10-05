import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useFeaturedImage } from "@/lib/site-images-client";
import {
  Nav,
  Footer,
  resolveImage,
  WishlistHeart,
} from "@/components/site-chrome";
import { LookbookNewsletterCarousel } from "@/components/LookbookNewsletterCarousel";
import { useCurrency } from "@/lib/currency";
import {
  listCategories,
  listFeatured,
  listProducts,
  listReviews,
  type Product,
} from "@/lib/catalogue.functions";
/** Real studio photography (CDN) - no AI-generated imagery on the homepage. */
const PHOTO = {
  hassanRoom:
    "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
  hassanChess:
    "/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg",
  hassanDetail:
    "/__l5e/assets-v1/28c325e7-6be3-44b6-8d49-e24f327dcc96/hassan-5.jpg",
  valencia1:
    "/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg",
  celestial:
    "/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg",
  valley3: "/__l5e/assets-v1/074246a2-d88c-4a8b-914b-d38c7182cc20/valley-3.jpg",
  geometric1:
    "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
  uzu1: "/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg",
  melt1: "/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg",
  tai1: "/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg",
  arc1: "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
};

const homeHero = PHOTO.hassanRoom;

const IG_GRID: string[] = [
  PHOTO.melt1,
  PHOTO.tai1,
  PHOTO.arc1,
  PHOTO.hassanDetail,
];

const HOME_CATEGORIES = [
  {
    slug: "area-rugs",
    name: "Area rugs",
    image: PHOTO.valencia1,
    search: { category: "area-rugs" },
  },
  {
    slug: "runners",
    name: "Runners",
    image: PHOTO.valley3,
    search: { category: "runners" },
  },
  {
    slug: "collections",
    name: "Collections",
    image: PHOTO.geometric1,
    search: {},
  },
];

const HERITAGE_SLIDES = [
  {
    image: PHOTO.valley3,
    kicker: "New collection",
    title: "Introducing the",
    italic: "Heritage",
    suffix: "rugs",
  },
  {
    image: PHOTO.geometric1,
    kicker: "Traditional patterns",
    title: "Woven with",
    italic: "intention",
    suffix: "",
  },
  {
    image: PHOTO.uzu1,

    kicker: "Made in Kigali",
    title: "Tufted by",
    italic: "hand",
    suffix: "",
  },
];

const PRESS = [
  {
    quote: "Playful, vibrant, and bizarrely compelling.",
    source: "Kigali Design Weekly",
  },
  {
    quote: "Rugs that feel like commissioned paintings you can walk on.",
    source: "East Africa Living",
  },
  {
    quote: "Handmade fidelity with an unmistakable point of view.",
    source: "The Craft Journal",
  },
  {
    quote: "The most exciting floor art coming out of East Africa right now.",
    source: "Continent Quarterly",
  },
];

const homeQO = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [categories, featured, reviews, allProducts] = await Promise.all([
      listCategories(),
      listFeatured(),
      listReviews(),
      listProducts(),
    ]);
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      const slug = p.category?.slug;
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
    }
    const pool = [
      ...featured,
      ...allProducts.filter((p) => !featured.some((f) => f.id === p.id)),
    ];
    return { categories, featured, reviews, counts, slider: pool.slice(0, 10) };
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQO),
  component: Home,
  head: () => ({
    meta: [
      { title: "Mosiac | Handmade custom rugs, tufted in Kigali" },
      {
        name: "description",
        content:
          "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali since 2021.",
      },
      {
        property: "og:title",
        content: "Mosiac | Handmade custom rugs, tufted in Kigali",
      },
      {
        property: "og:description",
        content:
          "A new dimension of home decor. Hand-tufted wool rugs made to order in Kigali since 2021.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RecognitionSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % PRESS.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="border-y border-border py-20 md:py-24">
      <div className="container-x mx-auto max-w-[1200px]">
        <div className="mb-10 text-center">
          <span className="eyebrow text-muted-foreground">Recognition</span>
        </div>
        <div className="relative min-h-[140px] md:min-h-[120px]">
          {PRESS.map((p, idx) => (
            <figure
              key={p.source}
              className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <blockquote className="font-serif italic text-2xl font-normal leading-snug tracking-tight text-foreground md:text-4xl max-w-3xl mx-auto px-4">
                “{p.quote}”
              </blockquote>
              <figcaption className="eyebrow mt-6 text-muted-foreground">
                {p.source}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          {PRESS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Show quote ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-foreground" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HeritageSlider() {
  const [i, setI] = useState(0);
  const total = HERITAGE_SLIDES.length;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setI((v) => (v + 1) % total), 6000);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const prev = () => {
    setI((v) => (v - 1 + total) % total);
    resetTimer();
  };
  const next = () => {
    setI((v) => (v + 1) % total);
    resetTimer();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Minimum distance 35px, predominantly horizontal, within 750ms
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.15 && dt < 750) {
      if (dx < 0) {
        next();
      } else {
        prev();
      }
    }
  };

  const slide1Img = useFeaturedImage("heritage_slide_1", PHOTO.valley3);
  const slide2Img = useFeaturedImage("heritage_slide_2", PHOTO.geometric1);
  const slide3Img = useFeaturedImage("heritage_slide_3", PHOTO.uzu1);

  const activeSlides = useMemo(
    () => [
      { ...HERITAGE_SLIDES[0], image: slide1Img },
      { ...HERITAGE_SLIDES[1], image: slide2Img },
      { ...HERITAGE_SLIDES[2], image: slide3Img },
    ],
    [slide1Img, slide2Img, slide3Img]
  );

  return (
    <section className="pb-12 md:pb-28">
      <div className="container-x mx-auto max-w-[1400px]">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="group relative overflow-hidden rounded-2xl bg-muted touch-pan-y select-none"
        >
          <div className="relative aspect-[4/5] min-h-[460px] w-full sm:min-h-0 sm:aspect-[21/10] md:aspect-[24/9]">
            {activeSlides.map((s, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === idx ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                aria-hidden={i !== idx}
              >
                <img
                  src={resolveImage(s.image)}
                  alt={`Heritage rug slide ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/30 sm:to-black/10" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-6 pb-20 text-white sm:inset-y-0 sm:max-w-2xl sm:justify-center sm:pb-0 md:p-14">
                  <span className="eyebrow text-white/80">{s.kicker}</span>
                  <h2 className="mt-2 font-display text-2xl font-medium leading-[1.05] tracking-tight sm:mt-3 sm:text-4xl md:text-6xl">
                    {s.title} <span className="italic">{s.italic}</span>
                    {s.suffix ? ` ${s.suffix}` : ""}
                  </h2>

                  {/* Explore button - shown inline on desktop, repositioned on mobile */}
                  <div className="hidden sm:block mt-5 sm:mt-8">
                    <Link
                      to="/catalogue"
                      className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-transparent hover:text-white"
                    >
                      Explore Heritage
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls - bottom left arrows, counter removed on mobile */}
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 md:bottom-8 md:left-8">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            {/* 01/03 counter - hidden on mobile, visible on desktop */}
            <div className="hidden md:block ml-3 text-xs font-semibold uppercase tracking-wider text-white/80">
              {String(i + 1).padStart(2, "0")}
              <span className="mx-1.5 opacity-50">/</span>
              {String(total).padStart(2, "0")}
            </div>
          </div>

          {/* Mobile Explore Heritage button - compact size, positioned on bottom right directly across from navigation arrows */}
          <div className="absolute bottom-5 right-5 z-10 sm:hidden">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-foreground shadow-lg backdrop-blur-sm transition-all active:scale-95"
            >
              Explore Heritage
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Featured rugs - Sticky pinned horizontal scroll gallery.
 * Supports both vertical document scrolling and direct horizontal touch/trackpad/mouse swiping.
 * As user scrolls vertically, the section pins in the viewport and translates all rugs horizontally.
 * Swiping or dragging left/right also navigates through the rugs. Once all rugs are shown,
 * vertical scrolling naturally resumes.
 */
function FeaturedRugsSection({ items }: { items: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { format } = useCurrency();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [maxScrollX, setMaxScrollX] = useState(2400);

  // Mouse & Touch horizontal drag/swipe tracking
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Measure total horizontal track translation distance
  const updateMetrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const padding = Math.max(20, (window.innerWidth - 1400) / 2);
    // Extra clearance at the end so the final card is completely and comfortably in view
    const max = Math.max(0, track.scrollWidth - window.innerWidth + padding + 60);
    setMaxScrollX(max);
  }, []);

  useEffect(() => {
    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    const t1 = setTimeout(updateMetrics, 200);
    const t2 = setTimeout(updateMetrics, 750);
    return () => {
      window.removeEventListener("resize", updateMetrics);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateMetrics, items.length]);

  // Link vertical page scroll to horizontal track translation
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalScrollDistance = container.offsetHeight - windowH;

      if (totalScrollDistance <= 0) return;

      // rect.top is relative to the viewport top
      // When rect.top <= 0, container is pinned at top
      // As user scrolls vertically, -rect.top increases from 0 to totalScrollDistance
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxScrollX]);

  // Handle direct trackpad horizontal wheel gestures (deltaX)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is swiping horizontally on trackpad or using horizontal tilt wheel
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX * 1.1 });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Touch Swipe Handlers (Mobile & Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isHorizontalSwipeRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartRef.current.x - currentX;
    const diffY = touchStartRef.current.y - currentY;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // If swiping horizontally, progress through the rugs by driving scroll position
    if (isHorizontalSwipeRef.current) {
      window.scrollBy({ top: diffX * 1.3 });
      touchStartRef.current = { x: currentX, y: currentY };
    }
  };

  const handleTouchEnd = () => {
    isHorizontalSwipeRef.current = null;
  };

  // Mouse Click-and-Drag Handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const diffX = dragStartPosRef.current.x - e.clientX;
    if (Math.abs(diffX) > 5) {
      hasDraggedRef.current = true;
      window.scrollBy({ top: diffX * 1.4 });
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  if (items.length === 0) return null;

  // The outer container provides vertical scroll height proportional to horizontal track distance
  const containerHeight = maxScrollX > 0 ? `calc(100vh + ${maxScrollX}px)` : "auto";

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: containerHeight }}
    >
      {/* Sticky full-viewport frame that stays pinned while rugs slide horizontally */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="sticky top-0 z-20 flex h-[100dvh] w-full flex-col justify-between overflow-hidden bg-background py-6 sm:py-8 md:py-10 border-b border-border/40 select-none cursor-grab active:cursor-grabbing"
      >
        {/* Header with Title only (Completely clean, no buttons, no links) */}
        <div className="container-x mx-auto w-full max-w-[1400px] shrink-0 pt-2 sm:pt-4">
          <span className="eyebrow text-muted-foreground">Featured rugs</span>
          <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl md:text-5xl">
            Ten pieces we're <span className="italic">obsessed</span> with.
          </h2>
        </div>

        {/* Horizontal sliding viewport */}
        <div className="relative flex flex-1 w-full items-center overflow-hidden my-auto py-3 sm:py-4">
          <div
            ref={trackRef}
            className="flex gap-6 sm:gap-7 md:gap-8 items-center will-change-transform pl-5 md:pl-[max(1.5rem,calc((100vw-1400px)/2))] pr-12 sm:pr-24"
            style={{
              transform: `translate3d(-${scrollProgress * maxScrollX}px, 0, 0)`,
            }}
          >
            {/* 10 Featured Rug Cards */}
            {items.map((r, idx) => {
              const img = resolveImage(r.main_image_url);
              return (
                <Link
                  key={r.id}
                  to="/catalogue/$slug"
                  params={{ slug: r.slug }}
                  onClick={(e) => {
                    if (hasDraggedRef.current) {
                      e.preventDefault();
                    }
                  }}
                  className="group block w-[270px] shrink-0 sm:w-[320px] md:w-[360px] lg:w-[380px] transition-transform duration-500"
                >
                  <div className="relative aspect-[4/5] max-h-[56vh] sm:max-h-[60vh] md:max-h-[64vh] overflow-hidden rounded-2xl bg-muted shadow-xs transition-all duration-700 ease-out group-hover:shadow-2xl group-hover:-translate-y-1">
                    <WishlistHeart
                      product={{
                        productId: r.id,
                        slug: r.slug,
                        name: r.name,
                        image: img,
                      }}
                    />
                    {img && (
                      <img
                        src={img}
                        alt={r.name}
                        loading={idx < 4 ? "eager" : "lazy"}
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                      />
                    )}
                  </div>
                  <div className="mt-3.5 flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-medium group-hover:text-accent transition-colors">
                      {r.name}
                    </h3>
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {format({ rwf: r.base_price_rwf, usd: r.base_price_usd })}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* 11th Final Card: Atelier Bespoke Commission Invitation */}
            <div className="flex h-full w-[270px] shrink-0 sm:w-[320px] md:w-[360px] lg:w-[380px] max-h-[56vh] sm:max-h-[60vh] md:max-h-[64vh] flex-col justify-between rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6 md:p-8 backdrop-blur-xs transition-all hover:border-foreground/40 hover:bg-muted/50">
              <div className="space-y-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Custom Atelier
                </span>
                <h3 className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                  Need a custom palette or size?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every rug can be tufted to your exact room specifications, tailored down to the centimeter with wool dyed to match your interiors.
                </p>
              </div>
              <div className="pt-6 space-y-2.5">
                <Link
                  to="/custom"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/90 transition-colors"
                >
                  <span>Commission Custom Rug</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/catalogue"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span>Explore Full Catalogue</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQO);

  // Dynamic featured imagery hooked to Studio Dash
  const heroImage = useFeaturedImage("home_hero", PHOTO.hassanRoom);
  const catAreaImg = useFeaturedImage("category_area_rugs", PHOTO.valencia1);
  const catRunnersImg = useFeaturedImage("category_runners", PHOTO.valley3);
  const catCollectionsImg = useFeaturedImage("category_collections", PHOTO.geometric1);

  const homeCategories = useMemo(
    () => [
      { ...HOME_CATEGORIES[0], image: catAreaImg },
      { ...HOME_CATEGORIES[1], image: catRunnersImg },
      { ...HOME_CATEGORIES[2], image: catCollectionsImg },
    ],
    [catAreaImg, catRunnersImg, catCollectionsImg]
  );

  const ig1 = useFeaturedImage("ig_grid_1", PHOTO.melt1);
  const ig2 = useFeaturedImage("ig_grid_2", PHOTO.tai1);
  const ig3 = useFeaturedImage("ig_grid_3", PHOTO.arc1);
  const ig4 = useFeaturedImage("ig_grid_4", PHOTO.hassanDetail);

  const igGrid = useMemo(() => [ig1, ig2, ig3, ig4], [ig1, ig2, ig3, ig4]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        {/* Hero card - generous whitespace beneath the brand wordmark on desktop */}
        <section className="pt-24 sm:pt-32 md:pt-56 lg:pt-64">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <div className="relative aspect-[16/12] w-full md:aspect-[16/9]">
                <img
                  src={resolveImage(heroImage)}
                  alt="A hand-tufted Mosiac rug anchoring a modern living room"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-12">
                  <span className="eyebrow text-white/80">
                    Hand-tufted in Kigali
                  </span>
                  <h1 className="mt-3 max-w-3xl font-display text-[1.35rem] min-[380px]:text-[1.55rem] sm:text-4xl md:text-6xl font-medium leading-[1.05] tracking-tight whitespace-nowrap">
                    Floor art, <span className="italic">made to order</span>.
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand intro beneath hero - tightened vertical spacing to Featured Rugs */}
        <section className="pt-6 pb-2 sm:pt-8 sm:pb-3 md:pt-10 md:pb-4">
          <div className="container-x mx-auto max-w-[900px] text-center">
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Welcome to a new dimension of home decor. Mosiac blends intricate
              design, considered function, and luxury materials to transform
              your home and awaken your senses.
            </p>
          </div>
        </section>

        {/* Featured rugs - horizontal carousel */}
        <FeaturedRugsSection items={data.slider as Product[]} />

        {/* Categories - Area rugs, Runners, Collections */}
        <section className="pb-12 md:pb-24">
          <div className="container-x mx-auto max-w-[1400px]">
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
                  Explore by format &amp; space
                </h2>
              </div>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>View all in catalogue</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
              {homeCategories.map((c) => (
                <Link
                  key={c.slug}
                  to="/catalogue"
                  search={c.search}
                  className="group relative aspect-[4/5] w-[76%] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted md:w-auto"
                >
                  <img
                    src={resolveImage(c.image)}
                    alt={`${c.name} rugs`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                    <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                      {c.name}
                    </h3>
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Heritage slideshow - 3 slides with paired controls */}
        <HeritageSlider />

        <RecognitionSlider />

        {/* Seeing is believing - editorial banner + Instagram grid */}
        <section className="relative overflow-hidden border-t border-border bg-foreground py-24 text-background md:py-32">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--accent), transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--accent), transparent)",
            }}
          />
          <div className="container-x relative mx-auto grid max-w-[1300px] items-center gap-14 lg:grid-cols-[1fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="eyebrow text-background/60">
                @rugmosiac on Instagram
              </span>
              <h2 className="mt-5 font-display text-5xl font-medium leading-[1.0] tracking-tight md:text-7xl">
                Seeing is <span className="italic">believing</span>.
              </h2>
              <p className="hidden md:block mx-auto mt-8 max-w-xl text-base leading-relaxed text-background/70 md:text-lg lg:mx-0">
                Follow along for behind-the-scenes tufting, finished commissions
                in real homes, and first looks at limited drops.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href="https://instagram.com/rugmosiac"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-background bg-background px-8 py-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-transparent hover:text-background"
                >
                  Follow @rugmosiac
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </a>
                <Link
                  to="/catalogue"
                  className="group inline-flex items-center gap-2 rounded-full border border-background/40 px-8 py-4 text-xs font-semibold uppercase tracking-wider text-background transition-all duration-300 hover:border-background hover:bg-background hover:text-foreground"
                >
                  Explore Mosaic
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Instagram grid: 3 images in 1 row on mobile, 2x2 grid on desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-2">
              {igGrid.map((src, i) => (
                <a
                  key={i}
                  href="https://instagram.com/rugmosiac"
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative aspect-square overflow-hidden rounded-xl bg-background/10 ${i >= 3 ? "hidden md:block" : ""}`}
                >
                  <img
                    src={resolveImage(src)}
                    alt="Mosiac rug on Instagram"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Combined Atelier Lookbook & Weekly Newsletter Carousel */}
        <LookbookNewsletterCarousel />
      </main>
      <Footer />
    </div>
  );
}
