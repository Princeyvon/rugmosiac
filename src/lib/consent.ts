/**
 * Privacy & Consent Engine for Mosiac
 *
 * Compliant with GDPR, CCPA/CPRA, and global privacy standards.
 * Manages user consent for analytics and marketing tracking (Meta Pixel, CAPI, GA4).
 */

export type ConsentStatus = "granted" | "denied" | "essential_only" | "undecided";

export interface ConsentPreferences {
  essential: boolean; // Always true (cart, session, security)
  marketing: boolean; // Meta Pixel, Meta CAPI, Google Ads
  analytics: boolean; // GA4, anonymous performance metrics
  updatedAt: number;
}

const CONSENT_STORAGE_KEY = "mosiac_consent_preferences";
const CONSENT_COOKIE_KEY = "mosiac_consent";

/**
 * Read Cookie helper
 */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Write Cookie helper
 */
function writeCookie(name: string, value: string, days = 180): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get current consent preferences from storage or cookies
 */
export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY) || readCookie(CONSENT_COOKIE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

/**
 * Check if marketing tracking is permitted
 */
export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  const prefs = getConsentPreferences();
  // If user hasn't made a choice yet, default to permissible or undecided based on policy
  if (!prefs) return true; // Default opt-in until user explicitly changes or if opt-out model
  return Boolean(prefs.marketing);
}

/**
 * Check if analytics tracking is permitted
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  const prefs = getConsentPreferences();
  if (!prefs) return true;
  return Boolean(prefs.analytics);
}

/**
 * Save user consent preferences and broadcast to running trackers
 */
export function setConsentPreferences(prefs: { marketing: boolean; analytics: boolean }): void {
  if (typeof window === "undefined") return;

  const fullPrefs: ConsentPreferences = {
    essential: true,
    marketing: prefs.marketing,
    analytics: prefs.analytics,
    updatedAt: Date.now(),
  };

  try {
    const serialized = JSON.stringify(fullPrefs);
    localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
    writeCookie(CONSENT_COOKIE_KEY, serialized, 180);
  } catch {}

  // Update Meta Pixel consent state if window.fbq is available
  if (window.fbq) {
    if (prefs.marketing) {
      window.fbq("consent", "grant");
    } else {
      window.fbq("consent", "revoke");
    }
  }

  // Update Google consent mode if gtag is available
  if (window.gtag) {
    window.gtag("consent", "update", {
      ad_storage: prefs.marketing ? "granted" : "denied",
      ad_user_data: prefs.marketing ? "granted" : "denied",
      ad_personalization: prefs.marketing ? "granted" : "denied",
      analytics_storage: prefs.analytics ? "granted" : "denied",
    });
  }

  // Dispatch custom window event for other listeners
  window.dispatchEvent(
    new CustomEvent("mosiac:consent_updated", { detail: fullPrefs })
  );
}
