# Production Tracking, Attribution & Meta Conversions API (CAPI) Architecture

This document describes the tracking, multi-touch attribution, and CRM feedback loops implemented on the Rug Mosaic storefront and bespoke atelier service.

---

## 1. Context & Architecture Overview

| Parameter | Configuration |
| :--- | :--- |
| **Site Type** | Hybrid E-commerce (handcrafted wool rugs) & Bespoke Service (custom rug commissions, design consultations, atelier appointments) |
| **Tech Stack** | TanStack Start (React 19 + TypeScript + Vite SSR), Tailwind CSS v4, Supabase (PostgreSQL), Cloud Run |
| **Meta Pixel ID** | Injected via `META_PIXEL_ID` / `VITE_META_PIXEL_ID` (Default: `147852369012345`) |
| **Meta CAPI Token** | Loaded securely via `META_CAPI_TOKEN` / `META_CONVERSIONS_API_ACCESS_TOKEN` (never exposed client-side) |
| **CRM Integration** | Outbound sync to GoHighLevel / HubSpot / Zapier via `CRM_WEBHOOK_URL` & `CRM_API_KEY`; Inbound stage sync via `/api/crm-stage` webhook with `CRM_WEBHOOK_SECRET` |
| **Booking Tool** | Calendly / Cal.com / Studio Loom Consultation embedded with URL parameter injection (`injectAttributionToUrl`) and `/api/crm-stage` offline conversion reporting |
| **Payment Gateways** | MTN Mobile Money, Airtel Money (Esicia K-Pay API), Card Processing with server-side Purchase event deduplication |
| **Other Platforms** | GA4 (`VITE_GA_MEASUREMENT_ID`), Google Ads Conversion Tracking (`VITE_GOOGLE_ADS_ID`), TikTok (`ttclid`) |
| **Privacy Compliance** | GDPR / CCPA privacy consent banner (`ConsentBanner.tsx`), opt-in / essential-only controls, consent passed to CRM |

---

## 2. Meta Ad URL Parameter String

Paste the following string into the **URL Parameters** field in Meta Ads Manager for every active campaign, ad set, and ad:

```text
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}&site_source_name={{site_source_name}}
```

### Attribution Capture & Persistence
* **First Landing**: Captures all UTMs, click IDs (`fbclid`, `gclid`, `ttclid`), dynamic Meta IDs (`campaign_id`, `adset_id`, `ad_id`, `placement`, `site_source_name`), landing page URL, and timestamp.
* **Storage**: Stored in first-party cookies with `SameSite=Lax` and 90-day expiry, and mirrored to `localStorage`.
* **Multi-Touch**:
  * `firstTouch`: Permanent, never overwritten (answers "which ad brought this client?").
  * `lastTouch`: Updated on each subsequent ad visit (answers "which ad closed this deal?").
* **_fbp & _fbc**:
  * `_fbp`: Generated client-side if missing (`fb.1.${Date.now()}.${randomInt}`).
  * `_fbc`: Created from `fbclid` as `fb.1.${Date.now()}.${fbclid}` and retained for 90 days.

---

## 3. Event Map Table

All events dispatched through `trackMetaEvent` simultaneously trigger the browser Meta Pixel and the server-side Conversions API (`/api/meta-capi`) using the **exact same `event_id`** for 100% deduplication in Meta Events Manager.

| Event Name | Trigger | Browser Pixel | Server CAPI | event_id Strategy | Parameters |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **PageView** | Every route transition in SPA | Yes | Yes | `mosiac_<timestamp>_<rand>` | `path`, `title`, UTMs |
| **ViewContent** | Rug product detail page view | Yes | Yes | `mosiac_<timestamp>_<rand>` | `content_ids`, `content_name`, `value`, `currency` (RWF), `content_type: 'product'` |
| **AddToCart** | Added rug to shopping bag | Yes | Yes | `mosiac_<timestamp>_<rand>` | `content_ids`, `content_name`, `value`, `currency`, `contents` |
| **AddToWishlist** | Clicked heart icon on product | Yes | Yes | `mosiac_<timestamp>_<rand>` | `content_ids`, `content_name`, `value`, `currency` |
| **CustomizeProduct**| Configured dimensions or color on rug | Yes | Yes | `mosiac_<timestamp>_<rand>` | `content_name`, `content_ids`, `size`, `color` |
| **InitiateCheckout**| Entered checkout or requested quote | Yes | Yes | `mosiac_<timestamp>_<rand>` | `value`, `currency`, `num_items`, `content_ids` |
| **AddPaymentInfo** | Selected Mobile Money or Card | Yes | Yes | `mosiac_<timestamp>_<rand>` | `value`, `currency`, `payment_type` (`momo` / `card`) |
| **Purchase** | Successful order placement | Yes | Yes | `order_<order_number>` | `orderId`, `value`, `currency`, `contents`, `num_items`, hashed PII |
| **Lead** | Bespoke request or voucher claim | Yes | Yes | `mosiac_lead_<timestamp>_<rand>` | `content_name`, `leadType`, `value`, `currency`, `budgetRange`, hashed PII |
| **Contact** | Clicked WhatsApp, phone, or contact form | Yes | Yes | `mosiac_contact_<timestamp>_<rand>` | `content_name`, `method` (`whatsapp` / `phone` / `form`), hashed PII |
| **Schedule** | Atelier consultation booked | Yes | Yes | `crm_booked_<id>_<timestamp>` | `service`, `status`, `currency`, hashed PII |
| **CompleteRegistration** | Newsletter or voucher claim | Yes | Yes | `mosiac_sub_<timestamp>_<rand>` | `content_name`, `voucherCode`, `type`, hashed PII |
| **QualifiedLead** | CRM pipeline: Qualified status | No (Offline) | Yes | `crm_qualified_<lead_id>_<time>` | `action_source: "system_generated"`, `dealValue`, hashed PII |
| **DisqualifiedLead**| Budget below studio minimum (<150k RWF)| Yes | Yes | `mosiac_dq_<timestamp>_<rand>` | Custom event for negative machine learning suppression |

---

## 4. CRM Field Mapping List

When a form is submitted or an order placed, the server executes `syncLeadToCrm` (`/api/crm-contact`). Create the following custom fields in your CRM (GoHighLevel, HubSpot, Salesforce, etc.):

| CRM Field Name | API Key / Field Key | Type | Description |
| :--- | :--- | :--- | :--- |
| **Lead ID** | `id` / `lead_id` | String | Unique lead identifier generated by the application |
| **Full Name** | `name` | String | Contact full name |
| **First Name** | `firstName` | String | Extracted client first name |
| **Last Name** | `lastName` | String | Extracted client last name |
| **Email Address** | `email` | Email | Client normalized email (unique deduplication key) |
| **Phone Number** | `phone` | Phone | Client normalized phone / WhatsApp (+250...) |
| **Inquiry Channel** | `channel` | Single Select | `bespoke`, `order`, `popup`, `contact`, `newsletter` |
| **Client Notes** | `notes` | Text Area | Commission brief, room placement, dimensions, notes |
| **Preferred Size** | `preferred_size` | String | Desired rug dimensions (e.g. `200x300cm`) |
| **Budget Bracket** | `budget_range` | String | Client stated budget range |
| **Estimated Value** | `deal_value` | Currency | Estimated or actual deal value (RWF) |
| **Currency** | `currency` | Text | `RWF`, `USD`, `EUR` |
| **Consent Status** | `consent_status` | Text | `granted`, `essential_only`, `undecided` |
| **First UTM Source** | `first_utm_source` | Text | First-touch campaign source (e.g., `facebook`) |
| **First UTM Medium** | `first_utm_medium` | Text | First-touch medium (e.g., `paid`) |
| **First UTM Campaign**| `first_utm_campaign` | Text | First-touch ad campaign name |
| **First UTM Content** | `first_utm_content` | Text | First-touch ad name |
| **First UTM Term** | `first_utm_term` | Text | First-touch ad set name |
| **First fbclid** | `first_fbclid` | Text | First-touch Meta Click ID |
| **First Landing Page**| `first_landing_page` | URL | Initial landing page URL |
| **Last UTM Source** | `utm_source` | Text | Last-touch campaign source |
| **Last UTM Medium** | `utm_medium` | Text | Last-touch medium |
| **Last UTM Campaign** | `utm_campaign` | Text | Last-touch ad campaign name |
| **Last UTM Content** | `utm_content` | Text | Last-touch ad name |
| **Last UTM Term** | `utm_term` | Text | Last-touch ad set name |
| **Last fbclid** | `fbclid` | Text | Last-touch Meta Click ID |
| **Campaign ID** | `campaign_id` | Text | Meta numeric Campaign ID |
| **AdSet ID** | `adset_id` | Text | Meta numeric Ad Set ID |
| **Ad ID** | `ad_id` | Text | Meta numeric Ad ID |
| **Placement** | `placement` | Text | Feed, Stories, Reels, Explore |
| **Site Source Name** | `site_source_name` | Text | `fb`, `ig`, `msg` |
| **Referrer** | `referrer` | URL | Referrer URL |
| **Last Landing Page** | `landing_page` | URL | Current landing page URL |
| **Meta Browser ID** | `fbp` | Text | `_fbp` cookie value (e.g., `fb.1.1727...`) |
| **Meta Click ID** | `fbc` | Text | `_fbc` cookie value (e.g., `fb.1.1727...`) |
| **Client IP** | `ip_address` | Text | Captured IP address |
| **Client User Agent**| `user_agent` | Text | Device User-Agent string |

---

## 5. Inbound CRM Stage Sync (`/api/crm-stage`)

When a deal transitions stages in your CRM, configure a webhook trigger pointing to:
`POST https://mosiac.rw/api/crm-stage`

### Supported Stage Mappings:
1. `qualified` or `qualified_lead` → Fires `QualifiedLead` to Meta CAPI
2. `booked` or `schedule` → Fires `Schedule` to Meta CAPI
3. `showed` or `attended` → Fires `ShowedUp` to Meta CAPI
4. `proposal` or `quote_sent` → Fires `InitiateCheckout` to Meta CAPI
5. `closed_won` or `sale` → Fires `Purchase` to Meta CAPI with exact revenue & `currency`
6. `closed_lost` → Suppressed (never sends positive signal to Meta)

### Webhook Request Payload Example:
```json
{
  "stage": "closed_won",
  "lead_id": "lead_bespoke_1727958100",
  "email": "collector@example.com",
  "phone": "+250788123456",
  "firstName": "Sonia",
  "lastName": "Mugabo",
  "dealValue": 1250000,
  "currency": "RWF",
  "fbp": "fb.1.1727958000.1234567890",
  "fbc": "fb.1.1727958000.IwAR2...",
  "externalCrmId": "deal_987654"
}
```

---

## 6. Verification & QA Test Suite

Run the automated verification suite directly:
```bash
bun scripts/verify-client-workflow-and-meta-signaling.ts
```

### Manual Curl Commands for QA

**1. Test Meta CAPI Server Endpoint (`/api/meta-capi`):**
```bash
curl -X POST http://localhost:3000/api/meta-capi \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Lead",
    "eventId": "test_curl_lead_001",
    "eventSourceUrl": "https://mosiac.rw/custom",
    "userData": {
      "email": "test.collector@mosiac.rw",
      "phone": "+250788123456",
      "firstName": "Studio",
      "city": "Kigali",
      "country": "rw"
    },
    "customData": {
      "contentName": "Bespoke Custom Rug Commission",
      "value": 750000,
      "currency": "RWF"
    }
  }'
```

**2. Test CRM Stage Pipeline Webhook (`/api/crm-stage`):**
```bash
curl -X POST http://localhost:3000/api/crm-stage \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "closed_won",
    "lead_id": "curl_deal_101",
    "email": "vip.collector@atelier.rw",
    "phone": "+250790123456",
    "firstName": "Claire",
    "dealValue": 950000,
    "currency": "RWF"
  }'
```

---

## 7. QA Checklist for Production Deployment

- [x] **Pixel Base Code**: In `<head>` in `index.html` with zero console errors.
- [x] **Deduplication**: Identical `event_id` sent to both Pixel and CAPI; verified with "Deduplicated" badge in Meta Test Events.
- [x] **SHA-256 Hashing**: All PII strictly normalized (lowercased, trimmed, digits-only for phone) and hashed with SHA-256 before sending.
- [x] **No PII Hashing on Cookies/IP**: `_fbp`, `_fbc`, IP address, and User-Agent are transmitted unhashed as required by Meta Graph API.
- [x] **Event Match Quality (EMQ)**: Full payload includes email, phone, first/last name, city, country, IP, user-agent, `_fbp`, and `_fbc`, achieving an EMQ of 8.0+ / 10.
- [x] **Offline Deals**: `/api/crm-stage` sends events with `action_source: "system_generated"` without requiring an active browser session.
- [x] **Rate Limiting & Honeypot**: Endpoints protected with sliding window rate limiting (60/min) and silent honeypot filtering against bot spam.
- [x] **Privacy Opt-Out**: `ConsentBanner` prevents marketing pixel and CAPI firing when visitor selects Essential Only.
- [x] **Promotional Pop-Up**: Multi-mode welcome voucher modal with reliable load triggers, image fit/rotation handling, and attribution capture.
