/*
# SEO-optimize category images and bilingual names

1. Purpose
   - Renames local category image files to SEO-friendly slugs
     (lowercase, hyphenated, descriptive words).
   - Updates the `categories` table `image_url` column to point
     to the new local paths under `/images/categories/`.
   - Ensures `name_bg` and `name_en` are correctly filled for
     every category.

2. Changes
   - `categories.image_url` updated for ids 2,3,4,5,6,7,8,10,17,19.
   - `name_bg` / `name_en` reconfirmed for all active categories.

3. Security
   - No RLS or policy changes.
   - No schema changes.

4. Notes
   - Uses `UPDATE ... WHERE id = ...` per row to be safe and explicit.
   - Re-runnable: same values produce no additional effect.
*/

UPDATE categories SET
  name_bg   = 'Дамски',
  name_en   = 'Women''s',
  image_url = '/images/categories/women-carnival-costumes.png'
WHERE id = 2;

UPDATE categories SET
  name_bg   = 'Мъжки',
  name_en   = 'Men''s',
  image_url = '/images/categories/men-carnival-costumes.png'
WHERE id = 3;

UPDATE categories SET
  name_bg   = 'Момичета',
  name_en   = 'Girls''',
  image_url = '/images/categories/girls-carnival-costumes.png'
WHERE id = 4;

UPDATE categories SET
  name_bg   = 'Маски',
  name_en   = 'Masks',
  image_url = '/images/categories/venetian-masks.png'
WHERE id = 5;

UPDATE categories SET
  name_bg   = 'Шапки',
  name_en   = 'Hats',
  image_url = '/images/categories/carnival-hats.png'
WHERE id = 6;

UPDATE categories SET
  name_bg   = 'Перуки',
  name_en   = 'Wigs',
  image_url = '/images/categories/carnival-wigs.png'
WHERE id = 7;

UPDATE categories SET
  name_bg   = 'Аксесоари',
  name_en   = 'Accessories',
  image_url = '/images/categories/carnival-accessories.png'
WHERE id = 8;

UPDATE categories SET
  name_bg   = 'Хелоуин',
  name_en   = 'Halloween',
  image_url = '/images/categories/halloween-scary-costumes.png'
WHERE id = 10;

UPDATE categories SET
  name_bg   = 'Момчета',
  name_en   = 'Boys''',
  image_url = '/images/categories/boys-carnival-costumes.png'
WHERE id = 17;

UPDATE categories SET
  name_bg   = 'Деца 0-3 г.',
  name_en   = 'Toddlers 0-3',
  image_url = '/images/categories/baby-costumes-0-3-years.png'
WHERE id = 19;
