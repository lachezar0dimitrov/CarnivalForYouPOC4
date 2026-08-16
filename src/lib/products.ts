// Product data layer — fetches from Supabase `public.products` table.
// Uses columns: id, old_id, category_id, name_bg, name_en, description_bg,
// description_en, sizes, price, old_price, image_url, is_active, priority.

import { supabase } from '@/lib/supabase';
import type { Lang } from '@/lib/i18n';

// --- Currency conversion ---
// Database prices are in BGN. We add 20% markup, then convert to EUR
// using the fixed BGN/EUR rate (1 EUR = 1.95583 BGN).
const BGN_TO_EUR_RATE = 1.95583;
const MARKUP = 1.2;

export function bgnToEur(bgn: number): number {
  return Math.round(((bgn * MARKUP) / BGN_TO_EUR_RATE) * 100) / 100;
}

export type Product = {
  id: number;
  oldId: number | null;
  categoryId: number | null;
  nameBg: string | null;
  nameEn: string | null;
  descriptionBg: string | null;
  descriptionEn: string | null;
  sizes: string | null;
  price: number; // EUR (converted)
  rawPrice: number; // BGN (original from DB)
  oldPrice: number | null; // EUR
  rawOldPrice: number | null; // BGN
  imageUrl: string | null;
  priority: number;
  tags: string[];
};

export type ProductRow = {
  id: number;
  old_id: number | null;
  category_id: number | null;
  name_bg: string | null;
  name_en: string | null;
  description_bg: string | null;
  description_en: string | null;
  sizes: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  priority: number;
  tags: string[] | null;
};

function mapRow(r: ProductRow): Product {
  const rawPrice = Number(r.price) || 0;
  const rawOldPrice =
    r.old_price != null ? Number(r.old_price) || null : null;
  return {
    id: r.id,
    oldId: r.old_id,
    categoryId: r.category_id,
    nameBg: r.name_bg,
    nameEn: r.name_en,
    descriptionBg: r.description_bg,
    descriptionEn: r.description_en,
    sizes: r.sizes,
    price: bgnToEur(rawPrice),
    rawPrice,
    oldPrice: rawOldPrice != null ? bgnToEur(rawOldPrice) : null,
    rawOldPrice,
    imageUrl: r.image_url,
    priority: r.priority ?? 0,
    tags: r.tags ?? [],
  };
}

// --- Category metadata ---
// Maps category_id from the products table to display info with STRICT ordering:
// 1. Women's (Дамски) — cat 2 (497 products: dresses, witches, Christmas ladies)
// 2. Men's (Мъжки) — cat 3 (291 products: musketeer, cowboy, viking)
// 3. Kids (Детски) — cat 19 (20 products: toddler sizes T, INF, TODD)
// Then the remaining categories:
// 4. Magical (Магически) — cat 4 (90: witches, fairies)
// 5. Masks (Маски) — cat 5 (101: domino, eye masks)
// 6. Hats (Шапки) — cat 6 (58: gangster hats, cylinder)
// 7. Wigs (Перуки) — cat 7 (125: Cleopatra, Marilyn)
// 8. Accessories (Аксесоари) — cat 8 (139: guns, swords, props)
// 9. Halloween (Хелоуин) — cat 10 (36: skulls, gothic decor)
// 10. Heroes (Герои) — cat 17 (146: characters, ninjas, zombies)
// Categories 9 (dog costumes), 12 & 16 (empty names) excluded.

export type CategoryMeta = {
  id: number;
  nameBg: string;
  nameEn: string;
  image: string;
  group: 'main' | 'other';
};

const FALLBACK_CATEGORIES: CategoryMeta[] = [
  {
    id: 2,
    nameBg: 'Дамски',
    nameEn: "Women's",
    image: '/images/categories/women-carnival-costumes.png',
    group: 'main',
  },
  {
    id: 3,
    nameBg: 'Мъжски',
    nameEn: "Men's",
    image: '/images/categories/men-carnival-costumes.png',
    group: 'main',
  },
  {
    id: 17,
    nameBg: 'Момчета',
    nameEn: "Boys'",
    image: '/images/categories/boys-carnival-costumes.png',
    group: 'main',
  },
  {
    id: 4,
    nameBg: 'Момичета',
    nameEn: "Girls'",
    image: '/images/categories/girls-carnival-costumes.png',
    group: 'main',
  },
  {
    id: 19,
    nameBg: 'Деца 0-3 г.',
    nameEn: 'Toddlers 0-3',
    image: '/images/categories/baby-costumes-0-3-years.png',
    group: 'main',
  },
  {
    id: 5,
    nameBg: 'Маски',
    nameEn: 'Masks',
    image: '/images/categories/venetian-masks.png',
    group: 'other',
  },
  {
    id: 6,
    nameBg: 'Шапки',
    nameEn: 'Hats',
    image: '/images/categories/carnival-hats.png',
    group: 'other',
  },
  {
    id: 7,
    nameBg: 'Перуки',
    nameEn: 'Wigs',
    image: '/images/categories/carnival-wigs.png',
    group: 'other',
  },
  {
    id: 8,
    nameBg: 'Аксесоари',
    nameEn: 'Accessories',
    image: '/images/categories/carnival-accessories.png',
    group: 'other',
  },
  {
    id: 10,
    nameBg: 'Хелоуин',
    nameEn: 'Halloween',
    image: '/images/categories/halloween-scary-costumes.png',
    group: 'other',
  },
  {
    id: 20,
    nameBg: 'Коледа',
    nameEn: 'Christmas',
    image: '/images/categories/christmas-carnival-costumes.png',
    group: 'other',
  },
];

let _dbCategories: CategoryMeta[] | null = null;

export async function loadCategories(): Promise<CategoryMeta[]> {
  if (_dbCategories) return _dbCategories;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      _dbCategories = data.map((r) => ({
        id: r.id,
        nameBg: r.name_bg ?? '',
        nameEn: r.name_en ?? '',
        image: r.image_url ?? '',
        group: (r.group as 'main' | 'other') ?? 'other',
      }));
      return _dbCategories;
    }
  } catch {
    // fall through to fallback
  }
  _dbCategories = FALLBACK_CATEGORIES;
  return _dbCategories;
}

export function setCategories(cats: CategoryMeta[]) {
  _dbCategories = cats;
}

export const categoryMeta: CategoryMeta[] = FALLBACK_CATEGORIES;

const PRIMARY_CATEGORY_IDS = new Set([2, 3, 4, 17, 19]);

export function getFeaturedCategories(categories: CategoryMeta[]): CategoryMeta[] {
  return categories.filter((category) => PRIMARY_CATEGORY_IDS.has(category.id));
}

export function getAllCategories(categories: CategoryMeta[]): CategoryMeta[] {
  return categories;
}

export function categoryName(id: number | null, lang: Lang): string {
  if (id == null) return lang === 'bg' ? 'Други' : 'Other';
  const cat = categoryMeta.find((c) => c.id === id);
  if (!cat) return lang === 'bg' ? 'Други' : 'Other';
  return lang === 'bg' ? cat.nameBg : cat.nameEn;
}

// Strips HTML tags, entities, and system symbols from raw DB text.
// Example: "<div>Contains:&nbsp;Dress and hat.</div>" -> "Contains: Dress and hat."
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ') // strip HTML tags
    .replace(/&nbsp;/g, ' ') // non-breaking spaces
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '') // numeric entities
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

export function productName(p: Product, lang: Lang): string {
  const bg = cleanText(p.nameBg ?? '');
  const en = cleanText(p.nameEn ?? '');
  if (lang === 'bg') return bg || en || `#${p.id}`;
  // For EN: use cleaned EN if meaningful, else fall back to cleaned BG.
  // EN is considered "missing/system garbage" if it's empty or just punctuation.
  const enMeaningful = en.length > 1 && /[a-zA-Z]/.test(en);
  return enMeaningful ? en : bg || `#${p.id}`;
}

export function productDescription(p: Product, lang: Lang): string {
  const bg = cleanText(p.descriptionBg ?? '');
  const en = cleanText(p.descriptionEn ?? '');
  if (lang === 'bg') return bg || en;
  // For EN: fall back to BG description (cleaned) if EN is empty or just HTML junk.
  const enMeaningful = en.length > 3 && /[a-zA-Z]/.test(en);
  return enMeaningful ? en : bg;
}

// --- Size normalization ---
// The database has many inconsistent size formats. We normalize them to
// a clean set for the filter dropdown.
const SIZE_NORMALIZE: Record<string, string> = {
  STD: 'STD',
  STANDARD: 'STD',
  STANDART: 'STD',
  'STD.': 'STD',
  Std: 'STD',
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  '2XL': 'XXL',
  XXL: 'XXL',
  'XXL/XXXL': 'XXL',
};

const KIDS_SIZES = new Set(['T', 'TODD', 'TODD/M', 'Toddler', 'INF', 'I', 'I, T']);

export function productSizes(p: Product): string[] {
  if (!p.sizes) return [];
  return p.sizes
    .split(/[,;/]/)
    .map((s) => s.trim().toUpperCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((s) => SIZE_NORMALIZE[s] ?? s);
}

// Get all distinct normalized sizes across the catalog for the filter dropdown.
export function getAvailableSizes(): string[] {
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'STD', 'Kids'];
}

// --- Pagination ---
const PAGE_SIZE = 24;

export type FetchResult = {
  products: Product[];
  hasMore: boolean;
  total: number;
  totalPages: number;
};

const selectColumns =
  'id, old_id, category_id, name_bg, name_en, description_bg, description_en, sizes, price, old_price, image_url, priority, tags';

// Build a base query with the common filters.
function baseQuery() {
  return supabase
    .from('products')
    .select(selectColumns)
    .eq('is_active', true)
    .gt('price', 0)
    .not('image_url', 'is', null)
    .neq('image_url', '');
}

// Build a PostgREST `or` filter string for text search across name columns.
// old_id is a numeric column and cannot be cast to text in PostgREST filters,
// so we search only name_bg and name_en via ilike.
function searchFilter(search: string): string {
  const term = search.trim().replace(/[,.()]/g, ' ').trim();
  if (!term) return '';
  return `name_bg.ilike.%${term}%,name_en.ilike.%${term}%`;
}

// Count total matching products for pagination.
export async function countProducts(
  categoryId: number | null,
  sizeFilter: string | null,
  search: string | null = null
): Promise<number> {
  // Supabase doesn't support COUNT via the client directly with filters easily,
  // so we fetch all IDs with only the id column.
  let query = supabase
    .from('products')
    .select('id')
    .eq('is_active', true)
    .gt('price', 0)
    .not('image_url', 'is', null)
    .neq('image_url', '');

  if (categoryId != null) {
    query = query.eq('category_id', categoryId);
  }

  if (search) {
    const sf = searchFilter(search);
    if (sf) query = query.or(sf);
  }

  const { data, error } = await query;

  if (error) throw error;

  let ids = (data ?? []).map((r) => r.id);

  // Size filter is applied client-side because sizes is a text field
  // with inconsistent formats (comma-separated, slash-separated, etc.)
  if (sizeFilter && sizeFilter !== 'Kids') {
    // We need to fetch the sizes too for filtering
    let sizeQuery = supabase
      .from('products')
      .select('id, sizes')
      .in('id', ids);
    const { data: sizeData, error: sizeError } = await sizeQuery;
    if (sizeError) throw sizeError;
    ids = (sizeData ?? [])
      .filter((r) => {
        const sizes = (r.sizes ?? '').toUpperCase();
        return sizes
          .split(/[,;/]/)
          .some((s: string) => s.trim() === sizeFilter);
      })
      .map((r) => r.id);
  } else if (sizeFilter === 'Kids') {
    let sizeQuery = supabase
      .from('products')
      .select('id, sizes, category_id')
      .in('id', ids);
    const { data: sizeData, error: sizeError } = await sizeQuery;
    if (sizeError) throw sizeError;
    ids = (sizeData ?? [])
      .filter((r) => {
        const sizes = (r.sizes ?? '').toUpperCase();
        const isKidsSize = [...KIDS_SIZES].some((ks) => sizes.includes(ks));
        const isKidsCategory = r.category_id === 19;
        return isKidsSize || isKidsCategory;
      })
      .map((r) => r.id);
  }

  return ids.length;
}

// Fetch a single page of products.
export async function fetchProducts(
  categoryId: number | null,
  sizeFilter: string | null,
  page: number,
  search: string | null = null
): Promise<FetchResult> {
  const total = await countProducts(categoryId, sizeFilter, search);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const from = safePage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = baseQuery().order('priority', { ascending: false }).order('id', { ascending: true });

  if (categoryId != null) {
    query = query.eq('category_id', categoryId);
  }

  if (search) {
    const sf = searchFilter(search);
    if (sf) query = query.or(sf);
  }

  const { data, error } = await query.range(from, to);

  if (error) throw error;

  let products = (data ?? []).map((r) => mapRow(r as unknown as ProductRow));

  // Apply size filter client-side
  if (sizeFilter) {
    products = products.filter((p) => {
      const sizes = (p.sizes ?? '').toUpperCase();
      if (sizeFilter === 'Kids') {
        return [...KIDS_SIZES].some((ks) => sizes.includes(ks)) || p.categoryId === 19;
      }
      return sizes
        .split(/[,;/]/)
        .some((s) => s.trim() === sizeFilter);
    });
  }

  return {
    products,
    hasMore: safePage < totalPages - 1,
    total,
    totalPages,
  };
}

// Fetch a single product by its bigint id.
export async function fetchProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(selectColumns)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as ProductRow);
}

// Fetch similar products in the same category (excluding current id).
export async function fetchSimilarProducts(
  categoryId: number | null,
  excludeId: number,
  limit: number
): Promise<Product[]> {
  let query = baseQuery()
    .neq('id', excludeId)
    .order('priority', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);

  if (categoryId != null) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as ProductRow[]).map(mapRow);
}
