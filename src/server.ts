import "./lib/error-capture";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { initSupabaseKeepAliveScheduler } from "./lib/supabase-keepalive.server";

// Start Supabase Inactivity Prevention Heartbeat
initSupabaseKeepAliveScheduler();

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// In-memory cache for first-party proxied tracking script
let cachedScriptBuffer: Buffer | null = null;
let cachedScriptTime = 0;
const SCRIPT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to parse cookie header
function parseCookieHeader(header?: string | null): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} - try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(
    consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`),
  );
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // 1. Static asset serving for local rug media
      if (url.pathname.startsWith("/__l5e/")) {
        const localPath = path.resolve(process.cwd(), "public", url.pathname.replace(/^\//, ""));
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const ext = path.extname(localPath).toLowerCase();
          const mime =
            ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : ext === ".png"
              ? "image/png"
              : ext === ".webp"
              ? "image/webp"
              : "application/octet-stream";
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
        return Response.redirect(`https://rugmosiac.lovable.app${url.pathname}${url.search}`, 302);
      }

      // 2. FIRST-PARTY TRACKING REVERSE PROXY: /sys/res/m-engine.js
      // Serves the client-side Meta engine from our own domain with neutral naming
      // Bypasses list-based ad blockers (uBlock, Brave Shields) and CNAME cloaking penalties
      if (url.pathname === "/sys/res/m-engine.js" || url.pathname === "/assets/m-client.js") {
        const now = Date.now();
        if (!cachedScriptBuffer || now - cachedScriptTime > SCRIPT_CACHE_TTL_MS) {
          try {
            const upstream = await fetch("https://connect.facebook.net/en_US/fbevents.js", {
              headers: { "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (upstream.ok) {
              const text = await upstream.text();
              cachedScriptBuffer = Buffer.from(text, "utf8");
              cachedScriptTime = now;
            }
          } catch (fetchErr) {
            console.warn("[Proxy] Upstream script fetch fallback:", fetchErr);
          }
        }

        if (cachedScriptBuffer) {
          return new Response(new Uint8Array(cachedScriptBuffer), {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
              "X-Content-Type-Options": "nosniff",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        // Graceful empty stub if upstream is unreachable
        return new Response("/* first-party telemetry ready */", {
          status: 200,
          headers: { "Content-Type": "application/javascript; charset=utf-8" },
        });
      }

      // 3. FIRST-PARTY TELEMETRY INGESTION ENDPOINT: /sys/collector/event
      // Receives navigator.sendBeacon and keepalive fetch calls directly on first-party domain
      if (url.pathname === "/sys/collector/event" || url.pathname === "/api/beacon") {
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }

        if (request.method === "POST") {
          try {
            const rawBody = await request.text();
            let payload: any = null;
            try {
              payload = JSON.parse(rawBody);
            } catch {
              payload = {};
            }

            if (payload?.eventName) {
              const { processMetaConversionEvent } = await import("./lib/meta-capi");
              const clientIp =
                request.headers.get("cf-connecting-ip") ||
                request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                request.headers.get("x-real-ip") ||
                undefined;
              const clientUserAgent = request.headers.get("user-agent") || undefined;

              const reqCookies = parseCookieHeader(request.headers.get("cookie"));
              const fbp = payload.userData?.fbp || reqCookies._fbp;
              const fbc = payload.userData?.fbc || reqCookies._fbc;

              processMetaConversionEvent({
                eventName: payload.eventName,
                eventId: payload.eventId,
                eventSourceUrl: payload.eventSourceUrl || "https://mosiac.rw",
                actionSource: "website",
                userData: {
                  ...payload.userData,
                  clientIp,
                  clientUserAgent,
                  fbp,
                  fbc,
                },
                customData: payload.customData,
              }).catch((e) => console.warn("[Collector] Beacon dispatch notice:", e));
            }

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          } catch {
            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
      }

      // 4. Pass request to TanStack Start application
      const handler = await getServerEntry();
      const rawResponse = await handler.fetch(request, env, ctx);
      const response = await normalizeCatastrophicSsrResponse(rawResponse);

      // 5. SERVER-SIDE FIRST-PARTY COOKIE GENERATION & ITP DEFENSE
      // Cookies set via HTTP headers directly on the first-party domain bypass Safari ITP's
      // 24-hour and 7-day client-side script caps, persisting for the full 90 days.
      const secureHeaders = new Headers(response.headers);
      const incomingCookies = parseCookieHeader(request.headers.get("cookie"));
      const isHtmlRequest = (response.headers.get("content-type") || "").includes("text/html");

      if (isHtmlRequest && request.method === "GET") {
        const now = Date.now();
        const cookieMaxAge = 90 * 24 * 60 * 60; // 90 days in seconds

        // A. Generate or persist Meta _fbp cookie if missing
        if (!incomingCookies._fbp) {
          const rand = Math.floor(1000000000 + Math.random() * 9000000000);
          const fbpValue = `fb.1.${now}.${rand}`;
          secureHeaders.append(
            "Set-Cookie",
            `_fbp=${encodeURIComponent(fbpValue)}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
          );
        }

        // B. Generate Meta _fbc from fbclid query parameter if present
        const fbclid = url.searchParams.get("fbclid");
        if (fbclid) {
          const fbcValue = `fb.1.${now}.${fbclid}`;
          secureHeaders.append(
            "Set-Cookie",
            `_fbc=${encodeURIComponent(fbcValue)}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
          );
        }

        // C. Generate first-party persistent visitor ID if missing
        if (!incomingCookies.mosiac_vid) {
          const vid = crypto.randomUUID();
          secureHeaders.append(
            "Set-Cookie",
            `mosiac_vid=${encodeURIComponent(vid)}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
          );
        }

        // D. Server-side capture of UTM parameters and click IDs on first landing
        const utmSource = url.searchParams.get("utm_source");
        const utmMedium = url.searchParams.get("utm_medium");
        const utmCampaign = url.searchParams.get("utm_campaign");
        const gclid = url.searchParams.get("gclid");
        const ttclid = url.searchParams.get("ttclid");

        if (utmSource || fbclid || gclid || ttclid) {
          const touchPayload = {
            utm_source: utmSource || (fbclid ? "facebook" : gclid ? "google" : ttclid ? "tiktok" : undefined),
            utm_medium: utmMedium || undefined,
            utm_campaign: utmCampaign || undefined,
            utm_content: url.searchParams.get("utm_content") || undefined,
            utm_term: url.searchParams.get("utm_term") || undefined,
            fbclid: fbclid || undefined,
            gclid: gclid || undefined,
            ttclid: ttclid || undefined,
            campaign_id: url.searchParams.get("campaign_id") || undefined,
            adset_id: url.searchParams.get("adset_id") || undefined,
            ad_id: url.searchParams.get("ad_id") || undefined,
            placement: url.searchParams.get("placement") || undefined,
            site_source_name: url.searchParams.get("site_source_name") || undefined,
            referrer: request.headers.get("referer") || undefined,
            landing_page_url: url.pathname + url.search,
            timestamp: now,
          };

          const serializedTouch = encodeURIComponent(JSON.stringify(touchPayload));
          // Last-touch is always updated on each new campaign landing
          secureHeaders.append(
            "Set-Cookie",
            `mosiac_attr_last=${serializedTouch}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
          );

          // First-touch is set only once (never overwritten)
          if (!incomingCookies.mosiac_attr_first) {
            secureHeaders.append(
              "Set-Cookie",
              `mosiac_attr_first=${serializedTouch}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
            );
          }
        }
      }

      // 6. Apply defense-in-depth security headers across all responses
      if (!secureHeaders.has("X-Content-Type-Options")) {
        secureHeaders.set("X-Content-Type-Options", "nosniff");
      }
      if (!secureHeaders.has("Referrer-Policy")) {
        secureHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      }
      if (!secureHeaders.has("Permissions-Policy")) {
        secureHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: secureHeaders,
      });
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

