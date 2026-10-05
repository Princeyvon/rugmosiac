/**
 * Centralized Brand & Atelier Configuration for Mosiac
 *
 * Consolidates all hardcoded phone numbers, WhatsApp links, atelier addresses,
 * support emails, and domain metadata to ensure zero drift across storefront,
 * checkout, admin, SEO structured data, and marketing triggers.
 */

export const BRAND_CONFIG = {
  name: "Mosiac",
  fullName: "Rug Mosaic Kigali",
  legalName: "Mosiac Rugs LLC",
  tagline: "Handmade Custom Rugs, Tufted in Kigali",
  description:
    "We dream up rugs that bring otherworldly comfort to the home. 100% hand-tufted with imported New Zealand wool in our Kigali workshop.",
  
  // Contact numbers
  phone: "+250 796 664 868",
  phoneRaw: "250796664868",
  phoneFormatted: "+250 796 664 868",
  
  // Emails
  email: "hello@mosiac.rw",
  supportEmail: "support@mosiac.rw",
  conciergeEmail: "concierge@mosiac.rw",
  
  // Physical Atelier Location
  address: {
    street: "KG 566 St",
    neighborhood: "Kimihurura",
    city: "Kigali",
    country: "Rwanda",
    countryCode: "RW",
    coordinates: {
      latitude: -1.9536,
      longitude: 30.0906,
    },
  },
  
  // Web & Domain URLs
  siteUrl: "https://mosiac.rw",
  canonicalDomain: "mosiac.rw",
  
  // Social & Messaging Links
  whatsappUrl: "https://wa.me/250796664868",
  instagramUrl: "https://instagram.com/rugmosiac",
  instagramHandle: "@rugmosiac",

  // Pricing & Currency
  studioMinimumCommissionRwf: 320000,
  defaultCurrency: "RWF",
  
  // Operational details
  leadTimeWeeks: "3 to 4 weeks",
  yearFounded: 2021,
} as const;

export const WHATSAPP_URL = BRAND_CONFIG.whatsappUrl;
export const WHATSAPP_NUMBER = BRAND_CONFIG.phoneRaw;
export const SUPPORT_EMAIL = BRAND_CONFIG.supportEmail;
export const SITE_URL = BRAND_CONFIG.siteUrl;
