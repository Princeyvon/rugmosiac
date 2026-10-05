import { createFileRoute } from "@tanstack/react-router";
import { generateGoogleMerchantXml } from "@/lib/merchant-feed.server";

export const Route = createFileRoute("/api/public/meta-catalog.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let origin = "https://mosiac.rw";
        try {
          if (request?.url) {
            const parsed = new URL(request.url);
            origin = `${parsed.protocol}//${parsed.host}`;
          }
        } catch {
          // fallback to default
        }

        const xml = await generateGoogleMerchantXml(origin);

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
