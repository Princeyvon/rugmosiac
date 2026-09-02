-- ============ PRODUCTS ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS cost_rwf integer,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS design_style text,
  ADD COLUMN IF NOT EXISTS care_instructions text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS fulfilment_type text NOT NULL DEFAULT 'made_to_order';

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products (sku) WHERE sku IS NOT NULL;

-- ============ VARIANTS ============
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  size_label text,
  color text,
  price_rwf integer,
  cost_rwf integer,
  stock_qty integer NOT NULL DEFAULT 0,
  reserved_qty integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 2,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COLLECTIONS ============
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections public read" ON public.collections FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);
GRANT SELECT ON public.product_collections TO anon, authenticated;
GRANT ALL ON public.product_collections TO service_role;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product collections public read" ON public.product_collections FOR SELECT TO anon, authenticated USING (true);

-- ============ INVENTORY MOVEMENTS ============
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reason text NOT NULL,
  delta integer NOT NULL,
  previous_qty integer NOT NULL,
  new_qty integer NOT NULL,
  note text,
  actor_name text,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS inventory_movements_product_idx ON public.inventory_movements (product_id, created_at DESC);

-- ============ ORDERS ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
  ADD COLUMN IF NOT EXISTS refunded_rwf integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS inventory_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_reference text;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sku text;

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL,
  actor_name text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_events_order_idx ON public.order_events (order_id, created_at);

-- ============ CUSTOM REQUESTS ============
ALTER TABLE public.custom_requests
  ADD COLUMN IF NOT EXISTS width_cm integer,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS production_notes text;

-- ============ DISCOUNTS ============
ALTER TABLE public.promo_coupons
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_amount_rwf integer,
  ADD COLUMN IF NOT EXISTS min_order_rwf integer,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;

-- ============ STAFF ============
DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('owner','admin','manager','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role staff_role NOT NULL DEFAULT 'staff',
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff_accounts TO service_role;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER staff_accounts_updated_at BEFORE UPDATE ON public.staff_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ACTIVITY LOG ============
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  summary text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON public.activity_log (created_at DESC);

-- ============ MEDIA ============
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  url text NOT NULL,
  alt text,
  content_type text,
  size_bytes integer,
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Harden existing trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
