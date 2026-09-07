ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colorways jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS colorway_id text;

CREATE TABLE IF NOT EXISTS public.promo_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.promo_leads TO service_role;
ALTER TABLE public.promo_leads ENABLE ROW LEVEL SECURITY;