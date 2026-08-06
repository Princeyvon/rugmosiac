
DELETE FROM public.product_images WHERE product_id IN (SELECT id FROM public.products WHERE slug IN ('hassan','arc','uzu-circle','valley'));

UPDATE public.products SET
  main_image_url = '/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg',
  hover_image_url = '/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg',
  color_palette = ARRAY['#E2A857','#F2EDE4','#111111']
WHERE slug = 'hassan';

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT id, u.url, 'Hassan hand-tufted rug', u.i FROM public.products, (VALUES
  ('/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg',0),
  ('/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg',1),
  ('/__l5e/assets-v1/71999378-5009-4b76-b34c-62a93ebed2a3/hassan-3.jpg',2),
  ('/__l5e/assets-v1/719acfc1-0de1-4569-af43-92d7fb86992b/hassan-4.jpg',3)
) AS u(url,i) WHERE slug = 'hassan';

UPDATE public.products SET
  main_image_url = '/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg',
  hover_image_url = '/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg',
  color_palette = ARRAY['#F0E2C4','#C08A21','#1A1310']
WHERE slug = 'arc';

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT id, u.url, 'Arc hand-tufted rug', u.i FROM public.products, (VALUES
  ('/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg',0),
  ('/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg',1)
) AS u(url,i) WHERE slug = 'arc';

UPDATE public.products SET
  main_image_url = '/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg',
  hover_image_url = '/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg',
  color_palette = ARRAY['#8E9A9D','#E08A3C']
WHERE slug = 'uzu-circle';

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT id, u.url, 'Uzu Circle hand-tufted rug', u.i FROM public.products, (VALUES
  ('/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg',0),
  ('/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg',1)
) AS u(url,i) WHERE slug = 'uzu-circle';

UPDATE public.products SET
  main_image_url = '/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg',
  hover_image_url = '/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg',
  color_palette = ARRAY['#D9B36A','#7DBB35','#3A2416']
WHERE slug = 'valley';

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT id, u.url, 'Valley hand-tufted rug', u.i FROM public.products, (VALUES
  ('/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg',0),
  ('/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg',1)
) AS u(url,i) WHERE slug = 'valley';
