import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Filter,
  Heart,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Target,
  UserCheck,
  UserX,
  Zap,
  Loader2,
} from "lucide-react";
import { Nav, Footer, WHATSAPP_URL } from "@/components/site-chrome";
import {
  staffMe,
  staffLoginPin,
  adminLogin,
} from "@/lib/admin.functions";
import {
  getMetaClientConfig,
  sendMetaConversionServerFn,
} from "@/lib/meta-capi";
import {
  trackMetaEvent,
  trackDqEvent,
  getMetaPixelDiagnosticInfo,
  getClientEventHistory,
  type DiagnosticEventLog,
} from "@/lib/meta-client";

export const Route = createFileRoute("/dq")({
  head: () => ({
    meta: [
      { title: "Staff Diagnostics & Meta Pixel DQ | Mosiac Atelier" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Internal lead qualification engine and real-time Meta Pixel Data Quality (DQ) test bench for Mosiac Studio staff.",
      },
      { property: "og:title", content: "Staff Diagnostics & Meta Pixel DQ | Mosiac Atelier" },
      { property: "og:robots", content: "noindex, nofollow" },
      { property: "og:description", content: "Mosiac studio lead qualification diagnostics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DqPage,
});

export default function DqPage() {
  const [activeTab, setActiveTab] = React.useState<"funnel" | "diagnostics">("funnel");
  const loadConfigFn = useServerFn(getMetaClientConfig);
  const sendCapiFn = useServerFn(sendMetaConversionServerFn);
  const checkStaffFn = useServerFn(staffMe);
  const loginPinFn = useServerFn(staffLoginPin);
  const loginPwFn = useServerFn(adminLogin);

  // Staff Authorization State (Gated from public view)
  const [authStatus, setAuthStatus] = React.useState<"checking" | "authorized" | "unauthorized">("checking");
  const [authPin, setAuthPin] = React.useState("");
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"pin" | "password">("pin");

  React.useEffect(() => {
    checkStaffFn()
      .then((res) => {
        if (res?.signedIn) {
          setAuthStatus("authorized");
        } else {
          const token = typeof window !== "undefined" ? localStorage.getItem("mosiac_admin_token") : null;
          if (token) {
            checkStaffFn()
              .then((r2) => setAuthStatus(r2?.signedIn ? "authorized" : "unauthorized"))
              .catch(() => setAuthStatus("unauthorized"));
          } else {
            setAuthStatus("unauthorized");
          }
        }
      })
      .catch(() => setAuthStatus("unauthorized"));
  }, [checkStaffFn]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (authMode === "pin") {
        const res = (await loginPinFn({ data: { pin: authPin } })) as any;
        if (res?.ok) {
          if (res.token && typeof window !== "undefined") {
            try {
              localStorage.setItem("mosiac_admin_token", res.token);
            } catch {}
          }
          setAuthStatus("authorized");
        } else {
          setAuthError(res?.message || "Invalid studio PIN.");
        }
      } else {
        const res = (await loginPwFn({ data: { password: authPin } })) as any;
        if (res?.ok) {
          if (res.token && typeof window !== "undefined") {
            try {
              localStorage.setItem("mosiac_admin_token", res.token);
            } catch {}
          }
          setAuthStatus("authorized");
        } else {
          setAuthError("Incorrect dashboard password.");
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  // Meta Pixel Configuration
  const [pixelConfig, setPixelConfig] = React.useState<{
    enabled: boolean;
    pixelId: string;
    googleAnalyticsId: string;
    googleAdsId: string;
  } | null>(null);

  // Diagnostics State
  const [testEventCode, setTestEventCode] = React.useState("");
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>(null);
  const [eventHistory, setEventHistory] = React.useState<DiagnosticEventLog[]>([]);
  const [testingEvent, setTestingEvent] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // Interactive Qualification Funnel State
  const [funnelStep, setFunnelStep] = React.useState<number>(1);
  const [roomType, setRoomType] = React.useState<string>("living");
  const [sizeTier, setSizeTier] = React.useState<string>("medium");
  const [budgetTier, setBudgetTier] = React.useState<string>("");
  const [timeline, setTimeline] = React.useState<string>("this_month");
  const [clientName, setClientName] = React.useState<string>("");
  const [clientPhone, setClientPhone] = React.useState<string>("");
  const [clientEmail, setClientEmail] = React.useState<string>("");
  const [submittingFunnel, setSubmittingFunnel] = React.useState<boolean>(false);
  const [qualificationResult, setQualificationResult] = React.useState<"qualified" | "disqualified" | null>(null);
  const [lastDispatchedEventId, setLastDispatchedEventId] = React.useState<string | null>(null);

  // Load client pixel config and diagnostics
  React.useEffect(() => {
    loadConfigFn()
      .then((cfg) => {
        if (cfg) setPixelConfig(cfg as any);
      })
      .catch(() => {});

    refreshDiagnostics();
    const interval = setInterval(refreshDiagnostics, 2500);
    return () => clearInterval(interval);
  }, [loadConfigFn]);

  const refreshDiagnostics = () => {
    setDiagnosticInfo(getMetaPixelDiagnosticInfo());
    setEventHistory(getClientEventHistory());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`Copied ${key} to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Submit the Qualification Funnel
  const handleFunnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetTier) {
      showToast("Please choose your estimated budget bracket.");
      return;
    }

    setSubmittingFunnel(true);
    const isUnderThreshold = budgetTier === "under_150k";

    try {
      if (isUnderThreshold) {
        // ----------------- PATH B: DISQUALIFIED (DQ) -----------------
        // Explicitly suppress the 'Lead' conversion so Meta DOES NOT optimize for low-budget clicks!
        // Instead fire custom 'DisqualifiedLead' for negative training.
        const eventId = await trackDqEvent("disqualified", {
          budgetBracket: "< 150,000 RWF (Below Minimum)",
          roomPlacement: roomType,
          timeline,
          userData: {
            email: clientEmail || undefined,
            phone: clientPhone || undefined,
            firstName: clientName || undefined,
            city: "Kigali",
            country: "rw",
          },
        });
        setLastDispatchedEventId(eventId);
        setQualificationResult("disqualified");
        showToast("Lead evaluated: Budget below custom tufting threshold (DQ event fired).");
      } else {
        // ----------------- PATH A: QUALIFIED (High Intent) -----------------
        // Fire high-value 'Lead' conversion event with full estimated value and hashed user data.
        let estValue = 480000;
        if (budgetTier === "320k_480k") estValue = 420000;
        if (budgetTier === "500k_850k") estValue = 680000;
        if (budgetTier === "900k_plus") estValue = 1200000;

        const eventId = await trackDqEvent("qualified", {
          budgetBracket: budgetTier,
          roomPlacement: roomType,
          timeline,
          estimatedValue: estValue,
          userData: {
            email: clientEmail || undefined,
            phone: clientPhone || undefined,
            firstName: clientName || undefined,
            city: "Kigali",
            country: "rw",
          },
        });
        setLastDispatchedEventId(eventId);
        setQualificationResult("qualified");
        showToast("Lead evaluated: High-intent qualified commission (Lead event fired).");
      }
    } catch (err: any) {
      console.error("[DQ Funnel Error]:", err);
      showToast("Error recording response: " + err.message);
    } finally {
      setSubmittingFunnel(false);
      refreshDiagnostics();
    }
  };

  // Reset Funnel
  const handleResetFunnel = () => {
    setFunnelStep(1);
    setBudgetTier("");
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setQualificationResult(null);
    setLastDispatchedEventId(null);
  };

  // Diagnostic Test Event Runner
  const handleFireTestEvent = async (
    eventName: string,
    customData: Record<string, any>,
    userData?: Record<string, any>
  ) => {
    setTestingEvent(eventName);
    try {
      const eventId = await trackMetaEvent(
        eventName as any,
        {
          ...customData,
          test_event_code: testEventCode || undefined,
        },
        userData as any
      );

      // Also trigger server-side CAPI test ping if test code is provided
      if (testEventCode) {
        await sendCapiFn({
          data: {
            eventName,
            eventId,
            eventSourceUrl: typeof window !== "undefined" ? window.location.href : "https://mosiac.rw/dq",
            testEventCode,
            userData: {
              email: userData?.email || "meta.tester@mosiac.rw",
              phone: userData?.phone || "+250788123456",
              firstName: userData?.firstName || "DQ Tester",
              city: "Kigali",
              country: "rw",
            },
            customData,
          },
        });
      }

      showToast(`Fired ${eventName} successfully! Event ID: ${eventId.slice(0, 14)}...`);
    } catch (err: any) {
      console.error(`Failed to fire ${eventName}:`, err);
      showToast(`Error firing ${eventName}: ${err.message}`);
    } finally {
      setTestingEvent(null);
      refreshDiagnostics();
    }
  };

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-background text-muted-foreground grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Nav />
        <main className="container-x mx-auto max-w-[540px] py-16 sm:py-24">
          <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-sm text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground mb-6">
              <Lock className="h-6 w-6 stroke-[1.75]" />
            </div>
            <span className="eyebrow text-muted-foreground font-mono">Restricted Access · Studio Staff Only</span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-medium tracking-tight">
              Internal Diagnostics &amp; Meta DQ Lab
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              This lead qualification engine and Meta Pixel test bench is restricted to studio team members and administrators. Enter your 6-digit staff PIN or dashboard password to access the diagnostics bench.
            </p>

            <form onSubmit={handleUnlock} className="mt-8 text-left space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {authMode === "pin" ? "Staff 6-Digit PIN" : "Admin Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode((m) => (m === "pin" ? "password" : "pin"));
                      setAuthError(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    {authMode === "pin" ? "Use password instead" : "Use PIN instead"}
                  </button>
                </div>
                <input
                  type="password"
                  maxLength={authMode === "pin" ? 6 : undefined}
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  placeholder={authMode === "pin" ? "••••••" : "Studio password"}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center tracking-widest text-lg font-mono outline-none focus:border-foreground transition-all"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-xs text-destructive text-center font-medium">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authBusy || !authPin.trim()}
                className="w-full rounded-full bg-foreground px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {authBusy ? "Verifying…" : "Unlock Diagnostics Lab"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground underline">
                ← Return to Storefront
              </Link>
              <span className="text-border">·</span>
              <Link to="/admin" className="hover:text-foreground underline">
                Open Studio Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 px-4 py-3 rounded-lg shadow-xl border border-stone-800 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="bg-stone-950 text-stone-100 pt-28 pb-14 px-4 sm:px-6 border-b border-stone-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider mb-4">
                <Target className="w-3.5 h-3.5" />
                Meta Ads Optimization & Pixel Trainer
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white">
                Meta Pixel <span className="italic font-normal text-amber-300">DQ</span> Training Lab
              </h1>
              <p className="mt-3 text-stone-400 max-w-2xl text-base leading-relaxed">
                Train your Meta Pixel and Conversions API algorithm to hunt for high-ticket rug commissions while disqualifying low-value clicks, protecting your ad budget and maximizing ROAS.
              </p>
            </div>

            {/* Status Pill */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${diagnosticInfo?.isLoaded ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="text-stone-300">Pixel ID:</span>
                <span className="text-amber-400">{pixelConfig?.pixelId || "Active"}</span>
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                EMQ Dual-Channel: Browser Pixel + Graph API v19.0
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-10 flex gap-2 border-b border-stone-800/80">
            <button
              onClick={() => setActiveTab("funnel")}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "funnel"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>1. Client Qualification Funnel (DQ Router)</span>
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "diagnostics"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>2. Meta Pixel & CAPI Diagnostics Test Bench</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* ========================================================================= */}
        {/* TAB 1: INTERACTIVE QUALIFICATION FUNNEL & DQ ROUTING                      */}
        {/* ========================================================================= */}
        {activeTab === "funnel" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Explainer Banner */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 text-sm text-stone-800 flex items-start gap-4">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-lg shrink-0 mt-0.5">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-stone-950 flex items-center gap-2">
                  How This DQ (Disqualification) Page Trains Your Meta Pixel
                </h3>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  When you run Meta Ads, sending everyone to a generic form tells Meta that <span className="font-semibold italic">any lead is good</span>. 
                  Low-budget shoppers will trigger conversion events, teaching Meta's AI to spend your ad budget on cheap, non-converting clicks. 
                  This page tests the <span className="font-semibold">Bespoke Rug Qualification Engine</span>: leads with realistic budgets fire the high-value <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-xs">Lead</code> conversion, while budget-mismatched inquiries fire a <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-900 font-mono text-xs">DisqualifiedLead</code> event, suppressing the conversion signal and training Meta's lookalikes strictly on high-intent patrons.
                </p>
              </div>
            </div>

            {/* Funnel Card */}
            {!qualificationResult ? (
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
                  <div>
                    <h2 className="text-lg font-serif tracking-tight">Atelier Bespoke Commission Quiz</h2>
                    <p className="text-xs text-stone-400">Step {funnelStep} of 4 — Evaluate design requirements & investment</p>
                  </div>
                  <div className="text-xs font-mono bg-stone-800 px-2.5 py-1 rounded text-amber-300">
                    Kigali Tufting Atelier
                  </div>
                </div>

                <form onSubmit={handleFunnelSubmit} className="p-6 sm:p-8 space-y-8">
                  {/* Step 1: Space & Purpose */}
                  {funnelStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Step 1</span>
                        <h3 className="text-xl font-serif text-stone-900 mt-1">Where will this custom hand-tufted rug live?</h3>
                        <p className="text-xs text-stone-500 mt-1">Our artisans adjust pile density and wool grade depending on foot traffic.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: "living", title: "Living Room Centerpiece", desc: "High visual impact, dense resilient pile for entertaining" },
                          { id: "bedroom", title: "Bedroom Sanctuary", desc: "Ultra-soft underfoot comfort, medium-high New Zealand wool" },
                          { id: "dining", title: "Dining Room or Office", desc: "Low-profile carving for effortless chair movement" },
                          { id: "tapestry", title: "Wall Tapestry / Textile Art", desc: "Sculptural wall hanging with gallery mounting sleeve" },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              roomType === item.id
                                ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-stone-900 text-sm">{item.title}</span>
                              <input
                                type="radio"
                                name="roomType"
                                value={item.id}
                                checked={roomType === item.id}
                                onChange={() => setRoomType(item.id)}
                                className="mt-1 text-stone-900 focus:ring-stone-900"
                              />
                            </div>
                            <span className="text-xs text-stone-500 mt-2">{item.desc}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setFunnelStep(2)}
                          className="px-6 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm font-medium inline-flex items-center gap-2"
                        >
                          Next: Rug Sizing <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Sizing Tier */}
                  {funnelStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Step 2</span>
                        <h3 className="text-xl font-serif text-stone-900 mt-1">What dimensions are you envisioning?</h3>
                        <p className="text-xs text-stone-500 mt-1">All rugs are hand-tufted stitch by stitch on custom wood frames.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "small", label: "Small / Accent", dims: "120 × 180 cm", note: "Reading nook, entryway, bedside" },
                          { id: "medium", label: "Medium / Standard", dims: "150 × 220 cm", note: "Standard seating area, office space" },
                          { id: "large", label: "Large / Masterpiece", dims: "200 × 300 cm+", note: "Grand salon, formal dining, full room" },
                        ].map((size) => (
                          <label
                            key={size.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              sizeTier === size.id
                                ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-stone-900 text-sm">{size.label}</div>
                                <div className="text-xs font-mono text-stone-600 mt-0.5">{size.dims}</div>
                              </div>
                              <input
                                type="radio"
                                name="sizeTier"
                                value={size.id}
                                checked={sizeTier === size.id}
                                onChange={() => setSizeTier(size.id)}
                                className="mt-1 text-stone-900 focus:ring-stone-900"
                              />
                            </div>
                            <span className="text-[11px] text-stone-500 mt-3">{size.note}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setFunnelStep(1)}
                          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setFunnelStep(3)}
                          className="px-6 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm font-medium inline-flex items-center gap-2"
                        >
                          Next: Investment Bracket <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: CRITICAL DQ BUDGET QUESTION */}
                  {funnelStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono mb-2">
                          <Filter className="w-3 h-3" /> Core Qualification Gate
                        </div>
                        <h3 className="text-xl font-serif text-stone-900">What is your planned investment bracket for this bespoke commission?</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          Our atelier minimum for 100% handmade wool tufting begins at 320,000 RWF (~$220 USD) due to artisanal labour and premium yarn imports.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            id: "under_150k",
                            title: "Under 150,000 RWF (Budget Tier)",
                            usd: "< $100 USD",
                            tag: "Will Trigger DQ (Disqualification)",
                            tagColor: "bg-rose-100 text-rose-800 border-rose-300",
                            desc: "Looking for mass-produced, machine-printed, or low-cost commercial rugs. (Does not meet artisanal hand-tufting cost threshold).",
                          },
                          {
                            id: "320k_480k",
                            title: "320,000 – 480,000 RWF (Studio Commission)",
                            usd: "~$220 – $330 USD",
                            tag: "Qualified Studio Tier",
                            tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
                            desc: "Standard custom geometric or organic shapes in small/medium formats. 100% New Zealand wool.",
                          },
                          {
                            id: "500k_850k",
                            title: "500,000 – 850,000 RWF (Masterpiece Tier)",
                            usd: "~$340 – $580 USD",
                            tag: "Qualified Masterpiece Tier",
                            tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
                            desc: "Complex organic carve work, multiple yarn colours, large living room scales up to 200x300cm.",
                          },
                          {
                            id: "900k_plus",
                            title: "900,000+ RWF (VIP Heirloom Commission)",
                            usd: "$600+ USD",
                            tag: "VIP High-Ticket Tier",
                            tagColor: "bg-amber-100 text-amber-800 border-amber-300",
                            desc: "Architectural grand scale rugs, hotel lobbies, multi-room suites, or collector tapestries.",
                          },
                        ].map((b) => (
                          <label
                            key={b.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              budgetTier === b.id
                                ? b.id === "under_150k"
                                  ? "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500"
                                  : "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-stone-900 text-sm">{b.title}</span>
                                <span className="text-xs text-stone-500 font-mono">({b.usd})</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${b.tagColor}`}>
                                  {b.tag}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600">{b.desc}</p>
                            </div>
                            <div className="shrink-0 flex items-center justify-end">
                              <input
                                type="radio"
                                name="budgetTier"
                                value={b.id}
                                checked={budgetTier === b.id}
                                onChange={() => setBudgetTier(b.id)}
                                className="text-stone-900 focus:ring-stone-900"
                              />
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setFunnelStep(2)}
                          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!budgetTier) {
                              showToast("Please select a budget bracket to continue.");
                              return;
                            }
                            setFunnelStep(4);
                          }}
                          className="px-6 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm font-medium inline-flex items-center gap-2"
                        >
                          Next: Client Details & Submission <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Contact & Submission */}
                  {funnelStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Final Step</span>
                        <h3 className="text-xl font-serif text-stone-900 mt-1">Where should our head artisan send your proposal?</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          We will evaluate your answers and fire the corresponding Meta training signal.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">Your Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Diane Uwase"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">WhatsApp / Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="+250 788 123 456"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="diane@example.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                      </div>

                      {/* Summary Banner */}
                      <div className="p-3.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-700 flex items-center justify-between">
                        <span>
                          Selected Budget: <strong>{budgetTier === "under_150k" ? "< 150,000 RWF (DQ)" : budgetTier}</strong>
                        </span>
                        <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${budgetTier === "under_150k" ? "bg-rose-200 text-rose-900" : "bg-emerald-200 text-emerald-900"}`}>
                          Expected Outcome: {budgetTier === "under_150k" ? "DISQUALIFIED (DQ)" : "QUALIFIED (Lead)"}
                        </span>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setFunnelStep(3)}
                          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submittingFunnel}
                          className="px-7 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 text-sm font-medium inline-flex items-center gap-2 shadow-sm"
                        >
                          {submittingFunnel ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating & Dispatching...
                            </>
                          ) : (
                            <>
                              Submit Commission Inquiry <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            ) : qualificationResult === "qualified" ? (
              /* ========================================================================= */
              /* OUTCOME A: QUALIFIED LEAD SCREEN                                          */
              /* ========================================================================= */
              <div className="bg-white border-2 border-emerald-500 rounded-2xl p-8 sm:p-10 shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <UserCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold uppercase tracking-wider">
                    ✓ High-Intent Lead Qualified
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif text-stone-950 font-normal">
                    Welcome to the Atelier, {clientName || "Collector"}.
                  </h2>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Your bespoke commission parameters align with our artisan production schedule. 
                    Our studio lead will review your specifications and prepare high-res wool yarn swatches.
                  </p>
                </div>

                {/* Pixel Verification Card */}
                <div className="max-w-md mx-auto p-4 rounded-xl bg-stone-900 text-left text-xs font-mono text-stone-300 space-y-2 border border-stone-800">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Meta Pixel Event Fired
                    </span>
                    <span>Standard 'Lead'</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500">Event ID:</span>{" "}
                      <span className="text-stone-300">{lastDispatchedEventId?.slice(0, 14)}...</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Value Tracked:</span>{" "}
                      <span className="text-amber-400">480,000 RWF</span>
                    </div>
                    <div>
                      <span className="text-stone-500">EMQ Hashed Data:</span>{" "}
                      <span className="text-emerald-400">Email, Phone, Name</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Pixel Training:</span>{" "}
                      <span className="text-emerald-400">Positive Signal (ROAS)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" /> Connect with Artisan on WhatsApp
                  </a>
                  <button
                    onClick={handleResetFunnel}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-sm"
                  >
                    Test Another Scenario
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* OUTCOME B: COURTEOUS DQ (DISQUALIFICATION) PAGE                           */
              /* ========================================================================= */
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-stone-50">
                  <UserX className="w-8 h-8 text-stone-500" />
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-mono text-xs font-semibold uppercase tracking-wider">
                    Bespoke Custom Rug Inquiry Evaluation
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif text-stone-950 font-normal">
                    Thank you for your interest in Mosiac, {clientName || "Friend"}.
                  </h2>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Because each Mosiac piece is 100% hand-tufted stitch by stitch using imported New Zealand wool in our Kigali workshop, bespoke custom commissions require 40 to 80 hours of meticulous hand-finishing and start at <strong>320,000 RWF</strong>.
                  </p>
                  <p className="text-xs text-stone-500">
                    Your estimated budget bracket (under 150,000 RWF) falls below our custom bespoke production threshold.
                  </p>
                </div>

                {/* Pixel Protection Diagnostic Banner */}
                <div className="max-w-md mx-auto p-4 rounded-xl bg-stone-900 text-left text-xs font-mono text-stone-300 space-y-2 border border-stone-800">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-rose-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Pixel Protected: 'Lead' Suppressed
                    </span>
                    <span className="text-[11px] bg-rose-950/80 px-2 py-0.5 rounded text-rose-300">
                      DisqualifiedLead Fired
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500">Standard Lead Event:</span>{" "}
                      <span className="text-rose-400 font-bold">BLOCKED / ZERO</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Custom Event:</span>{" "}
                      <span className="text-amber-400">DisqualifiedLead</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Meta Training Effect:</span>{" "}
                      <span className="text-stone-300">Stops targeting cheap clicks</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Ad Spend Saved:</span>{" "}
                      <span className="text-emerald-400">High ROAS Protection</span>
                    </div>
                  </div>
                </div>

                {/* Courteous Alternatives for Low Budget Client */}
                <div className="max-w-xl mx-auto pt-4 text-left">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3 text-center">
                    Alternative Ways to Experience Mosiac Atelier
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <Link
                      to="/catalogue"
                      className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-white transition-all space-y-1 block"
                    >
                      <div className="font-semibold text-stone-900 flex items-center justify-between">
                        <span>Standard Ready Collection</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <p className="text-stone-500">
                        Explore catalogue designs starting in smaller sizes from 170,000 RWF.
                      </p>
                    </Link>

                    <Link
                      to="/"
                      className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-white transition-all space-y-1 block"
                    >
                      <div className="font-semibold text-stone-900 flex items-center justify-between">
                        <span>Claim 55,000 RWF Credit</span>
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-stone-500">
                        Use our studio welcome voucher toward any standard sized rug.
                      </p>
                    </Link>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleResetFunnel}
                    className="px-6 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-sm inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Funnel Test
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: META PIXEL & CAPI DATA QUALITY (DQ) TEST BENCH                     */}
        {/* ========================================================================= */}
        {activeTab === "diagnostics" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Meta Test Code Input Card */}
            <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-7 border border-stone-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-mono uppercase tracking-wider mb-2">
                    <Activity className="w-3.5 h-3.5" /> Live Meta Events Manager Test Bridge
                  </div>
                  <h2 className="text-xl font-serif text-white">Direct Meta Graph API Test Event Code</h2>
                  <p className="text-xs text-stone-400 mt-1 max-w-xl">
                    Enter the Test Event Code from your <strong>Meta Events Manager &gt; Test Events</strong> tab (e.g. <code className="text-amber-300 font-mono">TEST12345</code>). Fired events will appear in real time inside Meta's dashboard.
                  </p>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TEST12345"
                    value={testEventCode}
                    onChange={(e) => setTestEventCode(e.target.value.toUpperCase())}
                    className="px-3.5 py-2 rounded-lg bg-stone-800 border border-stone-700 text-amber-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-44"
                  />
                  <button
                    type="button"
                    onClick={() => showToast(testEventCode ? `Test Event Code set to ${testEventCode}` : "Test code cleared.")}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium text-xs shrink-0"
                  >
                    Apply Code
                  </button>
                </div>
              </div>

              {/* Diagnostic Quick Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-800 text-xs font-mono">
                <div className="bg-stone-800/60 p-3 rounded-lg border border-stone-700/50">
                  <div className="text-stone-400 text-[11px]">Browser Pixel</div>
                  <div className={`mt-1 font-semibold flex items-center gap-1.5 ${diagnosticInfo?.isLoaded ? "text-emerald-400" : "text-amber-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${diagnosticInfo?.isLoaded ? "bg-emerald-400" : "bg-amber-400"}`} />
                    {diagnosticInfo?.isLoaded ? "Ready (fbq)" : "Initializing"}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-3 rounded-lg border border-stone-700/50">
                  <div className="text-stone-400 text-[11px]">First-Party _fbp</div>
                  <div className="mt-1 text-stone-200 truncate" title={diagnosticInfo?.fbp || "None"}>
                    {diagnosticInfo?.fbp ? diagnosticInfo.fbp.slice(0, 16) + "..." : "Auto-generated"}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-3 rounded-lg border border-stone-700/50">
                  <div className="text-stone-400 text-[11px]">Meta Click _fbc</div>
                  <div className="mt-1 text-stone-200 truncate" title={diagnosticInfo?.fbc || "None"}>
                    {diagnosticInfo?.fbc ? diagnosticInfo.fbc.slice(0, 16) + "..." : "Captures ?fbclid"}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-3 rounded-lg border border-stone-700/50">
                  <div className="text-stone-400 text-[11px]">Server CAPI Bridge</div>
                  <div className="mt-1 text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Graph API v19.0
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Click Event Test Trigger Buttons */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-serif text-stone-900">1-Click Live Event Diagnostic Triggers</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Click any button to dispatch real-time dual-channel events (Browser Pixel + Server CAPI) with SHA-256 hashed user data and deduplicated event IDs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. PageView */}
                <button
                  onClick={() =>
                    handleFireTestEvent("PageView", {
                      path: "/dq",
                      title: "Bespoke Qualification & Meta Pixel DQ",
                    })
                  }
                  disabled={testingEvent === "PageView"}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-stone-900 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-stone-500" /> PageView
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">Standard</span>
                  </div>
                  <p className="text-xs text-stone-500">Route view tracking for audience retention and retargeting pools.</p>
                </button>

                {/* 2. ViewContent */}
                <button
                  onClick={() =>
                    handleFireTestEvent("ViewContent", {
                      contentName: "Valley Hand-Tufted Rug",
                      contentCategory: "Area Rugs",
                      contentIds: ["MSC-VALLEY"],
                      contentType: "product",
                      value: 320000,
                      currency: "RWF",
                    })
                  }
                  disabled={testingEvent === "ViewContent"}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-stone-900 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-stone-500" /> ViewContent
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">320k RWF</span>
                  </div>
                  <p className="text-xs text-stone-500">Sends product SKU and catalogue metadata for dynamic ad catalogues.</p>
                </button>

                {/* 3. AddToCart */}
                <button
                  onClick={() =>
                    handleFireTestEvent("AddToCart", {
                      contentName: "Valencia Living Room Rug",
                      contentIds: ["MSC-VALENC"],
                      value: 480000,
                      currency: "RWF",
                      numItems: 1,
                    })
                  }
                  disabled={testingEvent === "AddToCart"}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-stone-900 text-sm">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-stone-500" /> AddToCart
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">480k RWF</span>
                  </div>
                  <p className="text-xs text-stone-500">Cart addition event for high-intent abandoned cart retargeting.</p>
                </button>

                {/* 4. InitiateCheckout */}
                <button
                  onClick={() =>
                    handleFireTestEvent("InitiateCheckout", {
                      value: 800000,
                      currency: "RWF",
                      numItems: 2,
                    })
                  }
                  disabled={testingEvent === "InitiateCheckout"}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-stone-900 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-stone-500" /> InitiateCheckout
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">800k RWF</span>
                  </div>
                  <p className="text-xs text-stone-500">Fired when entering the checkout / delivery information stage.</p>
                </button>

                {/* 5. Purchase */}
                <button
                  onClick={() =>
                    handleFireTestEvent(
                      "Purchase",
                      {
                        orderId: `MSC-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
                        value: 870000,
                        currency: "RWF",
                        numItems: 1,
                        contentName: "Bespoke Large Wool Rug",
                      },
                      {
                        email: "verified.buyer@mosiac.rw",
                        phone: "+250788999888",
                        firstName: "Collector",
                        city: "Kigali",
                        country: "rw",
                      }
                    )
                  }
                  disabled={testingEvent === "Purchase"}
                  className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-emerald-950 text-sm">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Purchase (High ROAS)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">870k RWF</span>
                  </div>
                  <p className="text-xs text-emerald-700/80">Full transaction test with hashed customer data for maximum match score.</p>
                </button>

                {/* 6. Lead (Qualified) */}
                <button
                  onClick={() =>
                    handleFireTestEvent(
                      "Lead",
                      {
                        contentName: "Qualified Atelier Commission",
                        value: 550000,
                        currency: "RWF",
                        qualification_status: "qualified",
                      },
                      {
                        email: "vip.patron@mosiac.rw",
                        phone: "+250788111222",
                        firstName: "Aline",
                        city: "Kigali",
                      }
                    )
                  }
                  disabled={testingEvent === "Lead"}
                  className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 hover:bg-amber-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-950 text-sm">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-600" /> Qualified Lead
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">550k RWF</span>
                  </div>
                  <p className="text-xs text-amber-800/80">Fires positive training signal to Meta algorithm for lookalike modeling.</p>
                </button>

                {/* 7. DisqualifiedLead (Negative Signal) */}
                <button
                  onClick={() =>
                    handleFireTestEvent(
                      "DisqualifiedLead",
                      {
                        contentName: "Disqualified Budget Too Low",
                        reason: "budget_under_150k",
                        qualification_status: "disqualified",
                      },
                      {
                        email: "low.intent@tester.rw",
                        city: "Kigali",
                      }
                    )
                  }
                  disabled={testingEvent === "DisqualifiedLead"}
                  className="p-4 rounded-xl border border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-rose-950 text-sm">
                    <span className="flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-600" /> DisqualifiedLead (DQ)
                    </span>
                    <span className="text-[10px] font-mono text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">Custom Event</span>
                  </div>
                  <p className="text-xs text-rose-800/80">Negative training signal; suppresses standard Lead conversion event.</p>
                </button>
              </div>
            </div>

            {/* Event History Stream Log */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-stone-600" /> Real-Time Dispatched Events Stream
                  </h3>
                  <p className="text-xs text-stone-500">Live inspection of recent browser & CAPI test payloads</p>
                </div>
                <button
                  onClick={refreshDiagnostics}
                  className="px-2.5 py-1 text-xs border border-stone-300 hover:bg-stone-100 rounded text-stone-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {eventHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No events recorded in this session yet. Trigger one of the buttons above or submit the qualification quiz!
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto font-mono text-xs">
                  {eventHistory.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            item.eventName === "Purchase"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.eventName === "Lead"
                              ? "bg-amber-100 text-amber-800"
                              : item.eventName === "DisqualifiedLead"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-200 text-stone-800"
                          }`}>
                            {item.eventName}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                          {item.isCustom && (
                            <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 rounded">Custom Event</span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-600 font-sans flex flex-wrap gap-x-4 gap-y-1">
                          <span>Event ID: <code className="font-mono text-stone-800">{item.eventId}</code></span>
                          {item.customData?.value && (
                            <span>Value: <strong>{Number(item.customData.value).toLocaleString()} {item.customData?.currency || "RWF"}</strong></span>
                          )}
                          <span>Hashed PII: {item.hasUserData ? "✓ Yes (Email/Phone)" : "—"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Sent to Pixel
                        </span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(item, null, 2), item.id)}
                          className="p-1.5 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-800"
                          title="Copy JSON Payload"
                        >
                          {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Match Quality (EMQ) Best Practices Card */}
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 text-xs text-stone-700 space-y-2">
              <h4 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Why Event Match Quality (EMQ) Matters for Rug Mosaic
              </h4>
              <p className="leading-relaxed">
                Meta assigns every pixel an <strong>Event Match Quality (EMQ)</strong> score from 1.0 to 10.0. Higher scores allow Meta to identify the exact Facebook and Instagram profiles of your luxury rug collectors. 
                Our integration automatically captures first-party cookies (<code className="font-mono text-stone-800">_fbp</code> and <code className="font-mono text-stone-800">_fbc</code>), user agents, client IPs, and SHA-256 hashed phone numbers and emails, ensuring your studio achieves a <strong>9.0+ Excellent EMQ rating</strong>.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
