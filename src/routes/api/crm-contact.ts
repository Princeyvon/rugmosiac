import { createFileRoute } from "@tanstack/react-router";
import { syncLeadToCrm, type CrmLeadPayload } from "@/lib/crm.server";
import { checkRateLimit } from "@/lib/security.server";

export const Route = createFileRoute("/api/crm-contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

          // Rate limit: 60 contacts per minute
          const rate = checkRateLimit(`crm_contact_${clientIp}`, 60, 60_000);
          if (!rate.allowed) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please retry shortly." }), {
              status: 429,
              headers: { "Content-Type": "application/json", "Retry-After": "60" },
            });
          }

          const payload = (await request.json()) as CrmLeadPayload;
          if (!payload?.lead_id) {
            payload.lead_id = `lead_${Date.now()}`;
          }

          const clientUserAgent = request.headers.get("user-agent") || undefined;

          payload.clientIp = payload.clientIp || (clientIp !== "unknown" ? clientIp : undefined);
          payload.clientUserAgent = payload.clientUserAgent || clientUserAgent;
          payload.timestamp = payload.timestamp || Date.now();

          const result = await syncLeadToCrm(payload);

          return new Response(JSON.stringify(result), {
            status: result.ok ? 200 : 502,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err?.message || "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
