-- Transient staging table for the 2026-08-22 full crawl of the legacy
-- carnivalforyou.com product pages (obid=2..2014), used to backfill
-- products.old_catalog_number (the real "каталожен номер" printed on the
-- old paper tags, distinct from old_id which is just the obid URL param).
-- RLS enabled immediately with no policies since this is admin-only staging
-- data with no reason to be reachable via the anon/authenticated API roles.
CREATE TABLE IF NOT EXISTS legacy_catalog_crawl_20260822 (
  obid int PRIMARY KEY,
  ctn text,
  name text
);
ALTER TABLE legacy_catalog_crawl_20260822 ENABLE ROW LEVEL SECURITY;
