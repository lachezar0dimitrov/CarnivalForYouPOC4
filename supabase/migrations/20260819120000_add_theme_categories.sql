-- Adds 6 new theme categories (Приказни/Fairy Tale, Супергерой/Superhero,
-- Ретро/Retro, Лицензирани/Licensed characters, Националности/Nationalities,
-- Пирати/Pirates) and tags matching existing products via category_ids.
--
-- Categories start is_active=false (hidden from production) pending
-- stakeholder review; the client only shows inactive categories when running
-- in dev mode (see loadCategories() in src/lib/products.ts).
--
-- Product matches were found via keyword search across name_bg/name_en/
-- description_bg/description_en (see git history for the classification
-- script, since removed after producing this migration). 3 known party-decor
-- prop IDs (not costumes) were explicitly excluded from all matching.
--
-- Applied as 6 separate UPDATE statements deliberately: a single combined
-- UPDATE ... FROM (VALUES ...) only applies one matching source row per
-- target row when a product appears in multiple categories' VALUES lists
-- (e.g. a product matching both Superhero and Licensed keywords), silently
-- dropping the other tag. Each statement here is idempotent via the
-- NOT (cat_id = ANY(category_ids)) guard, safe to re-run.

INSERT INTO categories (id, name_bg, name_en, image_url, "group", sort_order, is_active)
VALUES
  (21, 'Приказни', 'Fairy Tale', '', 'other', 8, false),
  (22, 'Супергерой', 'Superhero', '', 'other', 9, false),
  (23, 'Ретро', 'Retro', '', 'other', 10, false),
  (24, 'Лицензирани', 'Licensed', '', 'other', 11, false),
  (25, 'Националности', 'Nationalities', '', 'other', 12, false),
  (26, 'Пирати', 'Pirates', '', 'other', 13, false)
ON CONFLICT (id) DO NOTHING;

-- 21: Приказни (Fairy Tale) — 132 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 21)
FROM (VALUES (162),(544),(1152),(1205),(1215),(1393),(1499),(1323),(1333),(1335),(1346),(28),(48),(72),(70),(69),(73),(71),(98),(100),
(101),(102),(106),(111),(131),(160),(161),(175),(201),(205),(204),(253),(259),(261),(321),(327),(330),(356),(374),(389),
(449),(457),(471),(487),(502),(511),(521),(614),(619),(646),(689),(661),(731),(738),(740),(753),(766),(777),(783),(925),
(924),(1017),(1061),(1068),(1070),(1080),(1083),(1102),(1101),(1118),(1121),(1140),(1138),(1142),(1143),(1146),(1145),(1481),(1147),(1153),
(1159),(1172),(1185),(1192),(1206),(1207),(1220),(1312),(1245),(1253),(1277),(1290),(357),(355),(699),(700),(1030),(1224),(1249),(1578),
(1639),(1719),(1384),(1388),(1392),(1477),(1488),(1505),(1510),(1511),(1542),(1543),(1397),(1442),(1530),(1374),(1579),(1594),(1603),(1730),
(1592),(1659),(1558),(1641),(1649),(1653),(1663),(1681),(1695),(1564),(1725),(1733)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (21 = ANY(p.category_ids));

-- 22: Супергерой (Superhero) — 18 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 22)
FROM (VALUES (272),(1339),(1739),(1734),(1336),(1337),(1338),(59),(108),(113),(195),(976),(1590),(1523),(1522),(1629),(1747),(1751)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (22 = ANY(p.category_ids));

-- 23: Ретро (Retro) — 20 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 23)
FROM (VALUES (1326),(363),(451),(492),(507),(538),(726),(762),(763),(939),(1071),(1197),(1431),(1437),(1447),(1449),(1455),(1465),(1453),(1310)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (23 = ANY(p.category_ids));

-- 24: Лицензирани (Licensed characters) — 31 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 24)
FROM (VALUES (272),(1339),(1336),(1337),(1338),(1341),(59),(108),(113),(781),(793),(976),(782),(1523),(1522),(1524),(1527),(1528),(1533),(1314),
(1598),(1570),(1571),(1572),(1573),(1592),(1742),(1706),(1721),(1747),(1751)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (24 = ANY(p.category_ids));

-- 25: Националности (Nationalities) — 37 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 25)
FROM (VALUES (792),(1056),(934),(1333),(1334),(22),(25),(97),(338),(362),(394),(403),(436),(437),(489),(494),(506),(599),(621),(623),
(692),(760),(772),(900),(935),(959),(1010),(1055),(1079),(1126),(1116),(1178),(1263),(1490),(1517),(1543),(1569)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (25 = ANY(p.category_ids));

-- 26: Пирати (Pirates) — 72 products
UPDATE products AS p SET category_ids = array_append(p.category_ids, 26)
FROM (VALUES (339),(254),(483),(755),(1168),(1133),(1110),(1325),(1327),(19),(20),(37),(36),(38),(68),(44),(42),(60),(61),(94),
(133),(138),(157),(159),(185),(186),(249),(364),(378),(385),(393),(398),(458),(459),(464),(476),(474),(497),(532),(547),
(586),(595),(610),(666),(675),(743),(746),(906),(1033),(1031),(1044),(1111),(1140),(1155),(1169),(1177),(1200),(1201),(1252),(1),
(1567),(1413),(1421),(1444),(1513),(1761),(1420),(1587),(1690),(1689),(1700),(1566)
) AS v(product_id)
WHERE p.id = v.product_id AND NOT (26 = ANY(p.category_ids));
