-- Rollback snapshot taken before the 2026-08-20 product text/SEO audit.
-- Bulk text edits are applied to the live catalogue (DB changes are not
-- scoped by the git branch), so this table is the restore path.
CREATE TABLE IF NOT EXISTS products_text_backup_20260820 AS
SELECT id, old_id, name_bg, name_en, description_bg, description_en,
       price, old_price, is_active, now() AS backed_up_at
FROM products;
