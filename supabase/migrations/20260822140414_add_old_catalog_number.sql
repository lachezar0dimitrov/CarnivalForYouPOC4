-- The old site's per-product "catalog number" (ot_ctn on the legacy pages),
-- distinct from old_id (which is the obid URL param). Never captured during
-- the original import; text because some values have leading zeros (e.g. 00591).
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_catalog_number text;
CREATE INDEX IF NOT EXISTS idx_products_old_catalog_number ON products (old_catalog_number);
