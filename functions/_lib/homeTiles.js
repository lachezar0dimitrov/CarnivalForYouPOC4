// The six homepage category tiles (5 demographic + the seasonal one), shared
// by the homepage's server-injected ItemList JSON-LD (_middleware.js) and the
// homepage's <image:image> set in sitemap.xml.js. Google's search result for
// the homepage alternates between a strip of these tile photos and a single
// thumbnail; both of those signals point it at the same six images, in the
// same order the page shows them, so the strip has a consistent source.
//
// Mirrors getHomepageCategories() in src/lib/products.ts and the
// categories.image_url values (verified 2026-10-10). The #seo-static block in
// index.html and EN_SEO_STATIC in _middleware.js carry the same URLs -- if an
// admin swaps a tile photo, or the seasonal tile switches to Christmas
// (id=20, 1 Nov - 10 Jan), update all three.
export const HOME_TILES = [
  { id: 2, image: 'https://img.carnivalforyou.com/category-images/1789671859706-4f502551.webp', bg: 'Дамски карнавални костюми', en: "Women's carnival costumes" },
  { id: 3, image: 'https://img.carnivalforyou.com/category-images/1789671861804-1f26332a.webp', bg: 'Мъжки карнавални костюми', en: "Men's carnival costumes" },
  { id: 17, image: 'https://carnivalforyou.com/images/categories/boys-carnival-costumes.webp', bg: 'Карнавални костюми за момчета', en: "Boys' carnival costumes" },
  { id: 4, image: 'https://carnivalforyou.com/images/categories/girls-carnival-costumes.webp', bg: 'Карнавални костюми за момичета', en: "Girls' carnival costumes" },
  { id: 19, image: 'https://img.carnivalforyou.com/category-images/web/1789671863991-c3466ac6.webp', bg: 'Бебешки и детски костюми 0-3 години', en: 'Baby and toddler costumes 0-3 years' },
  { id: 10, image: 'https://carnivalforyou.com/images/categories/halloween-scary-costumes.webp', bg: 'Костюми за Хелоуин', en: 'Halloween costumes' },
];

export function homeTilesItemList(lang) {
  const prefix = lang === 'en' ? '/en' : '';
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'en' ? 'Costume categories' : 'Категории костюми',
    itemListElement: HOME_TILES.map((tile, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: lang === 'en' ? tile.en : tile.bg,
      url: `https://carnivalforyou.com${prefix}/products?category=${tile.id}`,
      image: tile.image,
    })),
  };
}
