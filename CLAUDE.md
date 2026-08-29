# CLAUDE.md

Persistent operational guidelines for Claude Code sessions on this repository.

## 1. Project Overview & Stack

- **Project**: CarnivalForYou (`CarnivalForYouPOC4`)
- **Tech Stack**: React 18 + TypeScript, Vite 5, Tailwind CSS 3
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- **Hosting**: Cloudflare Pages
- **Database**: Supabase PostgreSQL — text data, user auth, and metadata/URLs
- **Media Storage**: Cloudflare R2 (S3-compatible), bucket `carnival-media`, public via r2.dev subdomain

> **Migrated 2026-08-19.** Media upload now goes through [src/lib/r2.ts](src/lib/r2.ts) → [supabase/functions/r2-media](supabase/functions/r2-media/index.ts) (a Supabase Edge Function, since R2's write credentials must stay server-side — this is a client-only Vite SPA, so they can never be embedded in browser code) → Cloudflare R2. `src/lib/storage.ts` (the old direct-to-Supabase-Storage uploader) was deleted. All product/banner/category media now lives on R2 — catalog is 100% clean (1,760 products, zero broken `image_url` values). 55 products originally had pre-existing corrupted `image_url` values (a bug from the old-site→Supabase import, unrelated to this R2 work, predating it): 52 were recovered by re-scraping the real photo from the still-live legacy PHP site (`carnivalforyou.com/products.php?...&obid=<old_id>`); the other 3 were deleted outright — `id=1604` was a competitor ad (`arlekinobg.com`) imported by mistake, and `id=1285`/`id=1654` had no recoverable image (discontinued costumes, no longer on the old site). Original Supabase Storage files were intentionally left in place as a rollback fallback and have not yet been cleaned up.

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

- **Current workflow**: Admin interface ([src/pages/AdminPage.tsx](src/pages/AdminPage.tsx)) uploads media → [src/lib/r2.ts](src/lib/r2.ts) (client, no secrets) → `r2-media` edge function (server, holds R2 credentials + verifies caller is admin) → Cloudflare R2 → public R2 URL saved to Supabase DB table.
- **Environment variables**:
  - Local `.env` (client-side, gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Supabase Edge Function secrets (server-side only, set via `supabase secrets set` or dashboard — not in `.env`, not in the client bundle): `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
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

## 6. CRITICAL PENDING TASK: Phase 3 - SEO Preservation & Final Launch

> **Status: NOT STARTED.** This is the final pending phase of the migration from the old jump.bg-hosted site to the new Cloudflare/React architecture. Do **not** consider the migration complete, and do **not** switch production DNS to Cloudflare, until every item below is done. The separate media-storage DB migration (Supabase Storage → R2) referenced here finished and was pushed to `main` on 2026-08-19 — this SEO phase is independent and can proceed whenever picked up.

> **Routing note (2026-08-29):** The app moved from hash routing (`#/product-detail/123`) to real path routing (`/product-detail/123`, History API) in [src/lib/router.tsx](src/lib/router.tsx), specifically so real URLs — needed for OpenGraph share previews below — would also be ready for this phase's redirect mapping, sitemap.xml and canonical `<link>` work. Do this phase's URL/redirect work against real paths, not hash fragments. `public/_redirects` (`/*  /index.html  200`) provides the Cloudflare Pages SPA fallback for direct loads/refreshes of any path.

### Phase 3: SEO Preservation (Pending)

1. **URL Mapping & 301 Redirects:**
   - Crawl or extract all existing URLs from the old jump.bg website.
   - Implement a robust 301 redirect mapping in our new routing system (or via Cloudflare Bulk Redirects/Pages `_redirects` file) to point old URLs to the new structure.
2. **Metadata Consistency:**
   - Ensure perfect replication of existing `Title` tags, `Meta Descriptions`, `H1` tags, and `Schema.org` markup for all core pages and categories.
   - Configure dynamic `<link rel="canonical">` tags for the new pages.
3. **Post-Deployment SEO Operations (Google Search Console):**
   - Implement automated generation of `sitemap.xml` and configure `robots.txt`.
   - Once DNS is switched to Cloudflare, submit the new sitemap to Google Search Console.
   - Schedule daily checks for 404 crawl errors in GSC during the first 2 weeks post-launch.

## 7. QA/Design Audit & Fixes (2026-08-19)

A full QA pass (category data integrity, mobile/tablet/desktop responsiveness, category-preview video performance) found and fixed three issues, all resolved and validated live:

1. **Category ID collision** — the old site's `tid=10` meant "Украса за парти" (Party Decor); the new `categories` table redefined `id=10` to mean "Хелоуин" (Halloween). 36 products (decor props: skulls, spiderwebs, a smoke machine — verified via the old site's blank "Размери"/"Подходящ за" fields, i.e. not wearable items) had inherited the old numeric ID and were polluting the Halloween costume filter. Fixed by clearing their `category_id`/`category_ids` (SQL run directly by the user — the harness blocks bulk DB writes via this session's tools). Real Halloween/Christmas costumes are correctly cross-tagged via the `category_ids` array on top of a proper primary category (e.g. a women's costume also tagged Halloween) and were untouched. Validated: all 7 active categories (women/men/girls/boys/toddlers/Halloween/Christmas) sampled and confirmed correct; live-checked the Halloween filter on production.
   - **Known, intentional, left as-is** (stakeholder decisions, not bugs): Masks/Hats/Wigs/Accessories categories stay `is_active=false` (hidden) — 34 of their 464 products also have `price <= 0`/null, low priority since the site's own query already excludes non-positive-price items from all listings regardless of category visibility. 6 old-site categories (pets, themed parties, "our carnival house", purchase-items, party decor, men's formal wear) have no new-system equivalent and are being kept dropped intentionally — their ~135 products sit with orphaned `category_id` values (9/12/16/18) unreachable via category navigation. Men's formal wear specifically was checked and turned out to already be fully absent from the DB (its one remaining old-site listing, `old_id=1416`, was never imported) — nothing to hide.
2. **Pagination cap bug** (pre-existing, unrelated to the R2 migration — just surfaced during this audit): [src/lib/products.ts](src/lib/products.ts) `getFilteredAndSortedIds` had no `.range()`, so it silently hit PostgREST's default 1000-row cap once the catalog grew past that — the "1000 резултата" on the unfiltered products page was that cap, not a real count, hiding ~43% of the catalog. Fixed by paging through in batches of 1000.
3. **Category-preview videos loaded unconditionally** — [src/components/CategoryGrid.tsx](src/components/CategoryGrid.tsx)'s hover-preview videos were `autoPlay loop` on every page load regardless of whether they'd ever be seen (only revealed via CSS `opacity` on `:hover`), so touch devices — which have no real hover — downloaded and decoded all of them for nothing. Fixed two ways: (a) gated behind `matchMedia('(hover: hover) and (pointer: fine)')` so non-hover devices get the static image only, and even hover-capable devices only load/play on actual pointer interaction (`preload="none"`, imperative `.play()`/`.pause()` on mouse enter/leave, plus `onTouchStart` so a genuine tap gesture also triggers `.play()` on touch devices) instead of eagerly on mount; (b) re-encoded source videos (480px width, H.264 CRF 28, faststart) since they were oversized for small card previews. Originally Halloween/Christmas had no preview video since real filmed footage wasn't available without a paid AI video-gen service — **Halloween got one on 2026-08-19** via an AI image-to-video generation (vidmuse.ai) from the existing category still, re-encoded to match the other 5 (480×854, H.264/yuv420p, 24fps, faststart, ~470KB). Christmas still has no video.

## 8. OpenGraph / Link Previews (2026-08-29)

- **Default share image**: `public/og-default.jpg` (1200x630, matches the site's real branding/colors/fonts) — referenced statically in `index.html` and as the fallback in `src/lib/useSEO.ts`. It did not exist before this date; every shared link previously showed a broken image.
- **Per-product share images**: social/messenger crawlers (Facebook, WhatsApp, Viber, Messenger, X, ...) fetch raw HTML and never execute JavaScript, so `useSEO.ts`'s client-side `<meta>` updates are invisible to them — only visible to real browsers and JS-executing crawlers (e.g. Google). [functions/product-detail/\[id\].js](functions/product-detail/[id].js) is a Cloudflare Pages Function that intercepts `/product-detail/:id` server-side, queries Supabase directly for that product, and rewrites the OG/twitter meta tags (and `<title>`) in the served HTML via `HTMLRewriter` before it reaches the crawler — giving shared product links their actual photo/title/price.
  - Reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` straight from Cloudflare Pages' "Variables and secrets" — already configured there for the build step, and Pages exposes that same dashboard config to Functions at request time via `context.env`, so no separate/new env vars were needed.
  - The function's title/description composition logic is a deliberate hand-kept-in-sync duplicate of `productSeoTitle`/`productSeoDescription`/`SEO_CATEGORY_PHRASE` in `src/lib/products.ts` — that file can't be imported directly since it pulls in Vite/React-only modules that don't run in the Functions/workerd runtime.
  - Scoped to product pages only (highest share intent — sending a specific costume to a friend). Category/listing pages still use the generic default image; not done as part of this pass.
  - Not yet tested against a real Cloudflare Pages deployment (no `wrangler` in this project) — verify with the Facebook Sharing Debugger / Twitter Card Validator against a real product URL once deployed, and confirm the two env vars are set.

## 9. Notes for Future Sessions

- R2 media migration is live as of 2026-08-19 and the products catalog is fully clean (0 rows with broken `image_url`, verified via `SELECT count(*) FROM products WHERE image_url ilike '%/storage/v1/object/public/%'`). 3 unrecoverable rows (`1604`, `1285`, `1654`) were deleted outright rather than left broken.
- Original Supabase Storage files were kept as a rollback fallback and not yet deleted — don't assume they're gone, but also don't rely on them; new code should only ever write to R2.
- Supabase migrations live in `supabase/migrations/`; check there before altering table shape assumptions.
- This is a Bolt.new-originated project (see `.bolt/config.json`, `.bolt/prompt`) — some code may reflect Bolt scaffolding conventions rather than hand-authored patterns.
