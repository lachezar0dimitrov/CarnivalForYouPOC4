// Old site: holds.php?lang=bg&tid=X ("Празници" — seasonal/holiday costume
// listing: Halloween, New Year, Valentine's). Same tid-based category
// mapping as t_prod.php.
// onRequest (not onRequestGet) so HEAD redirects too — see products.php.js.
export { handleCategoryListing as onRequest } from './_lib/legacyRedirect.js';
