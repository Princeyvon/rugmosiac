-- Supabase Schema & Initial Data for Rug Mosaic
-- Paste into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jtgzsnghetquhielmzdf/sql

create extension if not exists "uuid-ossp";

-- 1. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  short_description text,
  description text,
  main_image_url text,
  hover_image_url text,
  base_price_rwf numeric,
  base_price_usd numeric,
  stock_status text default 'made_to_order',
  shape text default 'rectangle',
  material text default '100% acrylic wool',
  production_time text default '2-3 weeks',
  color_palette jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  featured boolean default false,
  featured_order int default 0,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- 3. Product Sizes
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  label text not null,
  width_cm int,
  height_cm int,
  price_rwf numeric,
  price_usd numeric,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. Product Images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 5. Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  location text,
  rating int default 5,
  quote text not null,
  sort_order int default 0,
  is_visible boolean default true,
  created_at timestamptz default now()
);

-- 6. Forms
create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text,
  phone text,
  description text not null,
  preferred_size text,
  budget_range text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'unread',
  created_at timestamptz default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  coupon_code text,
  welcomed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_images enable row level security;
alter table public.reviews enable row level security;
alter table public.custom_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products for select using (true);

drop policy if exists "Public read sizes" on public.product_sizes;
create policy "Public read sizes" on public.product_sizes for select using (true);

drop policy if exists "Public read images" on public.product_images;
create policy "Public read images" on public.product_images for select using (true);

drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews" on public.reviews for select using (true);

drop policy if exists "Public insert custom_requests" on public.custom_requests;
create policy "Public insert custom_requests" on public.custom_requests for insert with check (true);

drop policy if exists "Public insert contact_messages" on public.contact_messages;
create policy "Public insert contact_messages" on public.contact_messages for insert with check (true);

drop policy if exists "Public insert newsletter_subscribers" on public.newsletter_subscribers;
create policy "Public insert newsletter_subscribers" on public.newsletter_subscribers for insert with check (true);

insert into public.categories (id, slug, name, description, image_url, sort_order)
values ('6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3', 'area-rugs', 'Area Rugs', 'Statement floor pieces, hand-tufted to order.', null, 1)
on conflict (slug) do update set name = excluded.name;

insert into public.categories (id, slug, name, description, image_url, sort_order)
values ('13fc3743-15b2-4941-be4d-be1c8601b254', 'wall-art', 'Wall Art Pieces', 'Tufted textile art made to hang.', null, 2)
on conflict (slug) do update set name = excluded.name;

insert into public.categories (id, slug, name, description, image_url, sort_order)
values ('0118bf5a-bea5-4f85-b083-aa6c54de2822', 'custom', 'Custom Rugs', 'Any design, any size, made for you.', null, 3)
on conflict (slug) do update set name = excluded.name;

insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  'b69324c2-faa8-4478-9ddd-3a7c694e11a3',
  'arc',
  'Arc',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Cream and white ground with golden arcs and dark brown figure.',
  'Arc is a study in balance: a soft cream field framed in brown, with a golden arc sweeping through a dark, grounded figure. Hand-tufted in New Zealand wool.',
  '/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg',
  '/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#F0E2C4","#C08A21","#1A1310"]'::jsonb,
  array['rectangle', 'neutral', 'abstract']::text[],
  true,
  1,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('f92591f6-47cb-44df-9726-07f5fbe2386b', 'b69324c2-faa8-4478-9ddd-3a7c694e11a3', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('c8a366c7-13f5-412a-b408-7fda5cfc8613', 'b69324c2-faa8-4478-9ddd-3a7c694e11a3', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('c572ebe5-2f76-4c16-b519-e8b166e0f62e', 'b69324c2-faa8-4478-9ddd-3a7c694e11a3', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('591fb614-2965-4582-aaa9-e7d53ee5d712', 'b69324c2-faa8-4478-9ddd-3a7c694e11a3', '/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg', 'Arc hand-tufted rug', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('da5ec170-2fcb-4dec-8aff-ecbefb6eed03', 'b69324c2-faa8-4478-9ddd-3a7c694e11a3', '/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg', 'Arc hand-tufted rug', 1)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '8647bde4-28e4-4aa7-9b24-3569aa829d61',
  'burg',
  'Burg',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Deep burgundy field lifted with blush pink.',
  'Burg pairs a saturated deep red ground with soft blush detailing. Rich, warm, and quietly dramatic underfoot.',
  '/__l5e/assets-v1/f65fc452-6a55-416b-94bc-1e5108b44c6d/burg-1.jpg',
  '/__l5e/assets-v1/716c4390-0c0c-42fc-853e-b4f9d970d33e/burg-2.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#6B1F2A","#E8B4B8"]'::jsonb,
  array['rectangle', 'red', 'bold']::text[],
  true,
  2,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('3628e431-814f-4230-89df-ebb92fd6525b', '8647bde4-28e4-4aa7-9b24-3569aa829d61', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('8bda7b56-b3b4-4cd7-b8ca-4e75b88c66ec', '8647bde4-28e4-4aa7-9b24-3569aa829d61', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('6dd62404-a9a1-4756-9758-d635aa591062', '8647bde4-28e4-4aa7-9b24-3569aa829d61', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('8ac3b66c-8e9d-42e8-b2a7-cc6246c7d90a', '8647bde4-28e4-4aa7-9b24-3569aa829d61', '/__l5e/assets-v1/f65fc452-6a55-416b-94bc-1e5108b44c6d/burg-1.jpg', 'Burg rug overhead', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('43f7c179-8061-4f57-8d89-334b82e2b9db', '8647bde4-28e4-4aa7-9b24-3569aa829d61', '/__l5e/assets-v1/716c4390-0c0c-42fc-853e-b4f9d970d33e/burg-2.jpg', 'Burg rug in a bedroom', 1)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '5b62c5c1-f4d1-4f70-8145-0eecf63589f6',
  'tai',
  'Tai',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Ocean blues and teal breaking into white surf.',
  'Tai is water rendered in wool. Medium blue and blue teal roll across the field, cut with black line work, dark blue grey shadow and drifts of light grey and cream.',
  '/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg',
  '/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#2B7FC4","#1FA8B8","#111111","#D8DEE4"]'::jsonb,
  array['rectangle', 'blue', 'abstract', 'bestseller']::text[],
  true,
  7,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('751dba6f-989c-4083-b8cd-c5b09e297e89', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('11a81a77-5c21-492e-ab1a-ff84f1e1372b', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('e8cbad60-605b-4524-99fb-d9052d858641', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('b6c9990a-db37-4250-b118-fe56529582b1', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', '/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg', 'Tai rug beside a bed in a bright bedroom', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('1c4a0f20-d59f-4dcf-a1f2-f844cca54219', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', '/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg', 'Tai rug at floor level showing the blue field', 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('8fe3b6a6-b26e-4f39-94b8-32b1d8de5846', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', '/__l5e/assets-v1/0f4ca491-3973-42a4-bf1f-6af97f4ce657/tai-3.jpg', 'Close up of the Tai pile and black line work', 3)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('f18284f7-18a6-47fe-85fb-661e2f2ec505', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', '/__l5e/assets-v1/a042914d-aeb4-4f95-a01a-92704cbc1fe5/tai-4.jpg', 'Edge detail of the Tai rug', 4)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('c5219312-3e50-410b-8c95-0a6b8688423d', '5b62c5c1-f4d1-4f70-8145-0eecf63589f6', '/__l5e/assets-v1/dc2e9888-8b03-4f7a-b298-39ece2ed9364/tai-5.jpg', 'Tai rug in use in a bedroom', 5)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '67cc07bc-32a3-4611-996a-aed2efdd49b4',
  'celestial-night',
  'Celestial Night',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Deep navy sky with cream and golden yellow points of light.',
  'Celestial Night maps a night sky in wool: a deep navy ground scattered with cream and golden yellow. A calm, cosmic anchor for a room.',
  '/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg',
  null,
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#111C3A","#F4EFE7","#E5B93C"]'::jsonb,
  array['rectangle', 'blue', 'abstract']::text[],
  true,
  3,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('3b017a6f-c700-4e66-86b5-77233f0e559a', '67cc07bc-32a3-4611-996a-aed2efdd49b4', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('15478186-563a-4f2b-b0d6-414dc39f09b5', '67cc07bc-32a3-4611-996a-aed2efdd49b4', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('3eb8b613-89a4-4f52-9154-ce04aeb77bcb', '67cc07bc-32a3-4611-996a-aed2efdd49b4', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('fd2dd75a-4332-49b8-9ba1-cdfeb10c6198', '67cc07bc-32a3-4611-996a-aed2efdd49b4', '/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg', 'Celestial Night rug', 0)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  'b541208d-5524-4575-b812-fb960b93921a',
  'melt',
  'Melt',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Rich brown stripes dissolving into a liquid, hand cut edge.',
  'Melt starts as clean diagonal stripes in tan and rich brown, then loses its nerve: the pattern pools and runs into an irregular hand carved edge. Shown at 150 by 100 cm.',
  '/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg',
  '/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#F2DCC0","#8A5A2B","#5C3A1A"]'::jsonb,
  array['rectangle', 'brown', 'organic', 'bestseller']::text[],
  true,
  6,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('88308df1-a004-47f4-b563-dcadfbbed283', 'b541208d-5524-4575-b812-fb960b93921a', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('cfa692da-6a7f-42d3-9c65-a037bf685219', 'b541208d-5524-4575-b812-fb960b93921a', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('b9321511-6109-4fd0-a826-a216ad06a1d7', 'b541208d-5524-4575-b812-fb960b93921a', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('aa84082a-97a2-44a1-9a3d-f6f94ccde055', 'b541208d-5524-4575-b812-fb960b93921a', '/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg', 'Melt rug photographed from above', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('3e7f2221-9d62-42e0-a655-ecf97f41f50f', 'b541208d-5524-4575-b812-fb960b93921a', '/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg', 'Melt rug beside a bed', 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('329cf102-200d-4756-bd9e-15437b22108a', 'b541208d-5524-4575-b812-fb960b93921a', '/__l5e/assets-v1/d15ee859-c492-47e3-b2eb-00c46ad61ac4/melt-3.jpg', 'Close up of the Melt stripe pattern', 3)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('ac476ff0-af61-4a44-92f0-27e37d28279f', 'b541208d-5524-4575-b812-fb960b93921a', '/__l5e/assets-v1/bc05b933-8fc4-4519-b3ec-88b56043e381/melt-4.jpg', 'Hand carved edge detail on the Melt rug', 4)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '21d42e32-070d-4640-8751-b85680f5ecdc',
  'hassan',
  'Hassan',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Black, cream and golden tan in strong graphic blocks.',
  'Hassan is high contrast and architectural: black against cream, warmed with golden tan. It works hardest in a minimal room.',
  '/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg',
  '/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#E2A857","#F2EDE4","#111111"]'::jsonb,
  array['rectangle', 'monochrome', 'graphic']::text[],
  true,
  5,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('d8ca9583-0dd8-4252-b8cf-ef900b1c9376', '21d42e32-070d-4640-8751-b85680f5ecdc', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('56a0430f-c212-4337-abce-7ab47a4bc9a0', '21d42e32-070d-4640-8751-b85680f5ecdc', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('d5b85a7e-d624-4602-afee-41de9c881726', '21d42e32-070d-4640-8751-b85680f5ecdc', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('0c4a8fe3-2105-4c1b-a0cc-498c165c6cea', '21d42e32-070d-4640-8751-b85680f5ecdc', '/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg', 'Hassan hand-tufted rug', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('be82836a-2f2c-44ba-9e7e-803fed6ef470', '21d42e32-070d-4640-8751-b85680f5ecdc', '/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg', 'Hassan hand-tufted rug', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('d80ad67f-c043-412a-b0a8-a050b994f847', '21d42e32-070d-4640-8751-b85680f5ecdc', '/__l5e/assets-v1/71999378-5009-4b76-b34c-62a93ebed2a3/hassan-3.jpg', 'Hassan hand-tufted rug', 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('a44765ab-af1a-4b81-ae94-4a77c2c222ab', '21d42e32-070d-4640-8751-b85680f5ecdc', '/__l5e/assets-v1/719acfc1-0de1-4569-af43-92d7fb86992b/hassan-4.jpg', 'Hassan hand-tufted rug', 3)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('2da301d1-3613-40e4-ae56-40a500ded7da', '21d42e32-070d-4640-8751-b85680f5ecdc', '/__l5e/assets-v1/28c325e7-6be3-44b6-8d49-e24f327dcc96/hassan-5.jpg', 'Hassan rug detail', 4)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  'f65eb29c-9d61-448d-85d4-7827347eb636',
  'valencia',
  'Valencia',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Cream and gold with fine black line work.',
  'Valencia runs rich brown and gold through a cream field, held together by confident black lines. Warm, graphic, and generous at full size.',
  '/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg',
  '/__l5e/assets-v1/2f4ec13c-1de2-42c4-bd9e-291fe0ee4abd/valencia-5.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#C4571E","#F2EFE9","#1A1A1A"]'::jsonb,
  array['rectangle', 'gold', 'graphic']::text[],
  false,
  9,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('c96587a4-47bc-40ce-83ac-c47f4e9668f0', 'f65eb29c-9d61-448d-85d4-7827347eb636', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('5d417b1f-ff3e-4aa0-81b5-9347c78f4099', 'f65eb29c-9d61-448d-85d4-7827347eb636', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('a56a9da7-8010-4c20-b8d0-637c53d948cb', 'f65eb29c-9d61-448d-85d4-7827347eb636', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('9d029458-46d9-43b6-a5f8-db13028364ac', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg', 'Valencia rug photographed flat with a cushion', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('a8f9162f-f419-4059-95b7-1b49cd967ed0', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/2f4ec13c-1de2-42c4-bd9e-291fe0ee4abd/valencia-5.jpg', 'Valencia rug in a living room between two sofas', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('80d69d80-24d3-4ae6-b44c-4b0c015d3458', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/e6064fe1-3d5b-45a7-9da6-a7041c35bbe8/valencia-2.jpg', 'Reading on the Valencia rug', 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('0ec9d06d-277e-4443-ba0d-8c744962dc44', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/761bb306-5a03-450a-afb2-1bf642ebb56a/valencia-4.jpg', 'Valencia rug styled with headphones and a bowl', 3)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('fe4db481-6ef4-4da3-ba8c-85ed13d108c9', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/7b73fa5d-5a61-4b9c-80b2-daec17cfeecc/valencia-6.jpg', 'Close up of the Valencia drip pattern', 4)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('f9f79568-3d3f-45f3-94f4-74b96ee194e3', 'f65eb29c-9d61-448d-85d4-7827347eb636', '/__l5e/assets-v1/0fc75c52-cdd4-4e61-b388-76c1a6d3b8a6/valencia-3.jpg', 'Relaxing on the Valencia rug', 5)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '5f607a7b-bcc3-4848-97cd-0239ea17608c',
  'uzu-circle',
  'Uzu Circle (Enso)',
  '13fc3743-15b2-4941-be4d-be1c8601b254',
  'A single brown brushstroke circle on off white.',
  'Uzu Circle borrows the enso: one continuous brown stroke on a cream ground, closed but never perfect. Works on the floor or on the wall.',
  '/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg',
  '/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg',
  170000,
  116.44,
  'made_to_order',
  'circular',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#8E9A9D","#E08A3C"]'::jsonb,
  array['circular', 'neutral', 'minimal']::text[],
  true,
  8,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('eaa354f8-d8e9-454a-a045-ceda66622a4a', '5f607a7b-bcc3-4848-97cd-0239ea17608c', 'L', 160, 160, 290000, 198.63, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('b3727592-3bda-4684-8f26-fe9df87f8dee', '5f607a7b-bcc3-4848-97cd-0239ea17608c', 'M', 140, 140, 230000, 157.53, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('ff5200cf-77f9-484d-8c1b-ffb1777bde41', '5f607a7b-bcc3-4848-97cd-0239ea17608c', 'S', 120, 120, 170000, 116.44, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('ac348c8d-b391-409b-97e6-b7b14cea81fc', '5f607a7b-bcc3-4848-97cd-0239ea17608c', '/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg', 'Uzu Circle hand-tufted rug', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('bc3d427c-99ee-465d-9a75-391a2e51f44f', '5f607a7b-bcc3-4848-97cd-0239ea17608c', '/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg', 'Uzu Circle hand-tufted rug', 1)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  'b7073578-f58e-4e45-9cc1-514396828a22',
  'valley',
  'Valley',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Grey, khaki, brown and moss green in layered bands.',
  'Valley stacks soft grey, khaki cream, brown and moss green into a landscape of bands. Quiet, earthy, easy to live with.',
  '/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg',
  '/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg',
  320000,
  219.18,
  'made_to_order',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#D9B36A","#7DBB35","#3A2416"]'::jsonb,
  array['rectangle', 'green', 'neutral', 'new']::text[],
  false,
  11,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('874d3ff1-a085-465d-9997-a5b1be17ceaa', 'b7073578-f58e-4e45-9cc1-514396828a22', 'L', 200, 300, 870000, 595.89, 3)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('7fbde55f-d7c7-4b93-8aa7-ba6e376499d9', 'b7073578-f58e-4e45-9cc1-514396828a22', 'M', 150, 220, 480000, 328.77, 2)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('6bafeeaa-7024-4d60-b9e7-3cf6d709c050', 'b7073578-f58e-4e45-9cc1-514396828a22', 'S', 120, 180, 320000, 219.18, 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('e907fda0-df3f-4446-ba6b-f6df974825e5', 'b7073578-f58e-4e45-9cc1-514396828a22', '/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg', 'Valley hand-tufted rug', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('9fb059d8-9130-46b3-8a79-32828a4f0134', 'b7073578-f58e-4e45-9cc1-514396828a22', '/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg', 'Valley hand-tufted rug', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('6546fa5d-b17c-4f87-a5cd-ef65d9f0780a', 'b7073578-f58e-4e45-9cc1-514396828a22', '/__l5e/assets-v1/074246a2-d88c-4a8b-914b-d38c7182cc20/valley-3.jpg', 'Valley rug in a living room', 2)
on conflict (id) do nothing;
insert into public.products (id, slug, name, category_id, short_description, description, main_image_url, hover_image_url, base_price_rwf, base_price_usd, stock_status, shape, material, production_time, color_palette, tags, featured, featured_order, is_published)
values (
  '63fe983d-bb36-4705-bd61-40bdc63f425b',
  'geometric',
  'Geometric',
  '6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3',
  'Tan and beige ground with multi colour geometric accents.',
  'Geometric layers bright multi colour blocks over a warm tan field. Playful without shouting, and built to take daily traffic.',
  '/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg',
  '/__l5e/assets-v1/5205602f-02e7-4eeb-a1cd-5ee1cc9542e0/geometric-2.jpg',
  320000,
  219.18,
  'out_of_stock',
  'rectangle',
  'Hand-tufted New Zealand wool',
  'Ready in 3 to 4 weeks',
  '["#E8A400","#1F7A5A","#C6303A","#3D7EA6"]'::jsonb,
  array['rectangle', 'multicolour', 'geometric']::text[],
  true,
  4,
  true
)
on conflict (slug) do nothing;

insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('52ec1ca7-8c27-4580-8d93-888cde6a6952', '63fe983d-bb36-4705-bd61-40bdc63f425b', 'S', 120, 180, 320000, 219.18, 0)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('03e84285-4ce4-4ff5-a2c2-9228f6be80d0', '63fe983d-bb36-4705-bd61-40bdc63f425b', 'M', 150, 220, 480000, 328.77, 1)
on conflict (id) do nothing;
insert into public.product_sizes (id, product_id, label, width_cm, height_cm, price_rwf, price_usd, sort_order)
values ('fe0a0e9b-32e9-43a3-9eac-46e39f9c14ae', '63fe983d-bb36-4705-bd61-40bdc63f425b', 'L', 200, 300, 870000, 595.89, 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('de80e740-5289-45d7-9bd0-9c3cad2438ea', '63fe983d-bb36-4705-bd61-40bdc63f425b', '/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg', 'Geometric rug in a bright Kigali living room', 0)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('07319b45-2cc9-4b54-9479-cbc4e4da144f', '63fe983d-bb36-4705-bd61-40bdc63f425b', '/__l5e/assets-v1/5205602f-02e7-4eeb-a1cd-5ee1cc9542e0/geometric-2.jpg', 'Overhead view of the Geometric rug colour blocks', 1)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('fdecc646-7bd3-428f-86eb-0455bbfe98e0', '63fe983d-bb36-4705-bd61-40bdc63f425b', '/__l5e/assets-v1/a47a0de6-8ab3-4251-b78e-2d86cb34b29d/geometric-3.jpg', 'Geometric rug styled beside a sofa', 2)
on conflict (id) do nothing;
insert into public.product_images (id, product_id, url, alt, sort_order)
values ('c9fd6eff-bf79-4936-87a8-e67492382a9f', '63fe983d-bb36-4705-bd61-40bdc63f425b', '/__l5e/assets-v1/58cfc153-48d5-4aab-9fd0-e5367ce56886/geometric-4.jpg', 'Close up of the Geometric rug wool pile', 3)
on conflict (id) do nothing;
insert into public.reviews (id, customer_name, location, rating, quote, sort_order, is_visible)
values ('1e5473c8-dc8a-42cd-a11f-a10816e4968f', 'Aline M.', 'Kigali', 5, 'I brought them a doodle of my dog and they turned it into a rug that stops every guest in their tracks. Unreal craftsmanship.', 1, true)
on conflict (id) do nothing;
insert into public.reviews (id, customer_name, location, rating, quote, sort_order, is_visible)
values ('a17b9f45-0f90-45ca-86a3-5527ec3b539a', 'David K.', 'Kimihurura', 5, 'The colours are richer than I imagined, and it feels dense and heavy in the best way. Worth every franc.', 2, true)
on conflict (id) do nothing;
insert into public.reviews (id, customer_name, location, rating, quote, sort_order, is_visible)
values ('b168fe48-6089-443b-a0b5-8d104487e937', 'Sarah B.', 'Nyarutarama', 5, 'From the first WhatsApp to delivery was three weeks. They confirmed every detail. Genuinely thoughtful people.', 3, true)
on conflict (id) do nothing;

-- =========================================================
-- Performance Indexes (Prevents sequential scans and speeds up high-traffic queries)
-- =========================================================
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_created_at on public.order_items (created_at);
create index if not exists idx_products_category_published on public.products (category_id, is_published);
create index if not exists idx_products_featured on public.products (featured, featured_order);
create index if not exists idx_product_sizes_product_id on public.product_sizes (product_id, sort_order);
create index if not exists idx_product_images_product_id on public.product_images (product_id, sort_order);
create index if not exists idx_newsletter_created_at on public.newsletter_subscribers (created_at desc);
create index if not exists idx_contact_created_at on public.contact_messages (created_at desc);
create index if not exists idx_custom_requests_created_at on public.custom_requests (created_at desc);
create index if not exists idx_promo_leads_created_at on public.promo_leads (created_at desc);
create index if not exists idx_promo_coupons_code on public.promo_coupons (code, is_active);
create index if not exists idx_reviews_visible on public.reviews (is_visible, sort_order);
create index if not exists idx_activity_log_created_at on public.activity_log (created_at desc);
create index if not exists idx_site_settings_key on public.site_settings (key);

