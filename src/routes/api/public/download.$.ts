import { createFileRoute } from "@tanstack/react-router";

// Trusted download of studio uploads (e.g. the lookbook PDF) as an attachment.
export const Route = createFileRoute("/api/public/download/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const rawPath = params._splat ?? "";
        const { readUpload } = await import("@/lib/media-storage.server");
        const file = await readUpload(rawPath).catch(() => null);
        if (!file) {
          // Bundled static fallback (e.g. /Mosiac-Lookbook-2026.pdf in public/)
          const base = rawPath.split("/").pop() || "";
          if (/^[\w.-]+\.pdf$/i.test(base)) {
            return Response.redirect(new URL(`/${base}`, request.url).toString(), 302);
          }
          return new Response("File not found or has been removed.", { status: 404 });
        }
        const { getSecurityHeaders, detectFileSignature } = await import("@/lib/security.server");
        const sig = detectFileSignature(file.bytes as never);
        return new Response(file.bytes as unknown as BodyInit, {
          headers: getSecurityHeaders({
            contentType: sig?.mimeType || file.contentType,
            filename: file.name,
            isDownload: true,
            cacheControl: "private, no-transform, max-age=3600",
          }),
        });
      },
    },
  },
});
