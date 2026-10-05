import { useState, useEffect, useRef, useCallback } from "react";
import craftBlueScallop from "@/assets/craft-blue-scallop.jpg";
import craftRoseTufting from "@/assets/craft-rose-tufting.jpg";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AtelierSlide {
  id: string;
  src: string;
  alt: string;
}

const ATELIER_SLIDES: AtelierSlide[] = [
  {
    id: "fig1",
    src: craftBlueScallop,
    alt: "Artisan tufting intricate botanical shell scallop pattern on master loom in Kigali atelier",
  },
  {
    id: "fig2",
    src: craftRoseTufting,
    alt: "Artisan hand-tufting Highland wool floral rose relief on Kigali workshop frame",
  },
];

export function AtelierFiguresGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch gesture state for mobile swiping
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ATELIER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ATELIER_SLIDES.length) % ATELIER_SLIDES.length);
  }, []);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Auto-scroll carousel timer (advances every 4.8 seconds when not paused)
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touchStartX.current - touch.clientX;
    const deltaY = touchStartY.current - touch.clientY;

    // Trigger only if horizontal swipe dominates vertical scroll
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      id="atelier-figures-carousel"
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Spanning Minimalist Carousel Frame */}
      <div
        className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 bg-muted/40 shadow-xs select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Sliding Track */}
        <div
          className="flex will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: "transform 650ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {ATELIER_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="w-full shrink-0 relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[21/9]"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Minimal Navigation Arrows */}
        <button
          id="atelier-carousel-prev-btn"
          type="button"
          onClick={prevSlide}
          aria-label="Previous photograph"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-md border border-border/70 shadow-sm hover:bg-background hover:scale-105 active:scale-95 transition-all focus:outline-hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          id="atelier-carousel-next-btn"
          type="button"
          onClick={nextSlide}
          aria-label="Next photograph"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-md border border-border/70 shadow-sm hover:bg-background hover:scale-105 active:scale-95 transition-all focus:outline-hidden"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Minimal Navigation Indicator Dots */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {ATELIER_SLIDES.map((slide, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              id={`atelier-slide-indicator-${idx}`}
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`View slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-foreground"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

