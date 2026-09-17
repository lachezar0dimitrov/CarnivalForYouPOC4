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

  return context.next();
}
