// Old site: products.php?lang=bg&tid=X&obid=Y (single product detail page —
// see project/plan.md Phase 3 and functions/_lib/legacyRedirect.js for the
// mapping rationale). Runs only once the new site is actually deployed as
// the Cloudflare Pages origin, so this has zero effect before cutover.
import { categoryRedirectPath, lookupNewProductId, redirectTo } from './_lib/legacyRedirect.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const obid = url.searchParams.get('obid');
  const tid = url.searchParams.get('tid');

  let target = null;
  if (obid) {
    try {
      const newId = await lookupNewProductId(env, obid);
      if (newId != null) target = `/product-detail/${newId}`;
    } catch {
      // old product no longer resolvable — fall through to category/catalog fallback
    }
  }

  return redirectTo(target ?? categoryRedirectPath(tid), url.origin);
}
