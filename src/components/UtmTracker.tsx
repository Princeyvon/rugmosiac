import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { initUtmTracking, injectMetaPixel, injectGoogleTag, trackMetaEvent } from "@/lib/meta-client";
import { getMetaClientConfig } from "@/lib/meta-capi";
import { supabase } from "@/integrations/supabase/client";

export function UtmTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const loadConfigFn = useServerFn(getMetaClientConfig);
  const initializedRef = useRef(false);
  const lastTrackedUrlRef = useRef("");

  // 1. Initial Mount: Capture UTMs, gclid, fbclid & Load Pixel / Google Tags
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Capture URL UTMs, click IDs, referrer, and setup first-party cookies
    initUtmTracking();

    // Synchronously boot cached Pixel ID to prevent any race condition or dropped PageView
    try {
      const cachedId = localStorage.getItem("mosiac_meta_pixel_id");
      if (cachedId) {
        injectMetaPixel(cachedId);
      }
    } catch {}

    // Load server-configured marketing integrations
    loadConfigFn()
      .then((cfg) => {
        if (cfg?.enabled && cfg.pixelId) {
          injectMetaPixel(cfg.pixelId);
        }
        if (cfg?.googleEnabled && (cfg.googleAnalyticsId || cfg.googleAdsId)) {
          injectGoogleTag({
            gaId: cfg.googleAnalyticsId,
            adsId: cfg.googleAdsId,
            purchaseLabel: cfg.googleAdsPurchaseLabel,
            leadLabel: cfg.googleAdsLeadLabel,
          });
        }
      })
      .catch(() => {});
  }, [loadConfigFn]);

  // 2. Track PageView on route navigation across Meta and GA4
  useEffect(() => {
    const currentUrl = pathname + (search || "");
    if (lastTrackedUrlRef.current === currentUrl) return;
    lastTrackedUrlRef.current = currentUrl;

    // Record the visit for the Studio dashboard (skip the dashboard itself)
    if (!pathname.startsWith("/admin")) {
      let sid = "";
      try {
        sid = sessionStorage.getItem("mosiac_sid") || "";
        if (!sid) {
          sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem("mosiac_sid", sid);
        }
      } catch {}
      supabase
        .from("site_visits")
        .insert({ path: pathname, referrer: document.referrer || null, session_id: sid || null })
        .then(undefined, () => {});
    }

    // Fire omnichannel PageView (Browser Pixel, Server CAPI, Google Analytics 4)
    trackMetaEvent("PageView", {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : "",
    });
  }, [pathname, search]);

  return null;
}
