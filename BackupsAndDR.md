# Backups & Disaster Recovery

How CarnivalForYouPOC4 protects itself against a wiped git history, a bad
migration, or Supabase losing data — and how to actually recover if one of
those happens.

Nothing here is edited by hand day-to-day. It documents a system that
already runs on its own; treat this file as the map, not the source of
truth (the source of truth is the archive repo below).

## Why this exists

This repo's history was previously wiped by Bolt.new force-pushing to
`main`, and at the time Supabase had zero backups of any kind — free tier
(NANO compute) doesn't include them. Two independent problems, two
independent fixes, both described below.

## Where the backups live

**A separate, private repo**: [`lachezar0dimitrov/CarnivalForYouPOC4-archive`](https://github.com/lachezar0dimitrov/CarnivalForYouPOC4-archive)
(default branch `archive-main`).

It has to be a *separate repo*, not a branch in this one — a deletion of
this repo, a `push --mirror`, or a history rewrite here would take sibling
branches down with it. A backup can't share a failure domain with the thing
it protects. It also has to be *private* specifically so it can safely hold
the Supabase `service_role` key in its Actions secrets; this repo is
currently public (see [go-live note](#this-repos-own-public-private-status) below), which
couldn't hold that key.

Driven by `.github/workflows/archive.yml` in that repo: nightly at
**03:17 UTC** (`cron: '17 3 * * *'`, though GitHub's scheduler has been
firing it 5–7h late some nights — that's normal Actions queueing drift, not
a bug) plus manual `workflow_dispatch` from the Actions tab any time.

It backs up two independent things:

| What | Where | Protects against |
|---|---|---|
| Git history mirror | `mirror/*` branches | force-push, history rewrite, this repo being deleted |
| Supabase data | `data/*.json` + `data/public_schema_only.sql` on `archive-main` | bad migration, accidental delete/drop, dropped table |

### 1. Git history mirror

The workflow clones this repo with `git clone --mirror` and pushes every
ref into the archive repo under `mirror/*`:

```
git push archive 'refs/heads/*:refs/heads/mirror/*'
git push archive 'refs/tags/*:refs/tags/*'
```

**Deliberately append-only** — no `--force`, no `--prune`, no `--mirror` on
that push. Refs in the archive can only be created or fast-forwarded. So if
this repo's history ever gets rewritten again, that night's push is
**rejected as non-fast-forward and the job fails loudly**, instead of
faithfully replicating the damage into the backup too. A red build on the
archive repo's Actions tab means "someone rewrote history upstream" — and
the good history is still intact in `mirror/*`.

Branches deleted here are also retained there, not pruned.

### 2. Supabase data export

Two scripts, both run in the `backup-supabase-data` job:

- **`scripts/backup_supabase.py`** — reads every `public` table through
  PostgREST using the `service_role` key (bypasses RLS, so it also catches
  intentionally-locked-down tables like the 2026-08-20 audit snapshots).
  Pages explicitly past PostgREST's 1000-row cap, then verifies each
  table's row count against a server-side exact count — a short/truncated
  read fails the job instead of silently committing bad data. Also fetches
  `data/auth_users.json` via the GoTrue Admin API
  (`/auth/v1/admin/users`) — the only supported way to read login accounts
  on hosted Supabase; direct SQL access to the `auth` schema is not
  grantable there by design (Supabase Dashboard blocks it outright, even
  for `postgres`).
- **`scripts/backup_auth_and_schema.sh`** — runs `pg_dump` as a narrow
  `backup_reader` Postgres role (SELECT-only on `public`, created
  specifically for this workflow instead of using the DB superuser
  credential) to capture `data/public_schema_only.sql`: functions,
  triggers, RLS policies, indexes — structure the JSON row export doesn't
  include. This is a convenience reference snapshot, **not** the source of
  truth for schema; that's still [`supabase/migrations/`](supabase/migrations/)
  in this repo.

Output lands in `data/*.json` (one file per table, plus `auth_users.json`)
and `data/public_schema_only.sql`, committed to `archive-main` only if
something actually changed. `data/_manifest.json` records the row count
per table from the last successful run — check it to see what a healthy
backup should contain.

## Checking backup health

```bash
# recent run history — should show scheduled runs succeeding nightly
gh run list --repo lachezar0dimitrov/CarnivalForYouPOC4-archive --workflow archive.yml --limit 10

# does the mirror have this repo's latest commit?
gh api repos/lachezar0dimitrov/CarnivalForYouPOC4/commits/main --jq '.sha'
gh api repos/lachezar0dimitrov/CarnivalForYouPOC4-archive/commits/mirror/main --jq '.sha'
# (they won't always match exactly — the mirror only updates once a night,
# so it should match whatever main's HEAD was as of the last archive run)

# latest backed-up row counts
gh api repos/lachezar0dimitrov/CarnivalForYouPOC4-archive/contents/data/_manifest.json --jq '.content' | base64 -d
```

## Recovering

### Git history was force-pushed / rewritten / this repo was deleted

```bash
git clone https://github.com/lachezar0dimitrov/CarnivalForYouPOC4-archive.git recovered
cd recovered
git checkout -b main origin/mirror/main     # full pre-damage history
git remote add source https://github.com/lachezar0dimitrov/CarnivalForYouPOC4.git
# inspect thoroughly before pushing anywhere — diff against the current
# (possibly damaged) source main, confirm this is actually what you want
# restored, THEN push to source main. This overwrites history — treat it
# with the same care as any other force-push, and loop in the user first.
```

### Supabase data was lost / a migration went bad / a table got dropped

1. Pull the latest export from the archive repo's `data/` directory
   (`archive-main` branch) — each `<table>.json` is a plain array of row
   objects; check `_manifest.json` for expected row counts first.
2. Restore in FK-safe order: `categories` → `products` → everything else
   (banners, site_settings, profiles, contact_inquiries, the
   `_20260820` audit snapshots) — via PostgREST `INSERT`s or the Supabase
   SQL editor.
3. **Do not** try to restore `auth_users.json` with a raw `INSERT` into
   `auth.users` — recreate accounts via the GoTrue Admin API, or (for the
   admin account specifically) the `seed-admin` edge function already in
   this repo.
4. `data/public_schema_only.sql` is structure-only and useful as a
   reference when reconciling drift, but the actual schema restore path is
   replaying [`supabase/migrations/`](supabase/migrations/) from this repo,
   not that dump.

## Secrets involved (names only — values live only in the archive repo's Actions secrets)

| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | REST endpoint for `backup_supabase.py` |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS to read every `public` table, and reads `auth.users` via the GoTrue Admin API |
| `SUPABASE_DB_URL` | `backup_reader` role's Postgres connection string, for `pg_dump`. Must be the **Session pooler** URI (Direct connection is IPv6-only on the free tier; GitHub-hosted runners have no IPv6 egress) |
| `GITHUB_TOKEN` | Auto-provided by Actions; used to push into the archive repo itself |

The archive workflow never triggers on `pull_request`, so a fork of this
repo can never reach these secrets.

## This repo's own public/private status

This repo is currently **public** on purpose, even though that's unusual
for production code — GitHub's free-tier repository rulesets (the
`protect main` ruleset, id `21004805`, blocking deletion and force-push)
only apply to public repos on a personal account. Going private would
silently disable that protection. The plan is to flip it back to private
at go-live, at which point the ruleset protection is lost regardless, but
the archive repo's append-only mirror still catches a force-push or
history rewrite either way — see the private-repo-security notes for the
go-live checklist (rotate any credentials that were exposed while public).

## Supabase's own backups

The Supabase project is on the free tier (NANO compute), which includes
**no automated backups at all** — the archive repo's nightly export is
currently the *only* backup Supabase data has. Supabase Pro (~$25/mo) adds
daily backups with 7-day retention; worth deciding on before go-live as a
second layer, not a replacement for the archive (Pro's backups still live
inside Supabase's own infrastructure — same blast radius as the primary
data).
