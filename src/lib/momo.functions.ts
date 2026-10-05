import { createServerFn } from "@tanstack/react-start";

export const momoStatusCheck = createServerFn({ method: "GET" }).handler(async () => {
  const { getMomoConfig } = await import("./momo.server");
  const cfg = getMomoConfig();
  return { configured: cfg !== null, environment: cfg?.environment ?? null };
});

export const startMomoPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { orderNumber: string; phone: string; amountRwf: number }) => {
    if (!d.orderNumber || !d.phone) throw new Error("Missing order details");
    if (!Number.isFinite(d.amountRwf) || d.amountRwf <= 0) throw new Error("Invalid amount");
    return d;
  })
  .handler(async ({ data }) => {
    const { getMomoConfig, requestToPay } = await import("./momo.server");
    if (!getMomoConfig()) {
      return { ok: false as const, configured: false as const, error: "MoMo is not configured yet." };
    }
    try {
      const { referenceId } = await requestToPay({
        amount: data.amountRwf,
        phone: data.phone,
        orderNumber: data.orderNumber,
      });
      return { ok: true as const, configured: true as const, referenceId };
    } catch (err) {
      return {
        ok: false as const,
        configured: true as const,
        error: err instanceof Error ? err.message : "MoMo request failed",
      };
    }
  });

export const checkMomoPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { referenceId: string }) => {
    if (!d.referenceId) throw new Error("Missing reference");
    return d;
  })
  .handler(async ({ data }) => {
    const { getPaymentStatus } = await import("./momo.server");
    try {
      return { ok: true as const, ...(await getPaymentStatus(data.referenceId)) };
    } catch (err) {
      return { ok: false as const, status: "PENDING" as const, error: err instanceof Error ? err.message : "Status check failed" };
    }
  });
