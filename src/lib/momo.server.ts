/**
 * MTN MoMo Collections API (Request to Pay).
 *
 * Activates automatically once these secrets exist:
 *   MOMO_SUBSCRIPTION_KEY  - Collections product primary key (MoMo developer portal)
 *   MOMO_API_USER          - API user UUID
 *   MOMO_API_KEY           - API key generated for that API user
 *   MOMO_ENVIRONMENT       - "sandbox" (default) or "mtnrwanda"
 *   MOMO_CURRENCY          - defaults to EUR in sandbox, RWF in production
 */

export type MomoConfig = {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  environment: string;
  baseUrl: string;
  currency: string;
};

export function getMomoConfig(): MomoConfig | null {
  const subscriptionKey = process.env["MOMO_SUBSCRIPTION_KEY"];
  const apiUser = process.env["MOMO_API_USER"];
  const apiKey = process.env["MOMO_API_KEY"];
  if (!subscriptionKey || !apiUser || !apiKey) return null;

  const environment = process.env["MOMO_ENVIRONMENT"] || "sandbox";
  const baseUrl =
    environment === "sandbox"
      ? "https://sandbox.momodeveloper.mtn.com"
      : "https://proxy.momoapi.mtn.com";
  const currency =
    process.env["MOMO_CURRENCY"] || (environment === "sandbox" ? "EUR" : "RWF");

  return { subscriptionKey, apiUser, apiKey, environment, baseUrl, currency };
}

async function getToken(cfg: MomoConfig): Promise<string> {
  const basic = btoa(`${cfg.apiUser}:${cfg.apiKey}`);
  const res = await fetch(`${cfg.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": cfg.subscriptionKey,
    },
  });
  if (!res.ok) throw new Error(`MoMo token failed (${res.status})`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Normalise a Rwandan number to MSISDN form, e.g. 250796664868. */
export function toMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  if (digits.length === 9) return `250${digits}`;
  return digits;
}

export async function requestToPay(input: {
  amount: number;
  phone: string;
  orderNumber: string;
  note?: string;
}): Promise<{ referenceId: string }> {
  const cfg = getMomoConfig();
  if (!cfg) throw new Error("MoMo is not configured");

  const token = await getToken(cfg);
  const referenceId = crypto.randomUUID();

  const res = await fetch(`${cfg.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": cfg.environment,
      "Ocp-Apim-Subscription-Key": cfg.subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(input.amount),
      currency: cfg.currency,
      externalId: input.orderNumber,
      payer: { partyIdType: "MSISDN", partyId: toMsisdn(input.phone) },
      payerMessage: `Mosiac order ${input.orderNumber}`,
      payeeNote: input.note ?? `Mosiac order ${input.orderNumber}`,
    }),
  });

  if (res.status !== 202) {
    const detail = await res.text();
    throw new Error(`MoMo request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { referenceId };
}

export type MomoStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export async function getPaymentStatus(referenceId: string): Promise<{
  status: MomoStatus;
  reason?: string;
}> {
  const cfg = getMomoConfig();
  if (!cfg) throw new Error("MoMo is not configured");

  const token = await getToken(cfg);
  const res = await fetch(
    `${cfg.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": cfg.environment,
        "Ocp-Apim-Subscription-Key": cfg.subscriptionKey,
      },
    },
  );
  if (!res.ok) throw new Error(`MoMo status failed (${res.status})`);
  const json = (await res.json()) as { status: MomoStatus; reason?: string };
  return { status: json.status, reason: json.reason };
}
