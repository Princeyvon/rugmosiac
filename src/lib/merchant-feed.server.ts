import { listPublicProducts } from "./studio-store.server";
import { fallbackProducts } from "./fallback-catalogue";
import type { Product } from "./catalogue.functions";

const DEFAULT_ORIGIN = "https://mosiac.rw";

function cleanXmlText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveFullImageUrl(url: string | null | undefined, baseUrl: string): string {
  if (!url) return `${baseUrl}/hero-poster.jpg`;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generates an official Google Merchant Center RSS 2.0 XML Product Feed.
 * Conforms strictly to Google Merchant Center Product data specification
 * and Meta Catalog Feed format.
 *
 * Supported attributes:
 * - g:id, g:title, g:description, g:link, g:image_link, g:additional_image_link
 * - g:availability ("in_stock")
 * - g:price (e.g. "320000 RWF")
 * - g:brand ("Rug Mosaic")
 * - g:condition ("new")
 * - g:google_product_category ("648" - Home & Garden > Decor > Rugs)
 * - g:product_type
 * - g:material ("100% Hand-Tufted New Zealand Wool")
 * - g:pattern / g:color
 * - g:identifier_exists ("no")
 * - g:custom_label_0 (Hand-Tufted)
 * - g:custom_label_1 (Shape)
 * - g:custom_label_2 (Made-to-Order)
 * - g:shipping
 */
export async function generateGoogleMerchantXml(origin = DEFAULT_ORIGIN): Promise<string> {
  let products: Product[] = [];
  try {
    products = await listPublicProducts();
  } catch (err) {
    console.error("[merchant-feed] Error loading products from studio store:", err);
  }

  if (!products || products.length === 0) {
    products = fallbackProducts.filter((p: any) => p.is_published !== false);
  }

  const itemsXml = products
    .map((p) => {
      const title = `${p.name} Hand-Tufted Wool Rug – Rug Mosaic`;
      const desc =
        p.description ||
        p.short_description ||
        `${p.name} is a bespoke hand-tufted New Zealand wool rug artisanally crafted in Kigali, Rwanda by Rug Mosaic.`;
      
      const link = `${origin}/catalogue/${p.slug}`;
      const imageLink = resolveFullImageUrl(p.main_image_url, origin);
      const additionalImage = p.hover_image_url ? resolveFullImageUrl(p.hover_image_url, origin) : null;
      
      // Determine base price
      const priceRwf = p.base_price_rwf ?? 300000;
      const formattedPrice = `${priceRwf} RWF`;
      
      const categoryName = p.category?.name || "Area Rugs";
      const productType = `Home &amp; Decor &gt; Rugs &gt; ${cleanXmlText(categoryName)}`;
      const material = cleanXmlText(p.material || "100% Hand-Tufted New Zealand Wool");
      const color = cleanXmlText(p.color_palette && p.color_palette.length > 0 ? p.color_palette.join(" / ") : "Multicolor Artisanal");
      const shape = cleanXmlText(p.shape ? p.shape.charAt(0).toUpperCase() + p.shape.slice(1) : "Area Rug");

      return `    <item>
      <g:id>${cleanXmlText(p.id)}</g:id>
      <g:title><![CDATA[${title}]]></g:title>
      <g:description><![CDATA[${desc}]]></g:description>
      <g:link>${cleanXmlText(link)}</g:link>
      <g:image_link>${cleanXmlText(imageLink)}</g:image_link>${additionalImage ? `\n      <g:additional_image_link>${cleanXmlText(additionalImage)}</g:additional_image_link>` : ""}
      <g:availability>in_stock</g:availability>
      <g:price>${formattedPrice}</g:price>
      <g:brand>Rug Mosaic</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>648</g:google_product_category>
      <g:product_type>${productType}</g:product_type>
      <g:material>${material}</g:material>
      <g:color>${color}</g:color>
      <g:identifier_exists>no</g:identifier_exists>
      <g:custom_label_0>Hand-Tufted Artisanal</g:custom_label_0>
      <g:custom_label_1>${shape}</g:custom_label_1>
      <g:custom_label_2>Made-to-Order Studio</g:custom_label_2>
      <g:shipping>
        <g:country>RW</g:country>
        <g:service>Studio White Glove Delivery</g:service>
        <g:price>0 RWF</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>DHL Express Worldwide Air</g:service>
        <g:price>150000 RWF</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Rug Mosaic – Artisanal Hand-Tufted Rugs Catalog</title>
    <link>${origin}</link>
    <description>Live automated product catalog feed for Google Merchant Center, Google Shopping, Performance Max, and Meta Catalog Ads.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates an official Meta Catalog CSV file for Facebook & Instagram Commerce Manager.
 */
export async function generateMetaCatalogCsv(origin = DEFAULT_ORIGIN): Promise<string> {
  let products: Product[] = [];
  try {
    products = await listPublicProducts();
  } catch (err) {
    console.error("[merchant-feed] Error loading products for CSV:", err);
  }

  if (!products || products.length === 0) {
    products = fallbackProducts.filter((p: any) => p.is_published !== false);
  }

  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "google_product_category",
    "fb_product_category",
    "material",
    "custom_label_0",
  ];

  function escapeCsv(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  const rows = products.map((p) => {
    const title = `${p.name} Hand-Tufted Wool Rug`;
    const desc = (
      p.description ||
      p.short_description ||
      `${p.name} hand-tufted New Zealand wool rug crafted in Kigali by Rug Mosaic.`
    ).replace(/[\r\n]+/g, " ");

    const price = `${p.base_price_rwf ?? 300000} RWF`;
    const link = `${origin}/catalogue/${p.slug}`;
    const imageLink = resolveFullImageUrl(p.main_image_url, origin);

    return [
      escapeCsv(p.id),
      escapeCsv(title),
      escapeCsv(desc),
      "in_stock",
      "new",
      escapeCsv(price),
      escapeCsv(link),
      escapeCsv(imageLink),
      "Rug Mosaic",
      "648",
      "Home & Garden > Decor > Rugs",
      escapeCsv(p.material || "100% Hand-Tufted New Zealand Wool"),
      "Hand-Tufted Artisanal",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
