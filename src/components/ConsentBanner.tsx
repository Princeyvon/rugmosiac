import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getConsentPreferences,
  setConsentPreferences,
  type ConsentPreferences,
} from "@/lib/consent";
import { Shield, Check, X, SlidersHorizontal } from "lucide-react";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Check if consent has already been recorded
    const existing = getConsentPreferences();
    if (!existing) {
      // Show consent banner after a short natural delay
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setConsentPreferences({ marketing: true, analytics: true });
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    setConsentPreferences({ marketing: false, analytics: false });
    setVisible(false);
  };

  const handleSaveCustom = () => {
    setConsentPreferences({
      marketing: marketingEnabled,
      analytics: analyticsEnabled,
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and cookie choices"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[99990] max-w-lg animate-fade-in"
    >
      <div className="rounded-3xl border border-border/80 bg-background/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md text-foreground transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-accent">
            <Shield className="h-4 w-4" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground">
              Privacy &amp; Atelier Transparency
            </span>
          </div>
          <button
            type="button"
            onClick={handleEssentialOnly}
            aria-label="Close and keep essential cookies only"
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          We use first-party cookies and privacy-safe measurement to personalize your
          experience, preserve your shopping cart, and measure our handcrafted rug campaigns on Meta. We never sell your personal information.
        </p>

        {showDetails && (
          <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">Essential Studio Cookies</span>
                <p className="text-[11px] text-muted-foreground">Required for shopping cart, currency, and checkout security.</p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
                Always Active
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div>
                <span className="font-semibold text-foreground">Meta &amp; Marketing Attribution</span>
                <p className="text-[11px] text-muted-foreground">Enables 1:1 ad attribution and campaign conversion optimization.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground" />
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div>
                <span className="font-semibold text-foreground">Performance &amp; Diagnostics</span>
                <p className="text-[11px] text-muted-foreground">Anonymous site metrics to continually improve craftsmanship performance.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground" />
              </label>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>{showDetails ? "Hide Preferences" : "Customize"}</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Essential Only
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background shadow hover:opacity-90 transition-opacity cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] text-muted-foreground/60">
          Learn more in our{" "}
          <Link to="/terms" search={{ tab: "privacy" }} className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </aside>
  );
}
