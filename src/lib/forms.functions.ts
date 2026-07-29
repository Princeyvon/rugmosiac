import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const customSchema = z.object({
  customer_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(2000),
  preferred_size: z.string().trim().max(100).optional().or(z.literal("")),
  budget_range: z.string().trim().max(100).optional().or(z.literal("")),
});

export const submitCustomRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => customSchema.parse(d))
  .handler(async ({ data }) => {
    const s = getClient();
    const { error } = await s.from("custom_requests").insert({
      customer_name: data.customer_name,
      email: data.email || null,
      phone: data.phone || null,
      description: data.description,
      preferred_size: data.preferred_size || null,
      budget_range: data.budget_range || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const s = getClient();
    const { error } = await s.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const newsletterSchema = z.object({ email: z.string().trim().email().max(255) });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => newsletterSchema.parse(d))
  .handler(async ({ data }) => {
    const s = getClient();
    // Fetch an active coupon to gift the subscriber
    const { data: coupon } = await s
      .from("promo_coupons")
      .select("code, discount_percent, expires_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const code = coupon?.code ?? "WELCOME10";
    const discount = coupon?.discount_percent ?? 10;
    const expires = coupon?.expires_at ?? null;

    const { error } = await s.from("newsletter_subscribers").insert({
      email: data.email,
      coupon_code: code,
      welcomed_at: new Date().toISOString(),
    });
    // Ignore duplicate email — still return the coupon
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }

    return { ok: true, code, discount, expires };
  });
