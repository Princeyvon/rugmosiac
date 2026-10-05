/**
 * Site Featured Images Definition & Configuration
 * Provides centralized registry and dimension recommendations for all non-product
 * featured photography across the Mosiac storefront.
 */

export interface FeaturedImageSlot {
  id: string;
  title: string;
  group: "homepage" | "categories" | "carousels" | "editorial" | "banners" | "craft";
  groupLabel: string;
  locationDesc: string;
  routePreview: string;

  // Recommended specs
  recommendedDimensions: string;
  aspectRatio: string;
  recommendedFormat: string;
  maxRecommendedSize: string;
  designNotes: string;

  // Paths
  defaultUrl: string;
  customUrl?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface StudioLibraryItem {
  id: string;
  url: string;
  title: string;
  category: "product" | "archival" | "editorial" | "featured" | "uploaded";
  categoryLabel: string;
  productName?: string;
  productSlug?: string;
  sku?: string;
  role?: string;
  source: string;
}

export const DEFAULT_FEATURED_SLOTS: FeaturedImageSlot[] = [
  // 1. Homepage Hero Banner
  {
    id: "home_hero",
    title: "Homepage Master Hero Banner",
    group: "homepage",
    groupLabel: "Homepage",
    locationDesc: "The primary panoramic card anchoring the homepage under the wordmark and 'Floor art, made to order' heading.",
    routePreview: "/",
    recommendedDimensions: "1920 × 1080 px",
    aspectRatio: "16:9 (Desktop) / 4:3 (Mobile)",
    recommendedFormat: "WebP or High-Res JPEG",
    maxRecommendedSize: "< 2.0 MB",
    designNotes: "Wide landscape living room scene. Maintain generous contrast in center-bottom for white typography overlay.",
    defaultUrl: "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
  },

  // 2. Categories: Area Rugs
  {
    id: "category_area_rugs",
    title: "Category Card: Area Rugs",
    group: "categories",
    groupLabel: "Quick View Categories",
    locationDesc: "First card in 'Explore by format & space' on the homepage (routes to /catalogue?category=area-rugs).",
    routePreview: "/#categories",
    recommendedDimensions: "800 × 1000 px",
    aspectRatio: "4:5 Portrait",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 800 KB",
    designNotes: "Expansive living room or salon floor framing with dark vignette bottom for clean white category title readability.",
    defaultUrl: "/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg",
  },

  // 3. Categories: Runners
  {
    id: "category_runners",
    title: "Category Card: Runners",
    group: "categories",
    groupLabel: "Quick View Categories",
    locationDesc: "Second card in 'Explore by format & space' on the homepage (routes to /catalogue?category=runners).",
    routePreview: "/#categories",
    recommendedDimensions: "800 × 1000 px",
    aspectRatio: "4:5 Portrait",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 800 KB",
    designNotes: "Elongated architectural corridor, passage, or bedside perspective showcasing proportion.",
    defaultUrl: "/__l5e/assets-v1/074246a2-d88c-4a8b-914b-d38c7182cc20/valley-3.jpg",
  },

  // 4. Categories: Collections
  {
    id: "category_collections",
    title: "Category Card: Collections",
    group: "categories",
    groupLabel: "Quick View Categories",
    locationDesc: "Third card in 'Explore by format & space' on the homepage (routes to full catalogue).",
    routePreview: "/#categories",
    recommendedDimensions: "800 × 1000 px",
    aspectRatio: "4:5 Portrait",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 800 KB",
    designNotes: "Graphic geometric pattern or collection overview piece with rich natural Highland wool pile depth.",
    defaultUrl: "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
  },

  // 5. Heritage Slideshow - Slide 1
  {
    id: "heritage_slide_1",
    title: "Heritage Slideshow · Slide 1 ('Introducing the Heritage rugs')",
    group: "carousels",
    groupLabel: "Carousels & Sliders",
    locationDesc: "Slide 1 of the interactive full-width Heritage slideshow banner with paired arrow controls.",
    routePreview: "/#heritage-slider",
    recommendedDimensions: "1920 × 800 px",
    aspectRatio: "24:10 (Desktop) / 4:5 (Mobile)",
    recommendedFormat: "WebP or High-Res JPEG",
    maxRecommendedSize: "< 1.5 MB",
    designNotes: "Landscape view with left-weighted shadow or vignette so white editorial kicker & heading stay crisp.",
    defaultUrl: "/__l5e/assets-v1/074246a2-d88c-4a8b-914b-d38c7182cc20/valley-3.jpg",
  },

  // 6. Heritage Slideshow - Slide 2
  {
    id: "heritage_slide_2",
    title: "Heritage Slideshow · Slide 2 ('Woven with intention')",
    group: "carousels",
    groupLabel: "Carousels & Sliders",
    locationDesc: "Slide 2 of the interactive full-width Heritage slideshow banner with paired arrow controls.",
    routePreview: "/#heritage-slider",
    recommendedDimensions: "1920 × 800 px",
    aspectRatio: "24:10 (Desktop) / 4:5 (Mobile)",
    recommendedFormat: "WebP or High-Res JPEG",
    maxRecommendedSize: "< 1.5 MB",
    designNotes: "Traditional pattern weave or close-up Highland wool detail demonstrating texture.",
    defaultUrl: "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
  },

  // 7. Heritage Slideshow - Slide 3
  {
    id: "heritage_slide_3",
    title: "Heritage Slideshow · Slide 3 ('Tufted by hand in Kigali')",
    group: "carousels",
    groupLabel: "Carousels & Sliders",
    locationDesc: "Slide 3 of the interactive full-width Heritage slideshow banner with paired arrow controls.",
    routePreview: "/#heritage-slider",
    recommendedDimensions: "1920 × 800 px",
    aspectRatio: "24:10 (Desktop) / 4:5 (Mobile)",
    recommendedFormat: "WebP or High-Res JPEG",
    maxRecommendedSize: "< 1.5 MB",
    designNotes: "Artisanal hand-carving or circular wall-art piece capturing studio craftsmanship.",
    defaultUrl: "/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg",
  },

  // 8. Editorial Gallery: Tile 1
  {
    id: "ig_grid_1",
    title: "Editorial Gallery: Tile 1 (Melt Accent)",
    group: "editorial",
    groupLabel: "Editorial & Social Grid",
    locationDesc: "First tile in the 'Seeing is believing' editorial dark section on the homepage.",
    routePreview: "/#editorial-grid",
    recommendedDimensions: "800 × 800 px",
    aspectRatio: "1:1 Square",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 600 KB",
    designNotes: "Square crop of artisanal rug detail, organic contours, or styling accent.",
    defaultUrl: "/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg",
  },

  // 9. Editorial Gallery: Tile 2
  {
    id: "ig_grid_2",
    title: "Editorial Gallery: Tile 2 (Tai Texture)",
    group: "editorial",
    groupLabel: "Editorial & Social Grid",
    locationDesc: "Second tile in the 'Seeing is believing' editorial dark section on the homepage.",
    routePreview: "/#editorial-grid",
    recommendedDimensions: "800 × 800 px",
    aspectRatio: "1:1 Square",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 600 KB",
    designNotes: "Square close-up showing relief carving and rich saturation of Highland wool.",
    defaultUrl: "/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg",
  },

  // 10. Editorial Gallery: Tile 3
  {
    id: "ig_grid_3",
    title: "Editorial Gallery: Tile 3 (Arc Silhouette)",
    group: "editorial",
    groupLabel: "Editorial & Social Grid",
    locationDesc: "Third tile in the 'Seeing is believing' editorial dark section on the homepage.",
    routePreview: "/#editorial-grid",
    recommendedDimensions: "800 × 800 px",
    aspectRatio: "1:1 Square",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 600 KB",
    designNotes: "Clean geometric curves and architectural interior floor styling.",
    defaultUrl: "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
  },

  // 11. Editorial Gallery: Tile 4
  {
    id: "ig_grid_4",
    title: "Editorial Gallery: Tile 4 (Atelier Hand Craft)",
    group: "editorial",
    groupLabel: "Editorial & Social Grid",
    locationDesc: "Fourth tile in the 'Seeing is believing' editorial dark section on the homepage.",
    routePreview: "/#editorial-grid",
    recommendedDimensions: "800 × 800 px",
    aspectRatio: "1:1 Square",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 600 KB",
    designNotes: "Artisanal hand carving, trimming shears, or tactile yarn inspection.",
    defaultUrl: "/__l5e/assets-v1/28c325e7-6be3-44b6-8d49-e24f327dcc96/hassan-5.jpg",
  },

  // 12. Lookbook Pre-Footer Ambient Background
  {
    id: "lookbook_prefooter_bg",
    title: "Lookbook Volume I Architectural Pre-Footer Banner",
    group: "banners",
    groupLabel: "Banners & Footers",
    locationDesc: "Large full-width background image featured in the persistent Lookbook pre-footer across the site.",
    routePreview: "/#pre-footer-lookbook-banner",
    recommendedDimensions: "1920 × 1080 px",
    aspectRatio: "16:9 or 21:9 Ultra-wide",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 1.5 MB",
    designNotes: "High-end interior ambiance highlighting a signature rug; will be softly tinted with a dark gradient overlay.",
    defaultUrl: "/src/assets/lookbook-yellow-rug.jpg",
  },

  // 13. How It Works: Craft Pillar 1
  {
    id: "craft_rose_tufting",
    title: "Atelier Craft: Pneumatic Tufting & Rose Relief",
    group: "craft",
    groupLabel: "Craft & Story",
    locationDesc: "Pillar illustration image on the /how-it-works page under artisanal technique.",
    routePreview: "/how-it-works",
    recommendedDimensions: "1000 × 800 px",
    aspectRatio: "5:4 or 4:3",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 800 KB",
    designNotes: "Artisanal hand-tufting frame, wool yarns, or pneumatic tufting in progress.",
    defaultUrl: "/src/assets/craft-rose-tufting.jpg",
  },

  // 14. How It Works: Craft Pillar 2
  {
    id: "craft_blue_scallop",
    title: "Atelier Craft: Hand-Shearing & Contour Beveling",
    group: "craft",
    groupLabel: "Craft & Story",
    locationDesc: "Pillar illustration image on the /how-it-works page under finishing and edge carving.",
    routePreview: "/how-it-works",
    recommendedDimensions: "1000 × 800 px",
    aspectRatio: "5:4 or 4:3",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 800 KB",
    designNotes: "Detailed shearing scissors, contour beveling, or latex cloth backing.",
    defaultUrl: "/src/assets/craft-blue-scallop.jpg",
  },

  // 15. Contact Page Showroom Accent
  {
    id: "contact_hero",
    title: "Contact Page Kigali Showroom Accent",
    group: "banners",
    groupLabel: "Banners & Footers",
    locationDesc: "Studio consultation card visual featured on the /contact page.",
    routePreview: "/contact",
    recommendedDimensions: "1200 × 800 px",
    aspectRatio: "3:2 Landscape",
    recommendedFormat: "WebP or JPEG",
    maxRecommendedSize: "< 1.0 MB",
    designNotes: "Kigali studio atmosphere, wool swatch books, or consultation desk.",
    defaultUrl: "/src/assets/contact-hero.jpg",
  },
];

export interface SiteImagesConfig {
  overrides: Record<string, string>; // slotId -> custom image URL
  meta?: Record<string, { updatedAt?: string; updatedBy?: string }>;
}

/**
 * Returns the effective live image URL for a given slot.
 * Falls back safely to defaultUrl if no custom replacement has been set.
 */
export function getLiveSlotImage(
  slotId: string,
  overrides?: Record<string, string>,
  hardcodedFallback?: string
): string {
  if (overrides && overrides[slotId]) {
    return overrides[slotId];
  }
  const slot = DEFAULT_FEATURED_SLOTS.find((s) => s.id === slotId);
  return slot?.defaultUrl ?? hardcodedFallback ?? "";
}
