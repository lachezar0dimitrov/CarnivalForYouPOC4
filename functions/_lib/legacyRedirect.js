// Shared logic for redirecting the old jump.bg-hosted PHP site's URLs
// (products.php / t_prod.php / holds.php / about.php, all query-string
// based — there was never any path-based routing on the old site) to their
// equivalents on the new site. See project/plan.md Phase 3 for the mapping
// rationale (old category `tid` values don't map 1:1 onto the new
// `categories.id` values — id=10 meant "party decor" on the old site and
// means "Halloween" here, a real collision found during the 2026-08-19 QA
// audit, CLAUDE.md §7).

// Old tid -> new categories.id, for the ones that carried over unchanged.
// Masks/Hats/Wigs/Accessories (5/6/7/8) deliberately are NOT here: those
// categories still exist in the DB but src/lib/products.ts excludes them
// from every listing query (HIDDEN_CATEGORY_IDS), so /products?category=5
// renders zero results — verified live, 0 products returned for each of
// 5/6/7/8 vs 522 for category 2. They fall through to the /products
// fallback below instead of pointing at an empty page.
const OLD_TID_TO_CATEGORY_ID = {
  2: 2, // Дамски / Women's
  3: 3, // Мъжки / Men's
  4: 4, // Момичета / Girls'
  17: 17, // Момчета / Boys'
  19: 19, // Деца 0-3 / Toddlers
};

// Old tid values with no surviving category, but a reasonable specific
// landing page instead of the generic catalog fallback.
const OLD_TID_TO_PATH = {
  14: '/services', // Изработка по поръчка (custom costume orders)
  16: '/about', // Нашата Карнавална Къща (showroom)
};

// Old about.php `cntid` sidebar content pages (Terms/News/Privacy/etc. were
// all sub-pages of about.php on the old site, not their own scripts).
const OLD_CNTID_TO_PATH = {
  16: '/about', // Представяне
  18: '/terms', // Условия за отдаване под наем
  20: '/news', // Новини
  30: '/terms', // Защита на лични данни — no dedicated page, bundled into Terms
  19: '/about', // Партньори — no dedicated page, closest match
};

// Every old tid NOT listed above (9, 10, 12, 13, 15, 18, 21 — pets, party
// decor, themed parties, gifts, men's formal wear, purchase-only items, and
// a blank placeholder row — plus 5/6/7/8, hidden per the note above) has no
// reachable equivalent on the new site — user confirmed 2026-09-07 the
// generic catalog is the right fallback rather than inventing a closer match.
export function categoryRedirectPath(tid) {
  const id = Number(tid);
  if (!Number.isFinite(id)) return '/products';
  if (OLD_TID_TO_PATH[id]) return OLD_TID_TO_PATH[id];
  if (OLD_TID_TO_CATEGORY_ID[id]) return `/products?category=${OLD_TID_TO_CATEGORY_ID[id]}`;
  return '/products';
}

export function contentRedirectPath(cntid) {
  const id = Number(cntid);
  return (Number.isFinite(id) && OLD_CNTID_TO_PATH[id]) || '/about';
}

// products.old_id was preserved verbatim during the Supabase migration
// (see CLAUDE.md §1) specifically so old obid-based links stay resolvable.
export async function lookupNewProductId(env, oldId) {
  const id = Number(oldId);
  if (!Number.isFinite(id)) return null;
  const restUrl =
    `${env.VITE_SUPABASE_URL}/rest/v1/products?old_id=eq.${id}&select=id`;
  const res = await fetch(restUrl, {
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0]?.id ?? null;
}

export function redirectTo(path, origin) {
  return Response.redirect(new URL(path, origin).toString(), 301);
}

// These functions are named `<script>.php.js` so Pages routes them at the
// old site's literal `/<script>.php` paths. If that ever resolved to the
// extensionless path instead, `products.php.js` would sit on the real
// `/products` page and redirect the live catalog into a loop — so refuse to
// act on anything that isn't a .php request and serve the SPA instead.
export async function passThroughIfNotPhp(context) {
  const url = new URL(context.request.url);
  if (url.pathname.endsWith('.php')) return null;
  return context.env.ASSETS.fetch(context.request);
}

// Shared handler for the old site's category-listing scripts (t_prod.php,
// holds.php) — both only ever carry a `tid`, never an `obid`.
export async function handleCategoryListing(context) {
  const guard = await passThroughIfNotPhp(context);
  if (guard) return guard;
  const url = new URL(context.request.url);
  return redirectTo(categoryRedirectPath(url.searchParams.get('tid')), url.origin);
}
