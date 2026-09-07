// Old site: t_prod.php?lang=bg&tid=X (category listing, no specific product).
// onRequest (not onRequestGet) so HEAD redirects too — see products.php.js.
export { handleCategoryListing as onRequest } from './_lib/legacyRedirect.js';
