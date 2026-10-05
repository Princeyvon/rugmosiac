import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Download,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { subscribeNewsletter } from "@/lib/forms.functions";
import { useFeaturedImage } from "@/lib/site-images-client";
import { resolveImage } from "@/components/site-chrome";
import { listProducts } from "@/lib/catalogue.functions";
import { fallbackProducts } from "@/lib/fallback-catalogue";
import lookbookYellowRug from "@/assets/lookbook-yellow-rug.jpg";
import hassanChess from "@/assets/hassan-2.jpg";
import taiBedroom from "@/assets/tai-5.jpg";

export function LookbookNewsletterCarousel({
  className = "",
}: {
  className?: string;
}) {
  const [currentSlide, setCurrentSlide] = useState<0 | 1>(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Lookbook background image & infinity mini-carousel
  const bgPhoto = useFeaturedImage("lookbook_prefooter_bg", lookbookYellowRug);
  const [carouselImages, setCarouselImages] = useState<string[]>(() => {
    const list: string[] = [];
    for (const p of fallbackProducts) {
      if (p.main_image_url) list.push(p.main_image_url);
      if (p.hover_image_url) list.push(p.hover_image_url);
      if (p.images) {
        for (const im of p.images) {
          if (im.url) list.push(im.url);
        }
      }
    }
    return Array.from(new Set(list));
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    listProducts()
      .then((res) => {
        if (res && res.length > 0) {
          const list: string[] = [];
          for (const p of res) {
            if (p.main_image_url) list.push(p.main_image_url);
            if (p.hover_image_url) list.push(p.hover_image_url);
            if (p.images) {
              for (const im of p.images) {
                if (im.url) list.push(im.url);
              }
            }
          }
          const unique = Array.from(new Set(list));
          if (unique.length > 0) {
            setCarouselImages(unique);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Mini-lookbook image cycler on the floating monograph
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Main 7-Second Automatic Carousel Interval
  // Runs continuously unless user is actively typing in the newsletter input
  useEffect(() => {
    if (isInputFocused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(interval);
  }, [isInputFocused]);

  // Touch Swipe Handlers (Mobile & Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        // Swiped right -> go to Lookbook
        setCurrentSlide(0);
      } else {
        // Swiped left -> go to Newsletter
        setCurrentSlide(1);
      }
    }
    setTouchStartX(null);
  };

  // Newsletter Subscription Form State
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [newsletterCode, setNewsletterCode] = useState<string | null>(null);

  async function onNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) return;

    setNewsletterStatus("loading");
    try {
      const res = (await subscribeNewsletter({ data: { email } })) as {
        code?: string | null;
      } | null;
      setNewsletterCode(res?.code ?? null);
      setNewsletterStatus("done");

      // Dual-channel Meta CompleteRegistration tracking
      import("@/lib/meta-client")
        .then(({ trackMetaEvent }) => {
          trackMetaEvent(
            "CompleteRegistration",
            {
              contentName: "Weekly Newsletter Signup (Carousel)",
              type: "newsletter_subscriber",
              status: "subscribed",
            },
            { email }
          );
        })
        .catch(() => {});
    } catch {
      setNewsletterStatus("error");
    }
  }

  return (
    <aside
      id="pre-footer-carousel-section"
      aria-label="Atelier Lookbook and Newsletter"
      className={`bg-background pt-10 pb-6 sm:pt-14 sm:pb-8 select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container-x mx-auto max-w-[1400px]">
        {/* Seamless, Borderless Carousel Viewport */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl bg-neutral-950">
          <div
            className="flex w-full items-stretch transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {/* ========================================================= */}
            {/* SLIDE 0: GET INSPIRED BY OUR LOOKBOOK                     */}
            {/* ========================================================= */}
            <div className="w-full shrink-0 flex items-stretch">
              <div className="group relative w-full min-h-[500px] sm:min-h-[440px] md:aspect-[2.2/1] lg:aspect-[2.4/1] flex items-center">
                {/* Background Photography */}
                <img
                  src={bgPhoto}
                  alt="Handcrafted yellow wool rug with inlaid color blocks"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Subtle soft gradient on the left to keep typography crisp */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent sm:bg-gradient-to-r sm:from-black/90 sm:via-black/40 sm:to-transparent" />

                {/* Left Content Column */}
                <div className="relative z-10 flex h-full w-full flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12 pb-14 sm:pb-10 md:pb-10 text-white sm:max-w-2xl sm:justify-center">
                  {/* Monograph Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300 backdrop-blur-md">
                      <Lock className="h-3 w-3 stroke-[2.5]" />
                      <span>Atelier Monograph · Volume I</span>
                    </span>
                    <span className="hidden sm:inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-mono text-white/80 backdrop-blur-md uppercase tracking-wider">
                      96 Plates · E-Book &amp; PDF
                    </span>
                  </div>

                  {/* Editorial Headline */}
                  <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.08] tracking-tight text-white">
                    Get inspired by our{" "}
                    <span className="italic font-serif font-light text-amber-200">
                      Lookbook
                    </span>
                    .
                  </h2>

                  <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-sm md:text-base text-white/85 leading-relaxed font-light max-w-xl">
                    Immerse yourself in our annual monograph featuring bespoke
                    Rwandan Highland wool rugs in architectural spaces. Experience
                    sculptural contour carving, relief textures, and interior
                    styling inspirations.
                  </p>

                  {/* Action Buttons */}
                  <div className="mt-5 sm:mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      to="/lookbook"
                      id="carousel-explore-lookbook-btn"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <span>Explore Lookbook</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <Link
                      to="/lookbook"
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-300" />
                      <span>Download PDF (18.4 MB)</span>
                    </Link>
                  </div>
                </div>

                {/* Right Desktop Visual Accent: Floating Miniature Monograph */}
                <div className="hidden lg:flex absolute right-8 xl:right-14 top-1/2 -translate-y-1/2 z-20 items-center">
                  <Link
                    to="/lookbook"
                    aria-label="View Lookbook Monograph"
                    className="group/card relative block w-56 xl:w-60 rounded-2xl border border-white/30 bg-black/40 p-2.5 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:rotate-1 hover:border-amber-400/60 hover:shadow-amber-500/25 cursor-pointer"
                  >
                    <div className="absolute -left-1.5 inset-y-3 w-1.5 rounded-l-md bg-amber-500/80 shadow-xs" />

                    <div className="overflow-hidden rounded-xl border border-white/20 aspect-[4/5] bg-neutral-900 relative">
                      {carouselImages.map((img, idx) => (
                        <img
                          key={img + idx}
                          src={resolveImage(img)}
                          alt="Mosiac rug from catalogue"
                          loading="lazy"
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                            idx === currentImageIndex
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-105 pointer-events-none"
                          }`}
                        />
                      ))}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white tracking-wider uppercase drop-shadow-md">
                          <span>View Lookbook</span>
                          <ArrowRight className="h-3 w-3 text-amber-300" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SLIDE 1: JOIN OUR WEEKLY NEWSLETTER & DESIGN UPDATES      */}
            {/* ========================================================= */}
            <div className="w-full shrink-0 flex items-stretch">
              <div className="relative w-full min-h-[500px] sm:min-h-[440px] md:aspect-[2.2/1] lg:aspect-[2.4/1] bg-muted/95 p-6 sm:p-8 md:p-10 lg:p-12 pb-14 sm:pb-10 md:pb-10 flex items-center text-foreground">
                <div className="w-full grid items-center gap-6 lg:gap-10 md:grid-cols-[1.1fr_1fr]">
                  {/* Left Form Column */}
                  <div className="max-w-xl">
                    <span className="inline-block rounded-full bg-background px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50">
                      Stay connected
                    </span>
                    <h2 className="mt-3 sm:mt-4 font-display text-2xl sm:text-3xl lg:text-4xl font-medium leading-snug tracking-tight">
                      Join our weekly newsletter &amp; design updates
                    </h2>
                    <p className="mt-2.5 sm:mt-3 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground">
                      Subscribe to get exclusive previews of new rug collections,
                      behind-the-scenes artisan stories, and interior styling
                      guides.
                    </p>

                    {newsletterStatus === "done" ? (
                      <div className="mt-5 rounded-xl border border-border/60 bg-background p-4 sm:p-5 shadow-xs max-w-md">
                        <p className="font-display text-base sm:text-lg flex items-center gap-2 text-foreground">
                          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                          <span>You're on the list.</span>
                        </p>
                        {newsletterCode && (
                          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            Use code{" "}
                            <span className="font-semibold text-foreground">
                              {newsletterCode}
                            </span>{" "}
                            for 10% off your first order.
                          </p>
                        )}
                      </div>
                    ) : (
                      <form
                        onSubmit={onNewsletterSubmit}
                        className="mt-5 sm:mt-6 flex max-w-md flex-col gap-2.5 sm:flex-row sm:items-center"
                      >
                        <input
                          name="email"
                          type="email"
                          required
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          placeholder="you@example.com"
                          className="h-11 sm:h-12 w-full min-h-[44px] shrink-0 rounded-full border border-border/70 bg-background px-4 sm:px-5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all sm:w-auto sm:flex-1"
                        />
                        <button
                          type="submit"
                          disabled={newsletterStatus === "loading"}
                          className="h-11 sm:h-12 w-full min-h-[44px] shrink-0 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer sm:w-auto"
                        >
                          {newsletterStatus === "loading"
                            ? "Joining…"
                            : "Subscribe"}
                        </button>
                      </form>
                    )}
                    {newsletterStatus === "error" && (
                      <p className="mt-2.5 text-xs sm:text-sm text-red-500">
                        Something went wrong. Try again.
                      </p>
                    )}
                  </div>

                  {/* Right Column: Artisan Photos (cleanly constrained so they never overflow) */}
                  <div className="hidden md:grid grid-cols-2 gap-3.5 lg:gap-4 items-center">
                    <img
                      src={hassanChess}
                      alt="Smiling woman sitting on Mosiac artisan rug playing chess"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-48 md:h-56 lg:h-64 w-full rounded-2xl object-cover shadow-sm"
                    />
                    <img
                      src={taiBedroom}
                      alt="Woman relaxing with a smartphone on the Tai blue ocean artisan rug"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-48 md:h-56 lg:h-64 w-full rounded-2xl object-cover shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist, Clean Carousel Controls & Dot Indicators */}
          <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-6 z-20 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 shadow-sm">
              <button
                type="button"
                aria-label="Previous Slide"
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? 1 : 0))}
                className="text-white/70 hover:text-white transition-colors p-0.5 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                aria-label="Lookbook slide"
                onClick={() => setCurrentSlide(0)}
                className={`transition-all duration-300 cursor-pointer ${
                  currentSlide === 0
                    ? "h-1.5 w-5 rounded-full bg-white shadow-xs"
                    : "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/70"
                }`}
              />
              <button
                type="button"
                aria-label="Newsletter slide"
                onClick={() => setCurrentSlide(1)}
                className={`transition-all duration-300 cursor-pointer ${
                  currentSlide === 1
                    ? "h-1.5 w-5 rounded-full bg-white shadow-xs"
                    : "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/70"
                }`}
              />

              <button
                type="button"
                aria-label="Next Slide"
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? 1 : 0))}
                className="text-white/70 hover:text-white transition-colors p-0.5 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
