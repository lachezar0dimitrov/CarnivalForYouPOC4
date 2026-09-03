-- Adds 3 new sub-categories (filter-tag only, no tile card, same shape as
-- the theme categories added in 20260819120000/20260819140000):
--   31: Луксозна серия (Luxury Series)
--   32: Животни (Animals)
--   33: Маскот костюми (Mascot Costumes)
--
-- Requested as DB + admin only for now -- inserted with is_active=false so
-- they're manageable in the admin Category Manager and selectable as
-- product sub-category tags, but stay hidden from the public site's
-- category filters/tiles until explicitly activated later.

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order, is_active, show_as_tile)
VALUES
  (31, 'Луксозна серия', 'Luxury Series', '', 'other', 18, false, false),
  (32, 'Животни', 'Animals', '', 'other', 19, false, false),
  (33, 'Маскот костюми', 'Mascot Costumes', '', 'other', 20, false, false)
ON CONFLICT (id) DO NOTHING;
