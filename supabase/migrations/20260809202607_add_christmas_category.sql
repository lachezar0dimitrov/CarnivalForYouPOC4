/*
# Add missing Christmas category

1. Purpose
   - Inserts the "Коледа" (Christmas) category that was missing from the
     categories table. The image file `christmas-carnival-costumes.png`
     already exists in public/images/categories/.

2. Changes
   - INSERT new row into `categories` with id 20.
   - name_bg = 'Коледа', name_en = 'Christmas'.
   - image_url = '/images/categories/christmas-carnival-costumes.png'.
   - group = 'other', sort_order = 6, is_active = true.

3. Security
   - No RLS or policy changes.
   - No schema changes.

4. Notes
   - Uses ON CONFLICT (id) DO NOTHING to be idempotent / re-runnable.
*/

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order, is_active)
VALUES (20, 'Коледа', 'Christmas', '/images/categories/christmas-carnival-costumes.png', 'other', 6, true)
ON CONFLICT (id) DO NOTHING;
