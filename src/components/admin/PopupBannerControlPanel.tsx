import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  DEFAULT_POPUP_BANNER_CONFIG,
  PRESET_STUDIO_IMAGES,
  BANNER_CAMPAIGN_PRESETS,
  type PopupBannerConfig,
} from "@/lib/banner-config";
import {
  getPopupBannerSettings,
  savePopupBannerSettings,
} from "@/lib/leads-and-banner.functions";
import { claimPromo } from "@/lib/forms.functions";
import {
  adminListCoupons,
  adminLoadCatalogue,
  adminUploadImage,
} from "@/lib/admin.functions";
import {
  Eye,
  Save,
  RotateCcw,
  Clock,
  Image as ImageIcon,
  Type,
  Check,
  Smartphone,
  Monitor,
  Gift,
  X,
  Upload,
  Copy,
  ExternalLink,
  Tag,
  ShoppingBag,
  Sparkles,
  Layers,
  Send,
} from "lucide-react";

export function PopupBannerControlPanel({
  onToast,
}: {
  onToast?: (msg: string) => void;
}) {
  const [config, setConfig] = useState<PopupBannerConfig>(
    DEFAULT_POPUP_BANNER_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Studio dash interactive test modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testModalStep, setTestModalStep] = useState<"offer" | "form" | "done">("offer");
  const [testModalDevice, setTestModalDevice] = useState<"desktop" | "mobile">("desktop");
  const [testModalName, setTestModalName] = useState("");
  const [testModalPhone, setTestModalPhone] = useState("");
  const [testModalEmail, setTestModalEmail] = useState("");
  const [testModalCopied, setTestModalCopied] = useState(false);
  const [testModalSubmitting, setTestModalSubmitting] = useState(false);
  const [testModalRecordLead, setTestModalRecordLead] = useState(true);

  // Simulator state in right column
  const [simulatorStep, setSimulatorStep] = useState<"offer" | "form" | "done">("offer");
  const [simulatorDevice, setSimulatorDevice] = useState<"desktop" | "mobile">("desktop");
  const [simulatorCopied, setSimulatorCopied] = useState(false);

  // Coupons & Catalogue rugs from studio backend
  const [availableCoupons, setAvailableCoupons] = useState<
    Array<{ id: string; code: string; discount_percent: number; is_active: boolean }>
  >([]);
  const [catalogueRugs, setCatalogueRugs] = useState<
    Array<{ id: string; name: string; image?: string }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBannerSettingsFn = useServerFn(getPopupBannerSettings);
  const saveBannerSettingsFn = useServerFn(savePopupBannerSettings);
  const loadCouponsFn = useServerFn(adminListCoupons);
  const loadCatalogueFn = useServerFn(adminLoadCatalogue);
  const uploadImageFn = useServerFn(adminUploadImage);
  const claimPromoFn = useServerFn(claimPromo);

  // Initial load
  useEffect(() => {
    let active = true;

    // 1. Load saved config via authenticated server function
    getBannerSettingsFn()
      .then((res) => {
        if (res && active) setConfig(res);
      })
      .catch((err) => {
        console.error("Failed to load banner settings:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // 2. Load available coupons for 1-click incentive selection
    loadCouponsFn()
      .then((res) => {
        if (Array.isArray(res) && active) {
          setAvailableCoupons(res as any);
        }
      })
      .catch(() => {});

    // 3. Load catalogue products for image picker
    loadCatalogueFn()
      .then((res) => {
        if (res?.products && active) {
          const rugs = (res.products as any[])
            .filter((p) => p.images && p.images.length > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              image: p.images[0],
            }));
          setCatalogueRugs(rugs.slice(0, 12));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [getBannerSettingsFn, loadCouponsFn, loadCatalogueFn]);

  // Handle Save & Publish
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveBannerSettingsFn({ data: config });
      const savedConfig = (res as any)?.config || config;

      // 1. Persist to local browser storage & clear dismissal snooze so preview is immediate
      try {
        localStorage.setItem("mosiac.banner.config", JSON.stringify(savedConfig));
        localStorage.removeItem("mosiac.promo.dismiss");
      } catch {}

      // 2. Real-time multi-tab cross-broadcast
      try {
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("mosiac_banner_sync");
          bc.postMessage({ type: "config_saved", config: savedConfig });
          bc.close();
        }
      } catch {}

      // 3. Broadcast event so any open public page tabs update instantly
      window.dispatchEvent(
        new CustomEvent("mosiac:banner_config_saved", { detail: savedConfig })
      );

      onToast?.("Pop-up banner settings published live to website!");
    } catch (err: any) {
      console.error("Failed to save banner settings:", err);
      onToast?.(err?.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Open Full Screen Interactive Test Modal
  const handleOpenTestModal = () => {
    // Clear dismissal snooze and claimed flags so it can trigger
    try {
      localStorage.removeItem("mosiac.promo.dismiss");
      localStorage.removeItem("mosiac.promo.claimed");
      localStorage.setItem("mosiac.banner.config", JSON.stringify(config));
    } catch {}

    // Broadcast preview to open tabs
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("mosiac_banner_sync");
        bc.postMessage({ type: "preview", config });
        bc.close();
      }
    } catch {}

    setTestModalStep(config.displayMode === "direct_form" ? "form" : "offer");
    setTestModalName("");
    setTestModalPhone("");
    setTestModalEmail("vip.collector@atelier.rw");
    setTestModalCopied(false);
    setTestModalOpen(true);

    // Also broadcast to public site if storefront is in another window
    window.dispatchEvent(
      new CustomEvent("mosiac:banner_preview", { detail: config })
    );

    onToast?.("Testing live interactive pop-up banner on screen!");
  };

  // Clear dismissal snooze in admin browser
  const handleClearSnooze = () => {
    try {
      localStorage.removeItem("mosiac.promo.dismiss");
      localStorage.removeItem("mosiac.promo.claimed");
    } catch {}
    onToast?.("Dismissal snooze timer and claimed status reset! Banner will appear on next visit to storefront.");
  };

  // Submit test lead from in-admin test modal
  const handleTestModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalRecordLead) {
      setTestModalStep("done");
      return;
    }
    setTestModalSubmitting(true);
    try {
      await claimPromoFn({
        data: {
          name: testModalName.trim() || "Test Collector",
          phone: testModalPhone.trim() || undefined,
          email: testModalEmail.trim() || undefined,
          source: `${config.campaignSource || "studio-buying-credit"}-admin-test`,
        },
      });
      onToast?.("Test contact captured! Verified in database and Captured Contacts.");
      setTestModalStep("done");
    } catch (err: any) {
      console.warn("Test modal lead submission notice:", err);
      // Still allow step transition in test mode even if network glitch
      setTestModalStep("done");
    } finally {
      setTestModalSubmitting(false);
    }
  };

  // Reset to original studio defaults
  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Reset pop-up banner to original Mosiac studio promotion defaults?"
      )
    ) {
      setConfig({ ...DEFAULT_POPUP_BANNER_CONFIG });
      onToast?.("Reset to default configuration (remember to click Save & Publish).");
    }
  };

  // Image File Upload
  const handleImageFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onToast?.("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const { url } = await uploadImageFn({
            data: { filename: file.name, dataUrl },
          });
          setConfig((c) => ({
            ...c,
            imageUrl: url,
            imageAlt: file.name.replace(/\.[^/.]+$/, ""),
          }));
          onToast?.("Image uploaded and set as pop-up banner photography!");
        } catch (err) {
          console.error("Image upload failed:", err);
          onToast?.("Failed to upload image.");
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      onToast?.("Failed to read image file.");
    }
  };

  return (
    <div className="mt-6 space-y-10">
      {/* Hidden image file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImageFileSelected(e.target.files[0]);
          }
        }}
      />

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Pop-up Banner Control Studio
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                config.enabled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  config.enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              {config.enabled ? "Active on Website" : "Disabled"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure promotional rug photography, display delay, visitor snooze interval,
            copywriting, lead capture fields, and coupon vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open live storefront in a new tab to see how changes appear to visitors"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-accent" />
            <span>View Storefront</span>
          </a>

          <button
            type="button"
            onClick={handleClearSnooze}
            title="Reset browser dismissal so popup displays immediately when testing the site"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear My Snooze</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenTestModal}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/40 bg-foreground/5 hover:bg-foreground/10 px-4 py-2 text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            <span>Test Live Popup</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2 text-xs font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving…" : "Save & Publish"}</span>
          </button>
        </div>
      </div>

      {/* Campaign Quick Presets */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Campaign Quick Presets
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Switch proven studio promotional campaigns with 1 click
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BANNER_CAMPAIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setConfig((c) => ({ ...c, ...preset.config }));
                onToast?.(`Loaded "${preset.name}" preset! Remember to Save & Publish.`);
              }}
              className="flex flex-col justify-between rounded-xl border border-border bg-background p-3.5 text-left hover:border-foreground/50 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {preset.config.displayMode === "direct_form" ? "Direct Form" : "2-Step"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">
                  {preset.name}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                  {preset.tagline}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground font-medium group-hover:text-accent">
                <span>Load Preset</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Activation & Timing Intervals */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                  1. Visibility & Time Intervals
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-foreground">
                  Enable Popup:
                </span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, enabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-foreground"
                />
              </label>
            </div>

            {/* Display Mode / Presentation Style */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground">
                Promotion Workflow Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, displayMode: "two_step" }))}
                  className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    (config.displayMode || "two_step") === "two_step"
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Two-Step Interactive Flow</span>
                    {(config.displayMode || "two_step") === "two_step" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Step 1 presents the atelier invitation &amp; buying credit value. Clicking the CTA transitions to Step 2 contact verification.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, displayMode: "direct_form" }))}
                  className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    config.displayMode === "direct_form"
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Direct Form (Instant Inputs)</span>
                    {config.displayMode === "direct_form" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Skips Step 1 completely and displays contact capture fields immediately on first view for higher instant conversion rates.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Show Delay */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  Display Delay after Page Load
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={config.delaySeconds}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        delaySeconds: Number(e.target.value) || 5,
                      }))
                    }
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-foreground"
                  />
                  <span className="text-xs text-muted-foreground">seconds</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[2, 5, 8, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        setConfig((c) => ({ ...c, delaySeconds: sec }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                        config.delaySeconds === sec
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Snooze / Frequency Interval */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  Dismiss Snooze Interval (Hide for)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10080}
                    value={config.snoozeMinutes}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        snoozeMinutes: Number(e.target.value) || 60,
                      }))
                    }
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-foreground"
                  />
                  <span className="text-xs text-muted-foreground">minutes</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[
                    { label: "15m", val: 15 },
                    { label: "1h", val: 60 },
                    { label: "12h", val: 720 },
                    { label: "24h", val: 1440 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() =>
                        setConfig((c) => ({ ...c, snoozeMinutes: p.val }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                        config.snoozeMinutes === p.val
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Pages */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="block text-xs font-medium text-foreground">
                Page Targeting
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "all", label: "Everywhere" },
                  { key: "home_only", label: "Homepage Only" },
                  { key: "catalogue_only", label: "Catalogue Only" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        targetPages: opt.key as any,
                      }))
                    }
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                      config.targetPages === opt.key
                        ? "border-foreground bg-foreground text-background font-semibold"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Image Customization */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                  2. Image Customization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                <Upload className={`h-3.5 w-3.5 ${uploadingImage ? "animate-spin" : ""}`} />
                <span>{uploadingImage ? "Uploading…" : "Upload New Photo"}</span>
              </button>
            </div>

            {/* Curated Presets */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-foreground">
                Select from Studio Preset Rugs
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_STUDIO_IMAGES.map((preset) => {
                  const selected = config.imageUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          imageUrl: preset.url,
                          imageAlt: preset.alt,
                        }))
                      }
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border transition-all ${
                        selected
                          ? "border-foreground ring-2 ring-foreground/20 scale-[1.02]"
                          : "border-border opacity-75 hover:opacity-100"
                      }`}
                      title={preset.title}
                    >
                      <img
                        src={preset.url}
                        alt={preset.alt}
                        className="h-full w-full object-cover"
                      />
                      {selected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select from Live Catalogue Rugs */}
            {catalogueRugs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="block text-xs font-medium text-foreground">
                  Or Pick Directly from Catalogue Inventory
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {catalogueRugs.map((rug) => {
                    const selected = config.imageUrl === rug.image;
                    return (
                      <button
                        key={rug.id}
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            imageUrl: rug.image!,
                            imageAlt: rug.name,
                          }))
                        }
                        className={`group relative aspect-[4/3] overflow-hidden rounded-xl border transition-all ${
                          selected
                            ? "border-foreground ring-2 ring-foreground/20 scale-[1.02]"
                            : "border-border opacity-75 hover:opacity-100"
                        }`}
                        title={rug.name}
                      >
                        <img
                          src={rug.image}
                          alt={rug.name}
                          className="h-full w-full object-cover"
                        />
                        {selected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground">
                Or Enter Custom Image URL
              </label>
              <input
                type="text"
                value={config.imageUrl}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, imageUrl: e.target.value }))
                }
                placeholder="https://... or /__l5e/assets-v1/..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-foreground"
              />
            </div>

            {/* Badge Overlay Text */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground">
                Image Overlay Badge Text (Displayed on corner of rug photo)
              </label>
              <input
                type="text"
                value={config.badgeText}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, badgeText: e.target.value }))
                }
                placeholder="e.g. 55,000 RWF Credit or Limited Edition"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
              />
            </div>

            {/* Desktop Vertical Rug Orientation Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3.5">
              <div className="space-y-0.5 pr-2">
                <span className="block text-xs font-semibold text-foreground">
                  Desktop Vertical Orientation for Horizontal Rugs
                </span>
                <span className="block text-[11px] text-muted-foreground font-light">
                  When enabled, horizontal rug photography automatically adapts vertically on desktop screens to fill the 2:3 section cleanly without cropping.
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.rotateImageVertical !== false}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      rotateImageVertical: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded accent-foreground"
                />
                <span className="text-xs font-medium text-foreground">Auto-Adapt</span>
              </label>
            </div>

            {/* Image Fit Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground">
                Photography Fit Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "cover", label: "Cover (Fill Section)" },
                  { key: "fit", label: "Contain (Entire Rug Visible)" },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({ ...c, imageFitMode: m.key as any }))
                    }
                    className={`rounded-xl border p-2 text-center text-xs font-medium transition-colors cursor-pointer ${
                      (config.imageFitMode || "cover") === m.key
                        ? "border-foreground bg-foreground text-background font-semibold"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Copywriting & Content */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Type className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                3. Content & Messaging
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Eyebrow Label
                </label>
                <input
                  type="text"
                  value={config.eyebrow}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, eyebrow: e.target.value }))
                  }
                  placeholder="Atelier Welcome Offer"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs uppercase tracking-wider outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={config.headline}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, headline: e.target.value }))
                  }
                  placeholder="Claim your 55,000 RWF buying credit."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Subtitle / Voucher Delivery Details
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, subtitle: e.target.value }))
                  }
                  placeholder="Enter your contact details to receive your 55,000 RWF credit voucher, manually emailed by our atelier team."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Primary CTA Button Text
                </label>
                <input
                  type="text"
                  value={config.ctaText}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, ctaText: e.target.value }))
                  }
                  placeholder="Claim 55,000 RWF Credit"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold uppercase tracking-wider outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Form Header Eyebrow (Step 2)
                </label>
                <input
                  type="text"
                  value={config.formEyebrow}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, formEyebrow: e.target.value }))
                  }
                  placeholder="Atelier Credit Voucher"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs uppercase tracking-wider outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Form Description Microcopy (Step 2)
                </label>
                <input
                  type="text"
                  value={config.formDescription}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, formDescription: e.target.value }))
                  }
                  placeholder="Enter your email and contact details. Our Kigali studio team will manually email your 55,000 RWF voucher directly to your inbox."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Lead Capture Fields & Voucher Code */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Gift className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                4. Contact Details to Capture & Voucher Code
              </h3>
            </div>

            <div className="space-y-4">
              <span className="block text-xs font-medium text-foreground">
                Required Contact Fields in Step 2:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 cursor-pointer bg-background">
                  <input
                    type="checkbox"
                    checked={config.requireName !== false}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        requireName: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-foreground"
                  />
                  <span className="text-xs font-medium">Full Name</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 cursor-pointer bg-background">
                  <input
                    type="checkbox"
                    checked={config.requirePhone !== false}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        requirePhone: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-foreground"
                  />
                  <span className="text-xs font-medium">WhatsApp / Phone</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 cursor-pointer bg-background">
                  <input
                    type="checkbox"
                    checked={config.requireEmail !== false}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        requireEmail: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-foreground"
                  />
                  <span className="text-xs font-medium">Email Address</span>
                </label>
              </div>

              {/* Voucher Coupon Code with Active Coupons Quick-Picker */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="block text-xs font-medium text-foreground">
                  Voucher / Discount Coupon Code
                </label>
                <input
                  type="text"
                  value={config.couponCode}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      couponCode: e.target.value.trim(),
                    }))
                  }
                  placeholder="e.g. 55,000 RWF Credit or WELCOME10"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider outline-none focus:border-foreground"
                />

                {availableCoupons.length > 0 && (
                  <div className="pt-1">
                    <span className="block text-[11px] text-muted-foreground mb-1.5">
                      Or select from active studio coupons:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              couponCode: coupon.code,
                            }))
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            config.couponCode === coupon.code
                              ? "bg-foreground text-background"
                              : "border border-border bg-muted/30 text-foreground hover:bg-muted"
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                          <span>{coupon.code}</span>
                          <span className="text-[10px] opacity-75">
                            (-{coupon.discount_percent}%)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Success Headline
                  </label>
                  <input
                    type="text"
                    value={config.successHeadline}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        successHeadline: e.target.value,
                      }))
                    }
                    placeholder="You're on the atelier list."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Campaign Origin Source Tag
                  </label>
                  <input
                    type="text"
                    value={config.campaignSource}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        campaignSource: e.target.value.trim(),
                      }))
                    }
                    placeholder="studio-buying-credit"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-foreground">
                  Success Description / Voucher Delivery Notice
                </label>
                <textarea
                  rows={2}
                  value={config.successDescription}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      successDescription: e.target.value,
                    }))
                  }
                  placeholder="Thank you! Our studio team will manually email your 55,000 RWF buying credit voucher directly to your email address shortly."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Live Preview Simulator (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Real-Time Live Preview
              </h3>

              <div className="flex items-center gap-2">
                {/* Device View Mode */}
                <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSimulatorDevice("desktop")}
                    title="Desktop split view"
                    className={`rounded-full p-1 transition-colors ${
                      simulatorDevice === "desktop"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorDevice("mobile")}
                    title="Mobile view"
                    className={`rounded-full p-1 transition-colors ${
                      simulatorDevice === "mobile"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Step Toggle */}
                <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 text-[10px]">
                  {(["offer", "form", "done"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSimulatorStep(s)}
                      className={`rounded-full px-2 py-0.5 capitalize transition-colors ${
                        simulatorStep === s
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* High-Fidelity Live Simulator Container */}
            <div className="rounded-3xl border border-border bg-stone-900/10 dark:bg-stone-950/60 p-4 sm:p-5 backdrop-blur flex justify-center">
              <div
                className={`relative w-full overflow-hidden rounded-3xl bg-background shadow-2xl border border-border/80 text-foreground transition-all ${
                  simulatorDevice === "desktop"
                    ? "max-w-[420px] flex flex-col md:grid md:grid-cols-2"
                    : "max-w-[300px] flex flex-col"
                }`}
              >
                {/* Content Side */}
                <div className="p-4 sm:p-5 flex flex-col justify-between order-2 md:order-1 bg-background">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-script text-2xl leading-none text-foreground select-none">
                        Mosiac<span className="text-amber-500">.</span>
                      </span>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted/60 text-muted-foreground text-xs">
                        <X className="h-3 w-3" />
                      </span>
                    </div>

                    {config.eyebrow && (
                      <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                        {config.eyebrow}
                      </p>
                    )}

                    <h4 className="mt-1 font-display text-sm font-bold leading-tight text-foreground">
                      {config.headline || "Claim your 55,000 RWF buying credit."}
                    </h4>

                    <p className="mt-1 text-[10px] leading-snug text-muted-foreground font-light">
                      {config.subtitle}
                    </p>
                  </div>

                  <div className="mt-3">
                    {simulatorStep === "offer" && (
                      <div className="space-y-1.5">
                        {config.displayMode === "direct_form" && (
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[9px] text-amber-700 dark:text-amber-300">
                            Direct Form mode active · Visitors will skip this and start directly on Step 2 (Form).
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSimulatorStep("form")}
                          className="w-full rounded-xl bg-foreground px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-background shadow transition-all hover:opacity-90 cursor-pointer"
                        >
                          {config.ctaText || "Claim 55,000 RWF Credit"} →
                        </button>
                      </div>
                    )}

                    {simulatorStep === "form" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground pb-0.5">
                          <span>Verify Contact</span>
                          {config.displayMode !== "direct_form" && (
                            <button
                              type="button"
                              onClick={() => setSimulatorStep("offer")}
                              className="underline hover:text-foreground cursor-pointer"
                            >
                              ← Back
                            </button>
                          )}
                        </div>
                        {config.requireName !== false && (
                          <input
                            disabled
                            placeholder="Full name *"
                            className="w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-[10px] outline-none"
                          />
                        )}
                        {config.requirePhone !== false && (
                          <input
                            disabled
                            placeholder="Phone / WhatsApp *"
                            className="w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-[10px] outline-none"
                          />
                        )}
                        {config.requireEmail !== false && (
                          <input
                            disabled
                            placeholder="Email address *"
                            className="w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-[10px] outline-none"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setSimulatorStep("done")}
                          className="w-full mt-1 rounded-xl bg-foreground px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-background shadow cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          Simulate Submit →
                        </button>
                      </div>
                    )}

                    {simulatorStep === "done" && (
                      <div className="text-center py-1">
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 mb-1">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </div>
                        <h5 className="font-display text-xs font-bold text-foreground">
                          {config.successHeadline || "You're on the atelier list."}
                        </h5>
                        <p className="mt-0.5 text-[9px] text-muted-foreground leading-snug">
                          {config.successDescription || "Your voucher has been dispatched."}
                        </p>
                        {config.couponCode && (
                          <div className="mt-2 rounded-xl border border-dashed border-accent/40 bg-accent/10 p-2 text-left flex items-center justify-between">
                            <div>
                              <span className="block text-[8px] uppercase font-mono tracking-widest text-accent font-semibold">
                                Voucher Code
                              </span>
                              <span className="font-mono text-xs font-bold text-foreground">
                                {config.couponCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(config.couponCode);
                                setSimulatorCopied(true);
                                setTimeout(() => setSimulatorCopied(false), 2000);
                              }}
                              className="text-[9px] font-semibold text-foreground hover:text-accent underline cursor-pointer"
                            >
                              {simulatorCopied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSimulatorStep(config.displayMode === "direct_form" ? "form" : "offer")}
                          className="mt-2 text-[9px] text-muted-foreground underline hover:text-foreground cursor-pointer"
                        >
                          Restart Simulator
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rug Photo Side */}
                <div
                  className={`relative overflow-hidden bg-stone-950 order-1 md:order-2 flex items-center justify-center ${
                    simulatorDevice === "desktop" ? "h-28 md:h-full md:aspect-[2/3]" : "h-24 w-full"
                  }`}
                >
                  <img
                    src={config.imageUrl}
                    alt={config.imageAlt || "Rug"}
                    className={`h-full w-full select-none pointer-events-none ${
                      config.imageFitMode === "fit" ? "object-contain bg-black/40" : "object-cover"
                    }`}
                  />
                  {config.badgeText && (
                    <div className="absolute left-2 bottom-2 z-10">
                      <span className="inline-block rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[8px] font-medium text-white border border-white/20">
                        {config.badgeText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Click &ldquo;Test Live Popup&rdquo; at the top to simulate the interactive
              customer modal directly on this page.
            </p>
          </div>
        </div>
      </div>

      {/* FULL-FIDELITY INTERACTIVE TEST MODAL OVERLAY */}
      {testModalOpen && (
        <div
          className="fixed inset-0 z-[99999] grid place-items-center bg-black/80 p-4 sm:p-6 backdrop-blur-[6px] animate-fade-in select-none"
          onClick={() => setTestModalOpen(false)}
        >
          {/* Top Test Controls Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-1.5 text-xs text-white backdrop-blur-md shadow-2xl"
          >
            <span className="font-semibold text-amber-300">Studio Test Mode:</span>
            <button
              type="button"
              onClick={() => setTestModalDevice("desktop")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                testModalDevice === "desktop" ? "bg-white text-black font-semibold" : "text-white/80 hover:text-white"
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setTestModalDevice("mobile")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                testModalDevice === "mobile" ? "bg-white text-black font-semibold" : "text-white/80 hover:text-white"
              }`}
            >
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setTestModalStep("offer")}
              className="text-[10px] text-white/70 hover:text-white underline ml-1"
            >
              Restart Flow
            </button>
          </div>

          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full overflow-hidden rounded-3xl md:rounded-[32px] bg-background shadow-2xl border border-border/60 text-foreground transition-all max-h-[92vh] ${
              testModalDevice === "desktop"
                ? "max-w-3xl lg:max-w-[860px] flex flex-col md:grid md:grid-cols-2"
                : "max-w-sm flex flex-col"
            }`}
          >
            {/* LEFT COLUMN: Text, Branding, Inputs & Actions */}
            <div className="flex flex-col justify-between p-5 sm:p-7 md:p-8 order-2 md:order-1 overflow-y-auto bg-background">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-script text-2xl sm:text-3xl md:text-[34px] leading-none text-foreground select-none">
                    Mosiac<span className="text-accent">.</span>
                  </span>
                  <button
                    onClick={() => setTestModalOpen(false)}
                    aria-label="Close offer"
                    className="grid h-8 w-8 place-items-center rounded-full bg-muted/70 text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {config.eyebrow && (
                  <p className="mt-2.5 sm:mt-3.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    {config.eyebrow}
                  </p>
                )}

                <h3 className="mt-1.5 sm:mt-2 font-display text-xl sm:text-2xl md:text-3xl lg:text-[28px] font-bold leading-[1.18] tracking-tight text-foreground">
                  {config.headline || "Claim your 55,000 RWF buying credit."}
                </h3>

                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-relaxed text-muted-foreground font-light">
                  {config.subtitle}
                </p>
              </div>

              {/* Form & Actions or Success */}
              <div className="mt-4 sm:mt-6">
                {testModalStep === "offer" && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setTestModalStep("form")}
                      className="w-full rounded-xl bg-foreground px-5 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-background shadow-md transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer"
                    >
                      {config.ctaText || "Claim 55,000 RWF Credit"} →
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Step 1 of 2: Click to proceed to contact verification.
                    </p>
                  </div>
                )}

                {testModalStep === "form" && (
                  <form onSubmit={handleTestModalSubmit} className="space-y-2.5">
                    <div className="flex items-center justify-between pb-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        {config.formDescription || "Enter your contact details to receive your voucher."}
                      </p>
                      {config.displayMode !== "direct_form" && (
                        <button
                          type="button"
                          onClick={() => setTestModalStep("offer")}
                          className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0 ml-2 cursor-pointer"
                        >
                          ← Back
                        </button>
                      )}
                    </div>

                    {/* Test Mode Option: Record real lead vs simulate only */}
                    <div className="rounded-xl bg-muted/30 border border-border p-2.5 flex items-center justify-between">
                      <div className="text-[11px]">
                        <span className="font-semibold text-foreground">Save as Real Lead:</span>{" "}
                        <span className="text-muted-foreground">Registers in database &amp; contacts hub</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={testModalRecordLead}
                        onChange={(e) => setTestModalRecordLead(e.target.checked)}
                        className="h-4 w-4 rounded accent-foreground"
                      />
                    </div>

                    {config.requireName !== false && (
                      <input
                        required
                        value={testModalName}
                        onChange={(e) => setTestModalName(e.target.value)}
                        placeholder="Your name *"
                        className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground"
                      />
                    )}

                    {config.requirePhone !== false && (
                      <input
                        required
                        value={testModalPhone}
                        onChange={(e) => setTestModalPhone(e.target.value)}
                        placeholder="Phone / WhatsApp *"
                        className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground"
                      />
                    )}

                    {config.requireEmail !== false && (
                      <input
                        required
                        type="email"
                        value={testModalEmail}
                        onChange={(e) => setTestModalEmail(e.target.value)}
                        placeholder="Email address *"
                        className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground"
                      />
                    )}

                    <button
                      type="submit"
                      disabled={testModalSubmitting}
                      className="w-full mt-2 rounded-xl bg-foreground px-5 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-background shadow-md transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      {testModalSubmitting ? "Submitting Test Lead…" : (config.ctaText || "Claim 55,000 RWF Credit")}
                    </button>
                  </form>
                )}

                {testModalStep === "done" && (
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
                      <div className="mt-3 rounded-2xl border border-dashed border-accent/40 bg-accent/10 p-3 sm:p-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-accent font-semibold">
                            Voucher Code
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(config.couponCode);
                              setTestModalCopied(true);
                              try {
                                localStorage.setItem("mosiac.applied_coupon", config.couponCode);
                              } catch {}
                              setTimeout(() => setTestModalCopied(false), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-accent transition-colors cursor-pointer"
                          >
                            {testModalCopied ? (
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
                        {testModalEmail && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Dispatched for <span className="font-semibold text-foreground underline">{testModalEmail}</span>.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <a
                        href="/catalogue"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (config.couponCode) {
                            try {
                              localStorage.setItem("mosiac.applied_coupon", config.couponCode);
                            } catch {}
                          }
                          setTestModalOpen(false);
                        }}
                        className="flex-1 rounded-xl bg-foreground px-4 py-2.5 text-center text-xs font-semibold text-background hover:opacity-90 transition-opacity"
                      >
                        Shop Collection with Credit →
                      </a>
                      <button
                        type="button"
                        onClick={() => setTestModalStep(config.displayMode === "direct_form" ? "form" : "offer")}
                        className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        Restart Flow
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestModalOpen(false)}
                        className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom microcopy */}
              <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
                By continuing, you agree to our Terms &amp; Privacy Policies.
              </p>
            </div>

            {/* RIGHT COLUMN: Studio Rug Photography */}
            <div
              className={`relative overflow-hidden bg-stone-950 order-1 md:order-2 flex items-center justify-center ${
                testModalDevice === "desktop"
                  ? "h-44 sm:h-56 md:h-full md:aspect-[2/3] w-full"
                  : "h-36 w-full"
              }`}
            >
              <button
                onClick={() => setTestModalOpen(false)}
                aria-label="Close offer"
                className="absolute right-3.5 top-3.5 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85 transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/20"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>

              <img
                src={config.imageUrl}
                alt={config.imageAlt || "Rug"}
                className={`h-full w-full select-none pointer-events-none ${
                  config.imageFitMode === "fit" ? "object-contain bg-black/40" : "object-cover"
                }`}
              />

              {config.badgeText && (
                <div className="absolute left-3.5 bottom-3.5 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white shadow">
                    {config.badgeText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
