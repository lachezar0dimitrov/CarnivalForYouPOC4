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

  const res = await context.next();
  if (isEnglishPath(new URL(context.request.url).pathname)
      && (res.headers.get('content-type') || '').includes('text/html')) {
    return new HTMLRewriter()
      .on('#seo-static', { element(el) { el.setInnerContent(EN_SEO_STATIC, { html: true }); } })
      .transform(res);
  }
  return res;
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
