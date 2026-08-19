-- Refinements to the theme categories added in 20260819120000:
-- 1. New show_as_tile column — sub-categories are filter-only, no image
--    card on the products page (unlike the 5 main demographic categories
--    and Halloween/Christmas, which keep their tile cards).
-- 2. Merge Супергерой (Superhero) into Лицензирани (Licensed), renamed to
--    "Лицензирани и филмови герои" — the two overlapped almost entirely.
-- 3. Four new categories: Исторически (Historical), Секси костюми (Sexy),
--    Професии (Professions), Забавни костюми (Novelty/Funny) — same
--    keyword-matching approach as before, validated against false
--    positives (e.g. "Батман - Черния рицар" title-matching "рицар"/knight
--    despite being a superhero costume, not historical armor; "Доктор
--    Стрейндж" matching "доктор"/doctor despite being the Marvel
--    character, moved to Licensed instead).

ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_as_tile boolean NOT NULL DEFAULT true;

-- Merge Superhero (22) into Licensed (24)
UPDATE products SET category_ids = array_append(category_ids, 24)
WHERE 22 = ANY(category_ids) AND NOT (24 = ANY(category_ids));
UPDATE products SET category_ids = array_remove(category_ids, 22)
WHERE 22 = ANY(category_ids);
DELETE FROM categories WHERE id = 22;
UPDATE categories
SET name_bg = 'Лицензирани и филмови герои', name_en = 'Licensed & Movie Characters'
WHERE id = 24;

-- All theme/filter categories: filter-chip only, no tile card
UPDATE categories SET show_as_tile = false WHERE id IN (21, 23, 24, 25, 26);

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order, is_active, show_as_tile)
VALUES
  (27, 'Исторически', 'Historical', '', 'other', 14, false, false),
  (28, 'Секси костюми', 'Sexy Costumes', '', 'other', 15, false, false),
  (29, 'Професии', 'Professions', '', 'other', 16, false, false),
  (30, 'Забавни костюми', 'Novelty & Funny Costumes', '', 'other', 17, false, false)
ON CONFLICT (id) DO NOTHING;

-- 27: Исторически (Historical) — 53 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 27)
FROM (VALUES (1056),(3),(934),(1433),(1333),(1334),(489),(599),(621),(1116),(1159),(1206),(1517),(22),(56),(65),(90),(92),(176),(178),(180),
(191),(263),(359),(456),(482),(520),(515),(531),(539),(915),(935),(1010),(1012),(1019),(1035),(1052),(1055),(1135),(1216),(1221),(537),
(1008),(1415),(1422),(1435),(1503),(1569),(1472),(1579),(1601),(1662),(1685)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (27 = ANY(p.category_ids));

-- 28: Секси костюми (Sexy) — 64 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 28)
FROM (VALUES (339),(523),(1106),(1235),(1393),(1373),(1711),(186),(299),(692),(1384),(1392),(52),(69),(340),(347),(353),(350),(354),(358),
(356),(372),(379),(377),(493),(642),(657),(673),(771),(777),(942),(945),(1047),(1053),(1078),(1076),(1103),(1115),(1123),(1171),(1251),
(295),(357),(344),(719),(1578),(1661),(1371),(1372),(1381),(1391),(1413),(1428),(1441),(1462),(1480),(1491),(1488),(1468),(1374),(1600),
(1601),(1587),(1664)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (28 = ANY(p.category_ids));

-- 29: Професии (Professions) — 46 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 29)
FROM (VALUES (104),(445),(319),(349),(533),(1021),(1236),(1379),(52),(88),(143),(167),(166),(223),(224),(264),(346),(347),(371),(431),
(446),(447),(603),(739),(749),(765),(764),(1098),(1103),(1115),(1128),(1191),(1275),(1298),(1646),(1675),(1718),(1411),(1440),(1466),
(1467),(1419),(1684),(1672),(1697),(1698)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (29 = ANY(p.category_ids));

-- 30: Забавни костюми (Novelty/Funny) — 5 products, found via targeted
-- search (this category is conceptual, not keyword-driven — "Будка за
-- Целувки"/Kissing Booth, "Здрав като пирон"/Hard As Nails pun, "Мистър
-- Сигурност"/Condom Man, "Изненадата"/Flasher Costume, "Надуваемо бебешко
-- шишенце"/Inflatable Baby Bottle)
UPDATE products SET category_ids = array_append(category_ids, 30)
WHERE id IN (640, 1183, 467, 1059, 484) AND NOT (30 = ANY(category_ids));

-- "Доктор Стрейндж" is the Marvel character, not a generic doctor costume
UPDATE products SET category_ids = array_append(category_ids, 24)
WHERE id = 1715 AND NOT (24 = ANY(category_ids));
