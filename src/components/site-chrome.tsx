import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Search,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronRight,
  Heart,
  User,
  Minus,
  Plus,
  Trash2,
  Check,
  BookOpen,
  Lock,
  ArrowRight,
  Download,
  RotateCw,
  Copy,
  Sparkles,
} from "lucide-react";
import { listProducts, type Product } from "@/lib/catalogue.functions";
import { fallbackProducts } from "@/lib/fallback-catalogue";
import { subscribeNewsletter, claimPromo } from "@/lib/forms.functions";
import {
  DEFAULT_POPUP_BANNER_CONFIG,
  type PopupBannerConfig,
} from "@/lib/banner-config";
import { getPopupBannerSettings } from "@/lib/leads-and-banner.functions";
import { useFeaturedImage } from "@/lib/site-images-client";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";
import { CurrencyDropdown } from "@/components/CurrencyDropdown";
import { useCart, useWishlist, useHydratedCounts } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FAQ_SECTIONS } from "@/lib/faq-content";
import { PaymentMethodsRow } from "@/components/PaymentIcons";
import lookbookYellowRug from "@/assets/lookbook-yellow-rug.jpg";

import { BRAND_CONFIG, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/brand-config";
export { WHATSAPP_NUMBER, WHATSAPP_URL };

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.51-8.413z" />
    </svg>
  );
}

const PROMO_KEY = "mosiac.promo.dismiss";
/** Snooze ladder: first dismiss hides it 2 minutes, second 10 minutes, then an hour. */
const SNOOZE_MS = [2 * 60_000, 10 * 60_000, 60 * 60_000];
/** The banner only appears once the page has finished loading, then waits. */
const PROMO_DELAY_MS = 7_000;

/**
 * Kept for layout compatibility: the promo is now a centred overlay, so it no
 * longer pushes the sticky header down. Always reports zero height.
 */
export function usePromoHeight() {
  return 0;
}

export function PromoBar({
  onVisibleChange,
}: {
  onVisibleChange?: (visible: boolean) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [config, setConfig] = useState<PopupBannerConfig>(DEFAULT_POPUP_BANNER_CONFIG);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"offer" | "form" | "done">("offer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [rotatedDesktopSrc, setRotatedDesktopSrc] = useState<string>("");
  const [isNaturallyVertical, setIsNaturallyVertical] = useState(false);

  // Generate native vertically rotated image for desktop using offscreen canvas
  useEffect(() => {
    if (!config.imageUrl || config.rotateImageVertical === false) {
      setRotatedDesktopSrc("");
      setIsNaturallyVertical(false);
      return;
    }
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => {
      if (active) setRotatedDesktopSrc("");
    };
    img.onload = () => {
      if (!active) return;
      const nw = img.naturalWidth || 1920;
      const nh = img.naturalHeight || 1280;
      // If photo is already vertical (height >= width), keep natural orientation and never rotate
      if (nh >= nw) {
        setIsNaturallyVertical(true);
        setRotatedDesktopSrc("");
        return;
      }
      setIsNaturallyVertical(false);
      try {
        const canvas = document.createElement("canvas");
        // Swapping width & height for vertical orientation
        canvas.width = nh;
        canvas.height = nw;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((-90 * Math.PI) / 180);
          ctx.drawImage(img, -nw / 2, -nh / 2);
          const dataUrl = canvas.toDataURL("image/webp", 0.95);
          if (active) setRotatedDesktopSrc(dataUrl);
        }
      } catch {
        if (active) setRotatedDesktopSrc("");
      }
    };
    img.src = config.imageUrl;
    return () => {
      active = false;
    };
  }, [config.imageUrl, config.rotateImageVertical]);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  // 1. Hydrate saved configuration & listen for live test preview from Studio Dashboard
  useEffect(() => {
    try {
      const cached = localStorage.getItem("mosiac.banner.config");
      if (cached) {
        const parsed = JSON.parse(cached);
        setConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}

    getPopupBannerSettings()
      .then((cfg) => {
        if (cfg) {
          setConfig(cfg);
          try {
            localStorage.setItem("mosiac.banner.config", JSON.stringify(cfg));
          } catch {}
        }
      })
      .catch(() => {});

    const onPreviewEvent = (e: Event) => {
      const custom = e as CustomEvent<PopupBannerConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
        setStep(custom.detail.displayMode === "direct_form" ? "form" : "offer");
        setVisible(true);
      }
    };

    const onConfigSavedEvent = (e: Event) => {
      const custom = e as CustomEvent<PopupBannerConfig>;
      if (custom.detail) {
        setConfig((prev) => ({ ...prev, ...custom.detail }));
        if (custom.detail.enabled === false) {
          setVisible(false);
        }
      }
    };

    // Cross-tab storage synchronization
    const onStorageEvent = (e: StorageEvent) => {
      if (e.key === "mosiac.banner.config" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConfig((prev) => ({ ...prev, ...parsed }));
          if (parsed.enabled === false) {
            setVisible(false);
          }
        } catch {}
      }
    };

    // Cross-tab real-time BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("mosiac_banner_sync");
        bc.onmessage = (msg) => {
          if (msg.data?.type === "config_saved" && msg.data?.config) {
            setConfig((prev) => ({ ...prev, ...msg.data.config }));
            if (msg.data.config.enabled === false) {
              setVisible(false);
            }
          } else if (msg.data?.type === "preview" && msg.data?.config) {
            setConfig(msg.data.config);
            setStep(msg.data.config.displayMode === "direct_form" ? "form" : "offer");
            setVisible(true);
          }
        };
      }
    } catch {}

    window.addEventListener("mosiac:banner_preview" as any, onPreviewEvent);
    window.addEventListener("mosiac:banner_config_saved" as any, onConfigSavedEvent);
    window.addEventListener("storage", onStorageEvent);
    return () => {
      window.removeEventListener("mosiac:banner_preview" as any, onPreviewEvent);
      window.removeEventListener("mosiac:banner_config_saved" as any, onConfigSavedEvent);
      window.removeEventListener("storage", onStorageEvent);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, []);

  // 2. Control display logic based on target pages, delay, and dismissal snooze
  useEffect(() => {
    // Check if test query param is present to force instant display for testing
    let forceTest = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("test_popup") === "1" || sp.get("preview_banner") === "1" || (window as any).__MOSIAC_FORCE_POPUP__) {
        forceTest = true;
      }
    } catch {}

    if (!config.enabled && !forceTest) {
      setVisible(false);
      return;
    }

    // Do not pop up inside admin studio or checkout flow (unless forceTest)
    if (!forceTest && (pathname.startsWith("/admin") || pathname.startsWith("/checkout"))) {
      setVisible(false);
      return;
    }

    // Check page targets
    if (!forceTest) {
      if (config.targetPages === "home_only" && pathname !== "/") {
        setVisible(false);
        return;
      }
      if (config.targetPages === "catalogue_only" && !pathname.startsWith("/catalogue")) {
        setVisible(false);
        return;
      }

      // Check if user already claimed the promotion
      try {
        if (localStorage.getItem("mosiac.promo.claimed") === "true") {
          return;
        }
      } catch {}

      let until = 0;
      try {
        const raw = localStorage.getItem(PROMO_KEY);
        if (raw) until = (JSON.parse(raw) as { until: number }).until ?? 0;
      } catch {}

      if (Date.now() < until) return;
    }

    const delayMs = forceTest ? 100 : Math.max(1, (config.delaySeconds ?? 5)) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => {
        setStep(config.displayMode === "direct_form" ? "form" : "offer");
        setVisible(true);
      }, delayMs);
    };

    if (typeof document !== "undefined") {
      if (document.readyState !== "loading") {
        start();
      } else {
        document.addEventListener("DOMContentLoaded", start, { once: true });
        window.addEventListener("load", start, { once: true });
      }
    }

    const onOpenPromo = () => {
      setStep(config.displayMode === "direct_form" ? "form" : "offer");
      setVisible(true);
    };
    window.addEventListener("mosiac:open_promo" as any, onOpenPromo);

    return () => {
      if (timer) clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("load", start);
        window.removeEventListener("mosiac:open_promo" as any, onOpenPromo);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("DOMContentLoaded", start);
      }
    };
  }, [config.enabled, config.targetPages, config.delaySeconds, config.displayMode, pathname]);

  const dismiss = useCallback(() => {
    const snoozeMs = Math.max(1, (config.snoozeMinutes ?? 60)) * 60 * 1000;
    try {
      localStorage.setItem(
        PROMO_KEY,
        JSON.stringify({ until: Date.now() + snoozeMs }),
      );
    } catch {}
    setVisible(false);
  }, [config.snoozeMinutes]);

  // Handle escape key to dismiss popup
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, dismiss]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (config.requireName !== false && !trimmedName) {
      setErr("Please enter your name.");
      return;
    }
    if (config.requirePhone !== false && !trimmedPhone) {
      setErr("Please enter your phone or WhatsApp number.");
      return;
    }
    if (config.requireEmail !== false) {
      if (!trimmedEmail) {
        setErr("Please enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setErr("Please enter a valid email address.");
        return;
      }
    }

    setBusy(true);
    try {
      const { getAttributionPayload } = await import("@/lib/attribution");
      const { getConsentPreferences } = await import("@/lib/consent");
      const attr = getAttributionPayload();
      const consent = getConsentPreferences();

      await claimPromo({
        data: {
          name: trimmedName || undefined,
          phone: trimmedPhone || undefined,
          email: trimmedEmail || undefined,
          source: config.campaignSource || "popup-banner",
          firstTouch: attr.firstTouch,
          lastTouch: attr.lastTouch,
          fbp: attr.fbp,
          fbc: attr.fbc,
          consentStatus: consent ? (consent.marketing ? "granted" : "essential_only") : "undecided",
        },
      });

      // Dual-channel Meta Lead & CompleteRegistration conversion events
      const { trackMetaEvent } = await import("@/lib/meta-client");
      await trackMetaEvent(
        "Lead",
        {
          contentName: "Welcome Promo Voucher Claim",
          leadType: "welcome_voucher_lead",
          voucherCode: config.couponCode || "WELCOME55K",
          value: 55000,
          currency: "RWF",
        },
        {
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          firstName: trimmedName || undefined,
        }
      );

      trackMetaEvent(
        "CompleteRegistration",
        {
          contentName: "Welcome Promo Voucher Claim",
          voucherCode: config.couponCode || "WELCOME55K",
          discountValue: 55000,
          currency: "RWF",
          type: "welcome_voucher",
        },
        {
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          firstName: trimmedName || undefined,
        }
      );

      try {
        localStorage.setItem("mosiac.promo.claimed", "true");
        localStorage.setItem(
          PROMO_KEY,
          JSON.stringify({ until: Date.now() + 30 * 24 * 60 * 60 * 1000 })
        );
        if (config.couponCode) {
          localStorage.setItem("mosiac.applied_coupon", config.couponCode);
        }
      } catch {}

      setStep("done");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleCopyCoupon() {
    if (!config.couponCode) return;
    navigator.clipboard?.writeText(config.couponCode);
    setCopied(true);
    try {
      localStorage.setItem("mosiac.applied_coupon", config.couponCode);
    } catch {}
    setTimeout(() => setCopied(false), 2500);
  }

  if (!visible) return null;

  const cleanHeadline =
    config.headline?.trim() || "Claim your 55,000 RWF buying credit.";
  const cleanSubtitle =
    config.subtitle?.trim() ||
    "Enter your contact details to receive your 55,000 RWF credit voucher, manually emailed by our atelier team.";
  const cleanEyebrow = config.eyebrow?.trim() || "Atelier Welcome Offer";

  return (
    <div
      className="fixed inset-0 z-[99999] grid place-items-center bg-black/75 p-4 sm:p-6 backdrop-blur-[4px] animate-fade-in select-none"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={cleanHeadline || "Special studio offer"}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-[860px] overflow-hidden rounded-3xl md:rounded-[32px] bg-background shadow-2xl border border-border/60 text-foreground transition-all max-h-[92vh] flex flex-col md:grid md:grid-cols-2"
      >
        {/* LEFT COLUMN: Text, Branding, Inputs & Actions (Desktop Left, Mobile Bottom) */}
        <div className="flex flex-col justify-between p-4 sm:p-6 md:p-8 order-2 md:order-1 overflow-y-auto bg-background">
          {/* Top Brand Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-script text-2xl sm:text-3xl md:text-[34px] leading-none text-foreground select-none">
                Mosiac<span className="text-accent">.</span>
              </span>
            </div>

            {cleanEyebrow && (
              <p className="mt-2.5 sm:mt-3.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                {cleanEyebrow}
              </p>
            )}

            <h3 className="mt-1.5 sm:mt-2 font-display text-xl sm:text-2xl md:text-3xl lg:text-[28px] font-bold leading-[1.18] tracking-tight text-foreground">
              {cleanHeadline}
            </h3>

            {/* Subtitle - responsive display reflecting admin settings */}
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-relaxed text-muted-foreground font-light line-clamp-3 sm:line-clamp-none">
              {cleanSubtitle}
            </p>
          </div>

          {/* Form & Actions or Success */}
          <div className="mt-3.5 sm:mt-5 md:mt-6">
            {step === "offer" && config.displayMode !== "direct_form" ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full rounded-xl bg-foreground px-5 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-background shadow-md transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {config.ctaText || "Claim 55,000 RWF Credit"} →
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span>Instant email delivery · Valid on all handcrafted rugs</span>
                </div>
              </div>
            ) : step !== "done" ? (
              <form onSubmit={submit} className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between pb-0.5">
                  <p className="text-[11px] text-muted-foreground">
                    {config.formDescription ||
                      "Enter your email and contact details. Our Kigali studio team will manually email your 55,000 RWF voucher directly to your inbox."}
                  </p>
                  {config.displayMode !== "direct_form" && (
                    <button
                      type="button"
                      onClick={() => setStep("offer")}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0 ml-2"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                {config.requireName !== false && (
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name *"
                    className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 sm:px-4 sm:py-2.5 md:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-foreground focus:bg-background focus:ring-1 focus:ring-foreground"
                  />
                )}

                {config.requirePhone !== false && (
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone / WhatsApp *"
                    inputMode="tel"
                    className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 sm:px-4 sm:py-2.5 md:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-foreground focus:bg-background focus:ring-1 focus:ring-foreground"
                  />
                )}

                {config.requireEmail !== false && (
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address *"
                    className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2 sm:px-4 sm:py-2.5 md:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-foreground focus:bg-background focus:ring-1 focus:ring-foreground"
                  />
                )}

                {err && <p className="text-xs text-destructive">{err}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-1.5 sm:mt-2 rounded-xl bg-foreground px-5 py-2.5 sm:px-6 sm:py-3 md:py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-background shadow-md transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Submitting…" : (config.ctaText || "Claim 55,000 RWF Credit")}
                </button>
              </form>
            ) : (
              <div className="py-2 text-center sm:text-left space-y-3">
                <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 mb-1">
                  <Check className="h-5 w-5 stroke-[2.5]" />
                </div>
                <h4 className="font-display text-base sm:text-xl font-bold text-foreground">
                  {config.successHeadline || "You're on the atelier list."}
                </h4>
                <p className="text-xs text-muted-foreground leading-snug sm:leading-relaxed">
                  {config.successDescription ||
                    "Thank you! Our studio team will manually email your buying credit voucher directly to your inbox shortly."}
                </p>

                {config.couponCode && (
                  <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/10 p-3 sm:p-3.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-accent font-semibold">
                        Voucher Code
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCoupon}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-accent transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-1 font-mono text-base sm:text-lg font-bold tracking-wider text-foreground">
                      {config.couponCode}
                    </div>
                    {email && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Dispatched for <span className="font-semibold text-foreground underline">{email}</span>.
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/catalogue"
                    onClick={() => {
                      if (config.couponCode) {
                        try {
                          localStorage.setItem("mosiac.applied_coupon", config.couponCode);
                        } catch {}
                      }
                      dismiss();
                    }}
                    className="flex-1 rounded-xl bg-foreground px-4 py-2.5 text-center text-xs font-semibold text-background hover:opacity-90 transition-opacity"
                  >
                    Shop Collection with Credit →
                  </Link>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Microcopy Disclaimer with reduced wording on mobile and real /terms links */}
          <p className="mt-3 sm:mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
            <span className="md:hidden">
              By continuing, you agree to our{" "}
              <Link to="/terms" onClick={dismiss} className="underline hover:text-foreground">
                Terms &amp; Policies
              </Link>.
            </span>
            <span className="hidden md:inline">
              By signing up, you agree to our{" "}
              <Link to="/terms" search={{ tab: "privacy" }} onClick={dismiss} className="underline hover:text-foreground">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" search={{ tab: "terms" }} onClick={dismiss} className="underline hover:text-foreground">
                Terms of Use
              </Link>.
            </span>
          </p>
        </div>

        {/* RIGHT COLUMN: Studio Rug Photography (Proportional, Exact Dimensions, Rotated Vertically on Desktop, X Button Only) */}
        <div className="relative h-36 sm:h-48 md:h-full md:aspect-[2/3] w-full overflow-hidden bg-stone-950 order-1 md:order-2 flex items-center justify-center">
          {/* ONLY the X dismiss button on the right section (no other buttons or overlays) */}
          <button
            onClick={dismiss}
            aria-label="Close offer"
            className="absolute right-3.5 top-3.5 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/20"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>

          {/* Desktop image section: vertically rotated if configured and horizontal, otherwise natural with fit mode */}
          {rotatedDesktopSrc ? (
            <img
              src={rotatedDesktopSrc}
              alt={config.imageAlt || "Handcrafted Mosiac rug"}
              className={`hidden md:block h-full w-full select-none pointer-events-none ${
                config.imageFitMode === "fit" ? "object-contain bg-black/40" : "object-cover"
              }`}
            />
          ) : isNaturallyVertical || config.rotateImageVertical === false ? (
            <img
              src={config.imageUrl}
              alt={config.imageAlt || "Handcrafted Mosiac rug"}
              className={`hidden md:block h-full w-full select-none pointer-events-none ${
                config.imageFitMode === "fit" ? "object-contain bg-black/40" : "object-cover"
              }`}
            />
          ) : (
            <div className="hidden md:flex h-full w-full items-center justify-center overflow-hidden">
              <img
                src={config.imageUrl}
                alt={config.imageAlt || "Handcrafted Mosiac rug"}
                className={`select-none pointer-events-none -rotate-90 ${
                  config.imageFitMode === "fit" ? "object-contain" : "object-cover"
                }`}
                style={{
                  width: "150%",
                  height: "66.6667%",
                  maxWidth: "none",
                  maxHeight: "none",
                }}
              />
            </div>
          )}

          {/* Optional Image Badge Overlay */}
          {config.badgeText && (
            <div className="absolute left-3.5 bottom-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white shadow">
                {config.badgeText}
              </span>
            </div>
          )}

          {/* Mobile: horizontal view respecting fit mode */}
          <img
            src={config.imageUrl}
            alt={config.imageAlt || "Handcrafted Mosiac rug"}
            className={`block md:hidden h-full w-full select-none pointer-events-none ${
              config.imageFitMode === "fit" ? "object-contain bg-black/40" : "object-cover"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

/** Heart overlay for product cards. */
export function WishlistHeart({
  product,
  className = "",
}: {
  product: { productId: string; slug: string; name: string; image?: string };
  className?: string;
}) {
  const wishlist = useWishlist();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const active = hydrated && wishlist.has(product.productId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        wishlist.toggle(product);
      }}
      className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur-md transition-transform hover:scale-110 ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${active ? "fill-current text-accent" : ""}`}
      />
    </button>
  );
}

const SHOP_LINKS: Array<{
  label: string;
  to: string;
  search?: { category: string };
}> = [
  { label: "Shop All", to: "/catalogue" },
  { label: "Brands", to: "/catalogue", search: { category: "brands" } },
  { label: "Area Rugs", to: "/catalogue", search: { category: "area-rugs" } },
  { label: "Runners", to: "/catalogue", search: { category: "runners" } },
  { label: "Collections", to: "/catalogue" },
];

function useScrollProgress(range = 360) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setP(Math.max(0, Math.min(1, y / range)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [range]);
  return p;
}

/** Everything outside the catalogue that search should be able to surface. */
type PageHit = {
  kind: "page";
  title: string;
  blurb: string;
  to: string;
  hash?: string;
};

const SEARCHABLE_PAGES: PageHit[] = [
  {
    kind: "page",
    title: "Our Craft & Savoir-Faire",
    blurb: "100% Highland wool, vertical looms, duckbill carving, and Kigali atelier methods.",
    to: "/craft",
  },
  {
    kind: "page",
    title: "Atelier Lookbook Monograph",
    blurb: "Browse or download our Volume I digital lookbook monograph.",
    to: "/lookbook",
  },
  {
    kind: "page",
    title: "Shop all rugs",
    blurb: "The full Mosiac catalogue, filter by shape, colour and price.",
    to: "/catalogue",
  },
  {
    kind: "page",
    title: "Explore Mosiac",
    blurb: "Our rugs photographed in real homes and studios.",
    to: "/explore",
  },
  {
    kind: "page",
    title: "Custom rugs",
    blurb: "Any design, any size. Start a custom commission.",
    to: "/custom",
  },
  {
    kind: "page",
    title: "About the studio",
    blurb: "How we hand tuft every rug in Kigali, plus full FAQs.",
    to: "/how-it-works",
  },
  {
    kind: "page",
    title: "Contact us",
    blurb: "WhatsApp, email and a callback request.",
    to: "/contact",
  },
  {
    kind: "page",
    title: "Frequently asked questions",
    blurb: "Shipping, returns, care, custom work and pricing.",
    to: "/faq",
  },
  {
    kind: "page",
    title: "Sizing guide",
    blurb: "Rug dimensions, weights and how to pick a size.",
    to: "/faq",
  },
];

function scoreText(needle: string, haystack: string) {
  const h = haystack.toLowerCase();
  if (h.includes(needle)) return h.startsWith(needle) ? 3 : 2;
  // Loose intent match: every word in the query appears somewhere.
  return needle.split(/\s+/).every((w) => w.length > 2 && h.includes(w))
    ? 1
    : 0;
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[] | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    listProducts().then((res) => {
      if (!cancelled) setItems(res as Product[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const needle = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!items) return [];
    if (!needle) return items.slice(0, 5);
    return items
      .map((p) => ({
        p,
        s: Math.max(
          scoreText(needle, p.name) * 2,
          scoreText(needle, p.short_description ?? ""),
          scoreText(needle, p.category?.name ?? ""),
          scoreText(needle, (p.tags ?? []).join(" ")),
        ),
      }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((r) => r.p);
  }, [items, needle]);

  const pageHits = useMemo(() => {
    if (!needle) return SEARCHABLE_PAGES.slice(0, 3);
    return SEARCHABLE_PAGES.filter(
      (p) => scoreText(needle, `${p.title} ${p.blurb}`) > 0,
    ).slice(0, 4);
  }, [needle]);

  const answers = useMemo(() => {
    if (needle.length < 3) return [];
    return FAQ_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => scoreText(needle, `${item.q} ${item.a}`) > 0)
        .map((item) => ({ section: section.title, ...item })),
    ).slice(0, 3);
  }, [needle]);

  const empty =
    results.length === 0 && pageHits.length === 0 && answers.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search catalogue"
      className="fixed inset-0 z-[85] bg-background/95 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-24 max-w-2xl px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              import("@/lib/meta-client")
                .then(({ trackMetaEvent }) => {
                  trackMetaEvent("Search", {
                    query: q.trim(),
                    search_string: q.trim(),
                  });
                })
                .catch(() => {});
            }
            if (results[0]) {
              navigate({
                to: "/catalogue/$slug",
                params: { slug: results[0].slug },
              });
              onClose();
            } else if (pageHits[0]) {
              navigate({ to: pageHits[0].to });
              onClose();
            }
          }}
          className="flex items-center gap-3 border-b-2 border-foreground pb-3"
        >
          <Search className="h-6 w-6" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rugs, pages or ask a question"
            className="flex-1 bg-transparent text-2xl outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-6 max-h-[62vh] space-y-7 overflow-y-auto pb-10">
          {items === null ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : empty ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nothing matched. Try a colour, a shape, or something like
              "shipping".
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <section>
                  <p className="eyebrow text-muted-foreground">
                    {needle ? "Rugs" : "Popular rugs"}
                  </p>
                  <ul className="mt-2 divide-y divide-border">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/catalogue/$slug"
                          params={{ slug: p.slug }}
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 transition-opacity hover:opacity-70"
                        >
                          {resolveImage(p.main_image_url) && (
                            <img
                              src={resolveImage(p.main_image_url)}
                              alt=""
                              className="h-14 w-14 rounded-sm object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-display text-base font-medium">
                              {p.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {p.category?.name ?? "Rug"}
                            </div>
                          </div>
                          <span className="eyebrow shrink-0 text-muted-foreground">
                            View
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {answers.length > 0 && (
                <section>
                  <p className="eyebrow text-muted-foreground">Answers</p>
                  <ul className="mt-2 space-y-3">
                    {answers.map((a) => (
                      <li
                        key={a.q}
                        className="rounded-2xl border border-border p-4"
                      >
                        <div className="text-sm font-semibold">{a.q}</div>
                        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                          {a.a}
                        </p>
                        <Link
                          to="/faq"
                          onClick={onClose}
                          className="mt-2 inline-block text-xs font-semibold underline underline-offset-4"
                        >
                          Read in full
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {pageHits.length > 0 && (
                <section>
                  <p className="eyebrow text-muted-foreground">Pages</p>
                  <ul className="mt-2 divide-y divide-border">
                    {pageHits.map((page) => (
                      <li key={page.title}>
                        <Link
                          to={page.to}
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 transition-opacity hover:opacity-70"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">
                              {page.title}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {page.blurb}
                            </div>
                          </div>
                          <span className="eyebrow shrink-0 text-muted-foreground">
                            Open
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const pScroll = useScrollProgress(220);
  // Off the home page the wordmark stays small and centered in the nav, with
  // no huge-hero-to-nav shrink animation.
  const p = isHome ? pScroll : 1;
  const scrolled = p > 0.02;
  const promoH = usePromoHeight();

  // Lock body scroll when mobile menu is open on mobile screen
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  // Interpolated brand transforms, driven directly by scroll for a seamless
  // "card pushes the wordmark up into the nav" feel. No CSS transition on
  // these values so they track scroll 1:1.
  const size = 240 - (240 - 39) * p; // px, settles a touch larger in the nav
  // The resting position follows the promo bar: when it is dismissed the page
  // rises, so the wordmark rises with it instead of covering the hero card.
  const restTop = 62 + promoH;
  const top = restTop - (restTop - 14) * p; // px from viewport top

  const pillCls = `rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 ${
    scrolled ? "bg-background/60 backdrop-blur-md" : "bg-transparent"
  }`;

  return (
    <>
      <header className="sticky top-0 z-[60] bg-transparent">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center py-4">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={`md:hidden -ml-2 p-2 rounded-full transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden md:flex items-center gap-2">
              <div
                className="relative"
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <button className={`${pillCls} inline-flex items-center gap-1`}>
                  Shop <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {shopOpen && (
                  <div className="absolute left-0 top-full z-[65] pt-3">
                    <div className="min-w-[200px] rounded-lg border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md">
                      {SHOP_LINKS.map((l) => (
                        <Link
                          key={l.label}
                          to={l.to}
                          search={l.search as never}
                          className="block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/explore" className={pillCls}>
                Explore
              </Link>
              <Link to="/how-it-works" className={pillCls}>
                About
              </Link>
            </nav>
          </div>

          {/* Center: clicking brand navigates to home */}
          <div className="flex justify-center items-center">
            <Link
              to="/"
              aria-label="Mosiac home"
              className="h-8 w-32 md:w-44 flex items-center justify-center cursor-pointer pointer-events-auto select-none"
            >
              <span className="sr-only">Mosiac Home</span>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-2">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-full transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
            >
              <Search className="h-5 w-5" />
            </button>
            {/* Currency selector on desktop */}
            <div className="hidden md:block">
              <CurrencyDropdown variant="compact" />
            </div>
            {/* Wishlist lives inside the mobile menu; header keeps it on desktop only */}
            <div className="hidden md:block">
              <WishlistNavButton scrolled={scrolled} />
            </div>

            <CartNavButton scrolled={scrolled} />
          </div>
        </div>
      </header>

      {/* Animated brand - fixed, transitions from huge above hero to small nav-center */}
      <Link
        to="/"
        aria-label="Mosiac home"
        className={`fixed left-1/2 z-[75] -translate-x-1/2 font-script leading-none text-foreground pointer-events-auto cursor-pointer select-none transition-opacity duration-200 ${
          mobileOpen || searchOpen || promoOpen ? "opacity-0 pointer-events-none invisible" : ""
        }`}
        style={{
          top: `${top}px`,
          fontSize: `clamp(28px, ${size}px, 22vw)`,
          letterSpacing: "-0.04em",
          textShadow: p < 0.4 ? "0 2px 24px rgba(0,0,0,0.15)" : "none",
        }}
      >
        Mosiac
      </Link>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {/* Mobile menu */}
      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}

      <CartDrawer />
      <WishlistDrawer />

      {/* Pop up ad banner on top of EVERYTHING including Mosiac text */}
      <PromoBar onVisibleChange={setPromoOpen} />
    </>
  );
}

/** Studio photography used for the mobile menu cards. */
const MENU_PHOTO = {
  shopAll:
    "/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg",
  explore: "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
  about: "/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg",
};

const FEATURED_CHILDREN: Array<{
  label: string;
  to: string;
  search?: { category: string };
}> = [
  { label: "New Arrivals", to: "/catalogue" },
  { label: "Best Sellers", to: "/catalogue" },
  {
    label: "Heritage Collection",
    to: "/catalogue",
    search: { category: "heritage" },
  },
];

const MOBILE_CATEGORIES: Array<{
  label: string;
  to: string;
  search?: { category: string };
}> = [
  { label: "Wall Art", to: "/catalogue", search: { category: "wall-art" } },
  { label: "Area Rugs", to: "/catalogue", search: { category: "area-rugs" } },
  { label: "Collections", to: "/catalogue" },
  { label: "Lookbook", to: "/lookbook" },
];

/** Custom currency dropdown wrapper matching studio aesthetic. */
function CurrencyPicker({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <CurrencyDropdown
      variant={compact ? "compact" : "pill"}
      className={className}
    />
  );
}

function MenuCard({
  to,
  label,
  image,
  onClose,
  className = "",
}: {
  to: string;
  label: string;
  image: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className={`group relative block overflow-hidden rounded-xl bg-muted ${className}`}
    >
      <img
        src={resolveImage(image)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Slightly black overlay to emphasize visibility of text on the cards */}
      <span className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/40" />
      <span className="absolute inset-0 flex items-center justify-center p-2 text-center font-display text-sm sm:text-base font-bold text-white drop-shadow-md tracking-wider">
        {label}
      </span>
    </Link>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cart = useCart();
  const wishlist = useWishlist();
  const { cartCount, wishCount } = useHydratedCounts();

  return (
    <div className="fixed inset-0 z-[85] flex h-[100dvh] flex-col bg-background md:hidden select-none overflow-hidden overscroll-contain">
      {/* Top bar: comfortable spacing and proportions */}
      <div className="relative flex items-center justify-between px-5 py-3 shrink-0">
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-muted/40 text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Center brand: precisely centered across the screen */}
        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
          <Link
            to="/"
            onClick={onClose}
            className="pointer-events-auto font-script text-3xl sm:text-[34px] leading-none text-foreground select-none"
          >
            Mosiac<span className="text-accent">.</span>
          </Link>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted/50 text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Wishlist"
            onClick={() => {
              onClose();
              wishlist.setOpen(true);
            }}
            className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted/50 text-foreground transition-colors"
          >
            <Heart className="h-4 w-4" />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-[8px] font-semibold text-background">
                {wishCount}
              </span>
            )}
          </button>
          <button
            aria-label="Cart"
            onClick={() => {
              onClose();
              cart.setOpen(true);
            }}
            className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted/50 text-foreground transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-[8px] font-semibold text-background">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="border-t border-border/40" />

      {/* Pill row: well-proportioned spacing */}
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 px-5 py-2.5 bg-muted/15 border-b border-border/40 shrink-0">
        <Link
          to="/catalogue"
          onClick={onClose}
          className="flex h-9 items-center justify-between rounded-full border border-border/70 bg-background px-3.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <span>Shop All</span>
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <CurrencyPicker compact />
        <Link
          to="/contact"
          onClick={onClose}
          aria-label="Contact & Account"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted/50 transition-colors"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      {/* Nav body: increased spacing between elements while maintaining single-page fit */}
      <nav className="flex-1 flex flex-col justify-between overflow-y-auto overscroll-contain px-5 py-3 sm:py-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-1 pb-1">
            Collections
          </p>

          {/* Featured accordion - comfortable vertical rhythm */}
          <div>
            <button
              onClick={() => setFeaturedOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm sm:text-[15px] font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              <span>Featured</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${featuredOpen ? "rotate-180" : ""}`}
              />
            </button>
            {featuredOpen && (
              <ul className="pb-1 pl-4 pt-1 space-y-1">
                {FEATURED_CHILDREN.map((c) => (
                  <li key={c.label}>
                    <Link
                      to={c.to}
                      search={c.search as never}
                      onClick={onClose}
                      className="block py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Category options: increased line height and spacing */}
          <ul className="space-y-1">
            {MOBILE_CATEGORIES.map((c) => (
              <li key={c.label}>
                <Link
                  to={c.to}
                  search={c.search as never}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm sm:text-[15px] font-medium text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span>{c.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Asymmetrical 2-row grid structure with increased margin and white gutter */}
        <div className="pt-3 shrink-0">
          <div className="rounded-2xl bg-white p-1.5 shadow-xs">
            {/* Top Row: Shop all card banner */}
            <MenuCard
              to="/catalogue"
              label="Shop All"
              image={MENU_PHOTO.shopAll}
              onClose={onClose}
              className="h-32 sm:h-36 w-full rounded-xl"
            />
            {/* Bottom Row: Two equal-width portrait cards side by side, separated by thin white gutter */}
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <MenuCard
                to="/explore"
                label="Explore"
                image={MENU_PHOTO.explore}
                onClose={onClose}
                className="h-32 sm:h-36 w-full rounded-xl"
              />
              <MenuCard
                to="/how-it-works"
                label="About"
                image={MENU_PHOTO.about}
                onClose={onClose}
                className="h-32 sm:h-36 w-full rounded-xl"
              />
            </div>
          </div>

          {/* Bottom subtle secondary links with generous breathing room */}
          <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground px-1 shrink-0">
            <Link to="/story" onClick={onClose} className="hover:text-foreground">
              Story
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link to="/custom" onClick={onClose} className="hover:text-foreground">
              Bespoke
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link to="/contact" onClick={onClose} className="hover:text-foreground">
              Contact
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                import("@/lib/meta-client")
                  .then(({ trackMetaEvent }) => {
                    trackMetaEvent("Contact", {
                      contentName: "Mobile Nav WhatsApp",
                      method: "whatsapp_mobile_menu",
                    });
                  })
                  .catch(() => {});
              }}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <WhatsAppIcon className="h-3 w-3" />
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function FooterAccordion({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-border md:border-none ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left md:cursor-default md:py-0"
      >
        <span className="eyebrow text-foreground">{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform md:hidden ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`${open ? "block" : "hidden"} pb-4 md:block md:pb-0 md:pt-4`}
      >
        {children}
      </div>
    </div>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 sm:h-6 items-center justify-center rounded-[3px] border border-border bg-card px-1.5 sm:px-2 text-[8.5px] sm:text-[10px] font-semibold tracking-wide text-muted-foreground whitespace-nowrap text-center">
      {label}
    </span>
  );
}

export function LookbookPreFooter() {
  const routerState = useRouterState();
  const isLookbook = routerState.location.pathname === "/lookbook";

  const bgPhoto = useFeaturedImage("lookbook_prefooter_bg", lookbookYellowRug);

  // Gather database images for the automatic infinity carousel
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

  useEffect(() => {
    if (isLookbook) return;
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
  }, [isLookbook]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Automatic infinity carousel alternating every 2.5 seconds (desktop view)
  useEffect(() => {
    if (isLookbook || carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLookbook, carouselImages.length]);

  if (isLookbook) return null;

  return (
    <aside
      id="pre-footer-lookbook-banner"
      aria-label="Lookbook Inspiration"
      className="border-t border-border/80 bg-background pt-10 pb-4 sm:pt-14 sm:pb-6 select-none"
    >
      <div className="container-x mx-auto max-w-[1400px]">
        {/* Heritage-style visual editorial container */}
        <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-950 shadow-xl border border-border/60">
          {/* Background Photography - used as is with full color */}
          <div className="relative aspect-[4/5] min-h-[440px] w-full sm:min-h-0 sm:aspect-[21/10] md:aspect-[24/9]">
            <img
              src={bgPhoto}
              alt="Handcrafted yellow wool rug with inlaid color blocks"
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle soft gradient strictly on the left to keep text crisp, leaving center and right rug completely visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/30 sm:to-transparent" />

            {/* Left Content Column */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-6 sm:inset-y-0 sm:max-w-2xl sm:justify-center sm:p-10 md:p-14 text-white z-10">
              {/* Clean small lock / Monograph Archive Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300 backdrop-blur-md">
                  <Lock className="h-3 w-3 stroke-[2.5]" />
                  <span>Atelier Monograph · Volume I</span>
                </span>
                <span className="hidden sm:inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-mono text-white/80 backdrop-blur-md uppercase tracking-wider">
                  96 Plates · E-Book & PDF
                </span>
              </div>

              {/* Bold Editorial Headline */}
              <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.05] tracking-tight text-white">
                Get inspired by our <span className="italic font-serif font-light text-amber-200">Lookbook</span>.
              </h2>

              <p className="mt-2.5 sm:mt-4 text-xs sm:text-sm md:text-base text-white/85 leading-relaxed font-light max-w-xl">
                Immerse yourself in our annual monograph featuring bespoke Rwandan Highland wool rugs in architectural spaces. Experience sculptural contour carving, relief textures, and interior styling inspirations.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/lookbook"
                  id="pre-footer-explore-lookbook-btn"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 sm:px-7 py-3 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg"
                >
                  <span>Explore Lookbook</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  to="/lookbook"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <Download className="h-3.5 w-3.5 text-amber-300" />
                  <span>Download PDF (18.4 MB)</span>
                </Link>
              </div>
            </div>

            {/* Right Desktop Visual Accent: Floating Miniature Monograph Carousel (Desktop view only, clickable to lookbook) */}
            <div className="hidden lg:flex absolute right-10 xl:right-16 top-1/2 -translate-y-1/2 z-20 items-center">
              <Link
                to="/lookbook"
                aria-label="View Lookbook Monograph"
                className="group/card relative block w-64 rounded-2xl border border-white/30 bg-black/40 p-2.5 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:rotate-1 hover:border-amber-400/60 hover:shadow-amber-500/25 cursor-pointer"
              >
                {/* Book Spine depth indicator */}
                <div className="absolute -left-1.5 inset-y-3 w-1.5 rounded-l-md bg-amber-500/80 shadow-xs" />

                {/* Automatic Infinity Carousel alternating every 2.5 seconds with DB images */}
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

                  {/* Subtle hover overlay cue */}
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
      </div>
    </aside>
  );
}

/**
 * Disguised Studio / Inventory button.
 * Only activates when held continuously for 6 seconds straight / press and unhold.
 * A casual click does nothing, preventing accidental or unauthorized access.
 */
function DisguisedInvButton() {
  const navigate = useNavigate();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasTriggeredRef = useRef(false);

  const HOLD_DURATION_MS = 6000;

  const cleanup = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setHolding(false);
    setProgress(0);
  }, []);

  const triggerActivation = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setUnlocked(true);
    setProgress(100);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      navigate({ to: "/admin" });
    }, 250);
  }, [navigate]);

  const startHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // Only primary mouse/touch
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    hasTriggeredRef.current = false;
    setHolding(true);
    setUnlocked(false);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        triggerActivation();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const endHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const elapsed = Date.now() - startTimeRef.current;
    if (holding && elapsed >= HOLD_DURATION_MS) {
      triggerActivation();
    } else {
      cleanup();
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={cleanup}
      onPointerLeave={cleanup}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="relative ml-1 inline-flex items-center justify-center overflow-hidden rounded-full border border-border/40 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 transition-all select-none hover:border-border/80 hover:text-muted-foreground active:scale-95 touch-none cursor-default"
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {holding && (
        <span
          className="absolute inset-0 bg-foreground/10 transition-[width] duration-75 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center">
        {unlocked ? "✦" : "LLC"}
      </span>
    </button>
  );
}

export function Footer({ hidePreFooter = false }: { hidePreFooter?: boolean } = {}) {
  const routerState = useRouterState();
  const isLookbook = routerState.location.pathname === "/lookbook";
  const isHome = routerState.location.pathname === "/";

  return (
    <>
      {!isLookbook && !hidePreFooter && !isHome && <LookbookPreFooter />}
      <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr_1fr_2fr] md:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="font-script text-3xl">
              Mosiac
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              We dream up rugs that bring otherworldly comfort to the home.
              Hand-tufted in Kigali since 2021.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">© 2026 Mosiac</p>
          </div>

          {/* About & Support - side by side in a single row on mobile to reduce vertical space */}
          <div className="grid grid-cols-2 gap-4 border-b border-border pb-2 md:contents md:border-none md:pb-0">
            {/* About */}
            <FooterAccordion title="About" className="border-none">
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/craft"
                    className="transition-opacity hover:opacity-60"
                  >
                    Our Craft
                  </Link>
                </li>
                <li>
                  <Link
                    to="/story"
                    className="transition-opacity hover:opacity-60"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/lookbook"
                    className="transition-opacity hover:opacity-60"
                  >
                    Lookbook
                  </Link>
                </li>
                <li>
                  <a
                    href="https://instagram.com/rugmosiac"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-opacity hover:opacity-60"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <Link
                    to="/how-it-works"
                    className="transition-opacity hover:opacity-60"
                  >
                    Stockists
                  </Link>
                </li>
              </ul>
            </FooterAccordion>

            {/* Support */}
            <FooterAccordion title="Support" className="border-none">
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/contact"
                    className="transition-opacity hover:opacity-60"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/custom"
                    className="transition-opacity hover:opacity-60"
                  >
                    Custom
                  </Link>
                </li>
                <li>
                  <Link
                    to="/custom"
                    className="transition-opacity hover:opacity-60"
                  >
                    Samples
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="transition-opacity hover:opacity-60">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="transition-opacity hover:opacity-60">
                    Terms &amp; Policies
                  </Link>
                </li>
                <li>
                  <Link to="/terms" search={{ tab: "privacy" }} className="transition-opacity hover:opacity-60">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </FooterAccordion>
          </div>

          {/* Newsletter */}
          <div>
            <div className="eyebrow text-foreground">Get 10% off</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Join the list for early access to drops and a 10% welcome discount
              on your first order.
            </p>
            <NewsletterForm />

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="eyebrow text-muted-foreground">Currency</span>
                <CurrencyDropdown variant="footer" align="left" />
              </div>

              {/* Exact payment method circular badges in strictly one row/line */}
              <div className="pt-2">
                <span className="eyebrow text-muted-foreground block mb-1.5 text-[10px]">Accepted Payment Methods</span>
                <PaymentMethodsRow />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span>© 2026 Mosiac · Kigali, Rwanda · Made to order</span>
            <span>·</span>
            <Link to="/terms" className="underline hover:text-foreground transition-colors">
              Terms &amp; Policies
            </Link>
            <span>·</span>
            <Link to="/terms" search={{ tab: "privacy" }} className="underline hover:text-foreground transition-colors">
              Privacy
            </Link>
            <DisguisedInvButton />
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              import("@/lib/meta-client")
                .then(({ trackMetaEvent }) => {
                  trackMetaEvent("Contact", {
                    contentName: "Footer Atelier WhatsApp",
                    method: "whatsapp_footer",
                  });
                })
                .catch(() => {});
            }}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-60"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> +250 796 664 868
          </a>
        </div>
      </div>
    </footer>
    </>
  );
}

export function FloatingWhatsApp() {
  const handleClick = () => {
    import("@/lib/meta-client")
      .then(({ trackMetaEvent }) => {
        trackMetaEvent("Contact", {
          contentName: "Floating WhatsApp Consultation",
          method: "whatsapp_floating_button",
          channel: "whatsapp",
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        });
      })
      .catch(() => {});
  };

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Order on WhatsApp"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-2xl shadow-black/20 transition-transform hover:scale-110"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}

/** @deprecated Prefer useCurrency().format for live-currency prices. */
export function formatPrice({
  rwf,
  usd,
}: {
  rwf?: number | null;
  usd?: number | null;
}) {
  if (usd) return `$${Number(usd).toLocaleString()}`;
  if (rwf) return `${rwf.toLocaleString()} RWF`;
  return "Price on request";
}

function CurrencySelect({ className = "" }: { className?: string }) {
  return <CurrencyDropdown variant="footer" align="left" className={className} />;
}

const bundledAssets = import.meta.glob("/src/assets/*.{jpg,png,webp,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const assetJsonModules = import.meta.glob("/src/assets/*.asset.json", {
  eager: true,
  import: "default",
}) as Record<string, { url?: string }>;

const assetMap: Record<string, string> = {};
for (const [path, mod] of Object.entries(assetJsonModules)) {
  if (mod?.url) {
    const directUrl = mod.url.startsWith("http")
      ? mod.url
      : `https://rugmosiac.lovable.app${mod.url.startsWith("/") ? "" : "/"}${mod.url}`;
    const filename = path.replace("/src/assets/", "").replace(".asset.json", "");
    assetMap[filename] = directUrl;
    assetMap[`/src/assets/${filename}`] = directUrl;
    assetMap[`/assets/${filename}`] = directUrl;
    assetMap[`@/assets/${filename}`] = directUrl;
  }
}

export function resolveImage(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/__l5e/")) return `https://rugmosiac.lovable.app${url}`;
  if (url.startsWith("__l5e/")) return `https://rugmosiac.lovable.app/${url}`;
  if (assetMap[url]) return assetMap[url];
  if (bundledAssets[url]) return bundledAssets[url];
  const bare = url.split("/").pop() ?? "";
  if (assetMap[bare]) return assetMap[bare];
  return url;
}

// -------- Cart / Wishlist nav buttons --------

function CartNavButton({ scrolled }: { scrolled: boolean }) {
  const { setOpen } = useCart();
  const { cartCount } = useHydratedCounts();
  return (
    <button
      aria-label="Cart"
      onClick={() => setOpen(true)}
      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline">Cart ({cartCount})</span>
      {cartCount > 0 && (
        <span className="sm:hidden absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] font-semibold text-background">
          {cartCount}
        </span>
      )}
    </button>
  );
}

function WishlistNavButton({ scrolled }: { scrolled: boolean }) {
  const { setOpen } = useWishlist();
  const { wishCount } = useHydratedCounts();
  return (
    <button
      aria-label="Wishlist"
      onClick={() => setOpen(true)}
      className={`relative p-2 rounded-full transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
    >
      <Heart className="h-5 w-5" />
      {wishCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] font-semibold text-background">
          {wishCount}
        </span>
      )}
    </button>
  );
}

// -------- Cart drawer --------

function CartDrawer() {
  const { items, open, setOpen, remove, setQty } = useCart();
  const { format } = useCurrency();
  const subtotalUsd = items.reduce((s, i) => {
    const p = i.unitPriceUsd ?? (i.unitPriceRwf ? i.unitPriceRwf / 1380 : 0);
    return s + p * i.qty;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        hideDefaultClose
        className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border/40"
      >
        {/* Header matching design: 'Cart' on left, crisp '✕' on right */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground">
            Cart
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="p-1 text-foreground/80 hover:text-foreground transition-opacity"
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state exactly matching user attachment */
          <div className="flex flex-1 flex-col justify-between px-6 pb-8 pt-4">
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-base sm:text-[17px] text-[#5e584f]">
                Your cart is empty
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#8e8273] hover:bg-[#837666] text-base font-normal text-white transition-all shadow-sm active:scale-[0.99]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          /* Cart with items */
          <div className="flex flex-1 flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="divide-y divide-border/40">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-4 py-4">
                    {i.image && (
                      <img
                        src={resolveImage(i.image)}
                        alt={i.name}
                        className="h-20 w-20 rounded-xl object-cover bg-[#f4efe8] shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to="/catalogue/$slug"
                            params={{ slug: i.slug }}
                            onClick={() => setOpen(false)}
                            className="font-display text-base font-normal hover:opacity-75"
                          >
                            {i.name}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {i.sizeLabel && <>Size {i.sizeLabel}</>}
                            {i.sizeLabel && i.color ? " · " : ""}
                            {i.color}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(i.key)}
                          aria-label="Remove item"
                          className="text-muted-foreground hover:text-foreground p-1 -mr-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQty(i.key, i.qty - 1)}
                            aria-label="Decrease quantity"
                            className="grid h-7 w-7 place-items-center rounded-full border border-border/60 hover:bg-muted text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">{i.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(i.key, i.qty + 1)}
                            aria-label="Increase quantity"
                            className="grid h-7 w-7 place-items-center rounded-full border border-border/60 hover:bg-muted text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="font-sans text-sm font-medium">
                          {format({
                            rwf: (i.unitPriceRwf ?? 0) * i.qty,
                            usd: (i.unitPriceUsd ?? 0) * i.qty,
                          })}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border/40 p-6 pt-4 space-y-3 bg-background">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Subtotal</span>
                <div className="flex items-center gap-2">
                  <CurrencyDropdown variant="compact" placement="up" />
                  <span className="font-sans text-lg font-medium">
                    {format({ usd: subtotalUsd })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery calculated at checkout.
              </p>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#8e8273] hover:bg-[#837666] text-base font-normal text-white transition-all shadow-sm active:scale-[0.99]"
              >
                Proceed to checkout
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Continue shopping
              </button>

              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                  "Hi Mosiac, I'd like to place this order:\n" +
                    items
                      .map(
                        (i) =>
                          `• ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ""}${i.color ? ` / ${i.color}` : ""} × ${i.qty}`,
                      )
                      .join("\n"),
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  const subtotalRwf = items.reduce((acc, it) => acc + (it.unitPriceRwf ?? 0) * it.qty, 0);
                  import("@/lib/meta-client")
                    .then(({ trackMetaEvent }) => {
                      trackMetaEvent("Contact", {
                        contentName: "Cart Order via WhatsApp",
                        method: "whatsapp_cart_drawer",
                        value: subtotalRwf,
                        currency: "RWF",
                      });
                      trackMetaEvent("InitiateCheckout", {
                        contentName: "Cart Order via WhatsApp",
                        value: subtotalRwf,
                        currency: "RWF",
                        numItems: items.reduce((acc, it) => acc + it.qty, 0),
                        contentIds: items.map((i) => i.productId),
                      });
                      if (subtotalRwf >= 320000) {
                        trackMetaEvent("Lead", {
                          contentName: "Cart Order via WhatsApp Lead",
                          leadType: "whatsapp_order",
                          value: subtotalRwf,
                          currency: "RWF",
                        });
                      }
                    })
                    .catch(() => {});
                }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground pt-1"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" /> Or complete on WhatsApp
              </a>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// -------- Wishlist drawer --------

function WishlistDrawer() {
  const { items, open, setOpen, remove } = useWishlist();
  const cart = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Wishlist</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No rugs saved yet. Tap the heart on any rug to save it here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={i.productId} className="flex gap-3 py-4">
                  {i.image && (
                    <img
                      src={resolveImage(i.image)}
                      alt=""
                      className="h-20 w-20 rounded-md object-cover bg-muted"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/catalogue/$slug"
                      params={{ slug: i.slug }}
                      onClick={() => setOpen(false)}
                      className="font-display text-base font-medium hover:opacity-70"
                    >
                      {i.name}
                    </Link>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => {
                          cart.add({
                            productId: i.productId,
                            slug: i.slug,
                            name: i.name,
                            image: i.image,
                          });
                          setOpen(false);
                        }}
                        className="text-xs font-semibold uppercase tracking-wider underline underline-offset-4 hover:text-accent"
                      >
                        Add to cart
                      </button>
                      <button
                        onClick={() => remove(i.productId)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// -------- Newsletter form --------

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("loading");
        setErr("");
        try {
          const res = await subscribeNewsletter({ data: { email } });
          setCoupon({ code: res.code, discount: res.discount });
          setState("done");
        } catch (e: any) {
          setErr(e?.message ?? "Could not subscribe. Try again.");
          setState("error");
        }
      }}
      className="mt-4"
    >
      {state !== "done" ? (
        <>
          <div className="flex items-center border border-border bg-card focus-within:border-foreground transition-colors">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-full whitespace-nowrap bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
            >
              {state === "loading" ? "…" : "Join"}
            </button>
          </div>
          {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        </>
      ) : coupon ? (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="eyebrow text-accent">Welcome to Mosiac</div>
          <p className="mt-2 text-sm text-foreground">
            Here's <strong>{coupon.discount}% off</strong> your first rug. We've
            sent this to <strong>{email}</strong> too: use the code at
            checkout.
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(coupon.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-foreground bg-background px-4 py-2 font-mono text-sm font-semibold tracking-widest"
          >
            {coupon.code}
            {copied ? (
              <Check className="h-4 w-4 text-accent" />
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tap to copy
              </span>
            )}
          </button>
        </div>
      ) : null}
    </form>
  );
}
