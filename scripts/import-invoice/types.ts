export type InvoiceLine = {
  itemCode: string;
  qty: number;
  unitPriceEur: number;
  lineValueEur: number;
  // The invoice's own product description text — kept only as a fallback
  // label (shown when the manufacturer's site can't be matched/scraped) and
  // as a search hint. The real name/description always comes from the
  // manufacturer's site, per the tool's design.
  referenceDescription: string;
};

export type ScrapedProduct = {
  url: string;
  title: string;
  descriptionEn: string;
  sizes: string[];
  tags: string[];
  imageUrl: string | null;
  // The manufacturer's own SKU, read back from the site's schema.org
  // Product data — used only as a cross-check that the matched page is
  // really the invoice line's item, not written to the final catalog row.
  sku: string | null;
};

export type MatchStatus = 'matched' | 'no_image' | 'not_found';

export type ImportRow = {
  // First column. Seeded with the manufacturer's invoice code (so the row
  // is identifiable while reviewing), but the admin overwrites this in
  // place with the shop's own physical tag number before upload — this IS
  // products.old_catalog_number once uploaded, there's no separate
  // "manufacturer code" field kept around after that edit.
  catalogNumber: string;
  matchStatus: MatchStatus;
  productUrl: string | null;
  nameEn: string;
  nameBg: string;
  descriptionEn: string;
  descriptionBg: string;
  sizes: string;
  // Category names to check in the Excel — one checkbox column per active
  // category, since a product can genuinely belong to several at once
  // (matches the DB's category_ids array; a single dropdown can't express
  // that).
  categories: string[];
  costPriceEur: number;
  rentalPriceEur: number | null;
  imageFile: string | null;
};
