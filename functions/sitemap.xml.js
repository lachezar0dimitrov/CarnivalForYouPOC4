// Generated dynamically (not a build-time static file) so it always
// reflects the live catalog — a static sitemap baked in at build time would
// silently drift out of date every time a product is added/removed without
// a redeploy. Reads directly from Supabase via REST, same pattern as the
// other functions/ files in this project.

const STATIC_PATHS = ['/', '/about', '/products', '/services', '/news', '/contacts', '/terms'];

// Caps how many of the admin's is_popular picks get attached as the
// homepage's <image:image> set — mirrors fetchPopularProducts' own default
// limit in src/lib/products.ts, just as a sanity ceiling in case an admin
// flags an unusually large number of products as popular.
const POPULAR_PRODUCTS_LIMIT = 40;

// Only categories that are actually active/navigable — mirrors what
// ProductsPage's own canonical tag treats as a real indexable page (see
// src/pages/ProductsPage.tsx). Hidden categories (masks/hats/wigs/
// accessories) are intentionally left out of both. image_url is included so
// each category's sitemap entry can point at its own representative photo.
async function fetchActiveCategories(env) {
  const res = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=id,name_bg,image_url`,
    {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

// Mirrors baseQuery() in src/lib/products.ts exactly — a sitemap must only
// advertise pages the site itself actually surfaces. `is_active` alone is
// not that set: the listings additionally drop non-positive prices, missing
// images, and the four hidden categories (masks/hats/wigs/accessories), a
// 1665-vs-1230 difference when this was checked.
const HIDDEN_CATEGORY_IDS = '5,6,7,8';
const VISIBLE_FILTER =
  'is_active=eq.true&price=gt.0&image_url=not.is.null&image_url=neq.' +
  `&or=(category_id.is.null,category_id.not.in.(${HIDDEN_CATEGORY_IDS}))`;

async function fetchActiveProducts(env) {
  const pageSize = 1000; // PostgREST's default cap — see CLAUDE.md §7 pagination note
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/products?${VISIBLE_FILTER}&select=id,created_at,description_en,name_bg,image_url,is_popular,priority` +
        `&order=id.asc&offset=${offset}&limit=${pageSize}`,
      {
        headers: {
          apikey: env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) break;
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// Same "is this real English text" threshold as the client-side check in
// src/lib/products.ts's hasMeaningfulEnglishDescription — a product without
// it doesn't get an /en/ sitemap entry, since that page currently just shows
// Bulgarian text under an English URL. Self-corrects once the description is
// filled in (see project plan.md Phase 4 for the small remaining list).
function hasMeaningfulEnglishDescription(p) {
  const en = String(p.description_en ?? '').trim();
  return en.length > 3 && /[a-zA-Z]/.test(en);
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;');
}

// Same three-way hreflang set (self + other language + x-default) on every
// entry in a language pair, per Google's sitemap-annotation guidance —
// x-default points at the Bulgarian version, the site's primary market.
function buildAlternates(bgHref, enHref) {
  return [
    ['bg', bgHref],
    ['en', enHref],
    ['x-default', bgHref],
  ];
}

// `images` is a list of {loc, title} pairs using the sitemap image extension
// (https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
// — this doesn't create a rich result by itself, but it tells Google exactly
// which photo represents this URL instead of leaving that to its own crawl
// of the page, which helps it pick the right thumbnails for the inline
// image results some competitors already show for generic costume searches.
function urlEntry(loc, lastmod, priority, alternates, images) {
  const altXml = (alternates || [])
    .map(([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${xmlEscape(href)}" />\n`)
    .join('');
  const imageXml = (images || [])
    .map(
      (img) =>
        `    <image:image>\n      <image:loc>${xmlEscape(img.loc)}</image:loc>\n` +
        (img.title ? `      <image:title>${xmlEscape(img.title)}</image:title>\n` : '') +
        `    </image:image>\n`
    )
    .join('');
  return (
    `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n` +
    altXml +
    imageXml +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    (priority != null ? `    <priority>${priority}</priority>\n` : '') +
    `  </url>`
  );
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  let categories = [];
  let products = [];
  try {
    [categories, products] = await Promise.all([
      fetchActiveCategories(env),
      fetchActiveProducts(env),
    ]);
  } catch {
    // fall through with whatever was fetched (possibly nothing) rather than
    // failing the whole sitemap over a transient Supabase hiccup
  }

  const entries = [];

  // The homepage's <image:image> set doubles as the sitemap-side half of the
  // "Популярни костюми" section (src/components/PopularCostumes.tsx) — same
  // is_popular flag and same priority/id ordering as fetchPopularProducts in
  // src/lib/products.ts, so the section and its sitemap signal never drift.
  const homepageImages = products
    .filter((p) => p.is_popular)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.id - a.id)
    .slice(0, POPULAR_PRODUCTS_LIMIT)
    .map((p) => ({ loc: p.image_url, title: p.name_bg || undefined }));

  // Static pages: all fully bilingual (About/Services/News/Contacts/Terms
  // content and their SEO strings all verified live in Supabase/i18n.tsx) —
  // both language variants ship unconditionally.
  for (const p of STATIC_PATHS) {
    const bgHref = `${origin}${p}`;
    const enHref = p === '/' ? `${origin}/en` : `${origin}/en${p}`;
    const priority = p === '/' ? '1.0' : '0.8';
    const alternates = buildAlternates(bgHref, enHref);
    const images = p === '/' ? homepageImages : undefined;
    entries.push(urlEntry(bgHref, undefined, priority, alternates, images));
    entries.push(urlEntry(enHref, undefined, priority, alternates, images));
  }

  // Categories: all 19 active categories already have name_en populated —
  // both variants ship unconditionally, same as static pages. Each one's own
  // tile image (categories.image_url, same photo ProductsPage/CategoryGrid
  // render) is attached so the category listing's sitemap entry points at a
  // real representative photo rather than none at all.
  for (const cat of categories) {
    const bgHref = `${origin}/products?category=${cat.id}`;
    const enHref = `${origin}/en/products?category=${cat.id}`;
    const alternates = buildAlternates(bgHref, enHref);
    const images = cat.image_url ? [{ loc: cat.image_url, title: cat.name_bg || undefined }] : undefined;
    entries.push(urlEntry(bgHref, undefined, '0.7', alternates, images));
    entries.push(urlEntry(enHref, undefined, '0.7', alternates, images));
  }

  // Products: the English variant only ships once the product actually has
  // real English content — this makes indexing self-completing as
  // description_en gets filled in (admin panel), no redeploy needed.
  for (const p of products) {
    const bgHref = `${origin}/product-detail/${p.id}`;
    const lastmod = p.created_at ? p.created_at.slice(0, 10) : undefined;
    const images = p.image_url ? [{ loc: p.image_url, title: p.name_bg || undefined }] : undefined;
    if (hasMeaningfulEnglishDescription(p)) {
      const enHref = `${origin}/en/product-detail/${p.id}`;
      const alternates = buildAlternates(bgHref, enHref);
      entries.push(urlEntry(bgHref, lastmod, '0.6', alternates, images));
      entries.push(urlEntry(enHref, lastmod, '0.6', alternates, images));
    } else {
      entries.push(urlEntry(bgHref, lastmod, '0.6', undefined, images));
    }
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
