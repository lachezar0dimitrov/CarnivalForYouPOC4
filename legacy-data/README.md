# Legacy Database Export

A CSV export pulled from the old jump.bg-hosted site's MySQL database
(`carnival_carnival`), added to this repo 2026-08-22 as a reference dataset —
not consumed by any application code.

## Files

- **`carnival_carnival_raw_export.csv`** — the original file exactly as
  exported, kept verbatim for provenance. **It is not one table**: four
  separate tables were dumped one after another into this single file, each
  with its own header row buried partway through the data (row 7877, 9866,
  9884). Naively parsing it as one flat CSV silently corrupts everything
  after the first table. Do not add rows to it or fix it up — treat it as
  a frozen source artifact.
- **`carnival_category_object_associations.csv`** (7,876 rows) — raw section
  1. Columns: `tip, ass_bid, ass_tid`. `tip` is `cnt` (category → category
  containment) or `obj` (object/product → category assignment); `ass_bid`/
  `ass_tid` are old numeric ids. This is the raw link table behind the
  `tid` values referenced in [CLAUDE.md](../CLAUDE.md)'s category-collision
  writeup (§7) — useful if that mapping ever needs re-deriving.
- **`carnival_products.csv`** (1,988 rows) — raw section 2, the old products
  table. Columns: `obid` (old product id — matches the `obid` used in the
  legacy-site re-scrape URLs noted in [CLAUDE.md](../CLAUDE.md) §1),
  `tid` (category id), `catn`, `zaglbg`/`zaglen` (title BG/EN), `textbg`/
  `texten` (description BG/EN, some HTML), `size`, `attr`, `price`/
  `pricedn`, `rent`/`rprice`/`rpricedn` (rental flag/price), `mname` (old
  image filename), `active`, `prior` (sort priority).
- **`carnival_seo_page_meta.csv`** (17 rows) — raw section 3, old per-page
  SEO metadata. Columns: `seid`, `page` (a slug like `pr-1478` for a product
  page or `cn-9` for a category page), `zaglbg`/`zaglen` (`<title>` BG/EN),
  `annbg`/`annen` (meta description BG/EN), `textbg`/`texten`, `active`.
  **Directly relevant to the pending Phase 3 SEO task in
  [CLAUDE.md](../CLAUDE.md) §6** ("Ensure perfect replication of existing
  Title tags, Meta Descriptions...") — this is the actual old title/meta
  copy to replicate, for the pages that had it explicitly set.
- **`carnival_categories.csv`** (18 rows) — raw section 4, old category/term
  definitions. Columns: `tid`, `zaglbg`/`zaglen` (name BG/EN), `mname` (old
  image filename), `active`, `prior`. Resolves what each old numeric `tid`
  actually meant.

The four split files are a mechanical slice of the raw export (exact row
ranges, no reinterpretation of values) — done once, in this commit, so the
data is actually usable without re-parsing the raw file's hidden structure
every time.

## Caveats

- Column names and semantics above are inferred from the data and Bulgarian
  naming conventions (`zagl` = заглавие/title, `ann` = анонс/announcement,
  `tid`/`obid` = term/object id), not from an original schema doc — treat
  as a strong best guess, not certified accurate.
- This is a point-in-time snapshot (as of whenever it was exported, before
  2026-08-22) of the pre-migration database. It will not reflect any
  content changes made directly in the new Supabase-backed site since.
