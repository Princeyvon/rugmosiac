/**
 * Size Guide Outline Presets and Dynamic Interpolator
 * Allows configuring custom architectural SVG outlines per product for the "Find your size" guide.
 */

export const HASSAN_OUTLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <!-- Arrowhead markers for dimension lines -->
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748B" />
    </marker>
  </defs>

  <style>
    .shape {
      fill: none;
      stroke: #2563EB;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .dim-line {
      stroke: #64748B;
      stroke-width: 1.5;
      stroke-dasharray: 4 4;
      marker-start: url(#arrow);
      marker-end: url(#arrow);
    }
    .ext-line {
      stroke: #CBD5E1;
      stroke-width: 1;
    }
    .label {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      fill: #475569;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>

  <!-- === 1. BASE SHAPES === -->
  <!-- Rectangle (x: 100, y: 150, width: 220, height: 150) -->
  <rect x="100" y="150" width="220" height="150" class="shape" />

  <!-- Circle (Center placed at top-right corner: x: 320, y: 150) -->
  <circle cx="320" cy="150" r="40" class="shape" />

  <!-- === 2. TOP DIMENSION (WIDTH) === -->
  <!-- Extension lines -->
  <line x1="100" y1="140" x2="100" y2="90" class="ext-line" />
  <line x1="320" y1="100" x2="320" y2="90" class="ext-line" />
  
  <!-- Dimension Line & Label -->
  <line x1="100" y1="100" x2="320" y2="100" class="dim-line" />
  <rect x="180" y="88" width="60" height="24" fill="#FFFFFF" rx="4" />
  <text x="210" y="100" class="label">{width_label}</text>

  <!-- === 3. LEFT DIMENSION (HEIGHT) === -->
  <!-- Extension lines -->
  <line x1="90" y1="150" x2="40" y2="150" class="ext-line" />
  <line x1="90" y1="300" x2="40" y2="300" class="ext-line" />
  
  <!-- Dimension Line & Label -->
  <line x1="50" y1="150" x2="50" y2="300" class="dim-line" />
  <rect x="20" y="213" width="60" height="24" fill="#FFFFFF" rx="4" />
  <text x="50" y="225" class="label">{height_label}</text>
</svg>`;

export const RECTANGLE_OUTLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748B" />
    </marker>
  </defs>
  <style>
    .shape { fill: none; stroke: #2563EB; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .dim-line { stroke: #64748B; stroke-width: 1.5; stroke-dasharray: 4 4; marker-start: url(#arrow); marker-end: url(#arrow); }
    .ext-line { stroke: #CBD5E1; stroke-width: 1; }
    .label { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 600; fill: #475569; text-anchor: middle; dominant-baseline: middle; }
  </style>
  <!-- Base Rectangle -->
  <rect x="110" y="140" width="280" height="180" class="shape" />
  <!-- Top Dimension (Width) -->
  <line x1="110" y1="130" x2="110" y2="85" class="ext-line" />
  <line x1="390" y1="130" x2="390" y2="85" class="ext-line" />
  <line x1="110" y1="95" x2="390" y2="95" class="dim-line" />
  <rect x="220" y="83" width="60" height="24" fill="#FFFFFF" rx="4" />
  <text x="250" y="95" class="label">{width_label}</text>
  <!-- Left Dimension (Height) -->
  <line x1="100" y1="140" x2="55" y2="140" class="ext-line" />
  <line x1="100" y1="320" x2="55" y2="320" class="ext-line" />
  <line x1="65" y1="140" x2="65" y2="320" class="dim-line" />
  <rect x="35" y="218" width="60" height="24" fill="#FFFFFF" rx="4" />
  <text x="65" y="230" class="label">{height_label}</text>
</svg>`;

export const CIRCULAR_OUTLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748B" />
    </marker>
  </defs>
  <style>
    .shape { fill: none; stroke: #2563EB; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .dim-line { stroke: #64748B; stroke-width: 1.5; stroke-dasharray: 4 4; marker-start: url(#arrow); marker-end: url(#arrow); }
    .ext-line { stroke: #CBD5E1; stroke-width: 1; }
    .label { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 600; fill: #475569; text-anchor: middle; dominant-baseline: middle; }
  </style>
  <!-- Base Circle -->
  <circle cx="250" cy="220" r="120" class="shape" />
  <!-- Diameter Dimension -->
  <line x1="130" y1="210" x2="130" y2="65" class="ext-line" />
  <line x1="370" y1="210" x2="370" y2="65" class="ext-line" />
  <line x1="130" y1="75" x2="370" y2="75" class="dim-line" />
  <rect x="215" y="63" width="70" height="24" fill="#FFFFFF" rx="4" />
  <text x="250" y="75" class="label">⌀ {width_label}</text>
</svg>`;

export const OUTLINE_PRESETS: Record<string, { label: string; code: string }> = {
  hassan: {
    label: "Hassan Rug (Rect + Geometric Accent)",
    code: HASSAN_OUTLINE_SVG,
  },
  rectangle: {
    label: "Standard Architectural Rectangle",
    code: RECTANGLE_OUTLINE_SVG,
  },
  circular: {
    label: "Architectural Circular / Round Rug",
    code: CIRCULAR_OUTLINE_SVG,
  },
};

/**
 * Resolves the SVG code for a given product.
 * If the product has a custom size_guide_svg stored in DB/JSON, that takes highest priority.
 * If the product slug is 'hassan', it defaults to the Hassan SVG blueprint.
 */
export function getProductOutlineSvg(
  slug?: string | null,
  customSvg?: string | null,
): string | null {
  if (customSvg && customSvg.trim().length > 0) {
    return customSvg.trim();
  }
  if (slug === "hassan") {
    return HASSAN_OUTLINE_SVG;
  }
  return null;
}

/**
 * Interpolates dynamic size labels into the SVG code.
 * Handles both templated tokens ({width_label}, {height_label}, {width}, {height})
 * and directly hardcoded dimensions (e.g. 220 cm / 150 cm in the user's snippet).
 */
export function interpolateOutlineSvg(
  rawSvg: string,
  params: {
    wLabel: string;
    hLabel: string;
    widthCm: number;
    heightCm: number;
    units: "metric" | "imperial";
  },
): string {
  let svg = rawSvg;

  // 1. Replace dynamic token templates
  svg = svg
    .replace(/\{width_label\}/g, params.wLabel)
    .replace(/\{height_label\}/g, params.hLabel)
    .replace(/\{width\}/g, String(params.widthCm))
    .replace(/\{height\}/g, String(params.heightCm))
    .replace(/\{units\}/g, params.units === "metric" ? "cm" : "ft");

  // 2. If the user pasted the exact static Hassan snippet with hardcoded numbers:
  // <text x="210" y="100" class="label">220 cm</text>
  // <text x="50" y="225" class="label">150 cm</text>
  svg = svg.replace(
    /(<text[^>]*class=["']label["'][^>]*>)\s*220\s*cm\s*(<\/text>)/gi,
    `$1${params.wLabel}$2`,
  );
  svg = svg.replace(
    /(<text[^>]*class=["']label["'][^>]*>)\s*150\s*cm\s*(<\/text>)/gi,
    `$1${params.hLabel}$2`,
  );

  return svg;
}
