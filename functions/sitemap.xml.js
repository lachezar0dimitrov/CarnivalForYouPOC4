// Generated dynamically (not a build-time static file) so it always
// reflects the live catalog — a static sitemap baked in at build time would
// silently drift out of date every time a product is added/removed without
// a redeploy. Reads directly from Supabase via REST, same pattern as the
// other functions/ files in this project.

const STATIC_PATHS = ['/', '/about', '/products', '/services', '/news', '/contacts', '/terms'];

// Only categories that are actually active/navigable — mirrors what
// ProductsPage's own canonical tag treats as a real indexable page (see
// src/pages/ProductsPage.tsx). Hidden categories (masks/hats/wigs/
// accessories) are intentionally left out of both.
async function fetchActiveCategoryIds(env) {
  const res = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=id`,
    {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r) => r.id);
}

async function fetchActiveProducts(env) {
  const pageSize = 1000; // PostgREST's default cap — see CLAUDE.md §7 pagination note
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=id,created_at` +
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

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;');
}

function urlEntry(loc, lastmod, priority) {
  return (
    `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n` +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    (priority != null ? `    <priority>${priority}</priority>\n` : '') +
    `  </url>`
  );
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  const today = new Date().toISOString().slice(0, 10);

  let categoryIds = [];
  let products = [];
  try {
    [categoryIds, products] = await Promise.all([
      fetchActiveCategoryIds(env),
      fetchActiveProducts(env),
    ]);
  } catch {
    // fall through with whatever was fetched (possibly nothing) rather than
    // failing the whole sitemap over a transient Supabase hiccup
  }

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(`${origin}${p}`, today, p === '/' ? '1.0' : '0.8')),
    ...categoryIds.map((id) => urlEntry(`${origin}/products?category=${id}`, today, '0.7')),
    ...products.map((p) =>
      urlEntry(
        `${origin}/product-detail/${p.id}`,
        p.created_at ? p.created_at.slice(0, 10) : undefined,
        '0.6'
      )
    ),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
