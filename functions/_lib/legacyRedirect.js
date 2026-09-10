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
  // 18 (Условия за отдаване под наем) intentionally does NOT go to /terms.
  // The old site reused one generic, homepage-sounding <title> across many
  // pages, this one included — Google still shows that stale title for
  // this exact URL on searches like "карнавални костюми" (found 2026-09-08).
  // A visitor clicking it expects the shop, not a terms page, and whatever
  // ranking weight this old URL carries is far more useful transferred to
  // the homepage than spent on a page that doesn't sell anything.
  18: '/',
  20: '/news', // Новини
  30: '/', // Защита на лични данни — same reasoning as 18, see above
  19: '/about', // Партньори — no dedicated page, closest match
};

// Prefixes an internal path with /en when the old URL carried &lang=en —
// every target below (products, category listings, about/services/news)
// has a real /en/... equivalent since the language routing project. Old
// English product links redirect to the English URL even for the small set
// of products still missing a written English description (see
// ProductDetailPage.tsx's suppressAlternates) — the page still renders
// correctly (falls back to Bulgarian text, same as everywhere else), and
// this avoids a second Supabase round-trip in the redirect hot path just to
// check content completeness.
export function withLang(path, lang) {
  if (lang !== 'en') return path;
  return path === '/' ? '/en' : `/en${path}`;
}

// Every old tid NOT listed above (9, 10, 12, 13, 15, 18, 21 — pets, party
// decor, themed parties, gifts, men's formal wear, purchase-only items, and
// a blank placeholder row — plus 5/6/7/8, hidden per the note above) has no
// reachable equivalent on the new site — user confirmed 2026-09-07 the
// generic catalog is the right fallback rather than inventing a closer match.
export function categoryRedirectPath(tid, lang) {
  const id = Number(tid);
  if (!Number.isFinite(id)) return withLang('/products', lang);
  if (OLD_TID_TO_PATH[id]) return withLang(OLD_TID_TO_PATH[id], lang);
  if (OLD_TID_TO_CATEGORY_ID[id]) return withLang(`/products?category=${OLD_TID_TO_CATEGORY_ID[id]}`, lang);
  return withLang('/products', lang);
}

export function contentRedirectPath(cntid, lang) {
  const id = Number(cntid);
  const path = (Number.isFinite(id) && OLD_CNTID_TO_PATH[id]) || '/about';
  return withLang(path, lang);
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
  const path = categoryRedirectPath(url.searchParams.get('tid'), url.searchParams.get('lang'));
  return redirectTo(path, url.origin);
}

// Old site scripts that map 1:1 onto a single new page regardless of any
// other query params, but still need `lang=en` honored (services.php,
// contacts.php). These were previously only covered by static rules in
// public/_redirects, which match on path only and silently dropped
// `?lang=en` — every old English link landed on the Bulgarian page. Found
// during the Phase 3 redirect audit (2026-09-10): services.php's 4 old
// sub-services (грим/прическа/хна татуировки/поръчка) were never separate
// URLs on the old site (confirmed via Wayback Machine + zero GSC
// impressions for any of them in 16 months), so a single target page is
// correct — this only needed to stop swallowing the language.
export function handleStaticContentPage(path) {
  return async function onRequest(context) {
    const guard = await passThroughIfNotPhp(context);
    if (guard) return guard;
    const url = new URL(context.request.url);
    return redirectTo(withLang(path, url.searchParams.get('lang')), url.origin);
  };
}
