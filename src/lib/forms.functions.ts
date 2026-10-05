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
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const touchSchema = z
  .object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    utm_term: z.string().optional(),
    fbclid: z.string().optional(),
    gclid: z.string().optional(),
    ttclid: z.string().optional(),
    campaign_id: z.string().optional(),
    adset_id: z.string().optional(),
    ad_id: z.string().optional(),
    placement: z.string().optional(),
    site_source_name: z.string().optional(),
    referrer: z.string().optional(),
    landing_page_url: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .optional()
  .nullable();

const customSchema = z.object({
  lead_id: z.string().optional(),
  customer_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(2500),
  preferred_size: z.string().trim().max(100).optional().or(z.literal("")),
  budget_range: z.string().trim().max(100).optional().or(z.literal("")),
  firstTouch: touchSchema,
  lastTouch: touchSchema,
  fbp: z.string().optional().nullable(),
  fbc: z.string().optional().nullable(),
  consentStatus: z.string().optional().nullable(),
  website_hp: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

const partialLeadSchema = z.object({
  lead_id: z.string(),
  customer_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  preferred_contact: z.string().optional(),
  stage_reached: z.number().int().min(1).max(4),
  partial_brief: z.string().optional(),
  firstTouch: touchSchema,
  lastTouch: touchSchema,
  fbp: z.string().optional().nullable(),
  fbc: z.string().optional().nullable(),
  consentStatus: z.string().optional().nullable(),
});

/**
 * Progressively syncs in-progress bespoke lead data to CRM at Stage 1 / 2 / 3
 * Ensures customer contact details and attribution are captured even if the form is abandoned before final submit.
 */
export const syncPartialBespokeLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => partialLeadSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const { syncLeadToCrm } = await import("./crm.server");
      await syncLeadToCrm({
        lead_id: data.lead_id,
        name: data.customer_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        channel: "bespoke",
        message: `[IN-PROGRESS STAGE ${data.stage_reached}/4 · UNFINISHED LEAD CAPTURE]\nContact Preference: ${(data.preferred_contact || "whatsapp").toUpperCase()}\nDelivery Location: ${data.location || "Kigali"}\n${data.partial_brief || ""}`,
        consentStatus: data.consentStatus || "granted",
        firstTouch: data.firstTouch,
        lastTouch: data.lastTouch,
        fbp: data.fbp,
        fbc: data.fbc,
        timestamp: Date.now(),
      });
    } catch (crmErr) {
      console.warn("[CRM] Partial lead sync notice:", crmErr);
    }

    return { ok: true, lead_id: data.lead_id };
  });

export const submitCustomRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => customSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Honeypot anti-spam defense
    if (data.website_hp) {
      return { ok: true, lead_id: "hp_filtered" };
    }

    const leadId = data.lead_id || `lead_bespoke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventId = data.eventId || `mosiac_lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const s = getClient();
      const { error } = await s.from("custom_requests").insert({
        customer_name: data.customer_name,
        email: data.email || null,
        phone: data.phone || null,
        description: data.description,
        preferred_size: data.preferred_size || null,
        budget_range: data.budget_range || null,
      });
      if (error) {
        console.warn("[Supabase] custom_requests insert warning:", error.message);
      }
    } catch (err) {
      console.warn("[Supabase] custom_requests error:", err);
    }

    // 2. Dispatch to CRM server-side with multi-touch attribution
    try {
      const { syncLeadToCrm } = await import("./crm.server");
      await syncLeadToCrm({
        lead_id: leadId,
        name: data.customer_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        channel: "bespoke",
        message: data.description,
        preferredSize: data.preferred_size || undefined,
        budgetRange: data.budget_range || undefined,
        consentStatus: data.consentStatus || "granted",
        firstTouch: data.firstTouch,
        lastTouch: data.lastTouch,
        fbp: data.fbp,
        fbc: data.fbc,
        timestamp: Date.now(),
      });
    } catch (crmErr) {
      console.warn("[CRM] Lead sync notice:", crmErr);
    }

    // 3. Dispatch server-side Meta CAPI Lead event (for deduplication & ad blockers)
    try {
      const { processMetaConversionEvent } = await import("./meta-capi");
      let estimatedVal = 650000;
      if (data.budget_range?.includes("Under 600,000")) estimatedVal = 450000;
      else if (data.budget_range?.includes("600,000 – 1,200,000")) estimatedVal = 900000;
      else if (data.budget_range?.includes("1,200,000 – 2,500,000")) estimatedVal = 1850000;
      else if (data.budget_range?.includes("2,500,000+")) estimatedVal = 2800000;

      await processMetaConversionEvent({
        eventName: "Lead",
        eventId,
        eventSourceUrl: "https://mosiac.rw/custom",
        actionSource: "website",
        userData: {
          email: data.email || undefined,
          phone: data.phone || undefined,
          firstName: data.customer_name.split(" ")[0],
          lastName: data.customer_name.split(" ").slice(1).join(" ") || undefined,
          fbp: data.fbp || undefined,
          fbc: data.fbc || undefined,
          externalId: leadId,
        },
        customData: {
          contentName: "Bespoke Custom Rug Commission",
          leadType: "bespoke_custom_commission",
          value: estimatedVal,
          currency: "RWF",
          budgetRange: data.budget_range || undefined,
          preferredSize: data.preferred_size || undefined,
        },
      });
    } catch (metaErr) {
      console.warn("[Meta CAPI] Server event notice:", metaErr);
    }

    return { ok: true, lead_id: leadId, event_id: eventId };
  });

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  firstTouch: touchSchema,
  lastTouch: touchSchema,
  fbp: z.string().optional().nullable(),
  fbc: z.string().optional().nullable(),
  consentStatus: z.string().optional().nullable(),
  website_hp: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website_hp) {
      return { ok: true, lead_id: "hp_filtered" };
    }

    const leadId = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventId = data.eventId || `mosiac_contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const s = getClient();
      const { error } = await s.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        message: data.message,
      });
      if (error) {
        console.warn("[Supabase] contact_messages insert warning:", error.message);
      }
    } catch (err) {
      console.warn("[Supabase] contact_messages error:", err);
    }

    // Dispatch to CRM
    try {
      const { syncLeadToCrm } = await import("./crm.server");
      await syncLeadToCrm({
        lead_id: leadId,
        name: data.name,
        email: data.email,
        channel: "contact",
        message: `${data.subject ? `[${data.subject}] ` : ""}${data.message}`,
        consentStatus: data.consentStatus || "granted",
        firstTouch: data.firstTouch,
        lastTouch: data.lastTouch,
        fbp: data.fbp,
        fbc: data.fbc,
        timestamp: Date.now(),
      });
    } catch (crmErr) {
      console.warn("[CRM] Contact lead sync notice:", crmErr);
    }

    // Server-side Meta CAPI Contact event
    try {
      const { processMetaConversionEvent } = await import("./meta-capi");
      await processMetaConversionEvent({
        eventName: "Contact",
        eventId,
        eventSourceUrl: "https://mosiac.rw/contact",
        actionSource: "website",
        userData: {
          email: data.email,
          firstName: data.name.split(" ")[0],
          lastName: data.name.split(" ").slice(1).join(" ") || undefined,
          fbp: data.fbp || undefined,
          fbc: data.fbc || undefined,
          externalId: leadId,
        },
        customData: {
          contentName: "Atelier Contact Message",
          subject: data.subject || "General Inquiry",
        },
      });
    } catch (metaErr) {
      console.warn("[Meta CAPI] Contact notice:", metaErr);
    }

    return { ok: true, lead_id: leadId, event_id: eventId };
  });

const newsletterSchema = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().trim().max(100).optional(),
  firstTouch: touchSchema,
  lastTouch: touchSchema,
  fbp: z.string().optional().nullable(),
  fbc: z.string().optional().nullable(),
  consentStatus: z.string().optional().nullable(),
  website_hp: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => newsletterSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website_hp) {
      return { ok: true, code: "WELCOME10", discount: 10, expires: null };
    }

    const code = "WELCOME10";
    const discount = 10;
    const expires = null;
    const leadId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventId = data.eventId || `mosiac_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const s = getClient();
      const { data: coupon } = await s
        .from("promo_coupons")
        .select("code, discount_percent, expires_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const promoCode = coupon?.code ?? code;
      const promoDiscount = coupon?.discount_percent ?? discount;
      const promoExpires = coupon?.expires_at ?? expires;

      const { error } = await s.from("newsletter_subscribers").insert({
        email: data.email,
        coupon_code: promoCode,
        welcomed_at: new Date().toISOString(),
      });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        console.warn("[Supabase] newsletter insert warning:", error.message);
      }

      // Also record in promo_leads if source specified
      if (data.source) {
        await s.from("promo_leads").insert({
          name: data.email.split("@")[0],
          email: data.email,
          phone: "N/A",
          source: data.source,
        }).then(undefined, () => {});
      }

      // Dispatch to CRM
      try {
        const { syncLeadToCrm } = await import("./crm.server");
        await syncLeadToCrm({
          lead_id: leadId,
          email: data.email,
          channel: "newsletter",
          consentStatus: data.consentStatus || "granted",
          firstTouch: data.firstTouch,
          lastTouch: data.lastTouch,
          fbp: data.fbp,
          fbc: data.fbc,
          timestamp: Date.now(),
        });
      } catch (crmErr) {
        console.warn("[CRM] Newsletter lead sync notice:", crmErr);
      }

      // Server-side Meta CAPI CompleteRegistration event
      try {
        const { processMetaConversionEvent } = await import("./meta-capi");
        await processMetaConversionEvent({
          eventName: "CompleteRegistration",
          eventId,
          eventSourceUrl: "https://mosiac.rw",
          actionSource: "website",
          userData: {
            email: data.email,
            fbp: data.fbp || undefined,
            fbc: data.fbc || undefined,
            externalId: leadId,
          },
          customData: {
            contentName: "Newsletter Collector Subscription",
            type: "newsletter",
            couponCode: promoCode,
          },
        });
      } catch (metaErr) {
        console.warn("[Meta CAPI] Newsletter notice:", metaErr);
      }

      return { ok: true, code: promoCode, discount: promoDiscount, expires: promoExpires, lead_id: leadId, event_id: eventId };
    } catch (err) {
      console.warn("[Supabase] subscribeNewsletter error:", err);
      return { ok: true, code, discount, expires, lead_id: leadId, event_id: eventId };
    }
  });

export const claimPromo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        source: z.string().optional(),
        firstTouch: touchSchema,
        lastTouch: touchSchema,
        fbp: z.string().optional().nullable(),
        fbc: z.string().optional().nullable(),
        consentStatus: z.string().optional().nullable(),
        website_hp: z.string().optional().nullable(),
        eventId: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.website_hp) {
      return { ok: true, lead_id: "hp_filtered" };
    }

    const leadId = `popup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventId = data.eventId || `mosiac_voucher_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const { recordFallbackLead } = await import("./leads-and-banner.functions");
      recordFallbackLead({
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
      });
    } catch {}

    try {
      const s = getClient();
      // Record lead in promo_leads table
      await s.from("promo_leads").insert({
        name: data.name || "Pop-up Visitor",
        phone: data.phone || "N/A",
        email: data.email || null,
        source: data.source || "sample-sale-banner",
      });
    } catch (err) {
      console.warn("[Supabase] claimPromo insert warning:", err);
    }

    // Dispatch to CRM
    try {
      const { syncLeadToCrm } = await import("./crm.server");
      await syncLeadToCrm({
        lead_id: leadId,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        channel: "popup",
        message: `Claimed 55,000 RWF voucher (${data.source || "popup-banner"})`,
        consentStatus: data.consentStatus || "granted",
        firstTouch: data.firstTouch,
        lastTouch: data.lastTouch,
        fbp: data.fbp,
        fbc: data.fbc,
        timestamp: Date.now(),
      });
    } catch (crmErr) {
      console.warn("[CRM] Promo voucher lead sync notice:", crmErr);
    }

    // Server-side Meta CAPI Lead event
    try {
      const { processMetaConversionEvent } = await import("./meta-capi");
      await processMetaConversionEvent({
        eventName: "Lead",
        eventId,
        eventSourceUrl: "https://mosiac.rw",
        actionSource: "website",
        userData: {
          email: data.email || undefined,
          phone: data.phone || undefined,
          firstName: data.name ? data.name.split(" ")[0] : undefined,
          lastName: data.name ? data.name.split(" ").slice(1).join(" ") : undefined,
          fbp: data.fbp || undefined,
          fbc: data.fbc || undefined,
          externalId: leadId,
        },
        customData: {
          contentName: "Welcome Promo Voucher Claim",
          leadType: "welcome_voucher_lead",
          value: 55000,
          currency: "RWF",
        },
      });
    } catch (metaErr) {
      console.warn("[Meta CAPI] Promo lead notice:", metaErr);
    }

    return { ok: true, lead_id: leadId, event_id: eventId };
  });

export const uploadCustomerInspirationFile = createServerFn({ method: "POST" })
  .validator((d: { filename: string; dataUrl: string }) => d)
  .handler(async ({ data }) => {
    if (!data?.dataUrl || typeof data.dataUrl !== "string") {
      throw new Error("Security Alert: Missing or invalid file payload.");
    }
    const match = /^data:([^;]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) {
      throw new Error("Invalid file format. Please upload a verified JPG, PNG, WebP, or PDF file.");
    }

    const bytes = Buffer.from(match[2], "base64");
    const { validateUploadBuffer } = await import("@/lib/security.server");
    const validated = validateUploadBuffer(bytes, ["image", "pdf"], {
      filename: data.filename || "inspiration-file",
      maxBytes: 15_000_000,
    });

    const { saveUploadedImageFile } = await import("@/lib/studio-store.server");
    const url = await saveUploadedImageFile(validated.sanitizedFilename, bytes);
    return { ok: true, url, filename: validated.sanitizedFilename };
  });

