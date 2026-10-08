import { createFileRoute } from "@tanstack/react-router";

// Serves studio uploads (rug photos, lookbook PDFs) from cloud storage.
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawPath = params._splat ?? "";
        const { readUpload } = await import("@/lib/media-storage.server");
        const file = await readUpload(rawPath).catch(() => null);
        if (!file) return new Response("Not found", { status: 404 });
        const { getSecurityHeaders, detectFileSignature } = await import("@/lib/security.server");
        const sig = detectFileSignature(file.bytes as never);
        return new Response(file.bytes, {
          headers: getSecurityHeaders({
            contentType: sig?.mimeType || file.contentType,
            filename: file.name,
            isDownload: false,
          }),
        });
      },
    },
  },
});
