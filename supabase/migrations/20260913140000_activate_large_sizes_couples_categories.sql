-- Activates the "Големи размери" (34) and "Двойки" (35) filter-tag
-- categories added in 20260913120000, same pattern as
-- 20260903194037_activate_luxury_animals_mascot_categories.sql. Requested
-- once the first couple pairing (Joker + Harley Quinn) was tagged in admin
-- and the "Двойки" filter chip didn't show up on the public catalog filter
-- (is_active=false hides a category from fetchCategories()'s public list,
-- even though it was already selectable as a tag in the admin form).
UPDATE categories SET is_active = true WHERE id IN (34, 35);
