# Product Audit & SEO Optimisation — Summary Report

**Date:** 2026-08-20 (follow-up pass 2026-08-21)
**Branch:** `dev/product-seo-audit`
**Scope:** Every product row in `public.products`, every text column, both Bulgarian and English
**Method:** Full-catalogue SQL inspection + pattern sweeps, in-browser (Playwright) verification of rendered output, image inspection, and cross-referencing against the still-live legacy site

---

## ⚠️ Read this first — three things need your attention

1. **The site was carrying injected SEO spam.** 22 products across two columns
   contained hidden `<a style="display:none">` links pointing at
   replica-handbag and "elevator shoes" affiliate domains — **15 distinct spam
   domains**. **6 were live on the site.** All removed.
   See [Security Findings](#1-security-findings-most-important).

2. **Database edits are live, not branch-scoped.** Git branches don't isolate
   Supabase. Every change described here is **already applied to the
   production catalogue**. Full rollback snapshots were taken first — see
   [Rollback](#rollback).

3. **Root cause identified.** All the scrambled fields trace to one bug: the
   legacy export was CSV, and unescaped commas inside HTML attributes shifted
   every following column one place right.
   See [Root cause](#12-root-cause-the-csv-column-shift).

---

## Total Products Checked

| Metric | Before | After |
|---|---|---|
| Rows in `products` (all inspected) | **1,760** | **1,645** |
| Active products | 1,612 | 1,500 |
| Active *and* purchasable (`price > 0`, customer-visible) | 1,447 | **1,447** ✅ |
| Rows modified by this audit | — | **1,404** |
| Rows removed (non-products, archived) | — | **115** |
| Rows where price was modified | — | **0** |

> The purchasable count is **unchanged at 1,447** — confirmation that nothing a
> customer could actually see or rent was removed.

Field-level change counts vs. the pre-audit snapshot:

| Field | Rows changed |
|---|---|
| `description_en` | 1,143 |
| `description_bg` | 1,017 |
| `name_en` | 376 |
| `name_bg` | 242 |

---

## 1. Security Findings (most important)

### 1.1 Injected hidden spam links — **16 products, 6 live**

Classic black-hat "parasite SEO": hidden anchors injected into product
descriptions, almost certainly into the old PHP site, then carried through the
2026 migration.

Domains found: `bagstyle.cn`, `bagstyle.net`, `bagshot.org`, `bagsale.net`,
`shoesite.biz`, `hotshoes.biz`, `shoesvariety.com`, `supershoesoutlet.com`,
`poplifeshoes.com`

Affected IDs: `105, 255, 259, 265, 744, 768, 769, 1308, 1427, 1430, 1479, 1543, 1544, 1547, 1599, 1655`
Live at time of discovery: `255, 259, 1427, 1430, 1543, 1547`

**Example (id 255, live):**
```
BEFORE  Карнавален детски костюм съдържащ: рокля и наметка с качулка.
        <a style="display:none;" href="https://www.shoesite.biz">height increasing shoes</a>
AFTER   Карнавален детски костюм съдържащ: рокля и наметка с качулка.
```

> **Recommended follow-up (not done here):** these links were indexable for an
> unknown period. Worth a Google Search Console check for manual actions or
> unexpected outbound links once DNS is switched.

**Follow-up pass found more.** The first sweep only covered `name_*` and
`description_*`. Re-scanning **every** text column found **6 additional spam
domains hiding in the `sizes` column** — none active, but they had been sitting
undetected:

`bestshoesites.com`, `bagssale.cn`, `bagsonly.net`, `shoesforsale.net`,
`goodshoes.org`, `wholesaleshoes.biz`

Full column sweep now clean: `name_bg`, `name_en`, `description_bg`,
`description_en`, `sizes`, `image_url`, `tags`, `category_ids`.

### 1.2 Root cause — the CSV column shift

Every scrambled-field symptom in this report traces to a single bug:

> The legacy export was **CSV**, and commas inside HTML attributes were never
> escaped. Any comma inside `style="color: rgb(100, 100, 100)"` or inside an
> injected `<a style="display:none" href="...">` tag ended the field early,
> shifting **every subsequent column one place to the right**.

The cascade is visible in the data:

```
description_bg  ->  description_en  ->  sizes
"Детски"            "карнавален костюм"   (overflow)
```

That single bug produced all of the following, which initially looked like
unrelated problems:

| Symptom | Rows |
|---|---|
| Bulgarian sentence-tails stranded in the English field | 52 |
| Description text stranded in the `sizes` field | 41 |
| Description cut mid-CSS-attribute (`<span style="color: rgb(100`) | 8 |
| Name/description fields fully swapped | 1 |

### 1.3 Collateral damage — corrupted BG/EN field split

The injected anchors sat *mid-sentence*, and the legacy importer split each
record at the tag. This stranded the tail of a Bulgarian sentence in the
**English** field — so English visitors saw Bulgarian, and both languages saw a
truncated fragment. **52 products** total (16 spam-related + 36 more with the
same signature).

```
BEFORE  description_bg: "Детски"
        description_en: "карнавален костюм"
AFTER   description_bg: "Детски карнавален костюм на ориенталска принцеса."
        description_en: "Children's Arabian princess costume."
```

### 1.3 Other injection vectors — checked, all clean

| Check | Result |
|---|---|
| `<script>` / `javascript:` / `onerror` / `onload` / `iframe` | **0** |
| Control characters (`\x01–\x1F`, `\x7F`) | **0** |
| Invisible / bidi-override characters (zero-width, RTL overrides) | **0** |
| Prompt-injection style text ("ignore previous instructions", etc.) | **0** |
| Competitor advertising | **0** |

### 1.4 Mixed-script homoglyphs — 30 tokens

Latin letters hiding inside Cyrillic words and vice versa. Invisible to a
reader, but they **silently break search** — a customer searching
`Карнавален` never matches `Kарнавален` (Latin `K`).

Examples: `Kарнавален`→`Карнавален`, `произвeдена`→`произведена`,
`Zorrо`→`Zorro`, `queеn`→`Queen`, `Мusketeer`→`Musketeer`

Three genuinely bilingual tokens (`То/IT`, `Акула/Baby Shark`) were identified
as intentional and **deliberately left alone**.

---

## 2. Grammar & Text Corrections

### 2.1 Bulgarian (BG)

**Spelling** — found by frequency analysis (rare tokens one edit away from a
high-frequency token), then manually screened. 43 distinct misspellings fixed
across names and descriptions:

| Before | After | | Before | After |
|---|---|---|---|---|
| костщм | костюм | | гащеризон variants (3) | гащеризон |
| карнаввален | карнавален | | панталон variants (3) | панталон |
| съдржащ / съдъжащ | съдържащ | | ръкавници / ръкъвици | ръкавици |
| хеловин / хелоун | Хелоуин | | иматация / иметация | имитация |
| вкючва / бключва / вклщчва | включва | | вратовразка / вретовръзка | вратовръзка |
| скетет | скелет | | камплект | комплект |
| церна | черна | | мониче | момиче |
| Чено-Бялата | Черно-Бялата | | Зoбми | Зомби |
| Злодейда | Злодейка | | геройня | героиня |
| бпечятлите | впечатлите | | почувтвате | почувствате |
| Състой се | Състои се | | стрната | страната |

**Deliberately NOT changed** — the same analysis flagged these, but they are
valid Bulgarian, not typos:
`каска` (helmet) vs `маска` (mask) · `перка` (fin) vs `перука` (wig) ·
`макет` (model) vs `жакет` (jacket) · gender/number forms
(`детско`/`детски`, `кадифено`/`кадифена`, `ботушки`/`ботуши`)

**Grammar & punctuation:**
- Gender agreement: `Детски карнавална рокля` → `Детска карнавална рокля`
- Missing definite article: `Перфектния костюм` → `Перфектният костюм`
- Sentences starting lower-case, capitalised
- 51 rows: missing space after comma (`Пура,светеща` → `Пура, светеща`)
- 9 rows: stray space before comma/full stop
- Hyphen used as a space: `Забавния- страшен клоун` → `Забавният страшен клоун`

### 2.2 English (EN)

**133 products** had raw wholesaler SKU strings as their customer-facing English
name/description — SHOUTING CAPS, no space after commas, trailing commas and
trade abbreviations.

```
BEFORE  SPECS,AVIATOR,MIRROR LENSES,BLACK FRAME
AFTER   Specs, Aviator, Mirror Lenses, Black Frame

BEFORE  SIREN WIG,WHITE,LONG CURLY,
AFTER   Siren Wig, White, Long Curly

BEFORE  MUSKETEER W/SHIRT, TROUSERS, B/COVERS, HAT
AFTER   Musketeer with shirt, trousers, boot covers, hat
```

- 90 ALL-CAPS names → Title Case (acronyms `LED`, `PVC`, `UK` protected — note
  `Lite Up LED`, not `Lite Up Led`)
- 43 ALL-CAPS descriptions → sentence case
- Abbreviations expanded: `W/` → `with`, `B/COVERS` → `Boot Covers`, `Blk` → `Black`
- Spelling: `Coccet` → `Coquette`, `Peal Belt` → (flagged, see §4)
- Fields fully swapped (BG name in EN column, EN name in BG column) — id 438

### 2.3 Structural cleanup (all 1,760 rows swept)

| Issue | Before | After |
|---|---|---|
| Leftover HTML tags (`<div>`, `<br>`, `<p>`, `<span>`) | 478 tags | **0** |
| HTML entities (`&nbsp;` `&amp;` `&quot;` `&#39;`) | 1,167 rows | **0** |
| Double spaces / untrimmed whitespace | 386 rows | **0** |

`&nbsp;`-only descriptions were revealed as genuinely empty and normalised to
`NULL`, so "missing description" is now explicit and queryable rather than
masked by a placeholder.

---

## 3. Key SEO Improvements

### 3.1 The problem measured

| Metric | Before | Target |
|---|---|---|
| Avg `<title>` length | **35 chars** | 50–60 |
| Titles under 50 chars | **1,390 / 1,447** | — |
| Products with **no** meta description | **406** | 0 |
| Avg meta description length | **80 chars** | 150–160 |

Those 406 products fell back to the generic site blurb — i.e. **hundreds of URLs
sharing identical meta descriptions**, which search engines treat as low-value.

### 3.2 The approach

Product names were **not** padded with keywords in the database. That would be
keyword stuffing, and it would leak into the catalogue UI and the admin editor.
Instead the high-intent terms are composed at render time
(`productSeoTitle` / `productSeoDescription` in `src/lib/products.ts`) from data
each product already has: category, sizes, rental price, and the shop's city.

Category phrasing uses an explicit per-category map, **not** string
concatenation — Bulgarian category labels mix adjectives with plural nouns, and
the accessory categories aren't costumes at all:

| Category | Naive concatenation | Correct phrasing used |
|---|---|---|
| Дамски | дамски костюм ✅ | дамски костюм под наем |
| Момичета | ❌ "Момичета костюм" | костюм **за** момичета под наем |
| Перуки | ❌ "Перуки костюм" (a wig isn't a costume) | перука под наем |

### 3.3 Before / after (verified in-browser)

```
TITLE   before:  "Малката червена шапчица | CarnivalForYou"          (40 chars)
        after:   "Малката червена шапчица — костюм за момичета под наем"  (53)

TITLE   before:  "Перука Клеопатра | CarnivalForYou"                 (33)
        after:   "Перука Клеопатра — перука под наем | CarnivalForYou"    (51)

META    before:  (none → generic site blurb, shared with ~405 other URLs)
        after:   "Вампирски зъби — карнавален аксесоар под наем. Наем от
                  4 EUR/ден. Вземете от магазина в София."               (87)
```

**Verification:** 13 products spanning every category type were loaded in a real
browser and their rendered `<title>` and `<meta name="description">` measured.
All titles landed **45–60 chars**; all meta descriptions **≤160 chars**; Bulgarian
grammar correct in every case.

---

## 4. Flagged Issues

### 4.1 Zero-price costumes — **9 products, need your prices** ⬅ ACTION NEEDED

Real costumes in customer-visible categories with `price = 0`, so the site's own
`price > 0` filter makes them **invisible to customers**. Note **8 of the 9 are
Christmas costumes** — that pattern suggests they were retired as a group rather
than lost individually, so please confirm whether they should return at all.

| ID | Catalog № | Name (BG) | Name (EN) | Category | Sizes | Old-site page |
|---|---|---|---|---|---|---|
| 306 | 404 | Мис Снежанка | Miss Santa | Дамски | Std | [obid=404](https://www.carnivalforyou.com/products.php?lang=bg&obid=404) |
| 722 | 850 | Снежната принцеса | Fever Winter Wonderland Lingerie | Дамски | S, M | [obid=850](https://www.carnivalforyou.com/products.php?lang=bg&obid=850) |
| 723 | 851 | Лошата помощничка | Fever Santa's Bad Girl Lingerie | Дамски | S | [obid=851](https://www.carnivalforyou.com/products.php?lang=bg&obid=851) |
| 294 | 391 | Късметлийски Дядо Коледа | Bargain Santa | Мъжки | M, L | [obid=391](https://www.carnivalforyou.com/products.php?lang=bg&obid=391) |
| 1045 | 1207 | Костюма на дядо Коледа от плюш | Santa Costume | Мъжки | M/L | [obid=1207](https://www.carnivalforyou.com/products.php?lang=bg&obid=1207) |
| 281 | 378 | Мини мис Коледа с плитки | Santa Girl | Момичета | S, M, L | [obid=378](https://www.carnivalforyou.com/products.php?lang=bg&obid=378) |
| 282 | 379 | Коледно джудже "Сръчко" | Santa Boy Costume with Jacket | Момчета | S, M, L | [obid=379](https://www.carnivalforyou.com/products.php?lang=bg&obid=379) |
| 1284 | 1450 | Готиното скелетче | Bones | Момичета | — | [obid=1450](https://www.carnivalforyou.com/products.php?lang=bg&obid=1450) |
| 1299 | 1465 | Принцесата на океана | Princess Of the Seas | Момичета | — | [obid=1465](https://www.carnivalforyou.com/products.php?lang=bg&obid=1465) |

> **Prices could not be recovered automatically.** The legacy site never
> published prices — it shows "Направете Вашето запитване" (make an enquiry)
> and a phone number instead. These have to come from your own records.

Once you have them: `UPDATE products SET price = <BGN> WHERE id = <id>;`
(the DB stores **BGN**; the admin panel now accepts EUR and converts).

### 4.2 ✅ RESOLVED — id 933 "Още детски костюми" (deleted)

Confirmed not a product: a legacy navigation placeholder whose description was
a phone-number call-to-action ("Още нови детски костюмчета: козле, лисица,
жабче… За повече информация на тел: 0888716941"). **Archived and deleted.**

### 4.3 ✅ RESOLVED — the 114 nameless rows were never products (deleted)

Investigated rather than assumed. Every one of them had an image, a category and
an old-site catalog number, but no name, price, sizes or description. The
category IDs gave it away — **12** and **16**, which don't exist in the
`categories` table. Cross-referencing the live legacy site:

| Old-site category | Meaning | Rows |
|---|---|---|
| `tid=12` | **"Нашите тематични партита"** — Our Themed Parties | 106 |
| `tid=16` | **"Нашата Карнавална Къща"** — Our Carnival House | 8 |

They were the old site's **photo galleries** — marketing/portfolio pages — which
the migration imported into the products table. Confirmed by inspecting the
images: they're on-location event photos (venue sets, props, models posed with a
treasure chest), not white-background catalogue shots.

**Archived and deleted.** The R2 image files were **not** touched — all 114
photos remain available if you ever want a proper About/Gallery page, which is
probably where they belong.

### 4.4 ✅ RESOLVED — id 1577 is *not* the old-site product you linked

You asked whether id 1577 matches
[obid=643](https://www.carnivalforyou.com/products.php?lang=bg&tid=&hday=&rent=&attr=&filt_pager=&obid=643).
I fetched that page and compared both images directly — **they're different
costumes**, though your instinct that they look similar is fair:

| | **obid=643** (old site) | **id 1577** (ours) |
|---|---|---|
| Name | Пират от отвъдното (cat. 34218) | — (was scrambled) |
| Character | **Ghost** pirate | **Skeleton** pirate |
| Colours | All grey/washed-out, grey dreadlocks | Crimson jacket, olive trousers, rust sash |
| Face | Pale ghoul mask, red eyes | Bone-white **skull** mask |
| Components | jacket, shirt, trousers, hat with hair, mask, gloves | jacket, mask, sash, hat |

**Decisive evidence:** id 1577 is the **only row in the entire catalogue with no
old-site catalog number** (`old_id IS NULL`). It was never imported — it was
created directly in the new admin, which is also why its fields were mis-filled
and why it has no category.

Text has been reconstructed from its photo (skeleton pirate). **Category still
unset** — suggest Мъжки (3) + Хелоуин (10), not applied since that's a
merchandising call.

### 4.5 Correction: the 52 corrupted products are **not** in hidden categories

You expected these were mostly hidden — they aren't:

| Category | Products | Still active | Customer-visible |
|---|---|---|---|
| **Момичета** (visible main category) | 50 | 9 | 7 |
| Дамски | 1 | 0 | 0 |
| (dropped category) | 1 | 0 | 0 |

Practical impact is still small — only **7** are customer-visible. All 52 have
had proper Bulgarian and English descriptions written regardless, so no action
is needed either way.

### 4.6 Missing content

| Gap | Count | Customer impact |
|---|---|---|
| Active products with no BG description | ~549 | Meta description is now auto-generated, but hand-written copy would rank better |
| Active products with no EN description | ~579 | As above |

### 4.7 Minor, left for a human

- **id 1061** — English description reads `Peal Belt`; almost certainly
  `Pearl Belt`. Left alone because it's a supplier product name and I couldn't
  confirm intent.
- **4 products** have `old_price` ≤ `price`, which would render a nonsensical
  "discount". Note the admin `old_price` field was hidden earlier today, so
  these are legacy values only.

---

## 5. Git Branch Status

| | |
|---|---|
| Branch | `dev/product-seo-audit` (created from `origin/main`) |
| Base commit | `8c01948` |
| Code commit | `1dece98` — `feat(seo): generate rich per-product meta titles and descriptions` |
| Files changed | `src/lib/products.ts`, `src/pages/ProductDetailPage.tsx` |
| Typecheck / build | ✅ passing |
| Merged to `main`? | **No** — awaiting review |
| `main` / `bolt_branch` touched? | **No** |

### Database migrations applied (live)

| Migration | Purpose |
|---|---|
| `backup_products_text_before_seo_audit` | Rollback snapshot (1,760 rows) |
| `seo_audit_01_remove_injected_spam_links` | **Security:** strip hidden spam anchors |
| `seo_audit_02_strip_html_entities_whitespace` | HTML/entity/whitespace normalisation |
| `seo_audit_03_repair_spam_split_descriptions` | Rejoin 16 spam-split records |
| `seo_audit_04_fix_homoglyphs_and_typos` | Mixed-script repairs |
| `seo_audit_05_repair_split_bilingual_descriptions` | Rejoin 36 more split records |
| `seo_audit_06_fix_swapped_and_scrambled_names` | Swapped/scrambled name fields |
| `seo_audit_07`–`09` | Bulgarian spelling corrections |
| `seo_audit_10_normalise_allcaps_english` | English Title/sentence case |
| `seo_audit_11_final_abbreviation_expansion` | Remaining abbreviation |
| `seo_audit_12_bulgarian_punctuation_spacing` | BG punctuation spacing |
| `seo_audit_13_clean_sizes_column_spam_and_overflow` | **Security:** spam + overflow in `sizes` |
| `seo_audit_14_repair_css_split_english_descriptions` | Rows cut mid-CSS-attribute |
| `seo_audit_15_archive_nonproduct_rows` | Archive 115 non-product rows |
| `seo_audit_16_delete_nonproduct_rows` | Delete them from the live catalogue |

### Rollback

**Text changes** — every original value is preserved:

```sql
UPDATE products p
SET name_bg = b.name_bg, name_en = b.name_en,
    description_bg = b.description_bg, description_en = b.description_en
FROM products_text_backup_20260820 b
WHERE p.id = b.id;
```

**Deleted rows** — full copies, with a per-row reason:

```sql
-- inspect first
SELECT id, old_id, category_id, archive_reason
FROM products_archived_nonproducts_20260820;

-- restore all 115 if ever needed
INSERT INTO products
SELECT (a.*)::products FROM products_archived_nonproducts_20260820 a
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = a.id);
```

> ⚠️ Rolling back the text changes **would reinstate the injected spam links**.
> If you do roll back, re-run `seo_audit_01` and `seo_audit_13` afterwards.
> Keep both tables until the changes have been reviewed in production.

---

## Final Verification Sweep

Run against the whole catalogue after all changes:

| Check | Result |
|---|---|
| Injected anchors / script vectors | **0** |
| Known spam domains | **0** |
| HTML tags | **0** |
| HTML entities | **0** |
| Control characters | **0** |
| Invisible / bidi characters | **0** |
| Unresolved mixed-script tokens | **0** (3 intentional bilingual retained) |
| Known Bulgarian misspellings | **0** |
| ALL-CAPS English names/descriptions | **0** |
| Comma spacing / trailing commas / double spaces | **0** |
| Bulgarian text in English fields | **0** |
| Prose stranded in the `sizes` column | **0** |
| CSS fragments in any text column | **0** |
| Rows with no name in either language | **0** |
| Prices modified | **0** |

Columns swept: `name_bg`, `name_en`, `description_bg`, `description_en`,
`sizes`, `image_url`, `tags`, `category_ids`.

Post-cleanup health check via the live REST API confirmed the catalogue still
serves correctly, with the purchasable product count unchanged at **1,447**.
