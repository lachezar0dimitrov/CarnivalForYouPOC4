-- Promote the 9 theme/filter categories added in 20260819120000 and
-- refined in 20260819140000 from is_active=false (pending stakeholder
-- review) to is_active=true (approved, live). Halloween/Christmas/the 5
-- core demographic categories were already active; Masks/Hats/Wigs/
-- Accessories remain is_active=false by long-standing stakeholder
-- decision (see CLAUDE.md section 7) and are intentionally NOT touched
-- here.

UPDATE categories SET is_active = true
WHERE id IN (21, 23, 24, 25, 26, 27, 28, 29, 30);
