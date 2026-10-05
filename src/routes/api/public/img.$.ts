import { createFileRoute } from "@tanstack/react-router";
import { isPathSafe, getSecurityHeaders } from "@/lib/security.server";

/**
 * Serves verified rug photography and lookbook assets with strict security:
 * - Path traversal defense
 * - X-Content-Type-Options: nosniff
 * - Strict media sandbox CSP
 * - Immutable caching
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawPath = params._splat ?? "";
        if (!rawPath) return new Response("Not found", { status: 404 });

        const p = await import("node:path");
        const uploadsDir = p.join(process.cwd(), "data", "uploads");

        // 1. Strict Path Traversal Defense
        if (!isPathSafe(uploadsDir, rawPath)) {
          return new Response("Forbidden", { status: 403 });
        }

        // 2. Check local disk storage first
        try {
          const { getUploadedImageBuffer } = await import("@/lib/studio-store.server");
          const localImg = getUploadedImageBuffer(rawPath);
          if (localImg) {
            const headers = getSecurityHeaders({
              contentType: localImg.contentType,
              filename: p.basename(rawPath),
              isDownload: false,
            });
            return new Response(localImg.buffer, { headers });
          }
        } catch {
          // ignore
        }

        // 3. Fallback to Supabase Storage if configured
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("product-images").download(rawPath);
          if (error || !data) return new Response("Not found", { status: 404 });

          const arrayBuf = await data.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);

          // Verify file signature before caching or returning
          const { detectFileSignature } = await import("@/lib/security.server");
          const signature = detectFileSignature(buffer);
          const safeContentType = signature?.mimeType || data.type || "image/jpeg";

          // Cache on local disk
          try {
            const fs = await import("node:fs");
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            fs.writeFileSync(p.join(uploadsDir, p.basename(rawPath)), buffer);
          } catch {
            // non-fatal
          }

          const headers = getSecurityHeaders({
            contentType: safeContentType,
            filename: p.basename(rawPath),
            isDownload: false,
          });

          return new Response(buffer, { headers });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
