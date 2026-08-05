CREATE TYPE public.order_status AS ENUM ('pending','confirmed','in_production','shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('MSC-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6))),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  country text,
  notes text,
  currency text NOT NULL DEFAULT 'RWF',
  subtotal_rwf integer NOT NULL DEFAULT 0,
  delivery_rwf integer NOT NULL DEFAULT 0,
  total_rwf integer NOT NULL DEFAULT 0,
  coupon_code text,
  discount_rwf integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'momo',
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_slug text,
  size_label text,
  color text,
  qty integer NOT NULL DEFAULT 1,
  unit_price_rwf integer,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);