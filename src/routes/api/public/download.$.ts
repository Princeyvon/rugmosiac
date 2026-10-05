import { createFileRoute } from "@tanstack/react-router";
import { isPathSafe, getSecurityHeaders, detectFileSignature } from "@/lib/security.server";

/**
 * Trusted Download Service for Mosiac Atelier
 *
 * Enforces:
 * - Path traversal defense
 * - Magic bytes verification
 * - Content-Disposition: attachment with RFC 5987 safe filename
 * - X-Content-Type-Options: nosniff
 * - Sandboxed Content Security Policy
 */
export const Route = createFileRoute("/api/public/download/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawPath = params._splat ?? "";
        if (!rawPath) return new Response("Not found", { status: 404 });

        const p = await import("node:path");
        const fs = await import("node:fs");
        const uploadsDir = p.join(process.cwd(), "data", "uploads");

        // 1. Strict Path Traversal Defense
        if (!isPathSafe(uploadsDir, rawPath)) {
          return new Response("Forbidden", { status: 403 });
        }

        const safeFilename = p.basename(rawPath);
        const filePath = p.resolve(uploadsDir, safeFilename);

        let buffer: Buffer | null = null;
        let detectedType = "application/octet-stream";

        // Check local disk
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
        } else {
          // Check static public fallback (e.g., Mosiac-Lookbook-2026.pdf)
          const publicFallback = p.join(process.cwd(), "public", safeFilename);
          if (fs.existsSync(publicFallback)) {
            buffer = fs.readFileSync(publicFallback);
          }
        }

        // Check Supabase Storage if not on disk
        if (!buffer) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin.storage.from("product-images").download(safeFilename);
            if (data) {
              const arrayBuf = await data.arrayBuffer();
              buffer = Buffer.from(arrayBuf);
            }
          } catch {
            // ignore
          }
        }

        if (!buffer) {
          return new Response("File not found or has been removed.", { status: 404 });
        }

        // 2. Magic Bytes Verification
        const signature = detectFileSignature(buffer);
        if (signature) {
          detectedType = signature.mimeType;
        }

        // 3. Trusted Download Headers
        const headers = getSecurityHeaders({
          contentType: detectedType,
          filename: safeFilename,
          isDownload: true,
          cacheControl: "private, no-transform, max-age=3600",
        });

        return new Response(buffer, { headers });
      },
    },
  },
});
