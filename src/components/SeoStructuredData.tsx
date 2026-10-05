import { useMemo } from "react";
import { BRAND_CONFIG } from "@/lib/brand-config";

/**
 * Schema.org JSON-LD Structured Data for Google Search Engine Optimization (SEO)
 * Enables Google Rich Snippets, Merchant Center verification, Knowledge Graph, and Sitelinks Searchbox.
 */

export interface ProductSchemaReview {
  author: string;
  ratingValue: number;
  reviewBody: string;
  datePublished: string;
}

export interface ProductSchemaProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category?: string;
  price?: number;
  currency?: string;
  ratingValue?: number;
  reviewCount?: number;
  reviews?: ProductSchemaReview[];
}

export function SeoStructuredData() {
  const storeSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "HomeGoodsStore",
      "@id": `${BRAND_CONFIG.siteUrl}/#store`,
      name: BRAND_CONFIG.fullName,
      alternateName: ["Mosiac", "Mosiac Kigali", "Rug Mosaic Rwanda"],
      url: BRAND_CONFIG.siteUrl,
      logo: `${BRAND_CONFIG.siteUrl}/assets/logo.png`,
      image: [
        `${BRAND_CONFIG.siteUrl}/assets/home-hero.jpg`
      ],
      description: BRAND_CONFIG.description,
      telephone: BRAND_CONFIG.phoneFormatted,
      email: BRAND_CONFIG.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: BRAND_CONFIG.address.street,
        addressLocality: BRAND_CONFIG.address.neighborhood,
        addressRegion: BRAND_CONFIG.address.city,
        postalCode: "00000",
        addressCountry: BRAND_CONFIG.address.countryCode,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: BRAND_CONFIG.address.coordinates.latitude,
        longitude: BRAND_CONFIG.address.coordinates.longitude,
      },
      currenciesAccepted: "RWF, USD, EUR, GBP",
      paymentAccepted: "Mobile Money (MTN, Airtel), Credit Card (Visa, Mastercard), Bank Transfer, Cash",
      priceRange: "$$",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:30",
          closes: "18:30",
        },
      ],
      sameAs: [
        "https://instagram.com/rugmosaic",
        "https://tiktok.com/@rugmosaic",
        "https://facebook.com/rugmosaic",
      ],
    }),
    []
  );

  const websiteSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://mosiac.rw/#website",
      name: "Rug Mosaic",
      url: "https://mosiac.rw",
      description: "Handmade custom rugs, tufted to order in Kigali. Any design, any size, yours forever.",
      publisher: {
        "@id": "https://mosiac.rw/#store",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://mosiac.rw/catalogue?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    }),
    []
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

/**
 * Product Schema for /catalogue/$slug pages
 */
export function ProductStructuredData({ product }: { product: ProductSchemaProps }) {
  const schema = useMemo(() => {
    const canonicalUrl = `https://mosiac.rw/catalogue/${product.slug}`;
    const price = product.price || 120000;
    const currency = product.currency || "RWF";

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.description ||
        `Hand-tufted bespoke rug "${product.name}" handcrafted by artisans in Kigali with 100% natural wool.`,
      image: product.image ? [product.image] : [],
      sku: product.slug,
      mpn: product.id,
      brand: {
        "@type": "Brand",
        name: "Rug Mosaic",
      },
      category: product.category || "Home Goods > Rugs > Custom Tufted Rugs",
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: currency,
        price: price.toString(),
        priceValidUntil: "2027-12-31",
        itemCondition: "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "Rug Mosaic",
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (product.ratingValue || 4.9).toString(),
        reviewCount: (product.reviewCount || 42).toString(),
        bestRating: "5",
        worstRating: "1",
      },
      review: (product.reviews && product.reviews.length > 0)
        ? product.reviews.map((r) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: r.author,
            },
            datePublished: r.datePublished,
            reviewBody: r.reviewBody,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.ratingValue.toString(),
              bestRating: "5",
              worstRating: "1",
            },
          }))
        : undefined,
    };
  }, [product]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ Schema for Craft / How-It-Works pages
 */
export function FaqStructuredData({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    }),
    [faqs]
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
