/*
# Admin panel infrastructure: profiles, banners, product tags, admin user

## Purpose
Adds everything needed for the /admin panel: an admin role system,
a banner rotator table, a tags column on products, write policies for
authenticated admins, and creates the first admin user.

## New Tables
1. `profiles`
   - id (uuid, PK, references auth.users ON DELETE CASCADE)
   - role (text, default 'user', CHECK in ('user','admin'))
   - created_at (timestamptz, default now())
   - Purpose: maps auth users to application roles. The `role` column is
     server-controlled — clients cannot modify it directly (column-level
     privilege revoked).

2. `banners`
   - id (serial, PK)
   - image_url (text, not null) — path or URL to the slide image
   - title_bg (text) — Bulgarian title shown on the slide
   - title_en (text) — English title
   - subtitle_bg (text) — Bulgarian subtitle
   - subtitle_en (text) — English subtitle
   - link_url (text) — optional navigation target (e.g. "products?category=2")
   - is_active (boolean, default true) — only active banners show on the site
   - sort_order (int, default 0) — lower sorts first
   - created_at (timestamptz, default now())

## Modified Tables
- `products`: adds `tags text[] DEFAULT '{}'` column for admin-assigned tags.

## Security
### profiles
- RLS enabled.
- SELECT: users can read their own profile; admins can read all.
- No INSERT/UPDATE/DELETE policies — profiles are created by a trigger
  and roles are set server-side only.
- Column-level: REVOKE UPDATE on `role` from authenticated so clients
  cannot self-promote.

### banners
- RLS enabled.
- SELECT: anon + authenticated can read (public reads active, admin reads all
  via policy — we expose all rows and the frontend filters by is_active).
- INSERT/UPDATE/DELETE: admin only (checks profiles.role = 'admin').

### products (existing)
- Existing SELECT policy (anon read) stays.
- New INSERT/UPDATE/DELETE policies: admin only.

## Admin User
- Creates auth user with email valeriya@carnicalforyou.com, password "Bogomil".
- Email is confirmed (email_confirmed_at set) so login works immediately.
- Creates matching profile row with role='admin'.
- Idempotent: uses ON CONFLICT to avoid errors on re-run.

## Notes
1. The login form accepts username "Valeriya" and internally maps it to
   valeriya@carnicalforyou.com for Supabase Auth.
2. Product deletes from the admin panel are soft-deletes (is_active = false),
   not row deletions, to preserve data integrity.
3. A trigger `handle_new_user` auto-creates a profile row when a new auth
   user signs up, defaulting role to 'user'.
*/

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- Column-level: role is server-controlled, not client-writable
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (id, created_at) ON profiles TO authenticated;

-- Trigger: auto-create profile on new auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BANNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id serial PRIMARY KEY,
  image_url text NOT NULL,
  title_bg text DEFAULT '',
  title_en text DEFAULT '',
  subtitle_bg text DEFAULT '',
  subtitle_en text DEFAULT '',
  link_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Public can read all banners (frontend filters is_active client-side)
DROP POLICY IF EXISTS "banners_select_public" ON banners;
CREATE POLICY "banners_select_public"
ON banners FOR SELECT
TO anon, authenticated
USING (true);

-- Admin-only writes
DROP POLICY IF EXISTS "banners_insert_admin" ON banners;
CREATE POLICY "banners_insert_admin"
ON banners FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "banners_update_admin" ON banners;
CREATE POLICY "banners_update_admin"
ON banners FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "banners_delete_admin" ON banners;
CREATE POLICY "banners_delete_admin"
ON banners FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- ============================================================
-- 3. PRODUCTS: ADD TAGS COLUMN
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================================
-- 4. PRODUCTS: ADMIN WRITE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products"
ON products FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products"
ON products FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
ON products FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- ============================================================
-- 5. CREATE FIRST ADMIN USER
-- ============================================================
-- Insert auth user (idempotent via ON CONFLICT)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'valeriya@carnicalforyou.com',
  crypt('Bogomil', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'valeriya@carnicalforyou.com'
);

-- Insert admin profile (idempotent)
INSERT INTO profiles (id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'valeriya@carnicalforyou.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================
-- 6. SEED INITIAL BANNERS
-- ============================================================
INSERT INTO banners (image_url, title_bg, title_en, subtitle_bg, subtitle_en, link_url, is_active, sort_order)
SELECT
  '/images/carousel/viber_image_2026-08-03_22-39-18-672.jpg',
  'Магически костюми под наем',
  'Magical Costume Rentals',
  'Открийте своя образ в сърцето на София',
  'Find your look in the heart of Sofia',
  'products',
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM banners);

INSERT INTO banners (image_url, title_bg, title_en, subtitle_bg, subtitle_en, link_url, is_active, sort_order)
SELECT
  '/images/carousel/newwwuue_2026-08-03_22-39-18-672_copy.jpg',
  'Венециански маски и фантастични образи',
  'Venetian Masks & Fantasy Looks',
  'Резервирайте на място в нашия магазин',
  'Reserve in store',
  'products',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE image_url = '/images/carousel/newwwuue_2026-08-03_22-39-18-672_copy.jpg');
