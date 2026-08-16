// Product data layer — fetches from Supabase `public.products` table.
// Uses columns: id, old_id, category_id, category_ids, name_bg, name_en, description_bg,
// description_en, sizes, price, old_price, image_url, is_active, priority, tags.

import { supabase } from '@/lib/supabase';
import type { Lang } from '@/lib/i18n';

// --- Currency conversion ---
const BGN_TO_EUR_RATE = 1.95583;
const MARKUP = 1.2;

export function bgnToEur(bgn: number): number {
  return Math.round(((bgn * MARKUP) / BGN_TO_EUR_RATE) * 100) / 100;
}

export type Product = {
  id: number;
  oldId: number | null;
  categoryId: number | null;
  categoryIds: number[];
  nameBg: string | null;
  nameEn: string | null;
  descriptionBg: string | null;
  descriptionEn: string | null;
  sizes: string | null;
  price: number;
  rawPrice: number;
  oldPrice: number | null;
  rawOldPrice: number | null;
  imageUrl: string | null;
  priority: number;
  tags: string[];
};

export type ProductRow = {
  id: number;
  old_id: number | null;
  category_id: number | null;
  category_ids: number[] | string | null;
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

  let categoryIds: number[] = [];
  const rawCatIds = r.category_ids;

  if (Array.isArray(rawCatIds)) {
    categoryIds = rawCatIds.map(Number).filter(Boolean);
  } else if (typeof rawCatIds === 'string') {
    try {
      const parsed = JSON.parse(rawCatIds);
      if (Array.isArray(parsed)) {
        categoryIds = parsed.map(Number).filter(Boolean);
      } else {
        throw new Error();
      }
    } catch {
      if (rawCatIds.startsWith('{') && rawCatIds.endsWith('}')) {
        categoryIds = rawCatIds.slice(1, -1).split(',').map(Number).filter(Boolean);
      } else {
        categoryIds = [Number(rawCatIds)].filter(Boolean);
      }
    }
  } else if (rawCatIds != null) {
    categoryIds = [Number(rawCatIds)].filter(Boolean);
  }

  if (categoryIds.length === 0 && r.category_id != null) {
    categoryIds = [Number(r.category_id)].filter(Boolean);
  }

  return {
    id: r.id,
    oldId: r.old_id,
    categoryId: r.category_id,
    categoryIds,
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
export type CategoryMeta = {
  id: number;
  nameBg: string;
  nameEn: string;
  image: string;
  group: 'main' | 'other';
};

const FALLBACK_CATEGORIES: CategoryMeta[] = [
  { id: 2, nameBg: 'Дамски', nameEn: "Women's", image: '/images/categories/women-carnival-costumes.png', group: 'main' },
  { id: 3, nameBg: 'Мъжки', nameEn: "Men's", image: '/images/categories/men-carnival-costumes.png', group: 'main' },
  { id: 17, nameBg: 'Момчета', nameEn: "Boys'", image: '/images/categories/boys-carnival-costumes.png', group: 'main' },
  { id: 4, nameBg: 'Момичета', nameEn: "Girls'", image: '/images/categories/girls-carnival-costumes.png', group: 'main' },
  { id: 19, nameBg: 'Деца 0-3 г.', nameEn: 'Toddlers 0-3', image: '/images/categories/baby-costumes-0-3-years.png', group: 'main' },
  { id: 5, nameBg: 'Маски', nameEn: 'Masks', image: '/images/categories/venetian-masks.png', group: 'other' },
  { id: 6, nameBg: 'Шапки', nameEn: 'Hats', image: '/images/categories/carnival-hats.png', group: 'other' },
  { id: 7, nameBg: 'Перуки', nameEn: 'Wigs', image: '/images/categories/carnival-wigs.png', group: 'other' },
  { id: 8, nameBg: 'Аксесоари', nameEn: 'Accessories', image: '/images/categories/carnival-accessories.png', group: 'other' },
  { id: 10, nameBg: 'Хелоуин', nameEn: 'Halloween', image: '/images/categories/halloween-scary-costumes.png', group: 'other' },
  { id: 20, nameBg: 'Коледа', nameEn: 'Christmas', image: '/images/categories/christmas-carnival-costumes.png', group: 'other' },
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

export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function productName(p: Product, lang: Lang): string {
  const bg = cleanText(p.nameBg ?? '');
  const en = cleanText(p.nameEn ?? '');
  if (lang === 'bg') return bg || en || `#${p.id}`;
  const enMeaningful = en.length > 1 && /[a-zA-Z]/.test(en);
  return enMeaningful ? en : bg || `#${p.id}`;
}

export function productDescription(p: Product, lang: Lang): string {
  const bg = cleanText(p.descriptionBg ?? '');
  const en = cleanText(p.descriptionEn ?? '');
  if (lang === 'bg') return bg || en;
  const enMeaningful = en.length > 3 && /[a-zA-Z]/.test(en);
  return enMeaningful ? en : bg;
}

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

export function getAvailableSizes(): string[] {
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'STD', 'Kids'];
}

// --- Seasonal & Sorting Logic ---
type Season = 'christmas' | 'halloween' | 'normal';

function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth() + 1; // 1 - 12
  const day = now.getDate();

  // Коледа: 1 ноември – 10 януари
  if (month === 11 || month === 12 || (month === 1 && day <= 10)) {
    return 'christmas';
  }

  // Хелоуин: 15 август – 1 ноември
  if ((month === 8 && day >= 15) || month === 9 || month === 10 || (month === 11 && day === 1)) {
    return 'halloween';
  }

  return 'normal';
}

// Helper to check category presence efficiently
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasCategory(row: any, targetId: number): boolean {
  if (row.category_id === targetId) return true;
  const rawCatIds = row.category_ids;

  if (Array.isArray(rawCatIds)) {
    return rawCatIds.map(Number).includes(targetId);
  } else if (typeof rawCatIds === 'string') {
    try {
      const parsed = JSON.parse(rawCatIds);
      if (Array.isArray(parsed)) return parsed.map(Number).includes(targetId);
    } catch {
      if (rawCatIds.startsWith('{') && rawCatIds.endsWith('}')) {
        return rawCatIds.slice(1, -1).split(',').map(Number).includes(targetId);
      }
      return Number(rawCatIds) === targetId;
    }
  } else if (rawCatIds != null) {
    return Number(rawCatIds) === targetId;
  }
  return false;
}

const PAGE_SIZE = 24;

export type FetchResult = {
  products: Product[];
  hasMore: boolean;
  total: number;
  totalPages: number;
};

const selectColumns =
  'id, old_id, category_id, category_ids, name_bg, name_en, description_bg, description_en, sizes, price, old_price, image_url, priority, tags';

function baseQuery() {
  return supabase
    .from('products')
    .select(selectColumns)
    .eq('is_active', true)
    .gt('price', 0)
    .not('image_url', 'is', null)
    .neq('image_url', '');
}

function searchFilter(search: string): string {
  const term = search.trim().replace(/[,.()]/g, ' ').trim();
  if (!term) return '';
  return `name_bg.ilike.%${term}%,name_en.ilike.%${term}%`;
}

/**
 * Fetches all matching IDs, applies sizes filtering, and sorts them globally
 * taking into account the current season.
 */
export async function getFilteredAndSortedIds(
  categoryId: number | null,
  sizeFilter: string | null,
  search: string | null = null
): Promise<number[]> {
  let query = supabase
    .from('products')
    .select('id, category_id, category_ids, priority, sizes')
    .eq('is_active', true)
    .gt('price', 0)
    .not('image_url', 'is', null)
    .neq('image_url', '');

  if (categoryId != null) {
    query = query.or(`category_ids.cs.{${categoryId}},category_id.eq.${categoryId}`);
  }

  if (search) {
    const sf = searchFilter(search);
    if (sf) query = query.or(sf);
  }

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = data ?? [];

  // 1. Apply Size Filter
  if (sizeFilter) {
    items = items.filter((r) => {
      const sizes = (r.sizes ?? '').toUpperCase();
      if (sizeFilter === 'Kids') {
        const isKidsSize = [...KIDS_SIZES].some((ks) => sizes.includes(ks));
        const isKidsCat = hasCategory(r, 19);
        return isKidsSize || isKidsCat;
      }
      return sizes.split(/[,;/]/).some((s: string) => s.trim() === sizeFilter);
    });
  }

  // 2. Apply Seasonal Sorting
  const season = getCurrentSeason();

  items.sort((a, b) => {
    const aChris = hasCategory(a, 20); // Коледа
    const bChris = hasCategory(b, 20);
    const aHal = hasCategory(a, 10);   // Хелоуин
    const bHal = hasCategory(b, 10);

    const getWeight = (isChris: boolean, isHal: boolean) => {
      if (season === 'christmas') {
        if (isChris) return 10;
        if (isHal) return -10;
        return 0;
      }
      if (season === 'halloween') {
        if (isHal) return 10;
        if (isChris) return -10;
        return 0;
      }
      if (isChris || isHal) return -10;
      return 0;
    };

    const wA = getWeight(aChris, aHal);
    const wB = getWeight(bChris, bHal);

    if (wA !== wB) {
      return wB - wA;
    }

    const pA = a.priority ?? 0;
    const pB = b.priority ?? 0;
    if (pA !== pB) return pB - pA;
    return a.id - b.id;
  });

  return items.map((r) => r.id);
}

export async function countProducts(
  categoryId: number | null,
  sizeFilter: string | null,
  search: string | null = null
): Promise<number> {
  const ids = await getFilteredAndSortedIds(categoryId, sizeFilter, search);
  return ids.length;
}

export async function fetchProducts(
  categoryId: number | null,
  sizeFilter: string | null,
  page: number,
  search: string | null = null
): Promise<FetchResult> {
  // Get fully sorted and filtered IDs matching the query
  const allIds = await getFilteredAndSortedIds(categoryId, sizeFilter, search);

  const total = allIds.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const from = safePage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Slice only the IDs meant for the current page
  const pageIds = allIds.slice(from, to + 1);

  if (pageIds.length === 0) {
    return {
      products: [],
      hasMore: false,
      total: 0,
      totalPages: 1,
    };
  }

  // Fetch the full rows ONLY for this page
  const { data, error } = await supabase
    .from('products')
    .select(selectColumns)
    .in('id', pageIds);

  if (error) throw error;

  const rawProducts = (data ?? []).map((r) => mapRow(r as unknown as ProductRow));

  // Reorder the fetched products to match the 'pageIds' sequence strictly
  const prodMap = new Map(rawProducts.map(p => [p.id, p]));
  const products = pageIds.map(id => prodMap.get(id)).filter(Boolean) as Product[];

  return {
    products,
    hasMore: safePage < totalPages - 1,
    total,
    totalPages,
  };
}

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
    query = query.or(`category_ids.cs.{${categoryId}},category_id.eq.${categoryId}`);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as ProductRow[]).map(mapRow);
}