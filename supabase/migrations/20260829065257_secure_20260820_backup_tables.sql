-- Lock down the 2026-08-20 SEO-audit rollback snapshots.
--
-- `products_text_backup_20260820` and `products_archived_nonproducts_20260820`
-- were created in `public`, which PostgREST exposes, with RLS left off and the
-- default anon/authenticated grants intact. Supabase's Security Advisor
-- flagged both as "RLS Disabled in Public" (ERROR).
--
-- Verified impact before the fix: both tables answered HTTP 200 to an
-- unauthenticated REST read using the anon key, and anon/authenticated held
-- SELECT/INSERT/UPDATE/DELETE/TRUNCATE. Since the anon key ships in the
-- browser bundle (and the repo is public), anyone could have read or wiped the
-- rollback safety net for the SEO audit.
--
-- The data itself is still needed — PRODUCT_AUDIT_SUMMARY.md documents these
-- as the rollback path and says to keep them until the audit is reviewed in
-- production — so this migration secures them in place rather than dropping
-- them. Enabling RLS with no policies denies anon/authenticated outright; the
-- REVOKEs are defence in depth. `postgres` and `service_role` bypass RLS, so
-- the documented rollback SQL still runs from the SQL editor.
--
-- The resulting "RLS Enabled No Policy" INFO lint is the intended end state
-- for a private backup table, not an outstanding issue.

ALTER TABLE public.products_archived_nonproducts_20260820 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_text_backup_20260820 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.products_archived_nonproducts_20260820 FROM anon, authenticated;
REVOKE ALL ON public.products_text_backup_20260820 FROM anon, authenticated;
