# Build plan

## 1. Newsletter → 10% off coupon email
- Add `promo_coupons` table (code, discount_percent, active, expires_at) and `newsletter_subscribers.coupon_code` column. Seed one active code `WELCOME10` (10%, all rugs).
- Scaffold Lovable app-email templates. Create `welcome-coupon.tsx` React Email template (dark editorial style matching brand): headline "Welcome to Mosiac — here's 10% off", the coupon code in a big pill, expiry, CTA to catalogue, note it applies to all rugs.
- Wire `subscribeNewsletter` server function to: insert subscriber, look up an active coupon, call `sendTemplateEmail("welcome-coupon", email, { templateData: { code, expires } })`. Handle already-subscribed (resend nothing) and suppressed recipient gracefully.
- Prerequisite: needs an email domain. If none configured, surface the email-setup dialog to the user before wiring send.
- Cart/checkout coupon redemption itself is out of scope for this pass (no checkout exists yet); the code is delivered and stored for later use.

## 2. Product page polish
- Reduce product name from `text-5xl` to `text-3xl md:text-4xl` so it doesn't overlap gallery.
- Rewrite "Care instructions" tab to the New Zealand wool structure from the reference (4-item icon grid: blot spills, vacuum high pile, professional cleaning, trim loose threads) with lucide icons and centered heading.
- Add "Related Products" section under the tabs: fetch up to 4 other published products in the same category, render as small cards linking to `/catalogue/$slug`.

## 3. Sizing guide (Find your size tab)
- Rebuild the tab as an interactive diagram:
  - Imperial / Metric toggle (pill switch, top-left).
  - S / M / L / XL selector (top-right) driven by the product's own `product_sizes` rows.
  - Center: SVG rug outline that scales proportionally to the selected size's width/height, with dimension labels (e.g. "213 cm" / "84 in") on top and left edges. Outline uses soft cream fill (`#f0eadf`) with subtle notch marks matching the reference sketch.
  - Bottom-left: Weight (converted lb/kg) and Material.
- Add `weight_kg` numeric column to `product_sizes` and backfill sensible values for existing seeded rugs so weights render.

## 4. Wishlist + Cart (local, no WhatsApp)
- Create `src/lib/store.tsx`: `CartProvider` and `WishlistProvider` backed by localStorage + React context. Cart items: `{ productId, slug, name, image, sizeId, sizeLabel, color, qty, unitPriceUsd, unitPriceRwf }`. Wishlist: `{ productId, slug, name, image }`.
- Mount both providers in `__root.tsx` alongside `CurrencyProvider`.
- Nav cart icon shows live count from `useCart()`. Add heart icon next to cart showing wishlist count; click opens a slide-over drawer (shadcn `Sheet`) listing items with remove.
- Cart drawer (shadcn `Sheet`) opens from nav cart click: line items, qty +/-, remove, subtotal in current currency, "Checkout coming soon — message on WhatsApp" fallback link.
- Product page:
  - "Add to cart" no longer opens WhatsApp; it calls `cart.add(...)` and opens the cart drawer.
  - "Save to wishlist" toggles `wishlist.toggle(...)` and turns the heart filled when active.

## 5. FAQ page
- New route `/faq` (`src/routes/faq.tsx`) with head metadata.
- Sections: Orders & Returns, Shipping, Care, General. Use shadcn `Accordion` for questions.
- Content adapted for Mosiac: replace `hello@mushstudios.co` → `hello@mosiac.rw`, "Mush Studios" → "Mosiac", swap India → Kigali, Rwanda in the handmade answer, keep the rest of the substance. Link FAQ from the footer.

## Technical notes
- Migration: add `promo_coupons`, `newsletter_subscribers.coupon_code`, `product_sizes.weight_kg`; GRANT + RLS (coupons: public SELECT only where active; inserts admin/service only).
- Email: use `email_domain--scaffold_transactional_email_templates` then create the welcome-coupon template; `sendTemplateEmail` called inside `subscribeNewsletter` server fn.
- All new UI uses existing design tokens; no new colors. No changes to home hero / diminishing wordmark logic.

Reply "go" and I'll build it, or tell me which parts to trim.
