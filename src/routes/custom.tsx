import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { Nav, Footer } from "@/components/site-chrome";
import {
  submitCustomRequest,
  syncPartialBespokeLead,
  uploadCustomerInspirationFile,
} from "@/lib/forms.functions";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Upload,
  Ruler,
  Layers,
  Palette,
  Home,
  Clock,
  Shield,
  X,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Bespoke Rug Commission | Mosiac Studio Kigali" },
      {
        name: "description",
        content:
          "Commission a one-of-one hand-tufted rug. Choose your silhouette, Highland wool palette, dimensions, and sculptural pile relief. Ready in 3 to 4 weeks in Kigali.",
      },
      { property: "og:title", content: "Bespoke Rug Commission | Mosiac" },
      {
        property: "og:description",
        content: "From concept sketch to your doorstep: hand-tufted to order in Rwanda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomPage,
});

const ROOM_OPTIONS = [
  "Living Room",
  "Primary Bedroom",
  "Dining Area",
  "Entryway / Foyer",
  "Creative Studio / Office",
  "Wall Tapestry Art",
];

const SHAPE_OPTIONS = [
  { id: "rectangular", label: "Rectangular / Square", desc: "Classic clean architectural lines" },
  { id: "organic", label: "Organic / Wavy Fluid", desc: "Curvilinear, sculptural freeform" },
  { id: "arch", label: "Arch & Capsule", desc: "Modern curved contour" },
  { id: "circular", label: "Circular / Oval", desc: "Gentle organic grounding" },
  { id: "bespoke-silhouette", label: "Custom Contour", desc: "Logo, mascot, or art piece outline" },
];

const SIZE_PRESETS = [
  { label: "160 × 230 cm", note: "Accent / Compact Seating (3.68 m²)" },
  { label: "200 × 300 cm", note: "Standard Living / 6-Seater (6.00 m²)" },
  { label: "250 × 350 cm", note: "Grand Living / 8-Seater (8.75 m²)" },
  { label: "300 × 400 cm", note: "Master Suite / Architectural (12.00 m²)" },
  { label: "Custom Dimensions", note: "Exact centimeter specifications" },
];

const PILE_PRESETS = [
  {
    id: "sculptural",
    title: "Sculptural Multi-Level (16mm/10mm)",
    desc: "Hand-beveled high & low relief pile for tactile 3D shadow play",
  },
  {
    id: "dense-plush",
    title: "Dense High Plush (14mm)",
    desc: "Ultra-sumptuous cloud-like Highland wool cushion throughout",
  },
  {
    id: "low-profile",
    title: "Dual Texture: Cut & Loop",
    desc: "Architectural ribbing with clean definition for high-traffic zones",
  },
];

const PALETTE_OPTIONS = [
  { label: "Warm Neutrals & Raw Wool", colors: ["#ECE8E1", "#D8D0C5", "#8C8275"] },
  { label: "Earthy Terracotta & Ochre", colors: ["#C06C47", "#D49B55", "#4A3228"] },
  { label: "Deep Forest & Botanical Olive", colors: ["#2B3E2C", "#556447", "#E2DCD0"] },
  { label: "High-Contrast Monochrome", colors: ["#171717", "#EFEFEF", "#828282"] },
  { label: "Mineral Indigo & Basalt Slate", colors: ["#1F3A52", "#9E3D31", "#E6C687"] },
  { label: "Custom Swatch / Pantone Match", colors: ["#B8A99A", "#685F56", "#E8E3DD"] },
];

const BUDGET_RANGES = [
  "320,000 – 600,000 RWF (~$240–$450)",
  "600,000 – 1,200,000 RWF (~$450–$900)",
  "1,200,000 – 2,500,000 RWF (~$900–$1,900)",
  "2,500,000+ RWF (~$1,900+)",
  "Atelier guidance requested based on design",
];

const TIMELINE_OPTIONS = [
  "Standard Atelier Craft (3 to 4 weeks)",
  "Specific event / Move-in deadline",
  "Flexible / Planning ahead",
];

const STAGES = [
  { id: 1, title: "Client Details", subtitle: "Name & preferred contact" },
  { id: 2, title: "Space & Scale", subtitle: "Room, shape & dimensions" },
  { id: 3, title: "Fiber & Palette", subtitle: "Pile relief, colors & upload" },
  { id: 4, title: "Review & Submit", subtitle: "Timeline, budget & brief" },
];

function CustomPage() {
  const submit = useServerFn(submitCustomRequest);
  const syncPartial = useServerFn(syncPartialBespokeLead);
  const uploadInspiration = useServerFn(uploadCustomerInspirationFile);

  const formTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistent Lead ID so partial leads match final submission in CRM
  const [leadId] = useState<string>(
    () => `lead_bespoke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  // Step state (1 to 4)
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageError, setStageError] = useState<string>("");

  // Stage 1: Contact & Delivery Location
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [preferredContact, setPreferredContact] = useState<"whatsapp" | "email">("whatsapp");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("Kigali, Rwanda");

  // Stage 2: Room, Shape & Size
  const [selectedRoom, setSelectedRoom] = useState<string>("Living Room");
  const [selectedShape, setSelectedShape] = useState<string>("rectangular");
  const [selectedSizePreset, setSelectedSizePreset] = useState<string>("200 × 300 cm");
  const [customLength, setCustomLength] = useState<string>("240");
  const [customWidth, setCustomWidth] = useState<string>("170");

  // Stage 3: Fiber, Texture, Palette & References
  const [selectedPile, setSelectedPile] = useState<string>("sculptural");
  const [selectedPalette, setSelectedPalette] = useState<string>("Warm Neutrals & Raw Wool");
  const [referenceLink, setReferenceLink] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [fileScanning, setFileScanning] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Stage 4: Timeline, Budget & Final Notes
  const [selectedBudget, setSelectedBudget] = useState<string>("600,000 – 1,200,000 RWF (~$450–$900)");
  const [selectedTimeline, setSelectedTimeline] = useState<string>("Standard Atelier Craft (3 to 4 weeks)");
  const [designNotes, setDesignNotes] = useState<string>("");

  // Overall Submission state
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const scrollToFormTop = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const effectiveSize =
    selectedSizePreset === "Custom Dimensions"
      ? `Custom: ${customLength || "0"} × ${customWidth || "0"} cm`
      : selectedSizePreset;

  // File Upload Handler with Security Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setFileScanning(true);
    setUploadedFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFilePreview(null);
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await uploadInspiration({
        data: { filename: file.name, dataUrl },
      });

      if (res?.ok && res.url) {
        setUploadedFileUrl(res.url);
        setUploadedFileName(res.filename);
      }
    } catch (err: any) {
      console.error("[Upload Security Alert]", err);
      setFileError(err?.message || "File failed security check.");
      setUploadedFileUrl(null);
      setUploadedFileName(null);
      setUploadedFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setFileScanning(false);
    }
  };

  const removeFile = () => {
    setUploadedFileName(null);
    setUploadedFilePreview(null);
    setUploadedFileUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Asynchronously sync partial lead to CRM at each step
  const pushPartialLeadToCrm = async (stage: number) => {
    try {
      const { getAttributionPayload } = await import("@/lib/attribution");
      const { getConsentPreferences } = await import("@/lib/consent");
      const attr = getAttributionPayload();
      const consent = getConsentPreferences();

      const briefSummary = [
        `Placement: ${selectedRoom}`,
        `Shape: ${selectedShape}`,
        `Dimensions: ${effectiveSize}`,
        `Pile: ${selectedPile}`,
        `Palette: ${selectedPalette}`,
        `Budget: ${selectedBudget}`,
      ].join(" | ");

      await syncPartial({
        data: {
          lead_id: leadId,
          customer_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: deliveryLocation.trim(),
          preferred_contact: preferredContact,
          stage_reached: stage,
          partial_brief: briefSummary,
          firstTouch: attr.firstTouch,
          lastTouch: attr.lastTouch,
          fbp: attr.fbp,
          fbc: attr.fbc,
          consentStatus: consent ? (consent.marketing ? "granted" : "essential_only") : "undecided",
        },
      });
    } catch (e) {
      console.warn("[CRM] Progressive sync background notice:", e);
    }
  };

  // Stage 1 -> Stage 2 Validation & CRM Sync
  const handleProceedFromStage1 = async () => {
    setStageError("");
    if (!name.trim()) {
      setStageError("Please provide your name so our atelier master tufter can address you.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setStageError("Please provide either your email or WhatsApp number to receive your digital render.");
      return;
    }
    if (email.trim() && !email.includes("@")) {
      setStageError("Please enter a valid email address.");
      return;
    }

    // Immediately capture lead into CRM so unfinished forms are preserved
    pushPartialLeadToCrm(1);

    setCurrentStage(2);
    scrollToFormTop();
  };

  // Stage 2 -> Stage 3
  const handleProceedFromStage2 = () => {
    setStageError("");
    pushPartialLeadToCrm(2);
    setCurrentStage(3);
    scrollToFormTop();
  };

  // Stage 3 -> Stage 4
  const handleProceedFromStage3 = () => {
    setStageError("");
    pushPartialLeadToCrm(3);
    setCurrentStage(4);
    scrollToFormTop();
  };

  // Final Submission Handler
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const fullDescription = [
      `--- BESPOKE COMMISSION BRIEF ---`,
      `Placement: ${selectedRoom}`,
      `Shape: ${selectedShape}`,
      `Dimensions: ${effectiveSize}`,
      `Pile Relief: ${selectedPile}`,
      `Palette: ${selectedPalette}`,
      `Timeline: ${selectedTimeline}`,
      `Budget: ${selectedBudget}`,
      `Preferred Contact: ${preferredContact.toUpperCase()}`,
      `Delivery Location: ${deliveryLocation.trim()}`,
      referenceLink.trim() ? `Moodboard / Reference Link: ${referenceLink.trim()}` : null,
      uploadedFileName
        ? `Attached Artwork: ${uploadedFileName}${uploadedFileUrl ? ` (${uploadedFileUrl})` : ""}`
        : null,
      designNotes.trim() ? `\nDesign Notes & Interior Vision:\n${designNotes.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { getAttributionPayload } = await import("@/lib/attribution");
      const { getConsentPreferences } = await import("@/lib/consent");
      const attr = getAttributionPayload();
      const consent = getConsentPreferences();
      const eventId = `mosiac_lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await submit({
        data: {
          lead_id: leadId,
          customer_name: name.trim(),
          email: email.trim() || "",
          phone: phone.trim() || "",
          description: fullDescription,
          preferred_size: effectiveSize,
          budget_range: selectedBudget,
          firstTouch: attr.firstTouch,
          lastTouch: attr.lastTouch,
          fbp: attr.fbp,
          fbc: attr.fbc,
          consentStatus: consent ? (consent.marketing ? "granted" : "essential_only") : "undecided",
          eventId,
        },
      });

      // Estimated value calculation for Meta Value Optimization (ROAS)
      let dynamicLeadValue = 750000;
      if (selectedBudget.includes("Under 600,000")) dynamicLeadValue = 450000;
      else if (selectedBudget.includes("600,000 – 1,200,000")) dynamicLeadValue = 900000;
      else if (selectedBudget.includes("1,200,000 – 2,500,000")) dynamicLeadValue = 1850000;
      else if (selectedBudget.includes("2,500,000+")) dynamicLeadValue = 2800000;

      // Meta CAPI & Pixel Lead Event
      const { trackMetaEvent } = await import("@/lib/meta-client");
      await trackMetaEvent(
        "Lead",
        {
          contentName: "Bespoke Custom Rug Commission",
          leadType: "bespoke_custom_commission",
          value: dynamicLeadValue,
          currency: "RWF",
          budgetRange: selectedBudget,
          preferredSize: effectiveSize,
          roomPlacement: selectedRoom,
          shape: selectedShape,
          hasArtwork: Boolean(uploadedFileUrl || referenceLink),
        },
        {
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          firstName: name.trim().split(" ")[0] || undefined,
          lastName: name.trim().split(" ").slice(1).join(" ") || undefined,
          city: deliveryLocation.split(",")[0]?.trim() || "Kigali",
          country: "rw",
        }
      );

      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("[Submission error]", err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not submit brief. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="w-full max-w-full overflow-x-clip pb-24">
        {/* HEADER: Ultra-Chic Minimalist Editorial Header (No colored dots, no badges) */}
        <section className="container-x mx-auto max-w-[1240px] pt-12 pb-8 md:pt-16 md:pb-12">
          <div className="max-w-4xl">
            <span className="eyebrow text-muted-foreground font-mono tracking-[0.24em]">
              Bespoke Studio Commissions
            </span>

            <h1 className="mt-3 font-display text-4xl sm:text-6xl md:text-7xl lg:text-[4.75rem] font-normal tracking-tight text-foreground leading-[1.04]">
              Commission your{" "}
              <span className="font-serif italic font-normal text-foreground">
                one-of-one
              </span>{" "}
              rug.
            </h1>

            <p className="mt-5 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl font-light">
              From room sketches and fabric swatches to custom graphic silhouettes: our Kigali artisans tuft, bevel, and deliver bespoke Highland wool rugs in 3 to 4 weeks.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-mono uppercase tracking-wider text-muted-foreground/80 border-t border-border/40 pt-4">
              <span>100% East African Highland Wool</span>
              <span className="text-border">/</span>
              <span>Hand-Tufted &amp; Sculpted in Kigali</span>
              <span className="text-border">/</span>
              <span>Worldwide White-Glove Delivery</span>
            </div>
          </div>
        </section>

        {/* SUCCESS CONFIRMATION STATE */}
        {status === "success" ? (
          <section className="container-x mx-auto max-w-[800px] py-12">
            <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-sm text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-foreground/5 text-foreground mb-6">
                <CheckCircle2 className="h-8 w-8 stroke-[1.5]" />
              </div>
              <span className="eyebrow text-muted-foreground">Brief Confirmed</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
                Thank you, {name || "friend"}.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto font-light">
                Your custom commission brief has been transmitted directly to our Kigali atelier master tufter. We will review your dimensions, palette, and shape to formulate your digital render and quote within 24 to 48 hours.
              </p>

              <div className="mt-8 p-5 rounded-2xl bg-muted/20 border border-border/60 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto space-y-1.5 text-left">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">Next Steps:</p>
                <p>1. Studio team verifies Highland wool inventory &amp; dye codes</p>
                <p>2. Scaled digital render sent to your {preferredContact === "whatsapp" ? "WhatsApp" : "Email"}</p>
                <p>3. Tufting begins upon your final approval (3 to 4 week craft turnaround)</p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`https://wa.me/250788000000?text=Hello%20Mosiac%20Atelier%2C%20I%20just%20submitted%20a%20custom%20order%20for%20${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest font-semibold text-background inline-flex items-center gap-2 hover:bg-foreground/90 transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message Atelier on WhatsApp</span>
                </a>
                <Link
                  to="/catalogue"
                  className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest font-semibold text-foreground hover:bg-muted/40 transition-all"
                >
                  Browse Finished Rugs
                </Link>
              </div>
            </div>
          </section>
        ) : (
          /* MULTI-STAGE STEPPED FORM SECTION */
          <section ref={formTopRef} className="container-x mx-auto max-w-[1240px]">
            {/* STAGE PROGRESS INDICATOR */}
            <div className="mb-8 border-y border-border/50 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STAGES.map((s) => {
                  const isActive = currentStage === s.id;
                  const isDone = currentStage > s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        // Allow clicking back to completed steps
                        if (isDone) setCurrentStage(s.id);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        isDone ? "cursor-pointer hover:bg-muted/30" : ""
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-mono transition-colors ${
                          isActive
                            ? "bg-foreground text-background font-semibold"
                            : isDone
                            ? "border border-foreground/30 bg-foreground/5 text-foreground"
                            : "border border-border text-muted-foreground/60"
                        }`}
                      >
                        {isDone ? "✓" : s.id}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 truncate hidden sm:block">
                          {s.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* LEFT / MAIN COLUMN: Active Stage Form */}
              <div className="lg:col-span-8">
                {stageError && (
                  <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs font-medium text-destructive">
                    {stageError}
                  </div>
                )}

                {/* ========================================================= */}
                {/* STAGE 1: FIRST THINGS FIRST -> CLIENT IDENTITY & CONTACT */}
                {/* ========================================================= */}
                {currentStage === 1 && (
                  <form onSubmit={handleProceedFromStage1} className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Stage 01 of 04
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                        First, tell us who we're weaving for.
                      </h2>
                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        We capture your contact early so our master tufter can formulate and send scaled color renderings and wool yarn samples directly to you.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                          Full Name <span className="text-foreground font-semibold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Sonia Mugabo"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                            Email Address <span className="text-foreground font-semibold">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="sonia@example.rw"
                              className="w-full rounded-xl border border-border bg-background px-4 py-3 pl-10 text-sm focus:border-foreground focus:outline-hidden"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                            Phone / WhatsApp <span className="text-foreground font-semibold">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+250 788 123 456"
                              className="w-full rounded-xl border border-border bg-background px-4 py-3 pl-10 text-sm focus:border-foreground focus:outline-hidden"
                            />
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                            Delivery City / Location
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={deliveryLocation}
                              onChange={(e) => setDeliveryLocation(e.target.value)}
                              placeholder="Kigali, Rwanda (or International)"
                              className="w-full rounded-xl border border-border bg-background px-4 py-3 pl-10 text-sm focus:border-foreground focus:outline-hidden"
                            />
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                            Preferred Channel for Mockups
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPreferredContact("whatsapp")}
                              className={`rounded-xl border py-3 px-3 text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                                preferredContact === "whatsapp"
                                  ? "border-foreground bg-foreground text-background font-semibold"
                                  : "border-border bg-background hover:bg-muted/30 text-foreground"
                              }`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferredContact("email")}
                              className={`rounded-xl border py-3 px-3 text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                                preferredContact === "email"
                                  ? "border-foreground bg-foreground text-background font-semibold"
                                  : "border-border bg-background hover:bg-muted/30 text-foreground"
                              }`}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span>Email</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Continue to Placement &amp; Scale</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================= */}
                {/* STAGE 2: DESIRED RUG DETAILS -> ROOM, SILHOUETTE & SIZE */}
                {/* ========================================================= */}
                {currentStage === 2 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProceedFromStage2();
                    }}
                    className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-8"
                  >
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Stage 02 of 04
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                        Space, Silhouette &amp; Proportions
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Specify where this piece will anchor your space and choose your architectural outline.
                      </p>
                    </div>

                    {/* A. Room Placement */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        1. Room Placement
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {ROOM_OPTIONS.map((room) => {
                          const isSelected = selectedRoom === room;
                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => setSelectedRoom(room)}
                              className={`rounded-xl px-3.5 py-3 text-left text-xs font-medium transition-all flex items-center justify-between border cursor-pointer ${
                                isSelected
                                  ? "border-foreground bg-foreground text-background shadow-xs font-semibold"
                                  : "border-border bg-background text-foreground/80 hover:border-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <span className="truncate">{room}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. Silhouette & Shape */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        2. Architectural Silhouette
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SHAPE_OPTIONS.map((shape) => {
                          const isSelected = selectedShape === shape.id;
                          return (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => setSelectedShape(shape.id)}
                              className={`rounded-xl p-4 text-left transition-all border cursor-pointer ${
                                isSelected
                                  ? "border-foreground bg-muted/40 shadow-xs"
                                  : "border-border bg-background hover:border-foreground/30 hover:bg-muted/20"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                  {shape.label}
                                </span>
                                {isSelected && (
                                  <span className="h-2 w-2 rounded-full bg-foreground" />
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                {shape.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* C. Dimensions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          3. Dimensions &amp; Scale
                        </label>
                        <span className="text-xs text-muted-foreground font-mono">
                          Selected: {effectiveSize}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SIZE_PRESETS.map((preset) => {
                          const isSelected = selectedSizePreset === preset.label;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setSelectedSizePreset(preset.label)}
                              className={`rounded-xl p-3.5 text-left transition-all border flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "border-foreground bg-foreground text-background shadow-xs font-medium"
                                  : "border-border bg-background hover:border-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <div>
                                <p className="text-xs font-semibold">{preset.label}</p>
                                <p
                                  className={`text-[10px] mt-0.5 ${
                                    isSelected ? "text-background/80" : "text-muted-foreground"
                                  }`}
                                >
                                  {preset.note}
                                </p>
                              </div>
                              {isSelected && <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Dimension Inputs */}
                      {selectedSizePreset === "Custom Dimensions" && (
                        <div className="mt-4 p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">
                            Enter your exact room dimensions in centimeters:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                                Length (cm)
                              </label>
                              <input
                                type="number"
                                min="50"
                                max="1000"
                                value={customLength}
                                onChange={(e) => setCustomLength(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                                Width (cm)
                              </label>
                              <input
                                type="number"
                                min="50"
                                max="1000"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-hidden"
                              />
                            </div>
                          </div>
                          {customLength && customWidth && (
                            <p className="text-xs font-mono text-muted-foreground">
                              Surface Area: ~
                              {((parseFloat(customLength) * parseFloat(customWidth)) / 10000).toFixed(2)}{" "}
                              m²
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStage(1);
                          scrollToFormTop();
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Client Details</span>
                      </button>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Continue to Fiber &amp; Palette</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================= */}
                {/* STAGE 3: FIBER, TEXTURE, PALETTE & VISUAL REFERENCES */}
                {/* ========================================================= */}
                {currentStage === 3 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProceedFromStage3();
                    }}
                    className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-8"
                  >
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Stage 03 of 04
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                        Fiber, Pile Relief &amp; Palette
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        100% East African Highland Wool, tufted with tactile 3D carving and tailored color harmony.
                      </p>
                    </div>

                    {/* A. Pile & Relief Carving */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        1. Pile Relief &amp; Sculpting Style
                      </label>
                      <div className="space-y-2.5">
                        {PILE_PRESETS.map((p) => {
                          const isSelected = selectedPile === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPile(p.id)}
                              className={`w-full rounded-xl p-4 text-left transition-all border flex items-start justify-between cursor-pointer ${
                                isSelected
                                  ? "border-foreground bg-muted/40 shadow-xs"
                                  : "border-border bg-background hover:border-foreground/30 hover:bg-muted/20"
                              }`}
                            >
                              <div>
                                <p className="text-xs font-semibold text-foreground">{p.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                              </div>
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-foreground shrink-0 mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. Color Palette */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        2. Color Palette Direction
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PALETTE_OPTIONS.map((pal) => {
                          const isSelected = selectedPalette === pal.label;
                          return (
                            <button
                              key={pal.label}
                              type="button"
                              onClick={() => setSelectedPalette(pal.label)}
                              className={`rounded-xl p-3.5 text-left transition-all border flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "border-foreground bg-muted/40 shadow-xs"
                                  : "border-border bg-background hover:border-foreground/40 hover:bg-muted/20"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-semibold truncate text-foreground">
                                  {pal.label}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                  {pal.colors.map((c, i) => (
                                    <span
                                      key={i}
                                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                              {isSelected && <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* C. Reference & Inspiration Upload */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        3. Visual References &amp; Sketches (Optional)
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Upload room photos, fabric swatches, sketches, or artwork (JPG, PNG, WEBP, PDF up to 9.5MB).
                      </p>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-foreground/40 hover:bg-muted/20 transition-all"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-xs font-medium text-foreground">
                          {uploadedFileName ? uploadedFileName : "Click or drag files here to upload"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Scanned for malware integrity before storage
                        </p>
                      </div>

                      {uploadedFilePreview && (
                        <div className="relative inline-block mt-2">
                          <img
                            src={uploadedFilePreview}
                            alt="Upload preview"
                            className="h-20 w-20 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <div className="pt-2">
                        <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                          Or Paste Moodboard / Pinterest / Figma Link
                        </label>
                        <input
                          type="url"
                          value={referenceLink}
                          onChange={(e) => setReferenceLink(e.target.value)}
                          placeholder="https://pinterest.com/..."
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs focus:border-foreground focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStage(2);
                          scrollToFormTop();
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Placement &amp; Scale</span>
                      </button>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Continue to Investment &amp; Review</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================= */}
                {/* STAGE 4: INVESTMENT, TIMELINE & FINAL SUBMIT */}
                {/* ========================================================= */}
                {currentStage === 4 && (
                  <form onSubmit={handleFinalSubmit} className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-8">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Stage 04 of 04
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                        Investment, Timeline &amp; Review
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Select your preferred investment tier and add any specific design notes for our tufters.
                      </p>
                    </div>

                    {/* A. Investment Bracket */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        1. Estimated Investment Range
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {BUDGET_RANGES.map((b) => {
                          const isSelected = selectedBudget === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setSelectedBudget(b)}
                              className={`rounded-xl p-3 text-left text-xs font-medium transition-all border flex items-center justify-between ${
                                isSelected
                                  ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                                  : "border-border bg-background hover:border-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <span className="truncate">{b}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. Timeline */}
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        2. Target Turnaround
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {TIMELINE_OPTIONS.map((t) => {
                          const isSelected = selectedTimeline === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTimeline(t)}
                              className={`rounded-xl p-3 text-left text-xs font-medium transition-all border flex items-center justify-between ${
                                isSelected
                                  ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                                  : "border-border bg-background hover:border-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <span className="truncate">{t}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* C. Additional Design Notes */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        3. Specific Design Notes &amp; Architectural Context
                      </label>
                      <textarea
                        rows={3}
                        value={designNotes}
                        onChange={(e) => setDesignNotes(e.target.value)}
                        placeholder="Mention door swing clearances, furniture placement, underfloor heating, or special color matching..."
                        className="w-full rounded-xl border border-border bg-background p-3.5 text-xs focus:border-foreground focus:outline-hidden"
                      />
                    </div>

                    {/* D. Full Brief Summary Card */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-2.5 text-xs">
                      <p className="font-semibold text-foreground uppercase tracking-wider font-mono">
                        Commission Summary for {name || "Client"}:
                      </p>
                      <div className="grid grid-cols-2 gap-y-1.5 text-muted-foreground text-[11px]">
                        <div><span className="text-foreground">Contact:</span> {preferredContact.toUpperCase()} ({phone || email})</div>
                        <div><span className="text-foreground">Delivery:</span> {deliveryLocation}</div>
                        <div><span className="text-foreground">Space:</span> {selectedRoom}</div>
                        <div><span className="text-foreground">Shape &amp; Size:</span> {selectedShape} · {effectiveSize}</div>
                        <div><span className="text-foreground">Pile Relief:</span> {selectedPile}</div>
                        <div><span className="text-foreground">Palette:</span> {selectedPalette}</div>
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-destructive font-medium">{errorMsg}</p>
                    )}

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStage(3);
                          scrollToFormTop();
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Texture &amp; Palette</span>
                      </button>

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-xs uppercase tracking-widest font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <span>{status === "loading" ? "Transmitting to Atelier..." : "Submit Bespoke Commission Brief"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT / SIDEBAR COLUMN: Atelier Process & Real-Time Specifications */}
              <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-6 space-y-6 shadow-2xs">
                  <div>
                    <h3 className="font-display text-lg font-medium tracking-tight text-foreground">
                      Bespoke Atelier Process
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Every piece is tufted by hand in our Kigali workshop.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-mono">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Digital Mockup &amp; Palette</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Within 24-48 hours, we share scaled 2D render and Pantone dye formulations.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-mono">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Hand-Tufting &amp; 3D Carving</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Artisans tuft Highland wool on vertical looms and hand-bevel sculptural reliefs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-mono">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Inspection &amp; White-Glove Delivery</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Latex backing cured, inspected, and delivered in Kigali or dispatched worldwide.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-3">
                    <p className="text-xs font-semibold text-foreground">Need instantaneous guidance?</p>
                    <a
                      href="https://wa.me/250788000000?text=Hello%20Mosiac%20Atelier%2C%20I%20have%20a%20question%20about%20a%20custom%20rug%20commission"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
