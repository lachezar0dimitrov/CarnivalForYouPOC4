// Old site: about.php?lang=bg[&cntid=X] — the "За нас" page also hosted a
// sidebar of otherwise-unrelated content sub-pages (Terms, News, Privacy,
// Partners, "Представяне") as cntid values on this same script, rather than
// having their own .php files. See functions/_lib/legacyRedirect.js.
import { contentRedirectPath, redirectTo } from './_lib/legacyRedirect.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cntid = url.searchParams.get('cntid');
  return redirectTo(contentRedirectPath(cntid), url.origin);
}
