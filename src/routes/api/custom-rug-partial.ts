import { createFileRoute } from "@tanstack/react-router";
import { syncLeadToCrm } from "@/lib/crm.server";
import { checkRateLimit } from "@/lib/security.server";

export const Route = createFileRoute("/api/custom-rug-partial")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

          const rate = checkRateLimit(`custom_partial_${clientIp}`, 60, 60_000);
          if (!rate.allowed) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please retry shortly." }), {
              status: 429,
              headers: { "Content-Type": "application/json", "Retry-After": "60" },
            });
          }

          const payload = await request.json();
          const leadId = payload.lead_id || `lead_partial_${Date.now()}`;

          await syncLeadToCrm({
            lead_id: leadId,
            name: payload.customer_name || payload.name || "Anonymous Atelier Visitor",
            email: payload.email || undefined,
            phone: payload.phone || undefined,
            channel: "bespoke",
            message: `[IN-PROGRESS STAGE ${payload.stage_reached || 1}/4 · UNFINISHED LEAD CAPTURE]\nContact Preference: ${(payload.preferred_contact || "whatsapp").toUpperCase()}\nDelivery Location: ${payload.location || "Kigali"}\n${payload.partial_brief || ""}`,
            consentStatus: payload.consentStatus || "granted",
            firstTouch: payload.firstTouch,
            lastTouch: payload.lastTouch,
            fbp: payload.fbp,
            fbc: payload.fbc,
            timestamp: Date.now(),
          });

          return new Response(JSON.stringify({ ok: true, lead_id: leadId }), {
            status: 200,
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
