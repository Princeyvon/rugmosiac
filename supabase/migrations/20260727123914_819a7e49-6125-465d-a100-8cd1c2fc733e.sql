
-- Enrich product descriptions and add angle images per product
UPDATE public.products SET
  description = 'A hand-tufted piece inspired by centuries-old celestial maps. Dense New Zealand wool pile in a warm cream field, with gold-thread constellation lines and star points hand-cut at slight relief. Each rug is made to order in our Kigali studio — expect 4-6 weeks from confirmation to your door. Backed in natural cotton, finished with a bound edge.',
  short_description = 'Abstract star map in gold and cream — hand-tufted wool.',
  material = '100% New Zealand wool on cotton backing',
  production_time = '4-6 weeks',
  color_palette = ARRAY['#efe6ce','#c99a4b','#4a3b22']
WHERE slug = 'constellation';

UPDATE public.products SET
  description = 'A striking Bengal tiger portrait rendered in dense wool pile. Every stripe is hand-cut for depth, giving the coat a sculpted, almost three-dimensional feel underfoot. Rich orange, black, and cream tones sit on a warm background — a statement piece meant to anchor a room. Made to order in Kigali; 4-6 weeks.',
  short_description = 'Tiger portrait, tufted in wool with hand-cut relief.',
  material = '100% New Zealand wool, hand-cut pile',
  production_time = '4-6 weeks',
  color_palette = ARRAY['#c95a1a','#1a1210','#efe1c8']
WHERE slug = 'bengal';

UPDATE public.products SET
  description = 'A custom team crest tufted in bold wool — sized for any room, any team, any colour palette. Send us your crest and we''ll match it thread for thread: heavy pile, hand-bound edges, and a natural cotton back. Made to order in Kigali; 5-7 weeks for custom crests.',
  short_description = 'Custom team crest in bold wool — any team, any size.',
  material = '100% New Zealand wool, bound edge',
  production_time = '5-7 weeks',
  color_palette = ARRAY['#0f2244','#e0a929','#efe4c8']
WHERE slug = 'the-crest';

-- Wipe any existing product images so we don't duplicate
DELETE FROM public.product_images
WHERE product_id IN (SELECT id FROM public.products WHERE slug IN ('constellation','bengal','the-crest'));

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT p.id, v.url, v.alt, v.sort_order
FROM public.products p
JOIN (VALUES
  ('constellation', '/src/assets/rug-1.jpg', 'Constellation rug — front view', 0),
  ('constellation', '/src/assets/rug-constellation-2.jpg', 'Constellation rug — pile detail', 1),
  ('constellation', '/src/assets/rug-constellation-3.jpg', 'Constellation rug — styled in a living room', 2),
  ('bengal', '/src/assets/rug-2.jpg', 'Bengal tiger rug — front view', 0),
  ('bengal', '/src/assets/rug-bengal-2.jpg', 'Bengal tiger rug — pile detail', 1),
  ('bengal', '/src/assets/rug-bengal-3.jpg', 'Bengal tiger rug — styled in a lounge', 2),
  ('the-crest', '/src/assets/rug-3.jpg', 'The Crest rug — front view', 0),
  ('the-crest', '/src/assets/rug-crest-2.jpg', 'The Crest rug — edge and pile detail', 1),
  ('the-crest', '/src/assets/rug-crest-3.jpg', 'The Crest rug — styled in a den', 2)
) AS v(slug, url, alt, sort_order) ON v.slug = p.slug;
