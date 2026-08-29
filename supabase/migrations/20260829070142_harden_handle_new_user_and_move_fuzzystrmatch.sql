-- Clears the two remaining Security Advisor warnings that are fixable in SQL.
--
-- 1. public.handle_new_user()
-- The AFTER INSERT trigger on auth.users that seeds public.profiles. It is
-- SECURITY DEFINER and carried a blanket EXECUTE grant to PUBLIC, so
-- anon/authenticated could reach it at /rest/v1/rpc/handle_new_user.
--
-- Ordering matters: grant the real signup path explicitly FIRST, so there is
-- never a window with no grantee, then drop the blanket PUBLIC grant. GoTrue
-- inserts into auth.users as supabase_auth_admin, postgres owns the function,
-- and service_role is the trusted server-side key (never shipped to a browser).
--
-- Verified safe before applying: a disposable probe (scratch table + SECURITY
-- DEFINER trigger function with EXECUTE revoked from PUBLIC/anon/authenticated,
-- inserted as `authenticated`, whole thing rolled back) confirmed the trigger
-- still fires for a role holding no EXECUTE — PostgreSQL checks EXECUTE at
-- CREATE TRIGGER time, not at fire time. Signup is therefore unaffected.
-- Verified after: RPC returns 404/permission denied for anon; auth.users and
-- public.profiles row counts unchanged.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. fuzzystrmatch
-- Enabled in `public` for one-off typo detection during the 2026-08-20 SEO
-- audit. Verified nothing persistent references its symbols (no view, index,
-- constraint, or function body mentions levenshtein/soundex/metaphone), so the
-- move breaks nothing. `extensions` already exists and is on the postgres
-- role's search_path, so unqualified levenshtein()/soundex() calls from the
-- SQL editor keep resolving for any future audit work.
ALTER EXTENSION fuzzystrmatch SET SCHEMA extensions;
