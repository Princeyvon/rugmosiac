# Rug Mosiac — Full Platform Build Plan

This is a large scope (11 customer pages + full admin + payments + auth + storage). It's not a one-shot build — I'll ship it in phases so you can review and course-correct along the way. Note: we're on **TanStack Start** (not Next.js) with **Lovable Cloud** (Postgres, Auth, Storage, server functions) — same capabilities as your spec, just the Lovable-native stack. Cloudinary/Resend/Africa's Talking can be swapped in later if you want, but defaults below use built-ins.

## Design system (applies to every page)
- Tokens already in place: bg `#171513`, cream `#f2ede6`, gold accent `#c97d3a`, Playfair + DM Sans. Keep.
- Add: product card, size selector, quantity stepper, filter chip, status badge, step tracker, admin table components — all as reusable pieces.

## Phase 1 — Foundation (backend + storefront browsing)
1. Enable Lovable Cloud.
2. Schema (migrations, with GRANTs + RLS):
   - `categories`, `products`, `product_sizes`, `product_images`, `colors`, `product_colors`
   - `reviews`, `homepage_featured` (ordering table)
   - `profiles` + `user_roles` (enum: `admin`, `customer`) + `has_role()` security-definer fn
   - `custom_requests`
   - `orders`, `order_items`, `order_status_events`
   - `addresses`, `wishlist`, `newsletter_subscribers`, `contact_messages`, `promo_codes`
3. Storage bucket for product images (public read).
4. Routes: `/catalogue`, `/catalogue/$slug`, `/how-it-works`, `/story`, `/contact`, `/custom` — all wired to real data via server functions + TanStack Query.
5. Home page: replace hard-coded rugs/categories/reviews with DB data; keep current layout.
6. SEO `head()` per route with unique titles/descriptions/OG.

## Phase 2 — Accounts, cart, checkout (payments-lite)
1. Auth: email/password + Google (Lovable Cloud managed). `/auth`, `_authenticated/` gate.
2. `/account` dashboard: orders list, order detail with status tracker, addresses, wishlist, profile.
3. Cart: client state (Zustand) + persisted for logged-in users.
4. `/cart`, `/checkout` (contact → delivery → payment → review), `/order/$id` confirmation.
5. Payments: **Stripe** via Lovable's built-in seamless integration (cards). MTN MoMo, Airtel Money, and bank transfer added as manual/pending methods that create an order with `payment_status = awaiting_confirmation` and notify admin — real MoMo/Airtel API integration is a separate later phase (their APIs need merchant onboarding).
6. Transactional emails via Lovable Emails: order confirmation, status updates, custom-quote replies. (Requires you to set up a sender domain — I'll prompt when we get there.)

## Phase 3 — Admin portal (`/_authenticated/admin`, gated by `admin` role)
1. Dashboard home: stats, quick actions, recent orders.
2. Products: list, create/edit form with drag-and-drop image upload + reorder, sizes/prices matrix, featured toggle, stock state. Bulk actions.
3. Orders: table with filters, detail view with status stepper, internal notes, "send update" action.
4. Custom requests: table, detail, status workflow, send-quote (email + creates a draft order).
5. Content: reorder featured rugs, manage reviews, edit How-It-Works steps + Story rich text.
6. Analytics: sales over time, top rugs, AOV, conversion, customer locations (charts from `orders`).

## Phase 4 — Polish
Sitemap.xml, robots, JSON-LD product schema, per-image responsive srcset, wishlist share, Instagram feed (manual curated images since IG Graph API needs a business account), light-mode toggle w/ persisted preference, SMS OTP (Africa's Talking) if you still want it after email OTP is live.

## What I need from you before I start Phase 1
1. **Confirm the phased approach** — I'll ship Phase 1 in one go, then check in before Phase 2. OK?
2. **Seed data**: should I generate placeholder rug photos + categories + prices to fill the DB, or will you provide real product photos and a price list? (Placeholder is fine to start — you can replace via admin later.)
3. **Currency**: RWF, USD, or both?
4. **Payments now or later**: OK to enable Lovable's built-in Stripe in Phase 2 (requires Pro plan)? MoMo/Airtel start as manual-confirmation until we do real API integration.
5. **Reviews**: seed with the 3 quotes already on the page, or start empty and add via admin?

Reply with answers (or "go" to accept defaults: phased, placeholder seed, RWF+USD, Stripe in P2 + manual MoMo, seed existing reviews) and I'll start Phase 1.
