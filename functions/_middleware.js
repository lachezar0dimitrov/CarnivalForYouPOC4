// The project's *.pages.dev hostname stays publicly reachable after the real
// domain is attached, serving a byte-identical copy of the site — and its
// sitemap advertises pages.dev URLs, since sitemap.xml.js builds <loc> values
// from the requesting host. Left alone that is a duplicate of the whole
// catalog competing with carnivalforyou.com in search results, so every
// request on the preview host is 301'd straight to production instead of
// served — a stronger signal than noindex, and it stops pages.dev being a
// browsable duplicate at all. Only the preview host is touched; production
// requests fall through untouched.
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    if (url.hostname.endsWith('.pages.dev')) {
      url.protocol = 'https:';
      url.hostname = 'carnivalforyou.com';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
  } catch {
    // never let this cost a real response
  }

  return context.next();
}
