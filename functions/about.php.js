// Old site: about.php?lang=bg[&cntid=X] — the "За нас" page also hosted a
// sidebar of otherwise-unrelated content sub-pages (Terms, News, Privacy,
// Partners, "Представяне") as cntid values on this same script, rather than
// having their own .php files. See functions/_lib/legacyRedirect.js.
import { contentRedirectPath, passThroughIfNotPhp, redirectTo } from './_lib/legacyRedirect.js';

// onRequest (not onRequestGet) so HEAD redirects too — see products.php.js.
export async function onRequest(context) {
  const guard = await passThroughIfNotPhp(context);
  if (guard) return guard;

  const url = new URL(context.request.url);
  const cntid = url.searchParams.get('cntid');
  return redirectTo(contentRedirectPath(cntid), url.origin);
}
