// The project's *.pages.dev hostname stays publicly reachable after the real
// domain is attached, serving a byte-identical copy of the site — and its
// sitemap advertises pages.dev URLs, since sitemap.xml.js builds <loc> values
// from the requesting host. Left alone that is a duplicate of the whole
// catalog competing with carnivalforyou.com in search results.
//
// Tagging only the preview host keeps the production domain untouched.
export async function onRequest(context) {
  const response = await context.next();

  try {
    if (new URL(context.request.url).hostname.endsWith('.pages.dev')) {
      const tagged = new Response(response.body, response);
      tagged.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return tagged;
    }
  } catch {
    // never let this cost a real response
  }

  return response;
}
