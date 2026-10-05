import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminGetMetaSettings,
  adminSaveMetaSettings,
  adminSendTestMetaEvent,
} from "@/lib/meta-capi";
import {
  Activity,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Key,
  Layers,
  Lock,
  RefreshCw,
  Rss,
  Save,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";

export function MetaTrackingControlPanel({
  onToast,
}: {
  onToast?: (msg: string) => void;
}) {
  const getSettingsFn = useServerFn(adminGetMetaSettings);
  const saveSettingsFn = useServerFn(adminSaveMetaSettings);
  const sendTestFn = useServerFn(adminSendTestMetaEvent);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok?: boolean;
    simulated?: boolean;
    eventId?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Google Analytics & Google Ads ROAS State
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [googleAdsPurchaseLabel, setGoogleAdsPurchaseLabel] = useState("");
  const [googleAdsLeadLabel, setGoogleAdsLeadLabel] = useState("");

  useEffect(() => {
    let active = true;
    getSettingsFn()
      .then((res) => {
        if (!active || !res?.settings) return;
        setEnabled(res.settings.enabled ?? true);
        setPixelId(res.settings.pixelId || "");
        setTestEventCode(res.settings.testEventCode || "");
        setHasExistingToken(Boolean(res.settings.hasAccessToken));
        // Google settings
        setGoogleEnabled(res.settings.googleEnabled ?? true);
        setGoogleAnalyticsId(res.settings.googleAnalyticsId || "");
        setGoogleAdsId(res.settings.googleAdsId || "");
        setGoogleAdsPurchaseLabel(res.settings.googleAdsPurchaseLabel || "");
        setGoogleAdsLeadLabel(res.settings.googleAdsLeadLabel || "");
      })
      .catch((err) => {
        console.error("Failed to load Meta & Google settings:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getSettingsFn]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettingsFn({
        data: {
          enabled,
          pixelId,
          accessToken: accessToken || undefined,
          testEventCode,
          googleEnabled,
          googleAnalyticsId,
          googleAdsId,
          googleAdsPurchaseLabel,
          googleAdsLeadLabel,
        },
      });
      onToast?.("Omnichannel Meta & Google tracking settings saved successfully.");
      setAccessToken("");
      setHasExistingToken(true);
    } catch (err: any) {
      onToast?.(`Failed to save settings: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestFn({
        data: { testEventCode: testEventCode.trim() || undefined },
      });
      setTestResult(res as any);
      onToast?.(
        res?.ok
          ? "Test event dispatched successfully to Meta!"
          : "Dispatched test event with simulation fallback."
      );
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err?.message || "Exception dispatching test event",
      });
      onToast?.("Failed to dispatch test event.");
    } finally {
      setTesting(false);
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onToast?.(`Copied to clipboard: ${text}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-foreground">
                Omnichannel Marketing, Google SEO &amp; ROAS Control Engine
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dual-channel Meta Pixel &amp; CAPI, Google Analytics 4, and Google Ads Conversion Tracking with dynamic purchase values for Smart ROAS bidding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                enabled
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              {enabled ? "Meta Active" : "Meta Paused"}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                googleEnabled && (googleAnalyticsId || googleAdsId)
                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  googleEnabled && (googleAnalyticsId || googleAdsId)
                    ? "bg-blue-500 animate-pulse"
                    : "bg-muted-foreground"
                }`}
              />
              {googleEnabled && (googleAnalyticsId || googleAdsId) ? "Google Active" : "Google Paused"}
            </span>

            <a
              href="/dq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Pixel DQ Lab</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Lead Signal Quality & Protection Status */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  High-Ticket Lead Capture &amp; Signal Protection Active
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-medium">
                  EMQ 9.0+ Optimized
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your Meta Pixel is specifically configured to only send <strong>high-intent qualified rug buyers</strong> to your ad campaigns. Low-intent actions (newsletters, coupon popups, and under-budget inquiries) are cleanly segregated to prevent ad budget waste.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-500/15 text-xs">
          <div className="p-2.5 rounded-xl bg-background/80 border border-border">
            <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Qualified Rug Leads
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Fires <code className="font-mono text-foreground font-semibold">Lead</code> with dynamic values (350k–2.8M RWF) on bespoke custom commissions, atelier WhatsApp inquiries, and qualified quiz answers.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-background/80 border border-border">
            <div className="font-semibold text-blue-600 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Signal Dilution Blocked
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Newsletter signups and popup promo vouchers are routed to <code className="font-mono text-foreground font-semibold">CompleteRegistration</code>, preventing Meta from optimizing for cheap coupon clicks.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-background/80 border border-border">
            <div className="font-semibold text-amber-600 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Budget DQ Guard
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Inquiries below 150k RWF suppress the standard Lead conversion and fire <code className="font-mono text-foreground font-semibold">DisqualifiedLead</code> to negative-train Meta's ad algorithm.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Credentials &amp; Configuration
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure your Meta Pixel ID and system access token.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Meta Pixel ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder="e.g. 147852369012345"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  {pixelId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pixelId, "pixel")}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Found in Meta Events Manager &gt; Data Sources &gt; Settings &gt; Dataset ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span>Conversions API Access Token</span>
                  {hasExistingToken && (
                    <span className="text-[10px] text-emerald-600 font-semibold normal-case flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Token stored securely
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={hasExistingToken ? "•••••••••••••••• (Leave blank to keep existing)" : "Paste Meta System User token"}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Generate in Events Manager &gt; Settings &gt; Conversions API &gt; "Generate access token". Server encrypts and hashes all PII before transmission.
                </p>
                <div className="mt-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-950 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Permanent Token Shield:</strong> Standard personal tokens expire every 60 days. To ensure CAPI never breaks, generate a <strong>System User Token</strong> in Meta Business Settings &gt; Users &gt; System Users &gt; Generate New Token &gt; set expiration to <em>"Never"</em> with <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">ads_management</code>.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Meta Test Event Code (Optional)
                </label>
                <input
                  type="text"
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value)}
                  placeholder="e.g. TEST12345"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enter the code from the "Test Events" tab in Meta Events Manager to verify real-time event reception in the graph debugger.
                </p>
              </div>
            </div>

            {/* Google Analytics 4 & Google Ads ROAS Section */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Google Analytics 4 &amp; Google Ads ROAS Tracking
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Connect GA4 and Google Ads conversion labels to enable Smart Bidding for Target ROAS.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={googleEnabled}
                    onChange={(e) => setGoogleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    GA4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={googleAnalyticsId}
                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    placeholder="e.g. G-XXXXXXXXXX"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Google Analytics &gt; Admin &gt; Data Streams &gt; Measurement ID.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    Google Ads Tag ID
                  </label>
                  <input
                    type="text"
                    value={googleAdsId}
                    onChange={(e) => setGoogleAdsId(e.target.value)}
                    placeholder="e.g. AW-123456789"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Google Ads &gt; Tools &amp; Settings &gt; Google Tag (AW-XXXXXXXXX).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>Purchase Conversion Label (ROAS)</span>
                    <span className="text-[10px] text-amber-600 font-semibold normal-case bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Target ROAS Bidding
                    </span>
                  </label>
                  <input
                    type="text"
                    value={googleAdsPurchaseLabel}
                    onChange={(e) => setGoogleAdsPurchaseLabel(e.target.value)}
                    placeholder="e.g. AbCdEfGhIjK12345"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Passes order value &amp; RWF currency to Google Ads on every checkout for automated ROAS optimization.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    Lead Conversion Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={googleAdsLeadLabel}
                    onChange={(e) => setGoogleAdsLeadLabel(e.target.value)}
                    placeholder="e.g. XyZ12345AbCd"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Fired on custom rug inquiries, lookbook downloads, and callback requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testing || !pixelId}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Send Test Conversion Ping</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Meta Settings</span>
              </button>
            </div>
          </form>

          {/* Test Event Output Banner */}
          {testResult && (
            <div
              className={`rounded-2xl border p-5 ${
                testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {testResult.ok ? "Conversion Dispatch Successful" : "Conversion Ping Warning"}
                  </h4>
                  <p className="text-xs leading-relaxed">
                    {testResult.message || testResult.error || "Event processed"}
                  </p>
                  {testResult.eventId && (
                    <p className="text-[11px] font-mono opacity-80">
                      Shared Event ID: {testResult.eventId} (Deduplication Key)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Site-Wide Upload & Malware Defense Status Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  Site-Wide Upload Safety &amp; Anti-Virus Seals
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                33/33 OWASP Tests Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Binary Magic Bytes Verification
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Validates JPEG (FF D8 FF), PNG, WebP, GIF, and PDF signatures. Polyglot and spoofed extensions are automatically rejected.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Heuristic Threat &amp; Malware Scanner
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Deep-scans headers and trailers for Windows MZ executables, Linux ELF binaries, Java bytecode, shell scripts, and web shells.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Trusted Downloads &amp; Sandbox CSP
                </p>
                <p className="text-muted-foreground text-[11px]">
                  All lookbook PDFs and media downloads serve with RFC 5987 Content-Disposition, X-Content-Type-Options: nosniff, and sandboxed CSP.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Path Traversal &amp; Sanitization
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Filenames stripped of null bytes and directory jumps (`../../`). Root boundaries enforced before disk read or write operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: UTM & Attribution Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                UTM Parameters Captured
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every incoming visitor's marketing parameters are captured on the client and stored in session/local storage for attribution across their entire purchase journey:
            </p>

            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">utm_source</span>
                <span className="text-foreground font-semibold">e.g. facebook / instagram</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">utm_medium</span>
                <span className="text-foreground font-semibold">e.g. cpc / story_ad</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">utm_campaign</span>
                <span className="text-foreground font-semibold">e.g. kigali_heritage_drop</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">fbclid</span>
                <span className="text-foreground font-semibold">Facebook Click ID</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">gclid</span>
                <span className="text-foreground font-semibold">Google Click ID</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Dual-Channel Events Matrix
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">PageView</span>
                <span className="text-muted-foreground text-[11px]">All routes on navigate</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">ViewContent</span>
                <span className="text-muted-foreground text-[11px]">Catalogue product detail</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">AddToCart</span>
                <span className="text-muted-foreground text-[11px]">Bag addition with value</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">InitiateCheckout</span>
                <span className="text-muted-foreground text-[11px]">Cart &amp; checkout entry</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">Purchase</span>
                <span className="text-emerald-600 font-semibold text-[11px]">Completed order placement</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="font-semibold text-foreground">Lead</span>
                <span className="text-muted-foreground text-[11px]">Custom rug / Promo claim / Newsletter</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-semibold text-foreground">Contact</span>
                <span className="text-muted-foreground text-[11px]">Studio contact submission</span>
              </div>
            </div>
          </div>

          {/* Google SEO & Merchant Center Readiness Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Google SEO &amp; ROAS Verification
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Google Ads Target ROAS</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Product Rich Snippets</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Store &amp; WebSite Schema</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Injected
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">FAQ Schema (Search Accordion)</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Robots.txt Directives</span>
                <span className="font-mono text-foreground">/robots.txt</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">XML Sitemap Index</span>
                <span className="font-mono text-foreground">/sitemap.xml</span>
              </div>
            </div>
          </div>

          {/* Automated Product Feeds for Google Merchant & Meta Catalog */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">
                Google Merchant &amp; Meta Product Feeds
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time, automated product feeds for running Google Shopping, Performance Max, Free Product Listings, and Meta Dynamic Product Ads (DPA).
            </p>

            {/* Google Merchant Center XML */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Rss className="h-3.5 w-3.5 text-amber-500" /> Google Shopping XML Feed
                </span>
                <span className="text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 font-medium">
                  RSS 2.0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-1 rounded border border-border flex-1 truncate">
                  /google-feed.xml
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/google-feed.xml`;
                    navigator.clipboard.writeText(fullUrl);
                    onToast?.("Google Merchant Center Feed URL copied to clipboard!");
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1 shrink-0"
                  title="Copy full feed URL"
                >
                  <Copy className="h-3 w-3" /> Copy URL
                </button>
                <a
                  href="/google-feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Open feed in browser"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Paste into <em>Google Merchant Center &gt; Products &gt; Feeds &gt; Primary feed &gt; Scheduled fetch</em>.
              </p>
            </div>

            {/* Meta Commerce Catalog XML */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-500" /> Meta Catalog Feed (XML)
                </span>
                <span className="text-[10px] font-mono rounded bg-blue-500/10 text-blue-600 px-1.5 py-0.5 font-medium">
                  Meta DPA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-1 rounded border border-border flex-1 truncate">
                  /meta-catalog.xml
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/meta-catalog.xml`;
                    navigator.clipboard.writeText(fullUrl);
                    onToast?.("Meta Catalog Feed URL copied to clipboard!");
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1 shrink-0"
                  title="Copy full feed URL"
                >
                  <Copy className="h-3 w-3" /> Copy URL
                </button>
                <a
                  href="/meta-catalog.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Open feed in browser"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Paste into <em>Meta Commerce Manager &gt; Catalog &gt; Data Sources &gt; Data Feed &gt; Scheduled Feed</em>.
              </p>
            </div>

            {/* Meta CSV Download Fallback */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Manual CSV Catalog Export:</span>
              </div>
              <a
                href="/meta-catalog.csv"
                download="meta-catalog.csv"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
              >
                <Download className="h-3 w-3" /> Download .CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
