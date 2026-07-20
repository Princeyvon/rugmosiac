
-- Roles enum + user_roles + has_role
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'made_to_order', 'out_of_stock');
CREATE TYPE public.rug_shape AS ENUM ('rectangle', 'circular', 'runner', 'organic');

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description TEXT,
  description TEXT,
  shape public.rug_shape NOT NULL DEFAULT 'rectangle',
  material TEXT DEFAULT 'Hand-tufted New Zealand wool',
  production_time TEXT DEFAULT 'Ready in 3–4 weeks',
  base_price_rwf INT,
  base_price_usd NUMERIC(10,2),
  stock_status public.stock_status NOT NULL DEFAULT 'made_to_order',
  featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INT NOT NULL DEFAULT 0,
  main_image_url TEXT,
  color_palette TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public read" ON public.products FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product sizes
CREATE TABLE public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  width_cm INT,
  height_cm INT,
  price_rwf INT,
  price_usd NUMERIC(10,2),
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_sizes TO anon, authenticated;
GRANT ALL ON public.product_sizes TO service_role;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sizes public read" ON public.product_sizes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage sizes" ON public.product_sizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images public read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  location TEXT,
  rating INT NOT NULL DEFAULT 5,
  quote TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Custom order requests
CREATE TYPE public.custom_status AS ENUM ('new','reviewing','quoted','accepted','in_production','complete','declined');
CREATE TABLE public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  description TEXT NOT NULL,
  reference_image_url TEXT,
  preferred_size TEXT,
  preferred_colors TEXT[] DEFAULT '{}',
  budget_range TEXT,
  deadline DATE,
  status public.custom_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  quote_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_requests TO anon, authenticated;
GRANT ALL ON public.custom_requests TO service_role;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit custom requests" ON public.custom_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read custom requests" ON public.custom_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage custom requests" ON public.custom_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER custom_requests_updated_at BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed categories, products, sizes, reviews from existing hero assets (using asset paths; will replace with storage later)
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('sports', 'Sports', 'Team crests, jerseys, and sports icons rendered in wool.', 1),
  ('cartoon', 'Cartoon', 'Characters and pop-culture pieces.', 2),
  ('animals', 'Animals', 'Wildlife, pets, and creature portraits.', 3),
  ('custom', 'Custom', 'Bring your own design — we tuft anything.', 4),
  ('art', 'Art', 'Abstract compositions and gallery pieces.', 5),
  ('brands', 'Brands', 'Logos, monograms, and brand marks.', 6);

INSERT INTO public.products (slug, name, category_id, short_description, description, shape, base_price_rwf, base_price_usd, stock_status, featured, featured_order, main_image_url, color_palette, tags)
SELECT 'constellation', 'Constellation', c.id, 'Abstract star map in gold and cream.', 'A hand-tufted piece inspired by night-sky maps — dense wool pile, rich gold accents on a warm cream field.', 'rectangle', 850000, 950, 'made_to_order', true, 1, '/src/assets/rug-1.jpg', ARRAY['#c97d3a','#f2ede6','#171513'], ARRAY['abstract','gold','statement']
FROM public.categories c WHERE c.slug = 'art';

INSERT INTO public.products (slug, name, category_id, short_description, description, shape, base_price_rwf, base_price_usd, stock_status, featured, featured_order, main_image_url, color_palette, tags)
SELECT 'bengal', 'Bengal', c.id, 'Tiger portrait, tufted in wool.', 'A striking Bengal tiger rendered in dense wool pile — every stripe hand-cut for depth.', 'rectangle', 1100000, 1250, 'made_to_order', true, 2, '/src/assets/rug-2.jpg', ARRAY['#c97d3a','#171513','#f2ede6'], ARRAY['animals','portrait']
FROM public.categories c WHERE c.slug = 'animals';

INSERT INTO public.products (slug, name, category_id, short_description, description, shape, base_price_rwf, base_price_usd, stock_status, featured, featured_order, main_image_url, color_palette, tags)
SELECT 'the-crest', 'The Crest', c.id, 'Football-inspired team crest rug.', 'Custom team crest in bold wool — sized for any room, any team, any colours.', 'circular', 950000, 1050, 'made_to_order', true, 3, '/src/assets/rug-3.jpg', ARRAY['#c97d3a','#171513'], ARRAY['sports','crest']
FROM public.categories c WHERE c.slug = 'sports';

INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
SELECT id, 'Small · 120 × 180 cm', 120, 180, 750000, 850, 1 FROM public.products WHERE slug IN ('constellation','bengal');
INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
SELECT id, 'Medium · 160 × 230 cm', 160, 230, 1050000, 1200, 2 FROM public.products WHERE slug IN ('constellation','bengal');
INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
SELECT id, 'Large · 200 × 300 cm', 200, 300, 1450000, 1650, 3 FROM public.products WHERE slug IN ('constellation','bengal');
INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
SELECT id, '⌀ 150 cm', 150, 150, 950000, 1050, 1 FROM public.products WHERE slug = 'the-crest';
INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
SELECT id, '⌀ 200 cm', 200, 200, 1350000, 1550, 2 FROM public.products WHERE slug = 'the-crest';

INSERT INTO public.reviews (customer_name, location, rating, quote, sort_order) VALUES
  ('Aline M.', 'Kigali', 5, 'I brought them a doodle of my dog and they turned it into a rug that stops every guest in their tracks. Unreal craftsmanship.', 1),
  ('David K.', 'Kimihurura', 5, 'The colours are richer than I imagined, and it feels dense and heavy in the best way. Worth every franc.', 2),
  ('Sarah B.', 'Nyarutarama', 5, 'From the first WhatsApp to delivery was three weeks. They confirmed every detail. Genuinely thoughtful people.', 3);
