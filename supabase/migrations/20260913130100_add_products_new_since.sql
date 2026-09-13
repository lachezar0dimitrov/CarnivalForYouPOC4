-- Auto-expiring "new product" badge for batch invoice imports (Rubies UK
-- import tool). NULL means "no expiry" — every product flagged is_new before
-- this column existed (and any admin manually ticking the checkbox in
-- ProductForm) keeps behaving exactly as today, since is_new alone still
-- drives the badge. Only rows the import loader inserts get new_since set,
-- so only those actually expire — computed at query time in
-- fetchNewProducts(), no cron/scheduled job involved.
ALTER TABLE products ADD COLUMN IF NOT EXISTS new_since timestamptz;
