/*
# Admin panel: categories table, site settings, storage buckets

## Purpose
Adds dynamic category management, editable contact/site info, and
image storage buckets for the admin panel.

## New Tables
1. `categories` — id, name_bg, name_en, image_url, group, sort_order, is_active
2. `site_settings` — singleton (id=1) with address, phone, email, hours, maps_query

## Storage
- Creates product-images, banner-images, category-images buckets (public).

## Security
- categories: public SELECT, admin writes
- site_settings: public SELECT, admin UPDATE only
- Storage: public read, admin write
*/

CREATE TABLE IF NOT EXISTS categories (
  id int PRIMARY KEY,
  name_bg text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  "group" text NOT NULL DEFAULT 'other' CHECK ("group" IN ('main', 'other')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public"
ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order) VALUES
  (2, 'Дамски', 'Women''s', 'https://images.pexels.com/photos/30535497/pexels-photo-30535497.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'main', 1),
  (3, 'Мъжки', 'Men''s', 'https://images.pexels.com/photos/14317825/pexels-photo-14317825.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'main', 2),
  (17, 'Момчета', 'Boys''', 'https://images.pexels.com/photos/6203466/pexels-photo-6203466.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'main', 3),
  (4, 'Момичета', 'Girls''', 'https://images.pexels.com/photos/20184175/pexels-photo-20184175.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'main', 4),
  (19, 'Деца 0-3 г.', 'Toddlers 0-3', 'https://images.pexels.com/photos/12548665/pexels-photo-12548665.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'main', 5),
  (5, 'Маски', 'Masks', 'https://images.pexels.com/photos/15587740/pexels-photo-15587740.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'other', 1),
  (6, 'Шапки', 'Hats', 'https://images.pexels.com/photos/324656/pexels-photo-324656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'other', 2),
  (7, 'Перуки', 'Wigs', 'https://images.pexels.com/photos/29901341/pexels-photo-29901341.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'other', 3),
  (8, 'Аксесоари', 'Accessories', 'https://images.pexels.com/photos/4721513/pexels-photo-4721513.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'other', 4),
  (10, 'Хелоуин', 'Halloween', 'https://images.pexels.com/photos/14202548/pexels-photo-14202548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'other', 5)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  address text NOT NULL DEFAULT 'Младост 4, бл. 426А, София',
  phone text NOT NULL DEFAULT '+359 88 123 4567',
  email text NOT NULL DEFAULT 'info@carnivalforyou.com',
  hours_bg jsonb NOT NULL DEFAULT '[{"day":"Понеделник – Петък","time":"10:00 – 19:00"},{"day":"Събота","time":"10:00 – 18:00"},{"day":"Неделя","time":"Почивен ден"}]'::jsonb,
  hours_en jsonb NOT NULL DEFAULT '[{"day":"Monday – Friday","time":"10:00 – 19:00"},{"day":"Saturday","time":"10:00 – 18:00"},{"day":"Sunday","time":"Closed"}]'::jsonb,
  maps_query text NOT NULL DEFAULT 'Младост 4, бл. 426А, София',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON site_settings;
CREATE POLICY "settings_select_public"
ON site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON site_settings;
CREATE POLICY "settings_update_admin"
ON site_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('banner-images', 'banner-images', true),
  ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_read" ON storage.objects;
CREATE POLICY "product_images_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "product_images_write" ON storage.objects;
CREATE POLICY "product_images_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "banner_images_read" ON storage.objects;
CREATE POLICY "banner_images_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'banner-images');
DROP POLICY IF EXISTS "banner_images_write" ON storage.objects;
CREATE POLICY "banner_images_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "banner_images_delete" ON storage.objects;
CREATE POLICY "banner_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banner-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "category_images_read" ON storage.objects;
CREATE POLICY "category_images_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'category-images');
DROP POLICY IF EXISTS "category_images_write" ON storage.objects;
CREATE POLICY "category_images_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "category_images_delete" ON storage.objects;
CREATE POLICY "category_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'category-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
