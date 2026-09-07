/*
Fixes the nightly archive backup, which has been failing every run since
2026-09-04 with "permission denied for table services" during pg_dump
(see the archive repo's Actions history). The read-only `backup_reader`
role (used by scripts/backup_auth_and_schema.sh for the schema-only
pg_dump — see BackupsAndDR.md) was only ever granted SELECT on the 8
tables that existed when it was created. The 4 content tables added by
20260903160000_content_pages_services_news_about_terms.sql (services,
news_posts, about_content, terms_content) were never granted to it, so
pg_dump's LOCK TABLE ... IN ACCESS SHARE MODE (which locks every table
up front, not just the ones it can read) failed on the first ungranted
table it hit.

Grants SELECT on the 4 missing tables now, and sets a default privilege
so any future table created by `postgres` (the role Supabase migrations
run as) is automatically readable by backup_reader — preventing this
from recurring on the next new table.
*/

GRANT SELECT ON public.services, public.news_posts, public.about_content, public.terms_content
  TO backup_reader;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO backup_reader;
