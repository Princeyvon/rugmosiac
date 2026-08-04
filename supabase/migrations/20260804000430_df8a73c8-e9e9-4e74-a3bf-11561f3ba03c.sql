-- 1. Schema additions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hover_image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colorways jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS notes text;

-- 2. Wipe existing catalogue
DELETE FROM public.product_images;
DELETE FROM public.product_sizes;
DELETE FROM public.products;
DELETE FROM public.categories;

-- 3. Categories
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('area-rugs', 'Area Rugs', 'Statement floor pieces, hand-tufted to order.', 1),
  ('wall-art',  'Wall Art Pieces', 'Tufted textile art made to hang.', 2),
  ('custom',    'Custom Rugs', 'Any design, any size, made for you.', 3);

-- 4. Products
INSERT INTO public.products
  (slug, name, category_id, shape, short_description, description, notes,
   base_price_rwf, base_price_usd, stock_status, featured, featured_order,
   color_palette, tags, material, production_time, main_image_url, hover_image_url, colorways, is_published)
VALUES
  ('arc','Arc',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Cream and white ground with golden arcs and dark brown figure.',
   'Arc is a study in balance: a soft cream field framed in brown, with a golden arc sweeping through a dark, grounded figure. Hand-tufted in New Zealand wool.',
   NULL, 320000, 219.18, 'made_to_order', true, 1,
   ARRAY['#F4EFE7','#C9A227','#7A5230','#3E2A1C'], ARRAY['rectangle','neutral','abstract'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-1.jpg','/src/assets/heritage-2.jpg',
   '[{"name":"Original","colors":"Cream / White with golden, brown frames, dark brown figure"}]'::jsonb, true),

  ('burg','Burg',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Deep burgundy field lifted with blush pink.',
   'Burg pairs a saturated deep red ground with soft blush detailing. Rich, warm, and quietly dramatic underfoot.',
   NULL, 320000, 219.18, 'made_to_order', true, 2,
   ARRAY['#6B1F2A','#E8B4B8'], ARRAY['rectangle','red','bold'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-2.jpg','/src/assets/heritage-3.jpg',
   '[{"name":"Original","colors":"Deep Red / Burgundy with blush pink"},{"name":"Variant 2","colors":"Deep blue with cream blue"}]'::jsonb, true),

  ('celestial-night','Celestial Night',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Deep navy sky with cream and golden yellow points of light.',
   'Celestial Night maps a night sky in wool: a deep navy ground scattered with cream and golden yellow. A calm, cosmic anchor for a room.',
   NULL, 320000, 219.18, 'made_to_order', true, 3,
   ARRAY['#111C3A','#F4EFE7','#E5B93C'], ARRAY['rectangle','blue','abstract'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-constellation-2.jpg','/src/assets/rug-constellation-3.jpg',
   '[{"name":"Original","colors":"Deep navy blue with cream and golden yellow"}]'::jsonb, true),

  ('geometric','Geometric',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Tan and beige ground with multi colour geometric accents.',
   'Geometric layers bright multi colour blocks over a warm tan field. Playful without shouting, and built to take daily traffic.',
   NULL, 320000, 219.18, 'made_to_order', true, 4,
   ARRAY['#D9BE9C','#D9534F','#3D7EA6','#E5B93C'], ARRAY['rectangle','multicolour','geometric'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-3.jpg','/src/assets/hero-2.jpg',
   '[{"name":"Original","colors":"Tan / beige ground with multi colour accents"},{"name":"Variant 2","colors":"Moss green"}]'::jsonb, true),

  ('hassan','Hassan',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Black, cream and golden tan in strong graphic blocks.',
   'Hassan is high contrast and architectural: black against cream, warmed with golden tan. It works hardest in a minimal room.',
   NULL, 320000, 219.18, 'made_to_order', true, 5,
   ARRAY['#111111','#F4EFE7','#C79B54'], ARRAY['rectangle','monochrome','graphic'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-crest-2.jpg','/src/assets/rug-crest-3.jpg',
   '[{"name":"Original","colors":"Black, cream and golden tan"},{"name":"Variant 2","colors":"Rust orange red with black and grey"}]'::jsonb, true),

  ('melt','Melt',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Rich brown stripes dissolving into a liquid, hand cut edge.',
   'Melt starts as clean diagonal stripes in tan and rich brown, then loses its nerve: the pattern pools and runs into an irregular hand carved edge. Shown at 150 by 100 cm.',
   NULL, 320000, 219.18, 'made_to_order', true, 6,
   ARRAY['#F2DCC0','#8A5A2B','#5C3A1A'], ARRAY['rectangle','brown','organic','bestseller'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg',
   '/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg',
   '[{"name":"Original","colors":"Tan / beige brown with rich brown"}]'::jsonb, true),

  ('tai','Tai',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Ocean blues and teal breaking into white surf.',
   'Tai is water rendered in wool. Medium blue and blue teal roll across the field, cut with black line work, dark blue grey shadow and drifts of light grey and cream.',
   NULL, 320000, 219.18, 'made_to_order', true, 7,
   ARRAY['#2B7FC4','#1FA8B8','#111111','#D8DEE4'], ARRAY['rectangle','blue','abstract','bestseller'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg',
   '/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg',
   '[{"name":"Original","colors":"Medium blue and blue teal with black, dark blue grey and light grey"},{"name":"Variant 2","colors":"Pink, cream, red and grey"}]'::jsonb, true),

  ('uzu-circle','Uzu Circle (Enso)',(SELECT id FROM public.categories WHERE slug='wall-art'),'circular',
   'A single brown brushstroke circle on off white.',
   'Uzu Circle borrows the enso: one continuous brown stroke on a cream ground, closed but never perfect. Works on the floor or on the wall.',
   NULL, 170000, 116.44, 'made_to_order', true, 8,
   ARRAY['#F4EFE7','#7A4A22'], ARRAY['circular','neutral','minimal'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/cat-wall-art.jpg','/src/assets/craft-1.jpg',
   '[{"name":"Original","colors":"Cream / off white with rich brown"}]'::jsonb, true),

  ('valencia','Valencia',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Cream and gold with fine black line work.',
   'Valencia runs rich brown and gold through a cream field, held together by confident black lines. Warm, graphic, and generous at full size.',
   NULL, 320000, 219.18, 'made_to_order', false, 9,
   ARRAY['#F4EFE7','#B07A2A','#111111'], ARRAY['rectangle','gold','graphic'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/heritage-banner.jpg','/src/assets/hero-1.jpg',
   '[{"name":"Original","colors":"Cream / white with rich brown gold and black lines"},{"name":"Variant 2","colors":"Black and green"}]'::jsonb, true),

  ('ribbon','Ribbon',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Red, pink and cream ribboning across the field.',
   'Ribbon is in development. Reds and pinks fold through a cream ground. Talk to the studio for current samples and timing.',
   'Placeholder, details not yet finalised', 320000, 219.18, 'made_to_order', false, 10,
   ARRAY['#C6303A','#E8A0AE','#F4EFE7'], ARRAY['rectangle','red'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/rug-bengal-2.jpg','/src/assets/rug-bengal-3.jpg',
   '[{"name":"Original","colors":"Red, pink and red cream"}]'::jsonb, true),

  ('valley','Valley',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Grey, khaki, brown and moss green in layered bands.',
   'Valley stacks soft grey, khaki cream, brown and moss green into a landscape of bands. Quiet, earthy, easy to live with.',
   'Placeholder, details not yet finalised', 320000, 219.18, 'made_to_order', false, 11,
   ARRAY['#C9C7C2','#C2B280','#6B4A2F','#6E7B52'], ARRAY['rectangle','green','neutral'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/hero-3.jpg','/src/assets/craft-2.jpg',
   '[{"name":"Original","colors":"Grey, khaki cream, brown and moss green"}]'::jsonb, true),

  ('valve','Valve',(SELECT id FROM public.categories WHERE slug='area-rugs'),'rectangle',
   'Moss green and teal in a tight, mechanical curve.',
   'Valve holds moss green against teal in one tight, deliberate curve. Cool toned and modern.',
   'Placeholder, details not yet finalised', 320000, 219.18, 'made_to_order', false, 12,
   ARRAY['#6E7B52','#1F7A75'], ARRAY['rectangle','green'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/cat-area-rugs.jpg','/src/assets/hero-2.jpg',
   '[{"name":"Original","colors":"Moss green and teal"}]'::jsonb, true),

  ('apex','Apex',(SELECT id FROM public.categories WHERE slug='wall-art'),'circular',
   'Two purples meeting on a perfect circle.',
   'Apex is the simplest idea done carefully: two purples, one circle, a clean meeting point. Reads as art on the wall and as a soft landing on the floor.',
   'Placeholder, details not yet finalised', 170000, 116.44, 'made_to_order', false, 13,
   ARRAY['#A39AAA','#7F76AB'], ARRAY['circular','purple','minimal'],
   'Hand-tufted New Zealand wool','Ready in 3 to 4 weeks',
   '/src/assets/cat-custom.jpg','/src/assets/craft-1.jpg',
   '[{"name":"Original","colors":"#A39AAA purple with #7F76AB purple"}]'::jsonb, true);

-- 5. Size ladders
INSERT INTO public.product_sizes (product_id, label, width_cm, height_cm, price_rwf, price_usd, weight_kg, sort_order)
SELECT p.id, s.label, s.w, s.h, s.rwf, ROUND((s.rwf / 1460.0)::numeric, 2),
       ROUND((CASE WHEN p.shape = 'circular'
                   THEN pi() * (s.w / 200.0) * (s.w / 200.0)
                   ELSE (s.w / 100.0) * (s.h / 100.0) END * 3.8)::numeric, 1),
       s.ord
FROM public.products p
JOIN (VALUES
  ('rectangle','S',120,180,320000,1),
  ('rectangle','M',150,220,480000,2),
  ('rectangle','L',200,300,870000,3),
  ('circular','S',120,120,170000,1),
  ('circular','M',140,140,230000,2),
  ('circular','L',160,160,290000,3)
) AS s(shape,label,w,h,rwf,ord) ON s.shape = p.shape::text;

-- 6. Gallery images for the two photographed rugs
INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT p.id, i.url, i.alt, i.ord FROM public.products p
JOIN (VALUES
  ('tai','/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg','Tai rug beside a bed in a bright bedroom',1),
  ('tai','/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg','Tai rug at floor level showing the blue field',2),
  ('tai','/__l5e/assets-v1/0f4ca491-3973-42a4-bf1f-6af97f4ce657/tai-3.jpg','Close up of the Tai pile and black line work',3),
  ('tai','/__l5e/assets-v1/a042914d-aeb4-4f95-a01a-92704cbc1fe5/tai-4.jpg','Edge detail of the Tai rug',4),
  ('tai','/__l5e/assets-v1/dc2e9888-8b03-4f7a-b298-39ece2ed9364/tai-5.jpg','Tai rug in use in a bedroom',5),
  ('melt','/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg','Melt rug photographed from above',1),
  ('melt','/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg','Melt rug beside a bed',2),
  ('melt','/__l5e/assets-v1/d15ee859-c492-47e3-b2eb-00c46ad61ac4/melt-3.jpg','Close up of the Melt stripe pattern',3),
  ('melt','/__l5e/assets-v1/bc05b933-8fc4-4519-b3ec-88b56043e381/melt-4.jpg','Hand carved edge detail on the Melt rug',4)
) AS i(slug,url,alt,ord) ON i.slug = p.slug;