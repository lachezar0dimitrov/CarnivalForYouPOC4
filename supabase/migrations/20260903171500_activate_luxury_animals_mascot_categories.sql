-- Activates the 3 sub-categories added in 20260903170000
-- (Луксозна серия/Luxury Series, Животни/Animals, Маскот костюми/Mascot
-- Costumes) so they show up as filter chips on the public site, same as
-- the other theme/sub-categories (21, 23-30).

UPDATE categories SET is_active = true WHERE id IN (31, 32, 33);
