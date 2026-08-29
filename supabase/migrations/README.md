# Migrations

## Why some migrations are here and others aren't

Many migrations on this project were applied straight to the remote database
(via the Supabase MCP tools / SQL editor) without a file ever being committed.
On 2026-08-29 the remote had **57 applied migrations** against **10 files** in
this folder — meaning the schema could not be rebuilt from git.

That gap has been closed for **schema**: every migration that defines structure
(`CREATE`/`ALTER`/`DROP` of a table, function, trigger, policy, index, type,
extension, plus `ENABLE ROW LEVEL SECURITY` / `GRANT` / `REVOKE`) now has a file
here. Rebuilding from this folder reproduces the database structure.

**Deliberately not backfilled:** ~37 one-off *data-repair* migrations (~177 kB) —
the 2026-08-20 SEO audit text fixes, the `recover_missing_products` batches, the
`backfill_old_catalog_number` batches, price backfills, and similar. They mutate
rows rather than define structure, they are not idempotent, and replaying them
against a fresh database would be meaningless. Committing them would bloat the
repo without improving reproducibility.

Their *content* is protected instead by the nightly data backup (see the
`CarnivalForYouPOC4-archive` repo), which is the correct tool for row data.

## Source of truth for the full applied list

The remote database keeps every applied migration, including its SQL:

```sql
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;

-- full SQL of one migration
SELECT array_to_string(statements, E'\n')
FROM supabase_migrations.schema_migrations
WHERE version = '20260820205819';
```

## Keeping this folder honest

When applying a migration through the MCP tools or the SQL editor, commit a
matching file here in the same session, named `<version>_<name>.sql` using the
**exact version the remote recorded** — `apply_migration` assigns its own
timestamp, which will not match the wall-clock time you wrote the file. Check
with the query above and rename to match if they differ.

To find drift again later, diff the remote list against `ls supabase/migrations`.
