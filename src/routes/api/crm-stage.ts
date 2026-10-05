import { createFileRoute } from "@tanstack/react-router";
import { handleCrmStageTransition, type CrmStageWebhookPayload } from "@/lib/crm.server";
import { checkRateLimit } from "@/lib/security.server";

export const Route = createFileRoute("/api/crm-stage")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        // Rate limit: 120 requests per minute
        const rate = checkRateLimit(`crm_stage_${clientIp}`, 120, 60_000);
        if (!rate.allowed) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429,
            headers: { "Content-Type": "application/json", "Retry-After": "60" },
          });
        }

        // Optional webhook secret verification
        const expectedSecret = process.env.CRM_WEBHOOK_SECRET;
        if (expectedSecret) {
          const providedSecret =
            request.headers.get("x-crm-secret") ||
            request.headers.get("x-webhook-secret") ||
            request.headers.get("authorization")?.replace("Bearer ", "");

          if (providedSecret !== expectedSecret) {
            return new Response(JSON.stringify({ error: "Unauthorized webhook caller." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        try {
          const payload = (await request.json()) as CrmStageWebhookPayload;
          if (!payload?.stage) {
            return new Response(JSON.stringify({ error: "Missing stage in payload." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            undefined;
          const clientUserAgent = request.headers.get("user-agent") || undefined;

          const result = await handleCrmStageTransition(payload, clientIp, clientUserAgent);

          return new Response(JSON.stringify(result), {
            status: result.ok ? 200 : 422,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err?.message || "Failed to process CRM stage webhook." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
