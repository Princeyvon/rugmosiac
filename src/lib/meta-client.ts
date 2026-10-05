/**
 * Omnichannel Marketing & Analytics Client for Rug Mosaic
 *
 * Implements:
 * 1. Dual-channel Meta Pixel & Conversions API (CAPI) with deduplicated event_id.
 * 2. Google Analytics 4 (GA4) ecommerce event stream (view_item, add_to_cart, begin_checkout, purchase, generate_lead).
 * 3. Google Ads Conversion Tracking with dynamic Purchase Value & Currency for automated ROAS optimization.
 * 4. Enhanced Conversions with normalized user data.
 * 5. Full attribution persistence across UTMs, gclid, fbclid, wbraid, gbraid, ttclid.
 */
import { sendMetaConversionServerFn, type UtmData } from "./meta-capi";
import { hasMarketingConsent } from "./consent";
import { getAttributionPayload, initAttribution } from "./attribution";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const UTM_STORAGE_KEY = "mosiac_utm_data";
const FBP_COOKIE = "_fbp";
const FBC_COOKIE = "_fbc";

interface GoogleConfig {
  gaId?: string;
  adsId?: string;
  purchaseLabel?: string;
  leadLabel?: string;
}

let activeGoogleConfig: GoogleConfig = {};

/**
 * Cookie Helper: Read Cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Cookie Helper: Write Cookie
 */
export function setCookie(name: string, value: string, days = 90): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Initializes Meta First-Party Cookies (_fbp, _fbc)
 */
export function initMetaCookies(fbclid?: string | null): { fbp: string; fbc?: string } {
  let fbp = getCookie(FBP_COOKIE);
  if (!fbp) {
    const randomInt = Math.floor(1000000000 + Math.random() * 9000000000);
    fbp = `fb.1.${Date.now()}.${randomInt}`;
    setCookie(FBP_COOKIE, fbp, 90);
  }

  let fbc = getCookie(FBC_COOKIE) || undefined;
  if (fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie(FBC_COOKIE, fbc, 90);
  }

  return { fbp, fbc };
}

/**
 * Extracts UTM and marketing attribution parameters from current URL and persists them
 */
export function initUtmTracking(): UtmData {
  if (typeof window === "undefined") return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    const gclid = urlParams.get("gclid");
    const wbraid = urlParams.get("wbraid");
    const gbraid = urlParams.get("gbraid");
    const ttclid = urlParams.get("ttclid");
    const utmSource = urlParams.get("utm_source");

    const { fbp, fbc } = initMetaCookies(fbclid);

    // If new marketing parameters are present, update storage
    if (utmSource || fbclid || gclid || wbraid || gbraid || ttclid) {
      const freshData: UtmData & { wbraid?: string; gbraid?: string; ttclid?: string } = {
        utm_source: utmSource || (fbclid ? "facebook" : gclid || wbraid || gbraid ? "google" : ttclid ? "tiktok" : undefined),
        utm_medium: urlParams.get("utm_medium") || undefined,
        utm_campaign: urlParams.get("utm_campaign") || undefined,
        utm_term: urlParams.get("utm_term") || undefined,
        utm_content: urlParams.get("utm_content") || undefined,
        fbclid: fbclid || undefined,
        gclid: gclid || undefined,
        referrer: document.referrer || undefined,
        landing_page: window.location.pathname + window.location.search,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(freshData));
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(freshData));
      } catch {}

      return freshData;
    }

    // Otherwise return stored data
    return getStoredUtmData();
  } catch {
    return {};
  }
}

/**
 * Retrieves persisted UTM data from localStorage / sessionStorage
 */
export function getStoredUtmData(): UtmData {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY) || localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {};
}

/**
 * Injects Meta Pixel script into document head safely and initializes with Automatic Advanced Matching
 */
export function injectMetaPixel(pixelId: string, userData?: Record<string, any>): void {
  if (typeof window === "undefined" || !pixelId) return;

  try {
    localStorage.setItem("mosiac_meta_pixel_id", pixelId);
  } catch {}

  const currentInit = (window as any).__INITIALIZED_PIXEL_ID__;

  // If fbq doesn't exist yet, define stub queue
  if (!window.fbq) {
    const n: any = (window.fbq = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "/sys/res/m-engine.js";
    script.onerror = () => {
      (window as any).__mosiac_pixel_blocked = true;
      const fallback = document.createElement("script");
      fallback.async = true;
      fallback.src = "https://connect.facebook.net/en_US/fbevents.js";
      fallback.onerror = () => {
        (window as any).__mosiac_pixel_blocked = true;
      };
      document.head.appendChild(fallback);
    };
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
  }

  // Initialize or re-initialize if Pixel ID has updated
  if (currentInit !== pixelId) {
    (window as any).__INITIALIZED_PIXEL_ID__ = pixelId;
    window.fbq("init", pixelId, userData || {}, { autoConfig: true });
  }
}

/**
 * Checks whether an ad blocker or browser tracking prevention has blocked client Pixel
 */
export function isAdBlockerActive(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).__mosiac_pixel_blocked ||
    (!window.fbq && typeof document !== "undefined")
  );
}

/**
 * Injects Google tag (gtag.js) for GA4 and Google Ads ROAS tracking
 */
export function injectGoogleTag(config: GoogleConfig): void {
  if (typeof window === "undefined") return;
  activeGoogleConfig = { ...activeGoogleConfig, ...config };

  const primaryId = config.gaId || config.adsId;
  if (!primaryId) return;

  // Initialize dataLayer and gtag if not present
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function (...args: any[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
  }

  // Prevent duplicate script injection
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
    document.head.appendChild(script);
  }

  // Configure Google Analytics 4 (SPA mode: manual page_view)
  if (config.gaId) {
    window.gtag("config", config.gaId, {
      send_page_view: false,
    });
  }

  // Configure Google Ads
  if (config.adsId) {
    window.gtag("config", config.adsId);
  }
}

export type StandardMetaEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "Contact"
  | "Search"
  | "CompleteRegistration"
  | "Subscribe"
  | "Schedule"
  | "CustomizeProduct"
  | "SubmitApplication";

export type MetaEventName = StandardMetaEventName | (string & {});

const STANDARD_META_EVENTS = new Set<string>([
  "PageView",
  "ViewContent",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "Contact",
  "Search",
  "CompleteRegistration",
  "Subscribe",
  "Schedule",
  "CustomizeProduct",
  "SubmitApplication",
]);

// Memory log of client-side dispatched events for diagnostic DQ inspection
export interface DiagnosticEventLog {
  id: string;
  eventName: string;
  isCustom: boolean;
  timestamp: number;
  eventId: string;
  customData?: Record<string, any>;
  hasUserData: boolean;
  fbp?: string;
  fbc?: string;
  status: "dispatched" | "simulated" | "failed";
}

const clientEventHistory: DiagnosticEventLog[] = [];

export function getClientEventHistory(): DiagnosticEventLog[] {
  return [...clientEventHistory];
}

/**
 * Omnichannel Conversion & Event Tracking:
 * Fires simultaneously across Meta Pixel, Meta CAPI, Google Analytics 4, and Google Ads ROAS.
 */
export async function trackMetaEvent(
  eventName: MetaEventName,
  customData?: Record<string, any>,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
  }
): Promise<string> {
  const eventId =
    (customData?.orderId ? `order_${customData.orderId}` : undefined) ||
    (customData?.eventId ? String(customData.eventId) : undefined) ||
    `mosiac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const attribution = getAttributionPayload();
  const fbp = attribution.fbp || getCookie(FBP_COOKIE) || undefined;
  const fbc = attribution.fbc || getCookie(FBC_COOKIE) || undefined;

  const mergedCustomData = {
    ...customData,
    utm_source: attribution.lastTouch?.utm_source,
    utm_medium: attribution.lastTouch?.utm_medium,
    utm_campaign: attribution.lastTouch?.utm_campaign,
    utm_content: attribution.lastTouch?.utm_content,
    utm_term: attribution.lastTouch?.utm_term,
    campaign_id: attribution.lastTouch?.campaign_id,
    adset_id: attribution.lastTouch?.adset_id,
    ad_id: attribution.lastTouch?.ad_id,
  };

  const isStandard = STANDARD_META_EVENTS.has(eventName);
  const marketingPermitted = hasMarketingConsent();

  // 1. Browser Meta Pixel Event (subject to privacy consent)
  if (typeof window !== "undefined" && window.fbq && marketingPermitted) {
    try {
      if (isStandard) {
        window.fbq("track", eventName, mergedCustomData, { eventID: eventId });
      } else {
        window.fbq("trackCustom", eventName, mergedCustomData, { eventID: eventId });
      }
    } catch (e) {
      console.warn("[Meta Pixel browser error]:", e);
    }
  }

  // Record into client diagnostic event history
  clientEventHistory.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    eventName,
    isCustom: !isStandard,
    timestamp: Date.now(),
    eventId,
    customData: mergedCustomData,
    hasUserData: Boolean(userData?.email || userData?.phone),
    fbp,
    fbc,
    status: "dispatched",
  });
  if (clientEventHistory.length > 30) clientEventHistory.pop();

  // 2. Google Analytics 4 & Google Ads Conversion Tracking (ROAS optimization)
  if (typeof window !== "undefined" && window.gtag) {
    try {
      switch (eventName) {
        case "PageView":
          window.gtag("event", "page_view", {
            page_path: customData?.path || window.location.pathname,
            page_title: customData?.title || document.title,
          });
          break;

        case "ViewContent":
          window.gtag("event", "view_item", {
            currency: customData?.currency || "RWF",
            value: customData?.value,
            items: [
              {
                item_id: customData?.contentIds?.[0] || customData?.productId,
                item_name: customData?.contentName,
                price: customData?.value,
              },
            ],
          });
          break;

        case "AddToCart":
          window.gtag("event", "add_to_cart", {
            currency: customData?.currency || "RWF",
            value: customData?.value,
            items: [
              {
                item_id: customData?.contentIds?.[0] || customData?.productId,
                item_name: customData?.contentName,
                price: customData?.value,
              },
            ],
          });
          break;

        case "AddToWishlist":
          window.gtag("event", "add_to_wishlist", {
            currency: customData?.currency || "RWF",
            value: customData?.value,
            items: [
              {
                item_id: customData?.contentIds?.[0] || customData?.productId,
                item_name: customData?.contentName,
              },
            ],
          });
          break;

        case "InitiateCheckout":
          window.gtag("event", "begin_checkout", {
            currency: customData?.currency || "RWF",
            value: customData?.value,
            num_items: customData?.numItems,
          });
          break;

        case "AddPaymentInfo":
          window.gtag("event", "add_payment_info", {
            currency: customData?.currency || "RWF",
            value: customData?.value,
            payment_type: customData?.paymentType || "momo",
          });
          break;

        case "CustomizeProduct":
          window.gtag("event", "customize_product", {
            item_id: customData?.productId,
            item_name: customData?.contentName,
          });
          break;

        case "Purchase": {
          // Google Enhanced Conversions User Data
          if (userData) {
            window.gtag("set", "user_data", {
              email: userData.email,
              phone_number: userData.phone,
              address: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                city: userData.city,
                country: userData.country || "rw",
              },
            });
          }

          // GA4 Purchase
          window.gtag("event", "purchase", {
            transaction_id: customData?.orderId || eventId,
            value: customData?.value,
            currency: customData?.currency || "RWF",
            items: (customData?.contentIds || []).map((id: string) => ({ item_id: id })),
          });

          // Google Ads Purchase Conversion for ROAS target bidding
          if (activeGoogleConfig.adsId && activeGoogleConfig.purchaseLabel) {
            window.gtag("event", "conversion", {
              send_to: `${activeGoogleConfig.adsId}/${activeGoogleConfig.purchaseLabel}`,
              value: customData?.value,
              currency: customData?.currency || "RWF",
              transaction_id: customData?.orderId || eventId,
            });
          }
          break;
        }

        case "Lead": {
          window.gtag("event", "generate_lead", {
            value: customData?.value,
            currency: customData?.currency || "RWF",
          });

          if (activeGoogleConfig.adsId && activeGoogleConfig.leadLabel) {
            window.gtag("event", "conversion", {
              send_to: `${activeGoogleConfig.adsId}/${activeGoogleConfig.leadLabel}`,
              value: customData?.value,
              currency: customData?.currency || "RWF",
            });
          }
          break;
        }

        case "Contact":
          window.gtag("event", "contact", { method: customData?.method || "form" });
          break;

        case "CompleteRegistration":
        case "Subscribe":
          window.gtag("event", "sign_up", { method: customData?.type || "newsletter" });
          break;

        case "Search":
          window.gtag("event", "search", { search_term: customData?.query });
          break;

        case "DisqualifiedLead":
          window.gtag("event", "disqualified_lead", {
            reason: customData?.reason,
            budget: customData?.budget_bracket,
          });
          break;
      }
    } catch (gErr) {
      console.warn("[Google Tracking error]:", gErr);
    }
  }

  // 3. Server-side Meta Conversions API (CAPI) - non-blocking background dispatch
  if (marketingPermitted || eventName === "Purchase") {
    (sendMetaConversionServerFn as any)({
      data: {
        eventName,
        eventId,
        actionSource: "website",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : "https://mosiac.rw",
        userData: {
          ...userData,
          fbp,
          fbc,
          clientUserAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
        customData: mergedCustomData,
      },
    }).catch((err: any) => {
      console.warn("[Meta CAPI async dispatch warning]:", err);
    });

    // 4. Out-of-process sendBeacon backup for unloads/redirects (guarantees delivery on navigation)
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        navigator.sendBeacon(
          "/sys/collector/event",
          JSON.stringify({
            eventName,
            eventId,
            eventSourceUrl: typeof window !== "undefined" ? window.location.href : "https://mosiac.rw",
            userData: { ...userData, fbp, fbc },
            customData: mergedCustomData,
          })
        );
      } catch {}
    }
  }

  return eventId;
}

// Seamless alias
export const trackMarketingEvent = trackMetaEvent;

/**
 * Specialized DQ (Data Qualification & Disqualification) event router:
 * - Qualified leads fire standard Meta Lead conversion event for ad delivery optimization
 * - Disqualified leads fire custom DisqualifiedLead event, suppressing standard Lead conversion
 *   to train Meta's machine learning algorithm NOT to target low-budget or non-viable clicks.
 */
export async function trackDqEvent(
  type: "qualified" | "disqualified",
  details: {
    budgetBracket: string;
    roomPlacement?: string;
    timeline?: string;
    estimatedValue?: number;
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      country?: string;
    };
  }
): Promise<string> {
  if (type === "qualified") {
    return await trackMetaEvent(
      "Lead",
      {
        content_name: "Qualified Atelier Bespoke Commission",
        content_category: "Qualified Custom Rug",
        value: details.estimatedValue || 480000,
        currency: "RWF",
        qualification_status: "qualified",
        budget_bracket: details.budgetBracket,
        room_placement: details.roomPlacement,
        timeline: details.timeline,
      },
      details.userData
    );
  } else {
    return await trackMetaEvent(
      "DisqualifiedLead",
      {
        content_name: "Disqualified Lead Inquiry",
        content_category: "Below Atelier Minimum Investment",
        qualification_status: "disqualified",
        reason: "budget_below_threshold",
        budget_bracket: details.budgetBracket,
        room_placement: details.roomPlacement,
        timeline: details.timeline,
      },
      details.userData
    );
  }
}

/**
 * Returns real-time diagnostic health data for the Meta Pixel & CAPI
 */
export function getMetaPixelDiagnosticInfo() {
  if (typeof window === "undefined") {
    return {
      isLoaded: false,
      fbp: null,
      fbc: null,
      pixelId: null,
      storedUtm: {},
    };
  }

  return {
    isLoaded: Boolean(window.fbq && window.fbq.loaded),
    fbp: getCookie(FBP_COOKIE),
    fbc: getCookie(FBC_COOKIE),
    storedUtm: getStoredUtmData(),
  };
}
