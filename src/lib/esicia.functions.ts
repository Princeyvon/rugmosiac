import { createServerFn } from "@tanstack/react-start";
import type { EsiciaPaymentMethod } from "./esicia.server";

export const esiciaGatewayStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getEsiciaConfig } = await import("./esicia.server");
  const cfg = getEsiciaConfig();
  return {
    configured: cfg !== null,
    environment: cfg?.environment ?? "sandbox",
    processor: "Esicia Rwanda Ltd",
  };
});

export const startEsiciaPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      orderNumber: string;
      phone: string;
      amountRwf: number;
      method: "momo" | "airtel" | "card";
      customerName?: string;
      customerEmail?: string;
    }) => {
      if (!d.orderNumber) throw new Error("Missing order reference");
      if (!Number.isFinite(d.amountRwf) || d.amountRwf <= 0) throw new Error("Invalid amount");
      return d;
    }
  )
  .handler(async ({ data }) => {
    const { initiateEsiciaPayment } = await import("./esicia.server");
    try {
      const res = await initiateEsiciaPayment({
        orderNumber: data.orderNumber,
        amount: data.amountRwf,
        currency: "RWF",
        phone: data.phone,
        paymentMethod: data.method as EsiciaPaymentMethod,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      });

      return {
        ok: true as const,
        referenceId: res.referenceId,
        transactionId: res.transactionId,
        redirectUrl: res.redirectUrl,
        message: res.message,
        processor: res.processor,
      };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Esicia payment initiation failed",
      };
    }
  });

export const checkEsiciaPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { referenceId: string }) => {
    if (!d.referenceId) throw new Error("Missing transaction reference");
    return d;
  })
  .handler(async ({ data }) => {
    const { checkEsiciaPaymentStatus } = await import("./esicia.server");
    try {
      const res = await checkEsiciaPaymentStatus(data.referenceId);
      return {
        ok: true as const,
        status: res.status,
        reason: res.reason,
      };
    } catch (err) {
      return {
        ok: false as const,
        status: "PENDING" as const,
        error: err instanceof Error ? err.message : "Esicia payment verification failed",
      };
    }
  });
