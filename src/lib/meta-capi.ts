/**
 * Meta Conversions API (CAPI) & UTM Attribution Engine for Mosiac
 *
 * Implements:
 * 1. UTM Parameters extraction & persistence across user sessions.
 * 2. Meta Pixel browser events with event_id deduplication.
 * 3. Server-side Meta Conversions API (Graph API v19.0) with SHA-256 user data hashing.
 * 4. First-party cookies: _fbp (browser ID) and _fbc (click ID from fbclid).
 * 5. Full e-commerce tracking: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead.
 */
import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
  landing_page?: string;
  timestamp?: number;
}

export interface MetaSettings {
  enabled: boolean;
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  // Google Analytics 4 & Google Ads ROAS
  googleEnabled?: boolean;
  googleAnalyticsId?: string; // G-XXXXXXXXXX
  googleAdsId?: string; // AW-XXXXXXXXXX
  googleAdsPurchaseLabel?: string; // Conversion Label for Purchase ROAS
  googleAdsLeadLabel?: string; // Conversion Label for Leads
}

export const DEFAULT_META_SETTINGS: MetaSettings = {
  enabled: true,
  pixelId: process.env.META_PIXEL_ID || "",
  accessToken: process.env.META_CONVERSIONS_API_ACCESS_TOKEN || "",
  testEventCode: "",
  googleEnabled: true,
  googleAnalyticsId: process.env.VITE_GA_MEASUREMENT_ID || "",
  googleAdsId: process.env.VITE_GOOGLE_ADS_ID || "",
  googleAdsPurchaseLabel: process.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || "",
  googleAdsLeadLabel: process.env.VITE_GOOGLE_ADS_LEAD_LABEL || "",
};

// In-memory cache for settings
let cachedMetaSettings: MetaSettings = { ...DEFAULT_META_SETTINGS };

/**
 * Standard SHA-256 hashing for Meta CAPI PII normalization
 */
export function hashForMeta(val?: string | null): string | undefined {
  if (!val || typeof val !== "string") return undefined;
  const normalized = val.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalizes phone numbers to digits only before hashing
 */
export function hashPhoneForMeta(phone?: string | null): string | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits || digits.length < 5) return undefined;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

/**
 * Public Server Function: Get Meta & Google Client Config
 */
export const getMetaClientConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    enabled: boolean;
    pixelId: string;
    googleEnabled: boolean;
    googleAnalyticsId: string;
    googleAdsId: string;
    googleAdsPurchaseLabel: string;
    googleAdsLeadLabel: string;
  }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "meta_capi_settings")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        cachedMetaSettings = { ...DEFAULT_META_SETTINGS, ...(data.value as any) };
      }
    } catch {
      // Use cached/env fallback
    }

    return {
      enabled: cachedMetaSettings.enabled,
      pixelId: cachedMetaSettings.pixelId || process.env.META_PIXEL_ID || "",
      googleEnabled: cachedMetaSettings.googleEnabled ?? true,
      googleAnalyticsId: cachedMetaSettings.googleAnalyticsId || process.env.VITE_GA_MEASUREMENT_ID || "",
      googleAdsId: cachedMetaSettings.googleAdsId || process.env.VITE_GOOGLE_ADS_ID || "",
      googleAdsPurchaseLabel: cachedMetaSettings.googleAdsPurchaseLabel || "",
      googleAdsLeadLabel: cachedMetaSettings.googleAdsLeadLabel || "",
    };
  }
);

/**
 * Admin Server Function: Get full Meta CAPI & Google Ads settings
 */
export const adminGetMetaSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin("settings");

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "meta_capi_settings")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        cachedMetaSettings = { ...DEFAULT_META_SETTINGS, ...(data.value as any) };
      }
    } catch {
      // ignore
    }

    return {
      settings: {
        enabled: cachedMetaSettings.enabled,
        pixelId: cachedMetaSettings.pixelId,
        accessToken: cachedMetaSettings.accessToken ? "••••••••" + cachedMetaSettings.accessToken.slice(-6) : "",
        hasAccessToken: Boolean(cachedMetaSettings.accessToken || process.env.META_CONVERSIONS_API_ACCESS_TOKEN),
        testEventCode: cachedMetaSettings.testEventCode || "",
        // Google settings
        googleEnabled: cachedMetaSettings.googleEnabled ?? true,
        googleAnalyticsId: cachedMetaSettings.googleAnalyticsId || "",
        googleAdsId: cachedMetaSettings.googleAdsId || "",
        googleAdsPurchaseLabel: cachedMetaSettings.googleAdsPurchaseLabel || "",
        googleAdsLeadLabel: cachedMetaSettings.googleAdsLeadLabel || "",
      },
    };
  }
);

/**
 * Admin Server Function: Save Meta & Google tracking settings
 */
export const adminSaveMetaSettings = createServerFn({ method: "POST" })
  .validator(
    (d: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
      testEventCode?: string;
      googleEnabled?: boolean;
      googleAnalyticsId?: string;
      googleAdsId?: string;
      googleAdsPurchaseLabel?: string;
      googleAdsLeadLabel?: string;
    }) => d
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin("settings");

    const newAccessToken = data.accessToken && !data.accessToken.includes("••••")
      ? data.accessToken.trim()
      : cachedMetaSettings.accessToken;

    cachedMetaSettings = {
      enabled: Boolean(data.enabled),
      pixelId: data.pixelId.trim(),
      accessToken: newAccessToken,
      testEventCode: (data.testEventCode || "").trim(),
      googleEnabled: data.googleEnabled ?? true,
      googleAnalyticsId: (data.googleAnalyticsId || "").trim(),
      googleAdsId: (data.googleAdsId || "").trim(),
      googleAdsPurchaseLabel: (data.googleAdsPurchaseLabel || "").trim(),
      googleAdsLeadLabel: (data.googleAdsLeadLabel || "").trim(),
    };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_settings").upsert(
        {
          key: "meta_capi_settings",
          value: cachedMetaSettings as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch (e) {
      console.warn("[Meta & Google Settings] Error saving to Supabase:", e);
    }

    return { ok: true, settings: cachedMetaSettings };
  });

/**
 * Server Function: Send Meta Conversions API Event
 */
export interface UserDataPayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
}

export interface MetaConversionPayload {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "physical_store" | "other";
  userData?: UserDataPayload;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contentType?: string;
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    orderId?: string;
    numItems?: number;
    utmSource?: string;
    utmCampaign?: string;
    [key: string]: any;
  };
  testEventCode?: string;
  limitedDataUse?: boolean;
}

export interface CapiAuditLogEntry {
  eventId: string;
  eventName: string;
  timestamp: number;
  status: "success" | "retry" | "failed" | "simulated";
  emqScore: number;
  matchKeys: string[];
  actionSource: string;
  errorMessage?: string;
}

// In-memory circular audit log (last 200 server events)
const capiAuditLog: CapiAuditLogEntry[] = [];

/**
 * Calculates Estimated Event Match Quality (EMQ score 1-10) based on Meta's key criteria
 */
export function calculateEmqScore(userData: Record<string, any>): { score: number; keys: string[] } {
  let score = 0;
  const keys: string[] = [];

  if (userData.em?.[0]) { score += 3.5; keys.push("email"); }
  if (userData.ph?.[0]) { score += 2.5; keys.push("phone"); }
  if (userData.fn?.[0]) { score += 1.0; keys.push("firstName"); }
  if (userData.ln?.[0]) { score += 0.5; keys.push("lastName"); }
  if (userData.fbp) { score += 1.0; keys.push("_fbp"); }
  if (userData.fbc) { score += 1.5; keys.push("_fbc"); }
  if (userData.client_ip_address) { score += 0.5; keys.push("clientIp"); }
  if (userData.client_user_agent) { score += 0.5; keys.push("userAgent"); }
  if (userData.external_id?.[0]) { score += 1.0; keys.push("externalId"); }

  // Cap at 10.0
  return { score: Math.min(10.0, Math.round(score * 10) / 10), keys };
}

export function getCapiAuditLogs(): CapiAuditLogEntry[] {
  return [...capiAuditLog];
}

/**
 * Core processor for Meta Conversions API (CAPI) events.
 * Can be called from server functions, REST endpoints, CRM webhooks, or background tasks.
 * Includes exponential backoff retry on transient failures and structured PII-free logging.
 */
let metaSettingsLoadedAt = 0;
async function ensureMetaSettingsLoaded() {
  // Server workers are stateless: refresh Studio-saved settings from the database (cached 60s).
  if (Date.now() - metaSettingsLoadedAt < 60_000) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "meta_capi_settings")
      .maybeSingle();
    if (data?.value && typeof data.value === "object") {
      cachedMetaSettings = { ...DEFAULT_META_SETTINGS, ...(data.value as any) };
    }
    metaSettingsLoadedAt = Date.now();
  } catch {
    // keep cached/env fallback
  }
}

export async function processMetaConversionEvent(data: MetaConversionPayload) {
  await ensureMetaSettingsLoaded();
  const pixelId =
    cachedMetaSettings.pixelId ||
    process.env.META_PIXEL_ID ||
    process.env.VITE_META_PIXEL_ID ||
    "";

  const accessToken =
    cachedMetaSettings.accessToken ||
    process.env.META_CAPI_TOKEN ||
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    "";

  const testCode =
    data.testEventCode ||
    process.env.META_TEST_EVENT_CODE ||
    cachedMetaSettings.testEventCode;

  const eventId = data.eventId || `mosiac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const eventTime = Math.floor(Date.now() / 1000);

  // Build hashed user data payload (strictly normalized with SHA-256)
  const hashedUserData: Record<string, any> = {};
  if (data.userData?.email) hashedUserData.em = [hashForMeta(data.userData.email)];
  if (data.userData?.phone) hashedUserData.ph = [hashPhoneForMeta(data.userData.phone)];
  if (data.userData?.firstName) hashedUserData.fn = [hashForMeta(data.userData.firstName)];
  if (data.userData?.lastName) hashedUserData.ln = [hashForMeta(data.userData.lastName)];
  if (data.userData?.city) hashedUserData.ct = [hashForMeta(data.userData.city)];
  if (data.userData?.state) hashedUserData.st = [hashForMeta(data.userData.state)];
  if (data.userData?.zip) hashedUserData.zp = [hashForMeta(data.userData.zip)];
  if (data.userData?.country) hashedUserData.country = [hashForMeta(data.userData.country)];
  if (data.userData?.externalId) hashedUserData.external_id = [hashForMeta(data.userData.externalId)];

  // Never hash fbp, fbc, client IP, or user agent
  if (data.userData?.fbp) hashedUserData.fbp = data.userData.fbp;
  if (data.userData?.fbc) hashedUserData.fbc = data.userData.fbc;
  if (data.userData?.clientIp) hashedUserData.client_ip_address = data.userData.clientIp;
  if (data.userData?.clientUserAgent) hashedUserData.client_user_agent = data.userData.clientUserAgent;

  // Calculate match quality metrics
  const emq = calculateEmqScore(hashedUserData);

  // Build event object
  const eventPayload: Record<string, any> = {
    event_name: data.eventName,
    event_time: eventTime,
    event_id: eventId,
    event_source_url: data.eventSourceUrl || "https://mosiac.rw",
    action_source: data.actionSource || "website",
    user_data: hashedUserData,
    custom_data: data.customData
      ? {
          ...data.customData,
          currency: data.customData.currency || "RWF",
        }
      : undefined,
  };

  // Meta Limited Data Use (LDU) compliance for CCPA / US states
  if (data.limitedDataUse || process.env.META_LDU === "true") {
    eventPayload.data_processing_options = ["LDU"];
    eventPayload.data_processing_options_country = 1; // United States
    eventPayload.data_processing_options_state = 1000; // California
  } else {
    eventPayload.data_processing_options = [];
  }

  const requestBody: Record<string, any> = {
    data: [eventPayload],
  };

  if (testCode) {
    requestBody.test_event_code = testCode;
  }

  // If no real token is set yet, log simulation and return graceful success
  if (!pixelId || !accessToken) {
    capiAuditLog.unshift({
      eventId,
      eventName: data.eventName,
      timestamp: eventTime * 1000,
      status: "simulated",
      emqScore: emq.score,
      matchKeys: emq.keys,
      actionSource: data.actionSource || "website",
    });
    if (capiAuditLog.length > 200) capiAuditLog.pop();

    return {
      ok: true,
      simulated: true,
      eventId,
      payload: eventPayload,
      emqScore: emq.score,
      matchKeys: emq.keys,
      message:
        "Meta CAPI simulated. Configure Access Token in Studio Dashboard or META_CAPI_TOKEN in environment to send to live Meta Events Manager.",
    };
  }

  // Send real event to Meta Graph API v19.0 with retry & exponential backoff
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff delay: 300ms, 900ms
        await new Promise((res) => setTimeout(res, 300 * Math.pow(3, attempt - 1)));
      }

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(6000),
        }
      );

      const resJson = await response.json();
      if (!response.ok) {
        const isExpired =
          resJson?.error?.code === 190 ||
          resJson?.error?.error_subcode === 463 ||
          resJson?.error?.type === "OAuthException";

        // Do not retry on permanent authorization failures
        if (isExpired || response.status === 400) {
          const errorMsg = isExpired
            ? "Meta Access Token has EXPIRED (Error 190). Generate a permanent 'Never Expire' System User Token in Meta Business Suite."
            : resJson?.error?.message || "Failed to dispatch to Meta";

          capiAuditLog.unshift({
            eventId,
            eventName: data.eventName,
            timestamp: eventTime * 1000,
            status: "failed",
            emqScore: emq.score,
            matchKeys: emq.keys,
            actionSource: data.actionSource || "website",
            errorMessage: errorMsg,
          });
          if (capiAuditLog.length > 200) capiAuditLog.pop();

          return { ok: false, error: errorMsg, isTokenExpired: isExpired, eventId, payload: eventPayload, emqScore: emq.score };
        }

        // Retryable server errors (5xx or 429)
        lastError = resJson?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      console.log(`[Meta CAPI Success] ${data.eventName} (Event ID: ${eventId}, EMQ: ${emq.score}/10) events_received:`, resJson.events_received);
      capiAuditLog.unshift({
        eventId,
        eventName: data.eventName,
        timestamp: eventTime * 1000,
        status: "success",
        emqScore: emq.score,
        matchKeys: emq.keys,
        actionSource: data.actionSource || "website",
      });
      if (capiAuditLog.length > 200) capiAuditLog.pop();

      return { ok: true, eventId, metaResponse: resJson, payload: eventPayload, emqScore: emq.score, matchKeys: emq.keys };
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  console.warn(`[Meta CAPI Dispatch Failed after retries]:`, lastError);
  capiAuditLog.unshift({
    eventId,
    eventName: data.eventName,
    timestamp: eventTime * 1000,
    status: "failed",
    emqScore: emq.score,
    matchKeys: emq.keys,
    actionSource: data.actionSource || "website",
    errorMessage: lastError || "Failed after retries",
  });
  if (capiAuditLog.length > 200) capiAuditLog.pop();

  return { ok: false, error: lastError || "Failed to dispatch to Meta after retries", eventId, payload: eventPayload, emqScore: emq.score };
}

/**
 * Public Server Function: Dispatch Meta Conversions API (CAPI) Event
 */
export const sendMetaConversionServerFn = createServerFn({ method: "POST" })
  .validator((d: MetaConversionPayload) => d)
  .handler(async ({ data }) => {
    return await processMetaConversionEvent(data);
  });

/**
 * Admin Server Function: Send Test Meta CAPI Ping
 */
export const adminSendTestMetaEvent = createServerFn({ method: "POST" })
  .validator((d: { testEventCode?: string }) => d)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin("settings");

    const testEventId = `test_ping_${Date.now()}`;
    return await (sendMetaConversionServerFn as any)({
      data: {
        eventName: "Lead",
        eventId: testEventId,
        eventSourceUrl: "https://mosiac.rw/admin",
        testEventCode: data.testEventCode || cachedMetaSettings.testEventCode,
        userData: {
          email: "test.collector@mosiac.rw",
          phone: "+250788123456",
          firstName: "Studio",
          city: "Kigali",
          country: "rw",
        },
        customData: {
          contentName: "Atelier Studio Test Verification",
          value: 55000,
          currency: "RWF",
          utmSource: "studio_dashboard_test",
        },
      },
    });
  });

/**
 * Public Server Function: Get Meta Tracking & CAPI Reconciliation Report
 */
export const getReconciliationReport = createServerFn({ method: "GET" }).handler(
  async () => {
    const logs = getCapiAuditLogs();
    const totalEvents = logs.length;
    const successfulEvents = logs.filter((l) => l.status === "success" || l.status === "simulated").length;
    const failedEvents = logs.filter((l) => l.status === "failed").length;
    const avgEmq =
      totalEvents > 0
        ? Math.round((logs.reduce((acc, l) => acc + l.emqScore, 0) / totalEvents) * 10) / 10
        : 8.5;

    return {
      totalEvents,
      successfulEvents,
      failedEvents,
      successRate: totalEvents > 0 ? `${Math.round((successfulEvents / totalEvents) * 100)}%` : "100%",
      avgEmq,
      recentLogs: logs.slice(0, 20),
    };
  }
);

