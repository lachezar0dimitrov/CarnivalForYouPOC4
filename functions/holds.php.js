// Old site: holds.php?lang=bg&tid=X ("Празници" — seasonal/holiday costume
// listing: Halloween, New Year, Valentine's). Same tid-based category
// mapping as t_prod.php.
export { handleCategoryListing as onRequestGet } from './_lib/legacyRedirect.js';
