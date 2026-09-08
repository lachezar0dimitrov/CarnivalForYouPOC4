// Old site: products.php?lang=bg&tid=X&obid=Y (single product detail page —
// see project/plan.md Phase 3 and functions/_lib/legacyRedirect.js for the
// mapping rationale). Runs only once the new site is actually deployed as
// the Cloudflare Pages origin, so this has zero effect before cutover.
import {
  categoryRedirectPath,
  lookupNewProductId,
  passThroughIfNotPhp,
  redirectTo,
} from './_lib/legacyRedirect.js';

// onRequest, not onRequestGet: a HEAD request would otherwise skip this
// function entirely and fall through to the SPA catch-all, answering 200 for
// a legacy URL that should say 301. Browsers and Googlebot use GET, but link
// checkers and SEO audit tools routinely use HEAD and would read those old
// URLs as live duplicates rather than redirects. The static _redirects rules
// already behave correctly for both methods; this matches them.
export async function onRequest(context) {
  const guard = await passThroughIfNotPhp(context);
  if (guard) return guard;

  const { request, env } = context;
  const url = new URL(request.url);
  const obid = url.searchParams.get('obid');
  const tid = url.searchParams.get('tid');
  const lang = url.searchParams.get('lang');
  const enPrefix = lang === 'en' ? '/en' : '';

  let target = null;
  if (obid) {
    try {
      const newId = await lookupNewProductId(env, obid);
      // Redirects to the English product URL even if that product doesn't
      // have a written English description yet — see the withLang comment
      // in _lib/legacyRedirect.js for why.
      if (newId != null) target = `${enPrefix}/product-detail/${newId}`;
    } catch {
      // old product no longer resolvable — fall through to category/catalog fallback
    }
  }

  return redirectTo(target ?? categoryRedirectPath(tid, lang), url.origin);
}
