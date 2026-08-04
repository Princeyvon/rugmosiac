import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves rug photography uploaded through the studio dashboard. The storage
 * bucket is private, so the object is streamed here with cache headers.
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
