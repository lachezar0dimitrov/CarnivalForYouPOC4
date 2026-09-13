-- "Couple/pair" costumes: lets the admin link two products (e.g. a men's
-- costume + matching women's costume) as a couple set. Self-referencing,
-- nullable, ON DELETE SET NULL so deleting one product doesn't orphan a
-- dangling reference on its former partner. 1:1 reciprocity (both rows
-- point at each other) is enforced in application code (AdminPage.tsx save
-- logic), not at the DB level.
ALTER TABLE products ADD COLUMN IF NOT EXISTS couple_partner_id bigint REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_couple_partner_id ON products (couple_partner_id);
