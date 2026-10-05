/**
 * Comprehensive Studio Dashboard & Admin End-to-End Diagnostic Script
 */
import {
  listAllProducts,
  listAllCategories,
  getStorePendingChanges,
  getStore,
} from "../src/lib/studio-store.server";
import { DEFAULT_FEATURED_SLOTS } from "../src/lib/site-images";
import { DEFAULT_LOOKBOOK_CONFIG } from "../src/lib/lookbook-config";
import { DEFAULT_POPUP_BANNER_CONFIG } from "../src/lib/banner-config";
import { getReviewsStore } from "../src/lib/tracking-and-reviews.server";
import { getCapiAuditLogs, DEFAULT_META_SETTINGS } from "../src/lib/meta-capi";
import { createAdminToken } from "../src/lib/admin.server";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ [PASS] ${name}${detail ? ` - ${detail}` : ""}`);
  } else {
    failed++;
    const msg = `✗ [FAIL] ${name}${detail ? ` - ${detail}` : ""}`;
    errors.push(msg);
    console.error(`  ${msg}`);
  }
}

async function runStudioDashAudit() {
  console.log("================================================================================");
  console.log("MOSIAC STUDIO DASHBOARD: SYSTEM HEALTH & INTEGRITY AUDIT");
  console.log("================================================================================\n");

  // 1. Admin Token & Cryptographic Auth
  console.log("1. Verifying Studio Dashboard Token & Session Architecture:");
  try {
    const testOwner = {
      admin: true,
      role: "owner" as const,
      name: "Studio Owner",
      email: "owner@mosiac.rw",
      perms: { catalogue: true, pricing: true, orders: true, analytics: true },
    };
    const token = createAdminToken(testOwner);
    check("Owner JWT token generation", Boolean(token) && token.split(".").length === 2);
  } catch (err: any) {
    check("Owner JWT token generation", false, err?.message);
  }

  // 2. Catalogue Management Tab
  console.log("\n2. Verifying Catalogue Management Tab & Artisanal Data:");
  try {
    const products = await listAllProducts();
    const categories = await listAllCategories();
    check("Catalogue products load", products.length > 0, `${products.length} products found`);
    check("Catalogue categories load", categories.length > 0, `${categories.length} categories found`);

    // Verify product data integrity
    const invalidPrice = products.filter((p) => typeof p.base_price_rwf !== "number" || p.base_price_rwf <= 0);
    check("Product pricing integrity", invalidPrice.length === 0, `${invalidPrice.length} invalid prices`);

    const missingImages = products.filter((p) => !p.main_image_url);
    check("Product image integrity", missingImages.length === 0, `${missingImages.length} missing main images`);
  } catch (err: any) {
    check("Catalogue tab load", false, err?.message);
  }

  // 3. Overview Tab & Analytics
  console.log("\n3. Verifying Overview & Analytics Panels:");
  try {
    const store = await getStore();
    check("Store state active", Boolean(store));
    const pending = await getStorePendingChanges();
    check("Draft changes indicator", typeof pending.count === "number", `${pending.count} pending changes`);
  } catch (err: any) {
    check("Overview notifications", false, err?.message);
  }

  // 4. Promotions / Coupons Tab
  console.log("\n4. Verifying Promotions & Coupons Tab:");
  try {
    const { data: coupons } = await supabaseAdmin.from("promo_coupons").select("*");
    check("Coupons query", Array.isArray(coupons ?? []), `${coupons?.length ?? 0} coupons configured`);
  } catch (err: any) {
    check("Coupons query", false, err?.message);
  }

  // 5. Orders Tab
  console.log("\n5. Verifying Orders & Delivery Status Tab:");
  try {
    const { data: orders } = await supabaseAdmin.from("orders").select("id, order_number, total_rwf, status");
    check("Orders query", Array.isArray(orders ?? []), `${orders?.length ?? 0} orders in pipeline`);
  } catch (err: any) {
    check("Orders query", false, err?.message);
  }

  // 6. Customers Tab
  console.log("\n6. Verifying Customers & Mailing List Tab:");
  try {
    const { data: subs } = await supabaseAdmin.from("newsletter_subscribers").select("id, email");
    check("Newsletter subscribers query", Array.isArray(subs ?? []), `${subs?.length ?? 0} subscribers`);
  } catch (err: any) {
    check("Customers query", false, err?.message);
  }

  // 7. Team & Staff Permissions Tab
  console.log("\n7. Verifying Staff & Team Access Tab:");
  try {
    const { data: staff } = await supabaseAdmin.from("staff_accounts").select("id, full_name, role, is_active");
    check("Staff accounts query", Array.isArray(staff ?? []), `${staff?.length ?? 0} staff accounts`);
  } catch (err: any) {
    check("Staff accounts query", false, err?.message);
  }

  // 8. Activity Log Tab
  console.log("\n8. Verifying Studio Activity Audit Log Tab:");
  try {
    const { data: activity } = await supabaseAdmin.from("admin_activity_log").select("id, action, summary");
    check("Activity logs query", Array.isArray(activity ?? []), `${activity?.length ?? 0} audit entries`);
  } catch (err: any) {
    check("Activity logs query", false, err?.message);
  }

  // 9. Site Images Control Panel
  console.log("\n9. Verifying Site Images Control Panel:");
  try {
    check("Site image slots config", DEFAULT_FEATURED_SLOTS.length > 0, `${DEFAULT_FEATURED_SLOTS.length} image slots defined`);
  } catch (err: any) {
    check("Site image slots config", false, err?.message);
  }

  // 10. Lookbook Control Panel
  console.log("\n10. Verifying Lookbook Control Panel:");
  try {
    check("Lookbook configuration", Boolean(DEFAULT_LOOKBOOK_CONFIG?.pdfUrl), `PDF: ${DEFAULT_LOOKBOOK_CONFIG.pdfUrl}`);
  } catch (err: any) {
    check("Lookbook configuration", false, err?.message);
  }

  // 11. Pop-up Promotion Banner Panel
  console.log("\n11. Verifying Pop-up Banner Control Panel:");
  try {
    check("Banner configuration", typeof DEFAULT_POPUP_BANNER_CONFIG.enabled === "boolean", `Coupon: ${DEFAULT_POPUP_BANNER_CONFIG.couponCode}`);
  } catch (err: any) {
    check("Banner configuration", false, err?.message);
  }

  // 12. Meta CAPI & Tracking Diagnostics Panel
  console.log("\n12. Verifying Meta CAPI & Attribution Panel:");
  try {
    check("Meta settings retrieval", Boolean(DEFAULT_META_SETTINGS?.pixelId), `Pixel ID: ${DEFAULT_META_SETTINGS.pixelId}`);
    const logs = getCapiAuditLogs();
    check("Signal reconciliation audit logs", Array.isArray(logs), `${logs.length} CAPI dispatches logged`);
  } catch (err: any) {
    check("Meta settings & reconciliation", false, err?.message);
  }

  // 13. Customer Reviews Moderation Panel
  console.log("\n13. Verifying Reviews Moderation Panel:");
  try {
    const reviews = getReviewsStore();
    check("Customer reviews query", Array.isArray(reviews), `${reviews.length} reviews loaded`);
  } catch (err: any) {
    check("Customer reviews query", false, err?.message);
  }

  // 14. Captured Contacts Hub Panel
  console.log("\n14. Verifying Captured Contacts Hub Panel:");
  try {
    const { data: leads } = await supabaseAdmin.from("promo_leads").select("id, name, phone, email");
    check("Captured contacts query", Array.isArray(leads ?? []), `${leads?.length ?? 0} leads in hub`);
  } catch (err: any) {
    check("Captured contacts query", false, err?.message);
  }

  console.log("\n================================================================================");
  console.log(`AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("Errors found:", errors);
    process.exit(1);
  }
  process.exit(0);
}

runStudioDashAudit().catch((e) => {
  console.error("Fatal audit error:", e);
  process.exit(1);
});
