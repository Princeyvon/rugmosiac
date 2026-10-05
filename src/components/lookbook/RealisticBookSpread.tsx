import { useState, useRef, useEffect, useCallback } from "react";
import type { PDFDocumentProxy, LookbookSpreadView } from "@/lib/pdf-renderer";
import { PdfCanvasPage } from "./PdfCanvasPage";

interface RealisticBookSpreadProps {
  pdfDoc: PDFDocumentProxy | null;
  currentSpread: LookbookSpreadView;
  nextSpread: LookbookSpreadView | null;
  prevSpread: LookbookSpreadView | null;
  totalPages: number;
  zoomLevel: number;
  isSoundEnabled: boolean;
  onAdvanceSpread: () => void;
  onPreviousSpread: () => void;
  isMobileScreen: boolean;
  mobilePageMode: "split_a4" | "full_spread";
  mobileSubPage: "left" | "right";
  setMobileSubPage: (sub: "left" | "right") => void;
  playRustleSound: () => void;
  // Ref to trigger programmatic next/prev animation from external buttons/keys
  animationTriggerRef?: React.MutableRefObject<{
    triggerNext: () => boolean;
    triggerPrev: () => boolean;
  } | null>;
}

export function RealisticBookSpread({
  pdfDoc,
  currentSpread,
  nextSpread,
  prevSpread,
  totalPages,
  zoomLevel,
  isSoundEnabled,
  onAdvanceSpread,
  onPreviousSpread,
  isMobileScreen,
  mobilePageMode,
  mobileSubPage,
  setMobileSubPage,
  playRustleSound,
  animationTriggerRef,
}: RealisticBookSpreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Turn state
  const [turnDirection, setTurnDirection] = useState<"forward" | "backward" | null>(null);
  const [turnAngle, setTurnAngle] = useState<number>(0); // 0 to 180 degrees
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const turnDirectionRef = useRef<"forward" | "backward" | null>(null);
  const currentAngleRef = useRef<number>(0);
  const isBusyRef = useRef<boolean>(false);

  // Keep refs in sync
  turnDirectionRef.current = turnDirection;
  currentAngleRef.current = turnAngle;

  // Render individual page leaf helper
  const renderLeaf = (
    spread: LookbookSpreadView | null,
    side: "left" | "right",
    options?: {
      scale?: number;
      className?: string;
    }
  ) => {
    if (!spread) {
      return (
        <div className="h-full w-full bg-stone-950 flex items-center justify-center border border-stone-800/40">
          <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center text-stone-600 font-serif text-sm">
            M
          </div>
        </div>
      );
    }

    const scale = options?.scale || 1.8;

    if (spread.type === "cover") {
      if (side === "right") {
        return (
          <div className="relative h-full w-full">
            <PdfCanvasPage
              pdfDoc={pdfDoc}
              pageNumber={1}
              scale={scale}
              isCover
              side="single"
              className={options?.className}
            />
            {/* Paper corner curl prompt on cover */}
            <div className="absolute bottom-0 right-0 group-hover:scale-105 transition-transform z-20 pointer-events-none">
              <div className="w-14 h-14 border-b-[40px] border-l-[40px] border-b-amber-500/90 border-l-transparent drop-shadow-lg" />
              <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-bold text-stone-950">
                Open ↷
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className="h-full w-full bg-[#121110] flex flex-col items-center justify-center border-r border-stone-800/80 text-center p-8 select-none">
          <div className="w-16 h-16 rounded-full border border-amber-500/30 flex items-center justify-center text-amber-300 font-serif text-2xl mb-4 shadow-inner">
            M
          </div>
          <span className="font-serif text-sm tracking-[0.25em] text-amber-200 uppercase">
            Mosiac
          </span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-stone-500 uppercase mt-1">
            Kigali Atelier · Monograph
          </span>
          <div className="mt-6 h-px w-12 bg-amber-500/30" />
          <span className="mt-3 font-mono text-[8px] tracking-[0.2em] text-stone-600 uppercase">
            Edition 2026
          </span>
        </div>
      );
    }

    if (spread.type === "back_cover") {
      if (side === "left") {
        return (
          <PdfCanvasPage
            pdfDoc={pdfDoc}
            pageNumber={spread.singlePageNumber || totalPages}
            scale={scale}
            isBackCover
            side="single"
            className={options?.className}
          />
        );
      }
      return (
        <div className="h-full w-full bg-[#121110] flex flex-col items-center justify-center border-l border-stone-800/80 text-center p-8 select-none">
          <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center text-stone-500 font-serif text-lg mb-3">
            M
          </div>
          <span className="font-mono text-[9px] tracking-[0.25em] text-stone-500 uppercase">
            Fin de Monograph
          </span>
          <span className="font-mono text-[8px] text-stone-600 mt-1">
            mosiac.rw · Kigali
          </span>
        </div>
      );
    }

    if (spread.type === "combined_spread") {
      return (
        <PdfCanvasPage
          pdfDoc={pdfDoc}
          pageNumber={spread.singlePageNumber!}
          scale={scale}
          splitHalf={side === "left" ? "left" : "right"}
          side={side}
          className={options?.className}
        />
      );
    }

    if (spread.type === "paired_spread") {
      const pageNum = side === "left" ? spread.leftPageNumber! : spread.rightPageNumber!;
      return (
        <PdfCanvasPage
          pdfDoc={pdfDoc}
          pageNumber={pageNum}
          scale={scale}
          side={side}
          className={options?.className}
        />
      );
    }

    // single_page
    return (
      <PdfCanvasPage
        pdfDoc={pdfDoc}
        pageNumber={spread.singlePageNumber!}
        scale={scale}
        side="single"
        className={options?.className}
      />
    );
  };

  // Mobile specific touch / drag swipe handling
  const [mobileDragX, setMobileDragX] = useState<number>(0);
  const [isMobileDragging, setIsMobileDragging] = useState<boolean>(false);
  const mobileTouchStartXRef = useRef<number | null>(null);
  const mobileTouchStartYRef = useRef<number | null>(null);
  const mobileTouchStartTimeRef = useRef<number>(0);

  const handleMobileTouchStart = (clientX: number, clientY: number) => {
    mobileTouchStartXRef.current = clientX;
    mobileTouchStartYRef.current = clientY;
    mobileTouchStartTimeRef.current = Date.now();
    setIsMobileDragging(true);
    setMobileDragX(0);
  };

  const handleMobileTouchMove = (clientX: number, clientY: number) => {
    if (mobileTouchStartXRef.current === null) return;
    const deltaX = clientX - mobileTouchStartXRef.current;
    const deltaY = clientY - (mobileTouchStartYRef.current || 0);

    // If gesture is vertical scrolling, let the page scroll naturally
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaX) < 15) {
      return;
    }

    const dampedDeltaX = Math.sign(deltaX) * Math.min(Math.abs(deltaX), 140);
    setMobileDragX(dampedDeltaX);
  };

  const handleMobileTouchEnd = () => {
    if (mobileTouchStartXRef.current === null) return;
    const deltaX = mobileDragX;
    const duration = Date.now() - mobileTouchStartTimeRef.current;
    const isQuickSwipe = Math.abs(deltaX) > 25 && duration < 350;
    const isDragThreshold = Math.abs(deltaX) > 40;

    mobileTouchStartXRef.current = null;
    mobileTouchStartYRef.current = null;
    setIsMobileDragging(false);

    const hasTwoLeaves =
      currentSpread.type === "paired_spread" || currentSpread.type === "combined_spread";

    if (deltaX < 0 && (isQuickSwipe || isDragThreshold)) {
      // Swiping forward (towards left)
      if (hasTwoLeaves && mobileSubPage === "left") {
        if (isSoundEnabled) playRustleSound();
        setMobileSubPage("right");
      } else if (nextSpread) {
        if (isSoundEnabled) playRustleSound();
        onAdvanceSpread();
      }
    } else if (deltaX > 0 && (isQuickSwipe || isDragThreshold)) {
      // Swiping backward (towards right)
      if (hasTwoLeaves && mobileSubPage === "right") {
        if (isSoundEnabled) playRustleSound();
        setMobileSubPage("left");
      } else if (prevSpread) {
        if (isSoundEnabled) playRustleSound();
        onPreviousSpread();
      }
    }

    setMobileDragX(0);
  };

  // Helper to commit page turn after slow easing completes
  const commitTurn = useCallback(
    (direction: "forward" | "backward") => {
      if (direction === "forward") {
        onAdvanceSpread();
      } else {
        onPreviousSpread();
      }
      setTurnDirection(null);
      setTurnAngle(0);
      setIsAnimating(false);
      setIsDragging(false);
      isBusyRef.current = false;
    },
    [onAdvanceSpread, onPreviousSpread]
  );

  // Helper to cancel page turn (ease back to 0)
  const cancelTurn = useCallback(() => {
    setIsAnimating(true);
    setTurnAngle(0);
    setTimeout(() => {
      setTurnDirection(null);
      setIsAnimating(false);
      setIsDragging(false);
      isBusyRef.current = false;
    }, 650);
  }, []);

  // Programmatic slow page turn trigger (called from button click or arrow key)
  const startAnimatedTurn = useCallback(
    (direction: "forward" | "backward"): boolean => {
      if (isMobileScreen) {
        const hasTwoLeaves =
          currentSpread.type === "paired_spread" || currentSpread.type === "combined_spread";
        if (direction === "forward") {
          if (hasTwoLeaves && mobileSubPage === "left") {
            if (isSoundEnabled) playRustleSound();
            setMobileSubPage("right");
            return true;
          }
          if (nextSpread) {
            if (isSoundEnabled) playRustleSound();
            onAdvanceSpread();
            return true;
          }
          return false;
        } else {
          if (hasTwoLeaves && mobileSubPage === "right") {
            if (isSoundEnabled) playRustleSound();
            setMobileSubPage("left");
            return true;
          }
          if (prevSpread) {
            if (isSoundEnabled) playRustleSound();
            onPreviousSpread();
            return true;
          }
          return false;
        }
      }

      if (isBusyRef.current || isDragging || isAnimating) return false;

      if (direction === "forward") {
        if (!nextSpread) return false;
        isBusyRef.current = true;
        setTurnDirection("forward");
        setIsDragging(false);
        setIsAnimating(true);
        if (isSoundEnabled) playRustleSound();

        // Start angle at 0 and slowly ease to 180 degrees
        setTurnAngle(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTurnAngle(180);
          });
        });

        setTimeout(() => {
          commitTurn("forward");
        }, 850);
        return true;
      } else {
        if (!prevSpread) return false;
        isBusyRef.current = true;
        setTurnDirection("backward");
        setIsDragging(false);
        setIsAnimating(true);
        if (isSoundEnabled) playRustleSound();

        setTurnAngle(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTurnAngle(180);
          });
        });

        setTimeout(() => {
          commitTurn("backward");
        }, 850);
        return true;
      }
    },
    [
      isMobileScreen,
      currentSpread,
      mobileSubPage,
      setMobileSubPage,
      onAdvanceSpread,
      onPreviousSpread,
      nextSpread,
      prevSpread,
      isSoundEnabled,
      playRustleSound,
      commitTurn,
      isDragging,
      isAnimating,
    ]
  );

  // Attach to ref for parent lookbook controls
  useEffect(() => {
    if (animationTriggerRef) {
      animationTriggerRef.current = {
        triggerNext: () => startAnimatedTurn("forward"),
        triggerPrev: () => startAnimatedTurn("backward"),
      };
    }
  }, [animationTriggerRef, startAnimatedTurn]);

  // DRAG INTERACTION HANDLERS:
  // "when dragging only one side show movement animation ex: when dragging right page to left
  //  say from page 8 to see 9 and 10.. page 8 starts moving slowly until user releases mouse and then 9,10 slowly reveal"

  const handlePointerDown = (clientX: number, clientY: number, target: HTMLElement) => {
    if (isBusyRef.current || isAnimating) return;
    if (target.closest("button, a, input, [role='button']")) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartXRef.current = clientX;
    dragStartYRef.current = clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (dragStartXRef.current === null || isAnimating) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const deltaX = clientX - dragStartXRef.current;
    const deltaY = clientY - (dragStartYRef.current || 0);

    // If mainly vertical scroll on touch, ignore
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaX) < 15) {
      return;
    }

    const halfWidth = rect.width / 2;

    // Determine direction if not locked yet
    if (!turnDirectionRef.current) {
      if (deltaX < -10 && nextSpread) {
        // Dragging right page to the left (forward)
        setTurnDirection("forward");
        turnDirectionRef.current = "forward";
        if (isSoundEnabled) playRustleSound();
      } else if (deltaX > 10 && prevSpread) {
        // Dragging left page to the right (backward)
        setTurnDirection("backward");
        turnDirectionRef.current = "backward";
        if (isSoundEnabled) playRustleSound();
      }
    }

    if (turnDirectionRef.current === "forward") {
      // DeltaX is negative. Angle increases from 0 to 180
      const distance = Math.max(0, -deltaX);
      const progress = Math.min(1, distance / (halfWidth * 1.05));
      // Ease progress slightly for luxury paper tactile feel
      const angle = progress * 180;
      setTurnAngle(angle);
    } else if (turnDirectionRef.current === "backward") {
      // DeltaX is positive. Angle increases from 0 to 180
      const distance = Math.max(0, deltaX);
      const progress = Math.min(1, distance / (halfWidth * 1.05));
      const angle = progress * 180;
      setTurnAngle(angle);
    }
  };

  const handlePointerUp = () => {
    if (dragStartXRef.current === null) return;
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    setIsDragging(false);

    const dir = turnDirectionRef.current;
    const currentAngle = currentAngleRef.current;

    if (!dir) {
      setTurnAngle(0);
      return;
    }

    isBusyRef.current = true;
    setIsAnimating(true);

    // If dragged past 35 degrees: slowly ease rest of way to 180 degrees, revealing the next spread!
    if (currentAngle > 35) {
      setTurnAngle(180);
      if (isSoundEnabled) playRustleSound();
      setTimeout(() => {
        commitTurn(dir);
      }, 850);
    } else {
      // Released too early: slowly ease back to 0 degrees
      cancelTurn();
    }
  };

  // Mouse event listeners
  const onMouseDown = (e: React.MouseEvent) => {
    handlePointerDown(e.clientX, e.clientY, e.target as HTMLElement);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => {
    handlePointerUp();
  };
  const onMouseLeave = () => {
    if (isDragging) {
      handlePointerUp();
    }
  };

  // Touch event listeners
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handlePointerDown(t.clientX, t.clientY, e.target as HTMLElement);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handlePointerMove(t.clientX, t.clientY);
  };
  const onTouchEnd = () => {
    handlePointerUp();
  };

  // Calculate dynamic shadows based on turnAngle (0 to 180)
  const angleRad = (turnAngle * Math.PI) / 180;
  const shadowIntensity = Math.sin(angleRad); // Peaks at 90 deg (vertical leaf)
  const isPastHalfway = turnAngle > 90;

  // Mobile single-leaf presentation: handles both "split_a4" and wide "full_spread" (Never shows two squished pages on mobile!)
  if (isMobileScreen) {
    const isFullWide = mobilePageMode === "full_spread";
    const hasTwoLeaves =
      currentSpread.type === "paired_spread" || currentSpread.type === "combined_spread";

    // Exact dynamic single-leaf aspect ratio (width / height) matching the PDF
    const leafAspect = currentSpread.aspectRatio
      ? (currentSpread.aspectRatio > 1 ? currentSpread.aspectRatio * 0.5 : currentSpread.aspectRatio)
      : 0.7070757;

    return (
      <div
        ref={containerRef}
        onMouseDown={(e) => handleMobileTouchStart(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (isMobileDragging) handleMobileTouchMove(e.clientX, e.clientY);
        }}
        onMouseUp={handleMobileTouchEnd}
        onMouseLeave={() => {
          if (isMobileDragging) handleMobileTouchEnd();
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handleMobileTouchStart(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handleMobileTouchMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handleMobileTouchEnd}
        className={`flex flex-col items-center w-full select-none cursor-grab active:cursor-grabbing touch-pan-y ${
          isFullWide ? "max-w-[700px] px-1" : "max-w-[440px] px-2"
        }`}
      >
        <div
          style={{
            aspectRatio: `${leafAspect}`,
            transform: `translateX(${mobileDragX}px) rotateZ(${mobileDragX * 0.03}deg)`,
            transition: isMobileDragging
              ? "none"
              : "transform 0.35s cubic-bezier(0.2, 0.85, 0.25, 1)",
          }}
          className={`relative w-full rounded-lg overflow-hidden shadow-2xl border border-[#E0D7C6] dark:border-border/60 bg-stone-950 ${
            isFullWide ? "ring-1 ring-amber-500/20" : ""
          }`}
        >
          {currentSpread.type === "cover" ? (
            <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${leafAspect}` }}>
              <PdfCanvasPage
                pdfDoc={pdfDoc}
                pageNumber={1}
                scale={isFullWide ? 2.6 : 2.0}
                isCover
                side="single"
              />
              <button
                type="button"
                onClick={() => {
                  if (isSoundEnabled) playRustleSound();
                  onAdvanceSpread();
                }}
                className="absolute bottom-3 right-3 z-20 cursor-pointer flex items-center gap-1.5 rounded-full bg-amber-500 text-stone-950 px-3.5 py-1.5 font-mono text-[10px] font-bold shadow-xl transition-transform active:scale-95"
              >
                <span>Open Monograph</span>
                <span className="text-xs">↷</span>
              </button>
            </div>
          ) : currentSpread.type === "back_cover" ? (
            <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${leafAspect}` }}>
              <PdfCanvasPage
                pdfDoc={pdfDoc}
                pageNumber={currentSpread.singlePageNumber || totalPages}
                scale={isFullWide ? 2.6 : 2.0}
                isBackCover
                side="single"
              />
            </div>
          ) : currentSpread.type === "combined_spread" ? (
            <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${leafAspect}` }}>
              <PdfCanvasPage
                pdfDoc={pdfDoc}
                pageNumber={currentSpread.singlePageNumber!}
                scale={isFullWide ? 2.6 : 2.0}
                splitHalf={mobileSubPage === "left" ? "left" : "right"}
                side={mobileSubPage}
              />
            </div>
          ) : currentSpread.type === "paired_spread" ? (
            <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${leafAspect}` }}>
              <PdfCanvasPage
                pdfDoc={pdfDoc}
                pageNumber={
                  mobileSubPage === "left"
                    ? currentSpread.leftPageNumber!
                    : currentSpread.rightPageNumber!
                }
                scale={isFullWide ? 2.6 : 2.0}
                side="single"
              />
            </div>
          ) : (
            <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${leafAspect}` }}>
              <PdfCanvasPage
                pdfDoc={pdfDoc}
                pageNumber={currentSpread.singlePageNumber!}
                scale={isFullWide ? 2.6 : 2.0}
                side="single"
              />
            </div>
          )}

          {/* Dynamic Drag Tint */}
          {mobileDragX !== 0 && (
            <div
              style={{
                opacity: Math.min(0.45, Math.abs(mobileDragX) / 100),
              }}
              className={`pointer-events-none absolute inset-0 z-15 ${
                mobileDragX < 0
                  ? "bg-gradient-to-r from-transparent via-black/20 to-black/60"
                  : "bg-gradient-to-l from-transparent via-black/20 to-black/60"
              }`}
            />
          )}

          {/* Leaf / Plate Indicator Pill */}
          <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-stone-200 bg-black/80 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10 z-20 flex items-center gap-1.5 shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>
              {currentSpread.type === "cover"
                ? "Cover · Monograph Volume I"
                : currentSpread.type === "back_cover"
                ? `Back Cover · Plate ${currentSpread.singlePageNumber || totalPages}`
                : currentSpread.type === "combined_spread"
                ? `Plate ${currentSpread.singlePageNumber} · ${
                    mobileSubPage === "left" ? "Part 1/2 (Left)" : "Part 2/2 (Right)"
                  }`
                : `Page ${
                    mobileSubPage === "left"
                      ? currentSpread.leftPageNumber
                      : currentSpread.rightPageNumber
                  } of ${totalPages}`}
            </span>
          </div>

          {/* Wide badge when in Full View mode */}
          {isFullWide && (
            <div className="absolute top-2.5 right-3 font-mono text-[8px] text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-amber-500/20 z-20">
              Wide Leaf View
            </div>
          )}
        </div>

        {/* Mobile Leaf Switcher (Left Leaf / Right Leaf) */}
        {hasTwoLeaves && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mobileSubPage !== "left") {
                  if (isSoundEnabled) playRustleSound();
                  setMobileSubPage("left");
                }
              }}
              className={`px-3.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                mobileSubPage === "left"
                  ? "bg-amber-600 text-white font-bold shadow-xs scale-105"
                  : "bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              ← Left Leaf
            </button>
            <span className="text-muted-foreground/40 text-[10px]">·</span>
            <button
              type="button"
              onClick={() => {
                if (mobileSubPage !== "right") {
                  if (isSoundEnabled) playRustleSound();
                  setMobileSubPage("right");
                }
              }}
              className={`px-3.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                mobileSubPage === "right"
                  ? "bg-amber-600 text-white font-bold shadow-xs scale-105"
                  : "bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              Right Leaf →
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // REALISTIC 3D BOOK SPREAD ARCHITECTURE:
  // - Fixed central spine alignment at 50% across all pages (including Cover)
  // - LEFT BED: Stationary left page (or previous spread underlying if backward)
  // - RIGHT BED: Stationary right page (or next spread underlying if forward)
  // - CENTRAL SPINE CREASE: Ambient 3D depth and shadow
  // - TURNING LEAF: Only one side shows movement animation!
  // =========================================================================

  // Exact dynamic aspect ratios calculated directly from current spread and PDF dimensions
  // Single leaf width/height ratio (for A4: 595.28 / 841.89 = 0.7070757):
  const leafAspect = currentSpread.aspectRatio
    ? (currentSpread.aspectRatio > 1 ? currentSpread.aspectRatio * 0.5 : currentSpread.aspectRatio)
    : 0.7070757;
  // A 2-page spread is exactly twice the width of a single leaf:
  const spreadAspect = leafAspect * 2;

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        perspective: "2600px",
        transformStyle: "preserve-3d",
      }}
      className="relative w-full max-w-[1140px] select-none cursor-grab active:cursor-grabbing touch-pan-y"
    >
      <div
        style={{ aspectRatio: `${spreadAspect}` }}
        className="relative w-full grid grid-cols-2 rounded-lg overflow-hidden shadow-2xl border border-[#E0D7C6] dark:border-border/60 bg-stone-950"
      >
        {/* ================================================================
            LAYER 1: THE BED (Base underlying pages)
            ================================================================ */}

        {/* LEFT BED */}
        <div className="relative h-full overflow-hidden border-r border-[#DFD6C3]/80 dark:border-border/50 bg-stone-950">
          {turnDirection === "backward" && prevSpread ? (
            // Revealing previous spread's left page underneath
            <>
              {renderLeaf(prevSpread, "left", { scale: 1.8 })}
              <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {prevSpread.type === "paired_spread"
                  ? `Page ${prevSpread.leftPageNumber}`
                  : `Plate ${prevSpread.singlePageNumber}`}
              </div>
            </>
          ) : (
            // Current spread left page (resting stationary)
            <>
              {renderLeaf(currentSpread, "left", { scale: 1.8 })}
              <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {currentSpread.type === "paired_spread"
                  ? `Page ${currentSpread.leftPageNumber}`
                  : `Plate ${currentSpread.singlePageNumber}`}
              </div>
            </>
          )}

          {/* Cast shadow onto left bed when page turns towards left */}
          {turnDirection === "forward" && turnAngle > 0 && (
            <div
              style={{
                opacity: isPastHalfway ? shadowIntensity * 0.7 : 0,
                transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
              }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-black/25 to-black/65 z-20"
            />
          )}
        </div>

        {/* RIGHT BED */}
        <div className="relative h-full overflow-hidden bg-stone-950">
          {turnDirection === "forward" && nextSpread ? (
            // REVEALING NEXT SPREAD'S RIGHT PAGE UNDERNEATH (e.g. Page 10)!
            <>
              {renderLeaf(nextSpread, "right", { scale: 1.8 })}
              <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {nextSpread.type === "paired_spread"
                  ? `Page ${nextSpread.rightPageNumber}`
                  : `Plate ${nextSpread.singlePageNumber}`}
              </div>
            </>
          ) : (
            // Current spread right page (resting stationary)
            <>
              {renderLeaf(currentSpread, "right", { scale: 1.8 })}
              <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {currentSpread.type === "paired_spread"
                  ? `Page ${currentSpread.rightPageNumber}`
                  : `Plate ${currentSpread.singlePageNumber}`}
              </div>
            </>
          )}

          {/* Realistic spine cast shadow onto right bed as leaf lifts */}
          {turnDirection === "forward" && turnAngle > 0 && (
            <div
              style={{
                opacity: shadowIntensity * 0.5,
                transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
              }}
              className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-20"
            />
          )}
        </div>

        {/* CENTRAL SPINE CREASE & GUTTER DEPTH - Clean & subtle so zero content is obscured */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 sm:w-6 bg-gradient-to-r from-black/25 via-black/5 to-black/25 z-25 shadow-inner" />

        {/* ================================================================
            LAYER 2: THE TURNING LEAF (Single side motion with 3D easing)
            "when dragging only one side show movement animation ex: when dragging
             right page to left say from page 8 to see 9 and 10.. page 8 starts
             moving slowly until user releases mouse and then 9,10 slowly reveal"
            ================================================================ */}

        {/* A. FORWARD TURN: RIGHT LEAF LIFTS & ROTATES AROUND SPINE TO LEFT */}
        {turnDirection === "forward" && nextSpread && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
              transform: `rotateY(-${turnAngle}deg)`,
              transition: isDragging
                ? "none"
                : "transform 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
              zIndex: 35,
            }}
            className="overflow-visible"
          >
            {/* FRONT FACE: Current Right Page (e.g. Page 8) */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="relative w-full h-full overflow-hidden bg-stone-950 shadow-2xl"
            >
              {renderLeaf(currentSpread, "right", { scale: 1.8 })}

              {/* Dynamic paper curl & lighting sheen overlay */}
              <div
                style={{
                  opacity: shadowIntensity * 0.45,
                  transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
                }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10"
              />

              <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {currentSpread.type === "paired_spread"
                  ? `Page ${currentSpread.rightPageNumber}`
                  : `Plate ${currentSpread.singlePageNumber}`}
              </div>
            </div>

            {/* BACK FACE: Next Spread's Left Page (e.g. Page 9)! */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="overflow-hidden bg-stone-950 shadow-2xl border-r border-[#DFD6C3]/80 dark:border-border/50"
            >
              {renderLeaf(nextSpread, "left", { scale: 1.8 })}

              {/* Reverse curl shadow */}
              <div
                style={{
                  opacity: shadowIntensity * 0.45,
                  transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
                }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/40 via-white/10 to-transparent z-10"
              />

              <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {nextSpread.type === "paired_spread"
                  ? `Page ${nextSpread.leftPageNumber}`
                  : `Plate ${nextSpread.singlePageNumber}`}
              </div>
            </div>
          </div>
        )}

        {/* B. BACKWARD TURN: LEFT LEAF LIFTS & ROTATES AROUND SPINE TO RIGHT */}
        {turnDirection === "backward" && prevSpread && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              transformOrigin: "right center",
              transformStyle: "preserve-3d",
              transform: `rotateY(${turnAngle}deg)`,
              transition: isDragging
                ? "none"
                : "transform 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
              zIndex: 35,
            }}
            className="overflow-visible"
          >
            {/* FRONT FACE: Current Left Page (e.g. Page 9) */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="relative w-full h-full overflow-hidden bg-stone-950 shadow-2xl"
            >
              {renderLeaf(currentSpread, "left", { scale: 1.8 })}

              <div
                style={{
                  opacity: shadowIntensity * 0.45,
                  transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
                }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/40 via-white/10 to-transparent z-10"
              />

              <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {currentSpread.type === "paired_spread"
                  ? `Page ${currentSpread.leftPageNumber}`
                  : `Plate ${currentSpread.singlePageNumber}`}
              </div>
            </div>

            {/* BACK FACE: Previous Spread's Right Page (e.g. Page 8)! */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="overflow-hidden bg-stone-950 shadow-2xl"
            >
              {renderLeaf(prevSpread, "right", { scale: 1.8 })}

              <div
                style={{
                  opacity: shadowIntensity * 0.45,
                  transition: isDragging ? "none" : "opacity 0.85s cubic-bezier(0.2, 0.85, 0.25, 1)",
                }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10"
              />

              <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 z-10">
                {prevSpread.type === "paired_spread"
                  ? `Page ${prevSpread.rightPageNumber}`
                  : `Plate ${prevSpread.singlePageNumber}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
