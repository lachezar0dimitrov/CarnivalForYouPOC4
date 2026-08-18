# CLAUDE.md

Persistent operational guidelines for Claude Code sessions on this repository.

## 1. Project Overview & Stack

- **Project**: CarnivalForYou (`CarnivalForYouPOC4`)
- **Tech Stack**: React 18 + TypeScript, Vite 5, Tailwind CSS 3
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- **Hosting**: Cloudflare Pages
- **Database**: Supabase PostgreSQL — text data, user auth, and metadata/URLs
- **Media Storage — target architecture**: Cloudflare R2 (S3-compatible) for images/video, to keep media off Supabase's cached-egress quota

> **Current implementation status (verified from code, 2026-08-18):** media upload is **not yet migrated to R2**. [src/lib/storage.ts](src/lib/storage.ts) uploads directly to **Supabase Storage** buckets (`product-images`, `banner-images`, `category-images`) via `supabase.storage.from(bucket).upload(...)`. There is no R2/S3 client, no R2 env vars, and no Cloudflare Worker/function in this repo. Treat the R2 architecture below as the **target/planned** design, not current behavior — don't assume R2 URLs exist in the DB until this migration actually happens.

## 2. Infrastructure & Hosting Setup (Cloudflare Pages)

- **Production Branch**: `main`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Preview Deployments**: Disabled (set to `None` in Cloudflare Pages settings — avoids automated builds from experimental branches)
- **Build Cache**: Disabled (prevents stale `node_modules` cache issues during Vite builds)

## 3. Git Workflow & Branch Rules

- **Protected Branch**: `main` (force pushes blocked via GitHub Rulesets)
- **Actual remote branches** (verified 2026-08-18): `main`, `backup-stable`, `new`, `video`. There is currently **no `bolt_branch`** in this repo — if/when a Bolt.new sandbox branch is created, apply the same rule below to it.
- **Branching model**:
  - `main`: live production code
  - `backup-stable`: archival snapshot branch
  - (planned) `bolt_branch`: sandbox branch for Bolt.new UI generation — merge to `main` only via verified Pull Requests or local inspection, never a direct/blind merge
- **Git execution rule**: always commit and push from the local terminal (PowerShell). Never rely on browser-based Git force-syncs — they risk wiping repository history.
- Repo root for git purposes is `project/` (this file's directory), not its parent.

## 4. Media & Admin Architecture

- **Current workflow**: Admin interface ([src/pages/AdminPage.tsx](src/pages/AdminPage.tsx)) uploads media → [src/lib/storage.ts](src/lib/storage.ts) → Supabase Storage bucket → public URL saved to Supabase DB table.
- **Target workflow (post-R2-migration)**: Admin interface uploads media → file sent directly to Cloudflare R2 bucket → R2 returns public domain URL → URL saved to Supabase DB table.
- **Environment variables**:
  - Present in `.env` today: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Required once R2 migration lands: `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`
  - `.env` is gitignored — never commit real keys; check Cloudflare Pages dashboard env vars when debugging prod-only issues.

## 5. Common Local Commands

- **Local development**: `npm run dev`
- **Production build check**: `npm run build`
- **Type check**: `npm run typecheck`
- **Lint**: `npm run lint`
- **Standard git push**:
  ```powershell
  git status
  git add .
  git commit -m "feat/fix: descriptive message"
  git push origin main
  ```

## 6. Notes for Future Sessions

- Before assuming R2 is live, grep for `R2`/`S3Client`/`cloudflare` in `src/` and check `.env` for R2 keys — as of this writing, none exist.
- Supabase migrations live in `supabase/migrations/`; check there before altering table shape assumptions.
- This is a Bolt.new-originated project (see `.bolt/config.json`, `.bolt/prompt`) — some code may reflect Bolt scaffolding conventions rather than hand-authored patterns.
