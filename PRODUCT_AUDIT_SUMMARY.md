# Product Audit & SEO Optimisation — Summary Report

**Date:** 2026-08-20
**Branch:** `dev/product-seo-audit`
**Scope:** Every product row in `public.products`, both Bulgarian and English
**Method:** Full-catalogue SQL inspection + pattern sweeps, with in-browser (Playwright) verification of rendered output

---

## ⚠️ Read this first — two things need your attention

1. **The site was carrying injected SEO spam.** 16 products contained hidden
   `<a style="display:none">` links pointing at replica-handbag and
   "elevator shoes" affiliate domains. **6 of them were live on the site.**
   All are now removed. See [Security Findings](#1-security-findings-most-important).

2. **Database edits are live, not branch-scoped.** Git branches don't isolate
   Supabase. Every text change described here is **already applied to the
   production catalogue**. A full rollback snapshot was taken first — see
   [Rollback](#rollback).

---

## Total Products Checked

| Metric | Count |
|---|---|
| Products in catalogue (all rows inspected) | **1,760** |
| Active products | 1,612 |
| Active *and* purchasable (`price > 0`, i.e. customer-visible) | 1,447 |
| Rows modified by this audit | **1,404** |
| Rows where price was modified | **0** (text-only audit) |

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

### 1.2 Collateral damage — corrupted BG/EN field split

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

## 4. Flagged Issues — require human review

Nothing below was guessed at or auto-resolved.

### 4.1 Zero-price costumes in customer-visible categories — **10 products**

These are real costumes in Women's/Men's/Girls'/Boys' categories with
`price = 0`, so the site's own `price > 0` filter makes them **invisible to
customers**. They need a pricing decision:

| ID | Name (BG) | Category |
|---|---|---|
| 306 | Мис Снежанка | Дамски |
| 722 | Снежната принцеса | Дамски |
| 723 | Лошата помощничка | Дамски |
| 294 | Късметлийски Дядо Коледа | Мъжки |
| 1045 | Костюма на дядо Коледа от плюш | Мъжки |
| 281 | Мини мис Коледа с плитки | Момичета |
| 1284 | Готиното скелетче | Момичета |
| 1299 | Принцесата на океана | Момичета |
| 282 | Коледно джудже "Сръчко" | Момчета |
| **933** | **"Още детски костюми"** | Момичета |

> **id 933 is not a product** — "More children's costumes" is a leftover
> navigation link from the old site. Recommend deleting.

### 4.2 Missing content

| Gap | Count | Customer impact |
|---|---|---|
| Active products with no name in **either** language | 111 | **None today** — all have `price = 0`, so already hidden. Dead rows; recommend deleting or completing. |
| Active products with no BG description | 549 | Meta description is now auto-generated, but hand-written copy would rank better |
| Active products with no EN description | 579 | As above |

### 4.3 Uncategorised

- **23 active, priced products have no category** — reachable only via
  unfiltered browsing/search, not category navigation.
- **id 1577** (fixed text, still uncategorised): all four text fields held
  scattered *components* of one costume (`Mask` / `Jacket` / `Sash` / `Hat.`)
  rather than a name and description. Identified from the product photo as a
  **skeleton pirate**; name and descriptions written accordingly.
  **Suggested category: Мъжки (3) + Хелоуин (10)** — not applied, as
  categorisation is a merchandising decision.

### 4.4 Minor, left for a human

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

### Rollback

Text state before the audit is preserved in full:

```sql
UPDATE products p
SET name_bg = b.name_bg, name_en = b.name_en,
    description_bg = b.description_bg, description_en = b.description_en
FROM products_text_backup_20260820 b
WHERE p.id = b.id;
```

> Keep this table until the changes have been reviewed in production. Note that
> rolling back **would reinstate the injected spam links** — if you roll back,
> re-run `seo_audit_01` afterwards.

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
| Prices modified | **0** |
