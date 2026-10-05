import { createFileRoute } from "@tanstack/react-router";
import { processMetaConversionEvent, type MetaConversionPayload } from "@/lib/meta-capi";
import { checkRateLimit } from "@/lib/security.server";

export const Route = createFileRoute("/api/meta-capi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

          // Rate limit: 60 requests per minute per IP
          const rate = checkRateLimit(`capi_${clientIp}`, 60, 60_000);
          if (!rate.allowed) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Too many tracking events from this IP." }),
              {
                status: 429,
                headers: { "Content-Type": "application/json", "Retry-After": "60" },
              }
            );
          }

          const body = (await request.json()) as MetaConversionPayload;
          if (!body?.eventName) {
            return new Response(JSON.stringify({ error: "Missing eventName in request body." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const clientUserAgent = request.headers.get("user-agent") || undefined;

          const mergedUserData = {
            ...body.userData,
            clientIp: body.userData?.clientIp || (clientIp !== "unknown" ? clientIp : undefined),
            clientUserAgent: body.userData?.clientUserAgent || clientUserAgent,
          };

          const result = await processMetaConversionEvent({
            ...body,
            userData: mergedUserData,
          });

          const origin = request.headers.get("origin") || "";
          const isAllowedOrigin =
            origin.includes("mosiac.rw") ||
            origin.includes("localhost") ||
            origin.includes("run.app") ||
            origin.includes("lovable.app");

          return new Response(JSON.stringify(result), {
            status: result.ok ? 200 : 502,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "https://mosiac.rw",
              "Access-Control-Allow-Credentials": "true",
            },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err?.message || "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin") || "";
        const isAllowedOrigin =
          origin.includes("mosiac.rw") ||
          origin.includes("localhost") ||
          origin.includes("run.app") ||
          origin.includes("lovable.app");

        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "https://mosiac.rw",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      },
    },
  },
});
