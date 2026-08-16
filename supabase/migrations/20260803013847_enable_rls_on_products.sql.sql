/*
# Enable RLS on products table (public read-only catalog)

## Purpose
The `products` table already exists and contains 1765 catalog rows. RLS was
previously DISABLED, meaning the table relied solely on default Postgres
grants. This migration enables Row Level Security and adds a read-only SELECT
policy for the public catalog so the anon-key frontend can browse products.

## Tables
- `products` (existing, no structural changes)
  - Columns used by the app: id, old_id, category_id, name_bg, name_en,
    description_bg, description_en, sizes, price, old_price, image_url,
    is_active, priority, created_at.

## Security
- ENABLE Row Level Security on `products`.
- SELECT policy `anon_can_read_products` scoped TO anon, authenticated with
  USING (true): the catalog is intentionally public/shared. Anyone browsing
  the site (no sign-in) can read product rows.
- No INSERT / UPDATE / DELETE policies: the public catalog is read-only from
  the frontend. Only an authenticated admin (via a separate admin flow) would
  manage rows; that is out of scope for this migration.
- Existing grants: anon already holds SELECT/INSERT/UPDATE/DELETE at the table
  privilege level, but with RLS now enabled and only a SELECT policy present,
  anon can ONLY read — writes are blocked by the absence of write policies.

## Notes
1. This is a no-auth public catalog, so policies list `anon, authenticated`
   and `USING (true)` is appropriate for the intentionally public read path.
2. No data is modified or deleted — this migration only enables RLS and adds
   one SELECT policy.
*/

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_can_read_products" ON products;
CREATE POLICY "anon_can_read_products"
ON products FOR SELECT
TO anon, authenticated
USING (true);
