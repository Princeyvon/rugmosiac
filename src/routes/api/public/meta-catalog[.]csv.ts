import { createFileRoute } from "@tanstack/react-router";
import { generateMetaCatalogCsv } from "@/lib/merchant-feed.server";

export const Route = createFileRoute("/api/public/meta-catalog.csv")({
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

        const csv = await generateMetaCatalogCsv(origin);

        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'inline; filename="meta-catalog.csv"',
            "Cache-Control": "public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
