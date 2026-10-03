// The project's *.pages.dev hostname stays publicly reachable after the real
// domain is attached, serving a byte-identical copy of the site — and its
// sitemap advertises pages.dev URLs, since sitemap.xml.js builds <loc> values
// from the requesting host. Left alone that is a duplicate of the whole
// catalog competing with carnivalforyou.com in search results, so every
// request on the preview host is 301'd straight to production instead of
// served — a stronger signal than noindex, and it stops pages.dev being a
// browsable duplicate at all. Only the preview host is touched; production
// requests fall through untouched.
// Known scanner/bot-probe paths that don't exist on this site — a real 404
// instead of falling through to the SPA catch-all in public/_redirects,
// which serves the homepage with a 200 for any unknown path and gets
// flagged by Search Console as a "soft 404". Deliberately a narrow
// blocklist of well-known junk patterns (WordPress admin/config probes,
// dotfile probes), not an exhaustive whitelist of every real route — a
// whitelist risks 404-ing a real page if the list is wrong; this only ever
// removes paths that were never real to begin with. Lives here rather than
// in _redirects because Pages' _redirects file doesn't support a 404
// status code at all (only 200 and the 3xx redirect codes are honored —
// confirmed live 2026-09-17 after a `404` destination rule there sat doing
// nothing for ~20 minutes).
const BLOCKED_PATH_PATTERNS = [
  /^\/wp-admin(\/|$)/i,
  /^\/wp-login\.php$/i,
  /^\/wp-content(\/|$)/i,
  /^\/wp-includes(\/|$)/i,
  /^\/wp-json(\/|$)/i,
  /^\/xmlrpc\.php$/i,
  /^\/wp-config\.php$/i,
  /^\/\.env$/i,
  /^\/\.git(\/|$)/i,
  /^\/config\.php$/i,
  /^\/administrator(\/|$)/i,
  /^\/phpmyadmin(\/|$)/i,
];

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    if (url.hostname.endsWith('.pages.dev')) {
      url.protocol = 'https:';
      url.hostname = 'carnivalforyou.com';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    if (BLOCKED_PATH_PATTERNS.some((re) => re.test(url.pathname))) {
      return new Response('Not found', { status: 404 });
    }
  } catch {
    // never let this cost a real response
  }

  // Hashed build assets that don't exist (e.g. requested in the seconds
  // while a new deploy propagates) would otherwise hit the SPA catch-all and
  // come back as index.html with 200 + the /assets/* `immutable` header --
  // a browser then caches HTML as that JS file for a year and the site stays
  // blank for that visitor. A non-cacheable 404 lets the next load recover.
  if (new URL(context.request.url).pathname.startsWith('/assets/')) {
    const res = await context.next();
    if ((res.headers.get('content-type') || '').includes('text/html')) {
      return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return res;
  }

  const pathname = new URL(context.request.url).pathname;
  const isHome = pathname === '/' || pathname === '/en' || pathname === '/en/';
  // Started before context.next() so the lookup overlaps fetching the page.
  const banners = isHome ? activeBanners(context).catch(() => null) : null;

  const res = await context.next();
  const isHtml = (res.headers.get('content-type') || '').includes('text/html');

  if (isHome && isHtml) {
    // Injected right after the viewport meta, not earlier: Chrome's preload
    // scanner resolves imagesizes' 100vw against whatever viewport it knows
    // of at that point -- before the viewport meta that's the 980px desktop
    // default, so a phone fetched the full photo AND (once the real width
    // was known) the 828px copy.
    let rewriter = new HTMLRewriter().on('meta[name="viewport"]', {
      async element(el) {
        const rows = await banners;
        if (!rows || rows.length === 0) return;
        const src = validImageUrl(rows[0].image_url);
        const small = smallBannerUrl(rows[0].mobile_image_url);
        // Must match the <img>'s srcset/sizes exactly (bannerSrcSet /
        // BANNER_SIZES in src/lib/banners.ts), or the browser treats the
        // preload and the image as two different requests.
        const srcset = small
          ? ` imagesrcset="${escapeAttr(`${small} 828w, ${src} 1920w`)}" imagesizes="${BANNER_SIZES}"`
          : '';
        const preload = src
          ? `\n    <link rel="preload" as="image" href="${escapeAttr(src)}"${srcset} fetchpriority="high" />`
          : '';
        // '<' escaped so no row text can close the script element early.
        const json = JSON.stringify(rows).replace(/</g, '\\u003c');
        el.after(`${preload}\n    <script id="cfy-banners" type="application/json">${json}</script>`, { html: true });
      },
    });
    if (isEnglishPath(pathname)) rewriter = withEnglishCopy(rewriter, pathname);
    const out = rewriter.transform(res);
    // The injected tags depend on the banners table, not on the static
    // index.html this was built from -- without this, a browser revalidating
    // with that file's ETag would get a 304 and keep reusing a stale copy
    // that preloads whichever banner used to be first.
    const headers = new Headers(out.headers);
    headers.delete('ETag');
    headers.delete('Last-Modified');
    return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
  }

  if (isEnglishPath(pathname) && isHtml) {
    return withEnglishCopy(new HTMLRewriter(), pathname).transform(res);
  }
  return res;
}

// The homepage's LCP element on mobile is the first banner photo, but which
// photo that is only exists in the banners table: the browser used to learn
// it after downloading and running the JS bundle and then querying Supabase
// (with a CORS preflight) -- seconds of pure waiting in Lighthouse's mobile
// run, first before the photo could download and then again before React
// could draw it. So the homepage HTML now carries both a <link rel=preload>
// for the first photo (download starts alongside the bundle) and the active
// rows themselves as inline JSON, which BannerCarousel renders from on its
// very first pass (see readInlineBanners() in src/lib/banners.ts). Same
// query/order as fetchActiveBanners() there -- keep them in sync.
// Cached at the edge for a few minutes; the carousel still runs its own live
// query right after and swaps in the result if anything changed, so an admin
// edit is never hidden for longer than that one request. Any failure here
// means no injected tags (the page falls back to the live query alone),
// never a broken page.
const BANNERS_CACHE_KEY = 'https://carnivalforyou.com/__edge-cache/active-banners-v1';
const BANNERS_TTL_SECONDS = 300;

async function activeBanners(context) {
  const { env } = context;
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return null;

  const cache = caches.default;
  const cacheKey = new Request(BANNERS_CACHE_KEY);
  const hit = await cache.match(cacheKey);
  if (hit) return hit.json();

  const res = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/banners?select=*&is_active=eq.true` +
      '&order=sort_order.asc,id.asc',
    {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(1500),
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows)) return null;
  context.waitUntil(
    cache.put(
      cacheKey,
      new Response(JSON.stringify(rows), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${BANNERS_TTL_SECONDS}` },
      })
    )
  );
  return rows;
}

const BANNER_SIZES = '(min-width: 1920px) 1920px, 100vw';

// Mirrors smallBannerUrl() in src/lib/banners.ts: only full-frame phone
// copies under banner-images/small/ count, never an old portrait crop.
function smallBannerUrl(value) {
  const url = validImageUrl(value);
  return url && url.includes('/banner-images/small/') ? url : null;
}

function validImageUrl(value) {
  return typeof value === 'string' && /^https:\/\/[^\s"'<>]+$/.test(value) ? value : null;
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// English copy for every /en page (see EN_SEO_STATIC below), plus the /en
// homepage head tags.
function withEnglishCopy(rewriter, pathname) {
  rewriter = rewriter
    .on('#seo-static', { element(el) { el.setInnerContent(EN_SEO_STATIC, { html: true }); } });
  // The /en homepage has no Pages Function of its own (unlike product
  // pages), so its raw <head> would otherwise carry index.html's Bulgarian
  // title/description. Mirrors seo.homeTitle/seo.homeDesc (en) in
  // src/lib/i18n.tsx -- keep in sync.
  if (pathname === '/en' || pathname === '/en/') {
    const set = (value) => ({ element(el) { el.setAttribute('content', value); } });
    rewriter = rewriter
      .on('title', { element(el) { el.setInnerContent(EN_HOME_TITLE); } })
      .on('meta[name="description"]', set(EN_HOME_DESC))
      .on('meta[property="og:title"]', set(EN_HOME_TITLE))
      .on('meta[property="og:description"]', set(EN_HOME_DESC))
      .on('meta[name="twitter:title"]', set(EN_HOME_TITLE))
      .on('meta[name="twitter:description"]', set(EN_HOME_DESC))
      .on('meta[property="og:url"]', set('https://carnivalforyou.com/en'));
  }
  return rewriter;
}

// index.html ships a visually-hidden, crawlable Bulgarian snapshot of the
// homepage (#seo-static — see the comment there) so the raw HTML Google
// fetches isn't an empty #root. Every /en path is served that same file, so
// swap in the English copy here — otherwise English pages' first-pass HTML
// would carry Bulgarian text and Bulgarian-URL links. Image URLs must stay
// identical to index.html's (they mirror the homepage category tiles).
function isEnglishPath(pathname) {
  return pathname === '/en' || pathname.startsWith('/en/');
}

const EN_HOME_TITLE = 'Carnival Costume Rental in Sofia | CarnivalForYou';
const EN_HOME_DESC =
  'Carnival and Halloween costume rental in Sofia — for kids and adults. Venetian masks, fairy-tale characters, 48-hour rental. Reserve in store.';

const EN_SEO_STATIC = `
      <h1>Carnival Costume Rental in Sofia</h1>
      <p>Carnival and Halloween costume rental in Sofia — over 1500 costumes for kids and adults. Venetian masks, fairy-tale characters, wigs and accessories, 48-hour rental.</p>
      <ul>
        <li><a href="/en/products?category=2"><img src="https://img.carnivalforyou.com/category-images/1789671859706-4f502551.webp" alt="Women's carnival costumes for rent" width="890" height="1316" loading="lazy" decoding="async" fetchpriority="low" />Women's costumes</a></li>
        <li><a href="/en/products?category=3"><img src="https://img.carnivalforyou.com/category-images/1789671861804-1f26332a.webp" alt="Men's carnival costumes for rent" width="922" height="1420" loading="lazy" decoding="async" fetchpriority="low" />Men's costumes</a></li>
        <li><a href="/en/products?category=17"><img src="/images/categories/boys-carnival-costumes.webp" alt="Boys' carnival costumes" width="640" height="962" loading="lazy" decoding="async" fetchpriority="low" />Boys' costumes</a></li>
        <li><a href="/en/products?category=4"><img src="/images/categories/girls-carnival-costumes.webp" alt="Girls' carnival costumes" width="640" height="1127" loading="lazy" decoding="async" fetchpriority="low" />Girls' costumes</a></li>
        <li><a href="/en/products?category=19"><img src="https://img.carnivalforyou.com/category-images/web/1789671863991-c3466ac6.webp" alt="Baby and toddler costumes 0-3 years" width="800" height="1000" loading="lazy" decoding="async" fetchpriority="low" />Toddlers 0-3</a></li>
        <li><a href="/en/products?category=10"><img src="/images/categories/halloween-scary-costumes.webp" alt="Halloween costumes for rent" width="640" height="919" loading="lazy" decoding="async" fetchpriority="low" />Halloween</a></li>
      </ul>
      <p>Mladost 4, bl. 426A, Sofia · <a href="tel:+359888716941">+359 888 716 941</a> · <a href="/en/contacts">Contacts</a></p>
    `;
