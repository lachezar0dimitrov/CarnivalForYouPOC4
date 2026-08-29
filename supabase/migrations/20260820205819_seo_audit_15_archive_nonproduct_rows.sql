-- Full-row archive before deleting non-product rows, so this is reversible.
CREATE TABLE IF NOT EXISTS products_archived_nonproducts_20260820 AS
SELECT p.*, now() AS archived_at,
  CASE
    WHEN p.id = 933 THEN 'legacy navigation placeholder, not a product (description was a phone-number call-to-action)'
    WHEN p.category_id = 12 THEN 'gallery photo from old-site category 12 "Нашите тематични партита" (Our Themed Parties), not a product'
    WHEN p.category_id = 16 THEN 'gallery photo from old-site category 16 "Нашата Карнавална Къща" (Our Carnival House), not a product'
  END AS archive_reason
FROM products p
WHERE p.id = 933
   OR (p.name_bg IS NULL AND p.name_en IS NULL AND p.category_id IN (12,16));
