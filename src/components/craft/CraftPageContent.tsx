import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ShieldCheck,
  Feather,
  Layers,
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  BookOpen,
  Eye,
  Check,
  Award,
  Zap,
  ChevronRight,
  Send,
  MessageSquare,
  Sparkle,
} from "lucide-react";
import craft1 from "@/assets/craft-1.jpg";
import craft2 from "@/assets/craft-2.jpg";
import craftRoseTufting from "@/assets/craft-rose-tufting.jpg";
import craftBlueScallop from "@/assets/craft-blue-scallop.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import heritage2 from "@/assets/heritage-2.jpg";
import lookbookYellowRug from "@/assets/lookbook-yellow-rug.jpg";
import { RequestCallback } from "@/components/blocks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// 4-Layer Rug Anatomy
interface AnatomyLayer {
  id: string;
  name: string;
  shortDesc: string;
  depth: string;
  spec: string;
  longevity: string;
  composition: string;
  details: string;
  whyItMatters: string;
}

const ANATOMY_LAYERS: AnatomyLayer[] = [
  {
    id: "wool-pile",
    name: "1. 100% Pure Highland Wool Pile",
    shortDesc: "High-altitude fleece chosen for spring-back crimp and natural lanolin.",
    depth: "14mm – 28mm Sculpted Pile",
    spec: "50,000 – 72,000 tufts / m²",
    longevity: "30+ years without pile crush",
    composition: "100% Pure Virgin Highland & New Zealand Wool",
    details:
      "Unlike synthetic plastic fibres that flatten under pressure, pure high-altitude wool contains a natural cellular crimp. This crimp acts like microscopic coiled springs that bounce back beneath furniture and heavy footfall.",
    whyItMatters:
      "Natural lanolin coats every wool cuticular scale, creating an organic barrier against coffee, wine, and water spills before they soak into the yarn core.",
  },
  {
    id: "monks-cloth",
    name: "2. Heavy Tension Primary Monk's Cloth",
    shortDesc: "Double-warp woven base stretched under immense mechanical tension.",
    depth: "1.8mm Woven Matrix",
    spec: "Heavyweight 26×26 warp/weft density",
    longevity: "Structural backbone of the rug",
    composition: "Dense Poly-Cotton Canvas Weave",
    details:
      "Before any tufting begins, our artisans stretch heavy monk's cloth across vertical timber frames until it sounds like a drumhead when tapped. This uniform tension ensures every tuft loop penetrates to the exact millimeter depth.",
    whyItMatters:
      "Prevents dimensional warping, diagonal sagging, and edge curling over decades of humidity changes in residential and commercial spaces.",
  },
  {
    id: "botanical-latex",
    name: "3. Vulcanized Botanical Natural Latex",
    shortDesc: "Cold-cured organic rubber milk sealing yarn roots permanently.",
    depth: "2.5mm Flexible Seal",
    spec: "Zero toxic synthetic VOCs / 100% Solvent-Free",
    longevity: "Permanently fuses wool tufts to backing",
    composition: "Natural Botanical Tree Rubber Emulsion",
    details:
      "We reject petroleum-based synthetic adhesives and formaldehydes commonly found in commercial carpets. We apply pure botanical latex compound by hand trowel, forcing the rubber milk deep into the roots of each individual wool knot.",
    whyItMatters:
      "Zero off-gassing into your home's air, odorless upon unrolling, and resistant to dry-rotting or powdery degradation when exposed to floor heating.",
  },
  {
    id: "cotton-backing",
    name: "4. Heavy Unbleached Cotton Twill & Edge-Lock",
    shortDesc: "Non-abrasive furniture-grade secondary backing with studio twill tape.",
    depth: "3.0mm Foundation",
    spec: "480 GSM Cotton Canvas + Herringbone Twill Binding",
    longevity: "Protects delicate hardwood and stone floors",
    composition: "100% Unbleached Cotton Canvas",
    details:
      "The final structural stage is laminating a dense, breathable unbleached cotton secondary backing. The perimeter is double-folded and edge-locked by hand with heavyweight herringbone twill binding tape.",
    whyItMatters:
      "No abrasive rubber backing that scratches oiled oak, parquet, or marble flooring. Completely safe for heated floors and allows moisture to breathe.",
  },
];

// Savoir-Faire 5-Stage Process
const ATELIER_STAGES = [
  {
    number: "01",
    phase: "The Fleece & The Kettle",
    subtitle: "Raw Material Selection & Boutique Dyeing",
    duration: "4–6 days",
    artisan: "Master Dye Alchemist",
    image: hero1,
    desc: "Every Mosiac creation begins with raw virgin wool fleece from high-altitude flocks. Yarns are inspected for staple length (minimum 85mm) and micron diameter (29–34µm) to guarantee maximum floor resilience. Yarns are steeped in boutique copper kettles using pH-balanced, environmentally certified dyes to achieve profound chromatic saturation and UV lightfastness.",
    specs: ["29–34µm Micron Resilience", "Small-batch copper vat immersion", "Zero petroleum microplastics", "Natural lanolin coating intact"],
  },
  {
    number: "02",
    phase: "The Loom & The Gun",
    subtitle: "Tension Stretcher & High-Density Tufting",
    duration: "8–14 days",
    artisan: "Master Tufter",
    image: craftRoseTufting,
    desc: "On vertical eucalyptus-timber frames, primary backing is stretched under measured mechanical tension. The design silhouette is hand-drawn to millimeter scale using archival carbon transfer. Armed with pneumatic and handheld tufting machines, master artisans shoot thousands of wool yarn strands per minute through the cloth, packing over 50,000 tufts into every square meter.",
    specs: ["Over 50,000 tufts per square meter", "Hand-calibrated pneumatic loop velocity", "Seamless curve and organic silhouette control", "Multi-ply yarn blending for optical depth"],
  },
  {
    number: "03",
    phase: "The Vulcanized Core",
    subtitle: "Botanical Latex Fusion & Secondary Backing",
    duration: "3–4 days",
    artisan: "Backing Specialist",
    image: craft1,
    desc: "While still mounted under full loom tension to prevent shrinkage, the reverse face of the tufted wool is sealed with pure botanical liquid rubber milk. The latex penetrates the sheared loops, locking every strand into an unbreakable mechanical bond. A heavy 480 GSM unbleached cotton twill backing is smoothed across the surface and left to cure at ambient Rwandan plateau temperatures.",
    specs: ["Solvent-free botanical tree latex", "Zero VOC emissions / hypoallergenic", "480 GSM unbleached heavy cotton canvas", "Ambient curing prevents thermal distortion"],
  },
  {
    number: "04",
    phase: "The Sculptural Carve",
    subtitle: "Duckbill Shearing & 3D Contour Relief",
    duration: "4–7 days",
    artisan: "Sculptural Carving Master",
    image: craftBlueScallop,
    desc: "This is Mosiac's signature distinction. The cured rug is brought onto flat crafting tables where a master carver uses angled offset duckbill shears and micro-clippers entirely freehand. Every colour boundary, line, and arc is cut at a 45-degree inward bevel, creating distinct visual shadow lines that turn a graphic carpet into a dimensional architectural relief.",
    specs: ["100% freehand duckbill shear relief", "Tactile 45-degree border beveling", "Multi-height pile variation (14mm to 26mm)", "Shadow play under natural daylight"],
  },
  {
    number: "05",
    phase: "The Edge-Lock & Serial Seal",
    subtitle: "Perimeter Stitching, Shearing, & Archival Patch",
    duration: "2–3 days",
    artisan: "Studio Finisher",
    image: craft2,
    desc: "The rug is sheared to an even velvet touch with industrial planar blades to remove microscopic loose fibres. The outer border is turned by hand and bound with studio-grade herringbone cotton tape. Finally, each piece receives its numbered atelier provenance label—hand-signed and dated by the lead artisan responsible for its making.",
    specs: ["Hand-bound herringbone twill perimeter", "High-vacuum lint extraction & inspection", "Signed & dated archival atelier patch", "Shipped in breathable organic cotton roll"],
  },
];

// Technical Comparison Matrix
const COMPARISONS = [
  {
    feature: "Primary Pile Composition",
    mosiac: "100% Pure Virgin Highland & New Zealand Wool",
    massMachine: "100% Petroleum Polypropylene or Printed Nylon",
    commercialTufted: "Synthetic Wool Blend (30% acrylic / 70% poly)",
  },
  {
    feature: "Pile Density & Weight",
    mosiac: "4.5 – 5.2 kg / m² (Dense, heavy, acoustic absorbent)",
    massMachine: "1.2 – 1.8 kg / m² (Lightweight, slips easily)",
    commercialTufted: "2.2 – 2.8 kg / m² (Moderate pile density)",
  },
  {
    feature: "Dimensional Beveling",
    mosiac: "Hand-carved 3D relief with duckbill offset shears",
    massMachine: "Completely flat printed surface (0 relief)",
    commercialTufted: "Machine groove embossing (shallow & fragile)",
  },
  {
    feature: "Binding Adhesives",
    mosiac: "Botanical solvent-free natural vulcanized latex",
    massMachine: "Synthetic hot-melt glue with high VOCs",
    commercialTufted: "Chemical rubber compound (dries & powders)",
  },
  {
    feature: "Expected Life in Home",
    mosiac: "30+ Years (Heirloom quality, cleanable & restorable)",
    massMachine: "2 – 4 Years (Fibers mat, pill, and cannot be revived)",
    commercialTufted: "5 – 8 Years (Edges curl and backing delaminates)",
  },
  {
    feature: "Acoustic Noise Dampening",
    mosiac: "NRC 0.65 (Significantly absorbs room echo and footfall)",
    massMachine: "NRC 0.15 (Virtually zero acoustic insulation)",
    commercialTufted: "NRC 0.35 (Partial acoustic insulation)",
  },
  {
    feature: "Origin & Fair Labor",
    mosiac: "Kigali Atelier · 2.8× Regional Living Wage · Signed",
    massMachine: "Automated overseas factories · Anonymous",
    commercialTufted: "Industrial manufacturing plants · Unsigned",
  },
];

export function CraftPageContent() {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("wool-pile");
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [pileComparisonMode, setPileComparisonMode] = useState<"sculpted" | "flat">("sculpted");
  const [swatchModalOpen, setSwatchModalOpen] = useState(false);
  const [swatchFormSubmitted, setSwatchFormSubmitted] = useState(false);
  const [swatchName, setSwatchName] = useState("");
  const [swatchEmail, setSwatchEmail] = useState("");
  const [swatchAddress, setSwatchAddress] = useState("");

  const activeLayer =
    ANATOMY_LAYERS.find((l) => l.id === selectedLayerId) || ANATOMY_LAYERS[0];
  const activeStage = ATELIER_STAGES[activeStageIndex];

  const handleSwatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSwatchFormSubmitted(true);
  };

  return (
    <div className="w-full">
      {/* HERO SECTION: Editorial Atelier Statement */}
      <section className="border-b border-border/70 bg-[#FAF8F5] dark:bg-[#0E0E10] pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="container-x mx-auto max-w-[1400px]">
          {/* Header Metadata: Pure unboxed typography with dot separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-mono">
            <span>Atelier Mosiac</span>
            <span aria-hidden="true">·</span>
            <span>Kigali, Rwanda</span>
            <span aria-hidden="true">·</span>
            <span>Est. 2021</span>
            <span aria-hidden="true">·</span>
            <span className="text-accent font-semibold">Hand-Tufted Savoir-Faire</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-normal leading-[1.05] tracking-tight text-foreground">
                The Architecture of the <span className="font-serif italic font-light text-accent">Tuft</span>.
              </h1>
              <p className="mt-8 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-3xl">
                In an era of mass-printed synthetic carpets produced in minutes by anonymous overseas machines, Mosiac works backward.
                Every piece is tufted strand by strand on vertical timber looms in our Kigali studio using pure Highland wool,
                vulcanized with botanical rubber, and hand-carved with surgical duckbill shears.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-end space-y-4">
              <div className="border-l-2 border-accent pl-5 space-y-2">
                <span className="font-serif italic text-2xl text-foreground font-light block">
                  &ldquo;A rug is not floor covering. It is an architectural landscape.&rdquo;
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                  — Atelier Mosiac Studio Master
                </span>
              </div>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 active:scale-95 transition-all shadow"
                >
                  <span>Explore Pieces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSwatchModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>Request Wool Swatches</span>
                </button>
              </div>
            </div>
          </div>

          {/* Master Atelier Photo Montage */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="relative md:col-span-7 overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 aspect-[16/10] bg-neutral-900 group shadow-lg">
              <img
                src={craftRoseTufting}
                alt="Artisan tufting hand-dyed rose wool on vertical loom"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                  Plate 01 · High-Tension Loom Tufting
                </span>
                <p className="mt-1 text-sm font-medium text-white/90">
                  Individual wool loops inserted at 1,800 strokes per minute over heavy monk&apos;s cloth canvas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-5 gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-border/80 aspect-[16/11] md:aspect-auto md:h-full bg-neutral-900 group shadow-md">
                <img
                  src={craftBlueScallop}
                  alt="Sculptural micro-carving with duckbill scissors"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                    Plate 02 · Duckbill Shear Beveling
                  </span>
                  <p className="text-xs text-white/90 font-medium line-clamp-1">
                    Freehand 45° angled contour trimming along every colour junction.
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border/80 aspect-[16/11] md:aspect-auto md:h-full bg-neutral-900 group shadow-md">
                <img
                  src={craft2}
                  alt="Inspection and velvet planar shearing of pure Highland wool"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                    Plate 03 · Final Tactile Inspection
                  </span>
                  <p className="text-xs text-white/90 font-medium line-clamp-1">
                    Signed provenance label attached prior to white-glove packaging.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE 4-LAYER ANATOMY EXPLORER */}
      <section className="py-20 md:py-28 border-b border-border/70 bg-background">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <span className="eyebrow text-accent font-medium tracking-[0.2em]">
              Cross-Section Architecture
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-normal tracking-tight text-foreground">
              Built in 4 Layers. <span className="font-serif italic font-light text-accent">Engineered for 30+ Years</span>.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              Most store carpets consist of thin printed nylon glued to petroleum styrofoam.
              A Mosiac rug is an architectural sandwich of organic highland fleece, double-tension monk&apos;s cloth,
              botanical vulcanized rubber milk, and unbleached cotton twill. Select any layer to inspect its structural specs.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Layer Selector Buttons */}
            <div className="lg:col-span-5 space-y-3">
              {ANATOMY_LAYERS.map((layer, idx) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-foreground bg-foreground text-background shadow-lg scale-[1.01]"
                        : "border-border bg-card text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${isSelected ? "text-amber-300" : "text-muted-foreground"}`}>
                        Layer 0{idx + 1}
                      </span>
                      <span className={`text-[11px] font-mono ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                        {layer.depth}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                      {layer.name}
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                      {layer.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right: Selected Layer Deep Dive Card */}
            <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-accent font-medium">
                    Technical Specification
                  </span>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {activeLayer.name}
                  </h3>
                </div>
                <div className="rounded-full border border-border bg-muted/30 px-3.5 py-1 text-xs font-mono text-foreground">
                  {activeLayer.depth}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Material Composition & Sourcing
                  </h4>
                  <p className="mt-2 text-sm sm:text-base text-foreground font-light leading-relaxed">
                    {activeLayer.details}
                  </p>
                </div>

                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
                  <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Why This Matters for Decades of Living</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-foreground/90 leading-relaxed font-light">
                    {activeLayer.whyItMatters}
                  </p>
                </div>

                {/* Spec Indicators Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Density & Tolerances
                    </span>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
                      {activeLayer.spec}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Longevity Rating
                    </span>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
                      {activeLayer.longevity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 3D SCULPTURAL CARVING vs FLAT PILE COMPARISON */}
      <section className="py-20 md:py-28 border-b border-border/70 bg-[#FAF8F5] dark:bg-[#0E0E10]">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="eyebrow text-accent font-medium tracking-[0.2em]">
                The Signature Technique
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-foreground leading-[1.1]">
                Duckbill Shearing. <span className="font-serif italic font-light text-accent">Turning 2D Lines into 3D Shadows</span>.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                Standard rugs are manufactured completely flat—colors simply stop and start on a single plane.
                At Mosiac, our artisans spend hours with curved offset duckbill scissors beveling the boundary of every single shape at an inward 45-degree angle.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                As sunlight moves across your room throughout the day, the hand-cut trenches cast shifting micro-shadows across the wool,
                giving your rug a living sculptural presence that you feel under bare feet.
              </p>

              {/* Interactive View Toggle */}
              <div className="pt-2">
                <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Interactive Depth Simulation:
                </span>
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPileComparisonMode("sculpted")}
                    className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      pileComparisonMode === "sculpted"
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Mosiac 3D Sculpted Pile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPileComparisonMode("flat")}
                    className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      pileComparisonMode === "flat"
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Standard Flat Carpet
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-neutral-950 flex items-center justify-center">
                  <img
                    src={craftBlueScallop}
                    alt="Detail of hand-carved beveled wool pile"
                    className={`h-full w-full object-cover transition-all duration-700 ${
                      pileComparisonMode === "flat" ? "contrast-75 blur-[0.5px] scale-100" : "contrast-105 scale-105"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Dynamic Simulation Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-mono text-amber-300">
                      <Scissors className="h-3 w-3" />
                      <span>{pileComparisonMode === "sculpted" ? "3D Multi-Height Relief (18mm / 24mm)" : "Flat Single-Plane (10mm)"}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 text-white z-10">
                    <h4 className="font-display text-lg font-semibold">
                      {pileComparisonMode === "sculpted"
                        ? "Hand-Beveled Trench Contours"
                        : "Industrial Flat Plane (Zero Relief)"}
                    </h4>
                    <p className="mt-1 text-xs text-white/80 font-light leading-relaxed">
                      {pileComparisonMode === "sculpted"
                        ? "Each wool block is sheared independently at 45°, creating crisp tactile grooves that highlight the geometry under architectural lighting."
                        : "Commercial machine carpets have uniform loop height with no depth separation between colors, flattening the design completely."}
                    </p>
                  </div>
                </div>

                {/* Micro Metrics below */}
                <div className="mt-6 grid grid-cols-3 gap-3 text-center border-t border-border pt-5">
                  <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                    <span className="block text-[10px] font-mono text-muted-foreground uppercase">Low Contour</span>
                    <span className="block mt-0.5 text-sm font-semibold font-mono">14mm</span>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                    <span className="block text-[10px] font-mono text-muted-foreground uppercase">Plush Field</span>
                    <span className="block mt-0.5 text-sm font-semibold font-mono">18mm</span>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                    <span className="block text-[10px] font-mono text-muted-foreground uppercase">High Relief</span>
                    <span className="block mt-0.5 text-sm font-semibold font-mono">26mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 5-STAGE SAVOIR-FAIRE CHRONICLE */}
      <section className="py-20 md:py-28 border-b border-border/70 bg-background">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow text-accent font-medium tracking-[0.2em]">
                From Raw Fleece to Final Thread
              </span>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-normal tracking-tight text-foreground">
                The 5 Chapters of <span className="font-serif italic font-light text-accent">Making</span>.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md font-light leading-relaxed">
              Every single commission requires approximately 18 to 26 hours of dedicated artisan labor per square meter.
              Walk through the 5 essential chapters of the Kigali atelier method.
            </p>
          </div>

          {/* Interactive Chapter Steps Navigation */}
          <div className="mt-12 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {ATELIER_STAGES.map((stage, idx) => {
              const isActive = activeStageIndex === idx;
              return (
                <button
                  key={stage.number}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`shrink-0 rounded-2xl px-5 py-3.5 text-left border transition-all cursor-pointer ${
                    isActive
                      ? "border-foreground bg-foreground text-background shadow-md scale-[1.01]"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${isActive ? "text-amber-300" : "text-muted-foreground"}`}>
                    Chapter {stage.number}
                  </span>
                  <div className="mt-0.5 font-display text-sm font-semibold tracking-tight">
                    {stage.phase}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chapter Showcase Box */}
          <div className="mt-8 rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl sm:text-4xl font-bold text-accent">
                      {activeStage.number}
                    </span>
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                        {activeStage.subtitle}
                      </span>
                      <h3 className="font-display text-2xl sm:text-4xl font-semibold text-foreground tracking-tight">
                        {activeStage.phase}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-6 text-sm sm:text-base text-foreground/90 font-light leading-relaxed">
                    {activeStage.desc}
                  </p>

                  {/* Bullet Specs */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeStage.specs.map((spec) => (
                      <div key={spec} className="flex items-center gap-2 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
                  <div>
                    <span className="uppercase text-[10px] block">Dedicated Artisan</span>
                    <span className="font-semibold text-foreground text-xs">{activeStage.artisan}</span>
                  </div>
                  <div>
                    <span className="uppercase text-[10px] block">Standard Duration</span>
                    <span className="font-semibold text-foreground text-xs">{activeStage.duration}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={activeStageIndex === 0}
                      onClick={() => setActiveStageIndex((i) => Math.max(0, i - 1))}
                      className="px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={activeStageIndex === ATELIER_STAGES.length - 1}
                      onClick={() => setActiveStageIndex((i) => Math.min(ATELIER_STAGES.length - 1, i + 1))}
                      className="px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                    >
                      Next Chapter →
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo Side */}
              <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-neutral-950">
                <img
                  src={activeStage.image}
                  alt={activeStage.phase}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: COMPARATIVE STANDARDS MATRIX */}
      <section className="py-20 md:py-28 border-b border-border/70 bg-[#FAF8F5] dark:bg-[#0E0E10]">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <span className="eyebrow text-accent font-medium tracking-[0.2em]">
              Material Integrity Benchmarks
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-normal tracking-tight text-foreground">
              Mosiac Atelier vs. <span className="font-serif italic font-light text-accent">Commercial Alternatives</span>.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              We believe complete transparency is the foundation of luxury craftsmanship.
              Here is how Mosiac hand-tufted floor art compares to high-street factory machine carpets and commercial synthetic rugs.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-border bg-card shadow-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-5 font-semibold">Standard &amp; Feature</th>
                  <th className="py-4 px-5 font-bold text-foreground bg-foreground/5">Mosiac Hand-Tufted Atelier</th>
                  <th className="py-4 px-5">Mass Factory Machine Rug</th>
                  <th className="py-4 px-5">Commercial Tufted Blend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {COMPARISONS.map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-5 font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="py-4 px-5 font-semibold text-foreground bg-foreground/5">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{row.mosiac}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground">
                      {row.massMachine}
                    </td>
                    <td className="py-4 px-5 text-muted-foreground">
                      {row.commercialTufted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: KIGALI ATELIER ARTISANS & ETHICS */}
      <section className="py-20 md:py-28 border-b border-border/70 bg-background">
        <div className="container-x mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative">
              <div className="overflow-hidden rounded-3xl border border-border/80 aspect-[4/3] bg-neutral-900 shadow-xl group">
                <img
                  src={craft1}
                  alt="Kigali textile artisan tufting on wooden loom"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 hidden sm:block rounded-2xl border border-border bg-card p-5 shadow-2xl max-w-xs">
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold block">
                  Studio Living Wage Guarantee
                </span>
                <p className="mt-1 text-xs text-foreground leading-snug font-medium">
                  All 18 studio artisans earn at least 2.8× the regional textile benchmark with full comprehensive family healthcare.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="eyebrow text-accent font-medium tracking-[0.2em]">
                The Hands Behind the Wool
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-foreground leading-[1.1]">
                Preserving &amp; Elevating <span className="font-serif italic font-light text-accent">Rwandan Textile Artistry</span>.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                Rwanda has centuries of geometric textile heritage, from Imigongo bas-relief patterns to agaseke basketry.
                At Mosiac, we adapt these ancestral spatial principles to contemporary tufting engineering.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                We believe that ethical craftsmanship is non-negotiable. Our studio operates on an apprenticeship model where senior master weavers
                mentor emerging local artists in precision tufting, CAD silhouette translation, and sculptural carving.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">100%</span>
                  <span className="block text-xs text-muted-foreground font-light mt-0.5">
                    Made to order in Kigali studio
                  </span>
                </div>
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">18+</span>
                  <span className="block text-xs text-muted-foreground font-light mt-0.5">
                    Hours of handcrafting per m²
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: READY TO CREATE / BESPOKE CALLOUT */}
      <section className="py-20 md:py-28 bg-[#FAF8F5] dark:bg-[#0E0E10]">
        <div className="container-x mx-auto max-w-[1100px] text-center space-y-6">
          <span className="eyebrow text-accent font-medium tracking-[0.2em]">
            Commission Your One-of-a-Kind
          </span>
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-foreground">
            Bring the Atelier into <span className="font-serif italic font-light text-accent">Your Space</span>.
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
            Whether you are selecting a signature archival silhouette from our catalogue or commissioning a bespoke
            dimension tailored to your living room or penthouse, our master artisans craft each piece by hand.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/custom"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span>Start Custom Commission</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted active:scale-95 transition-all shadow-2xs"
            >
              <span>Browse Catalogue</span>
            </Link>
            <button
              type="button"
              onClick={() => setSwatchModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-accent hover:bg-accent/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Request Wool Swatch Pack</span>
            </button>
          </div>
        </div>
      </section>

      {/* SWATCH REQUEST MODAL */}
      <Dialog open={swatchModalOpen} onOpenChange={setSwatchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Request Atelier Wool Swatches
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-light">
              We dispatch a physical curated palette of hand-dyed 100% Highland wool pom-poms so you can feel the pile density and review exact color nuances in your home&apos;s lighting.
            </DialogDescription>
          </DialogHeader>

          {swatchFormSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-600">
                <Check className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h4 className="font-display text-lg font-bold">Swatch Pack Requested!</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Thank you, {swatchName}. Our Kigali studio team is preparing your wool yarn sample pack. We will contact you at{" "}
                <span className="font-semibold text-foreground">{swatchEmail}</span> with dispatch and tracking details.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSwatchModalOpen(false);
                  setSwatchFormSubmitted(false);
                }}
                className="mt-4 rounded-full bg-foreground px-6 py-2.5 text-xs font-semibold text-background uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSwatchSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={swatchName}
                  onChange={(e) => setSwatchName(e.target.value)}
                  placeholder="e.g. Diane Uwase"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={swatchEmail}
                  onChange={(e) => setSwatchEmail(e.target.value)}
                  placeholder="e.g. diane@domain.com"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Delivery Address / City *
                </label>
                <input
                  required
                  type="text"
                  value={swatchAddress}
                  onChange={(e) => setSwatchAddress(e.target.value)}
                  placeholder="e.g. Kigali, Rwanda or International address"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-foreground"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-wider text-background shadow transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                >
                  Confirm Wool Swatch Request →
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
