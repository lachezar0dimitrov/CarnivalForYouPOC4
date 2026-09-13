-- Adds 2 new sub-categories (filter-tag only, no tile card, same shape as
-- 20260903170000_add_luxury_animals_mascot_categories.sql):
--   34: Големи размери (Large Sizes)
--   35: Двойки (Couples)
--
-- Inserted with is_active=false so they're manageable in the admin Category
-- Manager and selectable as product sub-category tags right away, but stay
-- hidden from the public site's category filters/tiles until products are
-- tagged and the category is explicitly activated later.

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order, is_active, show_as_tile)
VALUES
  (34, 'Големи размери', 'Large Sizes', '', 'other', 21, false, false),
  (35, 'Двойки', 'Couples', '', 'other', 22, false, false)
ON CONFLICT (id) DO NOTHING;
