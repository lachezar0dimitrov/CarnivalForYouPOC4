-- Client-requested "new product" badge: an admin-settable flag, independent
-- of category/date logic, surfaced as a ribbon on the home page and a
-- toggle in the admin product form.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;
