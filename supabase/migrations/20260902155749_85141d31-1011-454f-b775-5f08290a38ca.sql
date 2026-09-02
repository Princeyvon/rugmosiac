ALTER TABLE public.staff_accounts ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.staff_accounts ALTER COLUMN role SET DEFAULT 'staff';
ALTER TABLE public.staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE public.staff_accounts ADD CONSTRAINT staff_accounts_role_check CHECK (role IN ('owner','admin','manager','sales','production','staff'));
ALTER TABLE public.staff_accounts ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS job_title text;

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can record a visit" ON public.site_visits;
CREATE POLICY "Anyone can record a visit" ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON public.site_visits (created_at DESC);

INSERT INTO public.site_settings (key, value)
VALUES ('last_published_at', to_jsonb(now()::text))
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.staff_accounts (email, full_name, job_title, role, pin_hash, is_active)
VALUES
  ('admin@mosiac.rw', 'Studio Admin', 'Administrator', 'admin', '1a0e344b4d2c3ef1161f3e6fd57c8a4f:25c4c5661d423d95b381b71ca07cc109ca3e8a5babff59992207050eeffe1987', true),
  ('manager@mosiac.rw', 'Studio Manager', 'Operations Manager', 'manager', '7ae89eb93c8eb0d66885fa95a5890ca9:5f17af261e0cfe0467af20062546dd47fab97d11fe4c16e037234683c1549310', true),
  ('sales@mosiac.rw', 'Sales Lead', 'Sales', 'sales', '039dfec2030503a16687e2a3231d4d37:0d722bd6cc449dd8a273f0361c6b8159c8fc970b6e7e90e1e856cc6a3fc02f6c', true),
  ('production@mosiac.rw', 'Production Lead', 'Production', 'production', '8ad4ab38dba9932566aa55f545704ae9:b8a0c34b2738fc749e124640cb21f15be1322e977415bc04760f37e36b034c87', true)
ON CONFLICT (email) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, role = EXCLUDED.role, is_active = true;