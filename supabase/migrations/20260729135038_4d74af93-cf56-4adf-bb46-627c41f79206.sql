-- Coupons table
CREATE TABLE public.promo_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_coupons TO anon, authenticated;
GRANT ALL ON public.promo_coupons TO service_role;

ALTER TABLE public.promo_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons public read"
  ON public.promo_coupons FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins manage coupons"
  ON public.promo_coupons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed welcome coupon
INSERT INTO public.promo_coupons (code, discount_percent, description, expires_at)
VALUES ('WELCOME10', 10, 'Welcome — 10% off all rugs', now() + interval '365 days');

-- Track which coupon we sent to each subscriber
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS welcomed_at timestamptz;

-- Weight on sizes
ALTER TABLE public.product_sizes
  ADD COLUMN IF NOT EXISTS weight_kg numeric;

-- Backfill sensible weights (approx 2.7 kg per m² of tufted wool)
UPDATE public.product_sizes
SET weight_kg = ROUND( GREATEST(1.5, (COALESCE(width_cm,120) * COALESCE(height_cm,180))::numeric / 10000.0 * 2.7)::numeric, 2)
WHERE weight_kg IS NULL;