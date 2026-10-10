CREATE OR REPLACE FUNCTION public.is_fresh_guest_order(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND status = 'pending' AND payment_status = 'unpaid' AND created_at > now() - interval '15 minutes');
$$;

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND status = 'pending' AND payment_status = 'unpaid' AND fulfillment_status = 'unfulfilled'
  AND refunded_rwf = 0 AND inventory_applied = false AND internal_notes IS NULL AND payment_reference IS NULL
  AND subtotal_rwf >= 0 AND delivery_rwf >= 0 AND discount_rwf >= 0 AND total_rwf >= 0
  AND length(customer_name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 255 AND length(phone) BETWEEN 5 AND 40
  AND (notes IS NULL OR length(notes) <= 5000)
);

DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated
WITH CHECK (public.is_fresh_guest_order(order_id) AND qty BETWEEN 1 AND 100 AND (unit_price_rwf IS NULL OR unit_price_rwf >= 0) AND length(product_name) BETWEEN 1 AND 300);

DROP POLICY IF EXISTS "Anyone can submit custom requests" ON public.custom_requests;
CREATE POLICY "Anyone can submit custom requests" ON public.custom_requests FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND admin_notes IS NULL AND quote_amount IS NULL AND production_notes IS NULL
  AND length(customer_name) BETWEEN 1 AND 200 AND length(description) BETWEEN 1 AND 5000
  AND (email IS NULL OR length(email) <= 255) AND (phone IS NULL OR length(phone) <= 40));

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 255 AND length(message) BETWEEN 1 AND 5000 AND (subject IS NULL OR length(subject) <= 300));

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (length(email) BETWEEN 3 AND 255 AND email LIKE '%@%' AND welcomed_at IS NULL);

DROP POLICY IF EXISTS "Anyone can record a visit" ON public.site_visits;
CREATE POLICY "Anyone can record a visit" ON public.site_visits FOR INSERT TO anon, authenticated
WITH CHECK (length(path) BETWEEN 1 AND 500 AND (referrer IS NULL OR length(referrer) <= 1000) AND (session_id IS NULL OR length(session_id) <= 200));

DROP POLICY IF EXISTS "Product images public read" ON public.product_images;
CREATE POLICY "Product images public read" ON public.product_images FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published));

DROP POLICY IF EXISTS "Sizes public read" ON public.product_sizes;
CREATE POLICY "Sizes public read" ON public.product_sizes FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published));

DROP POLICY IF EXISTS "Product collections public read" ON public.product_collections;
CREATE POLICY "Product collections public read" ON public.product_collections FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.is_active)
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published));

DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated
USING (slug IS NOT NULL AND length(name) > 0);