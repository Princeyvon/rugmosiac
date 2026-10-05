export interface PopupBannerConfig {
  enabled: boolean;
  delaySeconds: number;
  snoozeMinutes: number;
  targetPages: "all" | "home_only" | "catalogue_only";
  imageUrl: string;
  imageAlt: string;
  badgeText: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  formEyebrow: string;
  formDescription: string;
  requirePhone: boolean;
  requireEmail: boolean;
  requireName: boolean;
  successHeadline: string;
  successDescription: string;
  couponCode: string;
  campaignSource: string;
  rotateImageVertical?: boolean;
  imageFitMode?: "fit" | "cover";
  displayMode?: "two_step" | "direct_form";
}

export const DEFAULT_POPUP_BANNER_CONFIG: PopupBannerConfig = {
  enabled: true,
  delaySeconds: 5,
  snoozeMinutes: 60,
  targetPages: "all",
  imageUrl:
    "/__l5e/assets-v1/1ad78201-8a40-4d3a-bc57-fa97d5617dcc/promo-rug.webp",
  imageAlt: "A hand-tufted Mosiac rug in blues and stone",
  badgeText: "55,000 RWF Credit",
  eyebrow: "Atelier Welcome Offer",
  headline: "Claim your 55,000 RWF buying credit.",
  subtitle: "Enter your contact details to receive your 55,000 RWF credit voucher, manually emailed by our atelier team.",
  ctaText: "Claim 55,000 RWF credit",
  formEyebrow: "Atelier Credit Voucher",
  formDescription:
    "Enter your email and contact details. Our Kigali studio team will manually email your 55,000 RWF voucher directly to your inbox.",
  requirePhone: true,
  requireEmail: true,
  requireName: true,
  successHeadline: "You're on the atelier list.",
  successDescription:
    "Thank you! Our studio team will manually email your 55,000 RWF buying credit voucher to your email address shortly.",
  couponCode: "55,000 RWF Credit",
  campaignSource: "studio-buying-credit",
  rotateImageVertical: true,
  imageFitMode: "cover",
  displayMode: "two_step",
};

export interface StudioImagePreset {
  id: string;
  title: string;
  url: string;
  alt: string;
}

export const PRESET_STUDIO_IMAGES: StudioImagePreset[] = [
  {
    id: "sample-blue",
    title: "Indigo & Basalt Ridge",
    url: "/__l5e/assets-v1/1ad78201-8a40-4d3a-bc57-fa97d5617dcc/promo-rug.webp",
    alt: "A hand-tufted Mosiac rug in blues and stone",
  },
  {
    id: "geometric-tan",
    title: "Geometric Multi-color Blocks",
    url: "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
    alt: "Geometric layers bright multi colour blocks over a warm tan field",
  },
  {
    id: "arc-heritage",
    title: "Arc Sculptural Obsidian",
    url: "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
    alt: "Arc sculptural rug in dark tones",
  },
  {
    id: "tai-arch",
    title: "Tai Organic Arch",
    url: "/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg",
    alt: "Tai organic arch rug in warm earth tones",
  },
  {
    id: "celestial",
    title: "Celestial Gold & Midnight",
    url: "/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg",
    alt: "Celestial rug with gold accents",
  },
  {
    id: "hassan",
    title: "Hassan Terracotta & Cream",
    url: "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
    alt: "Hassan rug in terracotta and warm cream",
  },
];

export interface BannerCampaignPreset {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  config: Partial<PopupBannerConfig>;
}

export const BANNER_CAMPAIGN_PRESETS: BannerCampaignPreset[] = [
  {
    id: "atelier-credit-55k",
    name: "55,000 RWF Atelier Credit",
    tagline: "Standard two-step commission welcome offer",
    badge: "55,000 RWF Credit",
    config: {
      displayMode: "two_step",
      badgeText: "55,000 RWF Credit",
      eyebrow: "Atelier Welcome Offer",
      headline: "Claim your 55,000 RWF buying credit.",
      subtitle:
        "Enter your contact details to receive your 55,000 RWF credit voucher, manually emailed by our atelier team.",
      ctaText: "Claim 55,000 RWF credit",
      formEyebrow: "Atelier Credit Voucher",
      formDescription:
        "Enter your email and contact details. Our Kigali studio team will manually email your 55,000 RWF voucher directly to your inbox.",
      couponCode: "55,000 RWF Credit",
      campaignSource: "studio-buying-credit",
      requireName: true,
      requirePhone: true,
      requireEmail: true,
      successHeadline: "You're on the atelier list.",
      successDescription:
        "Thank you! Our studio team will manually email your 55,000 RWF buying credit voucher to your email address shortly.",
    },
  },
  {
    id: "bespoke-consultation",
    name: "Bespoke Atelier Commission",
    tagline: "VIP custom sizing & private yarn consultation",
    badge: "Bespoke Invitation",
    config: {
      displayMode: "two_step",
      badgeText: "Bespoke Commission",
      eyebrow: "Private Commission Access",
      headline: "Commission a one-of-one handcrafted rug.",
      subtitle:
        "Connect directly with our Kigali design atelier. Patrons receive a complimentary yarn box and bespoke sizing consultation.",
      ctaText: "Request Atelier Consultation",
      formEyebrow: "Artisan Studio Request",
      formDescription:
        "Leave your contact details. Our master weaver will reach out via WhatsApp with yarn swatches and custom dimensions.",
      couponCode: "BESPOKE10",
      campaignSource: "bespoke-commission-banner",
      requireName: true,
      requirePhone: true,
      requireEmail: true,
      successHeadline: "Consultation Request Received.",
      successDescription:
        "Our head artisan will connect directly to review your custom dimensions and palette.",
    },
  },
  {
    id: "direct-fast-signup",
    name: "Direct Fast Sign-Up",
    tagline: "Single-step immediate form with 10% welcome discount",
    badge: "10% Instant Code",
    config: {
      displayMode: "direct_form",
      badgeText: "10% Voucher",
      eyebrow: "Join the Collector Circle",
      headline: "10% off your first handcrafted piece.",
      subtitle:
        "Direct access to secret studio drops and an immediate 10% voucher code applied at checkout.",
      ctaText: "Unlock 10% Voucher",
      formEyebrow: "Direct Atelier Registration",
      formDescription: "Instant voucher activation for registered patrons.",
      couponCode: "WELCOME10",
      campaignSource: "direct-welcome-10",
      requireName: false,
      requirePhone: true,
      requireEmail: true,
      successHeadline: "Your 10% voucher is active.",
      successDescription:
        "Use code WELCOME10 at checkout or browse the collection with your credit pre-applied.",
    },
  },
  {
    id: "archive-sample-sale",
    name: "Limited Studio Archive Drop",
    tagline: "Exclusive sample preview for registered patrons",
    badge: "Archive Access",
    config: {
      displayMode: "two_step",
      badgeText: "Archive Access",
      eyebrow: "Private Studio Archive",
      headline: "Early access to limited prototype samples.",
      subtitle:
        "One-of-one color trials, gallery proofs, and studio experimental weaves reserved for patrons first.",
      ctaText: "Unlock Private Archive",
      formEyebrow: "Archive Patron Pass",
      formDescription:
        "Enter your contact details to receive private access links to unlisted studio archive inventory.",
      couponCode: "ARCHIVE15",
      campaignSource: "archive-sample-access",
      requireName: true,
      requirePhone: true,
      requireEmail: true,
      successHeadline: "Archive Pass Activated.",
      successDescription:
        "You will receive priority access notifications for all upcoming experimental drops.",
    },
  },
];

