-- Backfill ended up done via direct UPDATE...VALUES batches instead of
-- staging through this table, so it was never populated. Dropping it.
DROP TABLE IF EXISTS legacy_catalog_crawl_20260822;
