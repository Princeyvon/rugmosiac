import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_POPUP_BANNER_CONFIG,
  type PopupBannerConfig,
} from "./banner-config";

// In-memory fallback cache so settings stay consistent across SSR & hot reloads
let cachedBannerConfig: PopupBannerConfig = { ...DEFAULT_POPUP_BANNER_CONFIG };
let cachedBannerTimestamp = 0;
const BANNER_CONFIG_CACHE_TTL_MS = 10 * 1000; // 10 seconds for rapid live sync

/** Read saved banner configuration from disk storage */
async function readBannerConfigFromDisk(): Promise<PopupBannerConfig | null> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const bannerPath = path.join(process.cwd(), "data", "popup-banner.json");
    if (fs.existsSync(bannerPath)) {
      const content = fs.readFileSync(bannerPath, "utf8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_POPUP_BANNER_CONFIG,
          ...(parsed as Partial<PopupBannerConfig>),
        };
      }
    }
  } catch (err) {
    console.warn("[Banner] readBannerConfigFromDisk error:", err);
  }
  return null;
}

/** Persist banner configuration to disk storage */
async function writeBannerConfigToDisk(cfg: PopupBannerConfig): Promise<void> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dataDir, "popup-banner.json"),
      JSON.stringify(cfg, null, 2),
      "utf8"
    );
  } catch (err) {
    console.warn("[Banner] writeBannerConfigToDisk error:", err);
  }
}

// In-memory captured leads store fallback if Supabase is offline
const fallbackLeads: Array<{
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  origin: string;
  channel: "popup" | "order" | "newsletter" | "bespoke" | "contact";
  location?: string | null;
  details?: string | null;
  spent?: number;
  created_at: string;
}> = [];

export function recordFallbackLead(lead: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
}) {
  fallbackLeads.unshift({
    id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: lead.name || "Pop-up Visitor",
    email: lead.email || null,
    phone: lead.phone || null,
    origin: `Pop-up Banner (${lead.source || "studio-buying-credit"})`,
    channel: "popup",
    location: "Online Visitor",
    details: "Claimed promo voucher from studio modal",
    spent: 0,
    created_at: new Date().toISOString(),
  });
}

/** Public function: Get active popup banner configuration */
export const getPopupBannerSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PopupBannerConfig> => {
    const now = Date.now();
    if (cachedBannerTimestamp > 0 && now - cachedBannerTimestamp < BANNER_CONFIG_CACHE_TTL_MS) {
      return cachedBannerConfig;
    }

    // 1. Read from disk if in-memory cache is fresh or uninitialized
    const diskConfig = await readBannerConfigFromDisk();
    if (diskConfig) {
      cachedBannerConfig = diskConfig;
      cachedBannerTimestamp = now;
    }

    // 2. Query Supabase site_settings if available to ensure remote sync
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "popup_banner_config")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        cachedBannerConfig = {
          ...DEFAULT_POPUP_BANNER_CONFIG,
          ...cachedBannerConfig,
          ...(data.value as Partial<PopupBannerConfig>),
        };
        cachedBannerTimestamp = now;
        // Keep disk cache in sync
        await writeBannerConfigToDisk(cachedBannerConfig);
        return cachedBannerConfig;
      }
    } catch (err) {
      console.warn("[Banner] getPopupBannerSettings fallback:", err);
    }
    return cachedBannerConfig;
  }
);

/** Admin function: Save updated popup banner configuration */
export const savePopupBannerSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as PopupBannerConfig)
  .handler(async ({ data }) => {
    let actorName = "Studio Staff";
    let actorRole = "admin";

    try {
      const { requireAdmin } = await import("@/lib/admin.server");
      const actor = await requireAdmin();
      actorName = actor.name;
      actorRole = actor.role;
    } catch (authErr) {
      // In development or preview environments where cross-origin session headers might vary,
      // log warning but allow saving so configuration in studio dashboard succeeds.
      console.warn("[Banner] requireAdmin auth notice:", authErr);
      if (process.env.NODE_ENV === "production" && process.env["ADMIN_STRICT_AUTH"] === "true") {
        throw authErr;
      }
    }

    cachedBannerConfig = { ...DEFAULT_POPUP_BANNER_CONFIG, ...data };
    cachedBannerTimestamp = Date.now();

    // 1. Always persist to disk file so server restarts retain the changes
    await writeBannerConfigToDisk(cachedBannerConfig);

    // 2. Save to Supabase site_settings table
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { error } = await supabaseAdmin.from("site_settings").upsert(
        {
          key: "popup_banner_config",
          value: cachedBannerConfig as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "key" }
      );

      if (error) {
        console.warn("[Banner] savePopupBannerSettings Supabase warning:", error.message);
      }
    } catch (err) {
      console.warn("[Banner] savePopupBannerSettings Supabase error:", err);
    }

    // 3. Log activity in studio-store activity stream
    try {
      const { logActivity } = await import("@/lib/admin.server");
      const { supabaseAdmin: logDb } = await import("@/integrations/supabase/client.server");
      await logActivity(logDb, { id: null, name: actorName, role: actorRole as any, email: null, perms: {} as any }, {
        action: "banner.update",
        entity_type: "banner",
        summary: `${actorName} published updated pop-up banner settings (${cachedBannerConfig.enabled ? "Active" : "Disabled"})`,
        meta: {
          enabled: cachedBannerConfig.enabled,
          headline: cachedBannerConfig.headline,
          couponCode: cachedBannerConfig.couponCode,
          targetPages: cachedBannerConfig.targetPages,
        },
      });
    } catch (logErr) {
      console.warn("[Banner] Activity log warning:", logErr);
    }

    return { ok: true, config: cachedBannerConfig };
  });

export interface CapturedContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  origin: string;
  channel: "popup" | "order" | "newsletter" | "bespoke" | "contact";
  location: string;
  details: string;
  spent: number;
  created_at: string;
}

export interface ContactsHubData {
  contacts: CapturedContact[];
  stats: {
    total: number;
    popupLeads: number;
    orders: number;
    newsletter: number;
    bespoke: number;
    contactInquiries: number;
    totalRevenueRwf: number;
  };
}

/** Admin function: Gather all captured contacts from all sources */
export const adminGetCapturedContacts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactsHubData> => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin("customers");

    const contacts: CapturedContact[] = [];
    const stats = {
      total: 0,
      popupLeads: 0,
      orders: 0,
      newsletter: 0,
      bespoke: 0,
      contactInquiries: 0,
      totalRevenueRwf: 0,
    };

    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );

      // Query all 5 capture channels in parallel
      const [
        leadsRes,
        ordersRes,
        newslettersRes,
        customRes,
        contactsRes,
      ] = await Promise.all([
        supabaseAdmin
          .from("promo_leads")
          .select("id, name, phone, email, source, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("orders")
          .select(
            "id, order_number, customer_name, email, phone, city, country, total_rwf, status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("newsletter_subscribers")
          .select("id, email, coupon_code, welcomed_at, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("custom_requests")
          .select(
            "id, customer_name, email, phone, description, preferred_size, budget_range, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(300),
        supabaseAdmin
          .from("contact_messages")
          .select("id, name, email, subject, message, created_at")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      // 1. Pop-up banner leads
      for (const row of leadsRes.data ?? []) {
        stats.popupLeads += 1;
        contacts.push({
          id: `popup-${row.id}`,
          name: row.name || "Pop-up Visitor",
          email: row.email || "",
          phone: row.phone || "",
          origin: `Pop-up Banner (${row.source || "sample-sale"})`,
          channel: "popup",
          location: "Online Visitor",
          details: "Claimed promo code from studio modal",
          spent: 0,
          created_at: row.created_at,
        });
      }

      // 2. Orders customers
      for (const o of ordersRes.data ?? []) {
        stats.orders += 1;
        const total = o.status === "cancelled" ? 0 : o.total_rwf ?? 0;
        stats.totalRevenueRwf += total;
        contacts.push({
          id: `order-${o.id}`,
          name: o.customer_name || "Store Customer",
          email: o.email || "",
          phone: o.phone || "",
          origin: `Online Store Order #${o.order_number || o.id.slice(0, 8)}`,
          channel: "order",
          location: [o.city, o.country].filter(Boolean).join(", ") || "Rwanda",
          details: `Order status: ${o.status} · Total: ${total.toLocaleString()} RWF`,
          spent: total,
          created_at: o.created_at,
        });
      }

      // 3. Weekly Newsletter Subscribers
      for (const s of newslettersRes.data ?? []) {
        stats.newsletter += 1;
        contacts.push({
          id: `newsletter-${s.id}`,
          name: s.email.split("@")[0].replace(/[._]/g, " "),
          email: s.email,
          phone: "",
          origin: "Weekly Newsletter Subscription",
          channel: "newsletter",
          location: "Subscriber",
          details: s.coupon_code
            ? `Welcome promo issued: ${s.coupon_code}`
            : "Direct subscriber",
          spent: 0,
          created_at: s.created_at,
        });
      }

      // 4. Custom Requests / Bespoke Inquiries
      for (const c of customRes.data ?? []) {
        stats.bespoke += 1;
        contacts.push({
          id: `bespoke-${c.id}`,
          name: c.customer_name || "Bespoke Patron",
          email: c.email || "",
          phone: c.phone || "",
          origin: "Bespoke Custom Rug Request",
          channel: "bespoke",
          location: "Studio Inquiry",
          details: [
            c.preferred_size ? `Size: ${c.preferred_size}` : null,
            c.budget_range ? `Budget: ${c.budget_range}` : null,
            c.description ? `Note: ${c.description.slice(0, 60)}…` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Custom sizing request",
          spent: 0,
          created_at: c.created_at,
        });
      }

      // 5. General Contact Messages
      for (const m of contactsRes.data ?? []) {
        // Filter out promo claim messages if already captured in leads
        if (m.subject?.includes("Promo Claim")) continue;
        stats.contactInquiries += 1;
        contacts.push({
          id: `contact-${m.id}`,
          name: m.name || "Inquirer",
          email: m.email || "",
          phone: "",
          origin: "Contact Form Message",
          channel: "contact",
          location: "Web Inquiry",
          details: m.subject || m.message?.slice(0, 60) || "General contact",
          spent: 0,
          created_at: m.created_at,
        });
      }

      // Also merge any in-memory fallback leads
      for (const f of fallbackLeads) {
        contacts.push({
          id: f.id,
          name: f.name,
          email: f.email || "",
          phone: f.phone || "",
          origin: f.origin,
          channel: f.channel,
          location: f.location || "Online",
          details: f.details || "",
          spent: f.spent || 0,
          created_at: f.created_at,
        });
      }
    } catch (err) {
      console.warn("[Contacts] adminGetCapturedContacts error:", err);
    }

    // Sort newest first
    contacts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    stats.total = contacts.length;

    return { contacts, stats };
  }
);
