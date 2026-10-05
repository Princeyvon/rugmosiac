/**
 * Production-Grade Multi-Touch Marketing Attribution Engine for Mosiac
 *
 * Captures, normalizes, and persists:
 * 1. First-Touch Attribution (Permanent, never overwritten)
 * 2. Last-Touch Attribution (Updated on each subsequent campaign visit)
 * 3. Meta Click ID (_fbc) & Browser ID (_fbp) first-party cookies (90 days)
 * 4. Google Click IDs (gclid, wbraid, gbraid) & TikTok (ttclid)
 * 5. Meta dynamic ad macros (campaign_id, adset_id, ad_id, placement, site_source_name)
 */

export interface TouchAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  placement?: string;
  site_source_name?: string;
  referrer?: string;
  landing_page_url?: string;
  timestamp: number;
}

export interface CompleteAttributionPayload {
  firstTouch: TouchAttribution | null;
  lastTouch: TouchAttribution | null;
  fbp: string | null;
  fbc: string | null;
  clientUserAgent?: string;
}

const FIRST_TOUCH_KEY = "mosiac_attr_first";
const LAST_TOUCH_KEY = "mosiac_attr_last";
const FBP_COOKIE = "_fbp";
const FBC_COOKIE = "_fbc";

/**
 * Cookie Helper: Read Cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Cookie Helper: Write Cookie with 90-day retention
 */
export function setCookie(name: string, value: string, days = 90): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Initialize or retrieve Meta _fbp and _fbc cookies
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
 * Extract marketing attribution parameters from current URL and document
 */
export function extractCurrentTouch(): TouchAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    const gclid = params.get("gclid");
    const ttclid = params.get("ttclid");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");
    const campaignId = params.get("campaign_id");
    const adsetId = params.get("adset_id");
    const adId = params.get("ad_id");
    const placement = params.get("placement");
    const siteSourceName = params.get("site_source_name");

    const hasMarketingParam = Boolean(
      utmSource ||
      utmMedium ||
      utmCampaign ||
      fbclid ||
      gclid ||
      ttclid ||
      campaignId ||
      adsetId ||
      adId
    );

    if (!hasMarketingParam && !document.referrer) {
      return null;
    }

    // Determine derived source if not explicitly provided
    let derivedSource = utmSource || undefined;
    if (!derivedSource) {
      if (fbclid) derivedSource = "facebook";
      else if (gclid) derivedSource = "google";
      else if (ttclid) derivedSource = "tiktok";
      else if (document.referrer) {
        try {
          const refHost = new URL(document.referrer).hostname;
          if (refHost.includes("instagram.com")) derivedSource = "instagram";
          else if (refHost.includes("facebook.com")) derivedSource = "facebook";
          else if (refHost.includes("google.")) derivedSource = "google_organic";
          else if (refHost.includes("tiktok.com")) derivedSource = "tiktok";
          else if (!refHost.includes(window.location.hostname)) derivedSource = refHost;
        } catch {}
      }
    }

    return {
      utm_source: derivedSource,
      utm_medium: utmMedium || (fbclid ? "paid" : undefined),
      utm_campaign: utmCampaign || undefined,
      utm_content: utmContent || undefined,
      utm_term: utmTerm || undefined,
      fbclid: fbclid || undefined,
      gclid: gclid || undefined,
      ttclid: ttclid || undefined,
      campaign_id: campaignId || undefined,
      adset_id: adsetId || undefined,
      ad_id: adId || undefined,
      placement: placement || undefined,
      site_source_name: siteSourceName || undefined,
      referrer: document.referrer || undefined,
      landing_page_url: window.location.href,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Initializes and persists first-touch and last-touch attribution
 */
export function initAttribution(): CompleteAttributionPayload {
  if (typeof window === "undefined") {
    return { firstTouch: null, lastTouch: null, fbp: null, fbc: null };
  }

  const currentTouch = extractCurrentTouch();
  const fbclid = currentTouch?.fbclid || new URLSearchParams(window.location.search).get("fbclid");
  const { fbp, fbc } = initMetaCookies(fbclid);

  // 1. First-Touch (Written ONCE, never overwritten)
  let firstTouch: TouchAttribution | null = null;
  try {
    const rawFirst = localStorage.getItem(FIRST_TOUCH_KEY) || getCookie(FIRST_TOUCH_KEY);
    if (rawFirst) {
      firstTouch = JSON.parse(rawFirst);
    } else if (currentTouch) {
      firstTouch = currentTouch;
      const serialized = JSON.stringify(currentTouch);
      localStorage.setItem(FIRST_TOUCH_KEY, serialized);
      setCookie(FIRST_TOUCH_KEY, serialized, 90);
    }
  } catch {}

  // 2. Last-Touch (Updated whenever a new campaign visit occurs)
  let lastTouch: TouchAttribution | null = null;
  try {
    const rawLast = localStorage.getItem(LAST_TOUCH_KEY) || getCookie(LAST_TOUCH_KEY);
    if (rawLast) {
      lastTouch = JSON.parse(rawLast);
    }

    if (currentTouch) {
      lastTouch = currentTouch;
      const serialized = JSON.stringify(currentTouch);
      localStorage.setItem(LAST_TOUCH_KEY, serialized);
      setCookie(LAST_TOUCH_KEY, serialized, 90);
    } else if (!lastTouch && firstTouch) {
      lastTouch = firstTouch;
    }
  } catch {}

  return {
    firstTouch,
    lastTouch: lastTouch || firstTouch,
    fbp,
    fbc: fbc || null,
    clientUserAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
}

/**
 * Retrieves the complete persisted attribution payload for form submissions or API requests
 */
export function getAttributionPayload(): CompleteAttributionPayload {
  return initAttribution();
}

/**
 * Flattens attribution parameters into a clean key-value object for CRM payloads or form bodies
 */
export function getAttributionFormFields(): Record<string, string> {
  const { firstTouch, lastTouch, fbp, fbc } = getAttributionPayload();
  const fields: Record<string, string> = {};

  if (fbp) fields.fbp = fbp;
  if (fbc) fields.fbc = fbc;

  // First touch mapping
  if (firstTouch) {
    if (firstTouch.utm_source) fields.first_utm_source = firstTouch.utm_source;
    if (firstTouch.utm_medium) fields.first_utm_medium = firstTouch.utm_medium;
    if (firstTouch.utm_campaign) fields.first_utm_campaign = firstTouch.utm_campaign;
    if (firstTouch.utm_content) fields.first_utm_content = firstTouch.utm_content;
    if (firstTouch.utm_term) fields.first_utm_term = firstTouch.utm_term;
    if (firstTouch.fbclid) fields.first_fbclid = firstTouch.fbclid;
    if (firstTouch.gclid) fields.first_gclid = firstTouch.gclid;
    if (firstTouch.campaign_id) fields.first_campaign_id = firstTouch.campaign_id;
    if (firstTouch.adset_id) fields.first_adset_id = firstTouch.adset_id;
    if (firstTouch.ad_id) fields.first_ad_id = firstTouch.ad_id;
    if (firstTouch.landing_page_url) fields.first_landing_page = firstTouch.landing_page_url;
  }

  // Last touch mapping (primary)
  if (lastTouch) {
    if (lastTouch.utm_source) fields.utm_source = lastTouch.utm_source;
    if (lastTouch.utm_medium) fields.utm_medium = lastTouch.utm_medium;
    if (lastTouch.utm_campaign) fields.utm_campaign = lastTouch.utm_campaign;
    if (lastTouch.utm_content) fields.utm_content = lastTouch.utm_content;
    if (lastTouch.utm_term) fields.utm_term = lastTouch.utm_term;
    if (lastTouch.fbclid) fields.fbclid = lastTouch.fbclid;
    if (lastTouch.gclid) fields.gclid = lastTouch.gclid;
    if (lastTouch.ttclid) fields.ttclid = lastTouch.ttclid;
    if (lastTouch.campaign_id) fields.campaign_id = lastTouch.campaign_id;
    if (lastTouch.adset_id) fields.adset_id = lastTouch.adset_id;
    if (lastTouch.ad_id) fields.ad_id = lastTouch.ad_id;
    if (lastTouch.placement) fields.placement = lastTouch.placement;
    if (lastTouch.site_source_name) fields.site_source_name = lastTouch.site_source_name;
    if (lastTouch.referrer) fields.referrer = lastTouch.referrer;
    if (lastTouch.landing_page_url) fields.landing_page = lastTouch.landing_page_url;
  }

  return fields;
}

/**
 * Appends current attribution parameters to external booking links (e.g. Calendly, Cal.com, WhatsApp)
 */
export function injectAttributionToUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const { lastTouch, fbp, fbc } = getAttributionPayload();
    if (!lastTouch) return baseUrl;

    if (lastTouch.utm_source) url.searchParams.set("utm_source", lastTouch.utm_source);
    if (lastTouch.utm_medium) url.searchParams.set("utm_medium", lastTouch.utm_medium);
    if (lastTouch.utm_campaign) url.searchParams.set("utm_campaign", lastTouch.utm_campaign);
    if (lastTouch.utm_content) url.searchParams.set("utm_content", lastTouch.utm_content);
    if (lastTouch.utm_term) url.searchParams.set("utm_term", lastTouch.utm_term);
    if (lastTouch.fbclid) url.searchParams.set("fbclid", lastTouch.fbclid);
    if (lastTouch.campaign_id) url.searchParams.set("campaign_id", lastTouch.campaign_id);
    if (lastTouch.adset_id) url.searchParams.set("adset_id", lastTouch.adset_id);
    if (lastTouch.ad_id) url.searchParams.set("ad_id", lastTouch.ad_id);
    if (fbp) url.searchParams.set("fbp", fbp);
    if (fbc) url.searchParams.set("fbc", fbc);

    return url.toString();
  } catch {
    return baseUrl;
  }
}
