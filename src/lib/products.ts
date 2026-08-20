// Product data layer — fetches from Supabase `public.products` table.
// Uses columns: id, old_id, category_id, category_ids, name_bg, name_en, description_bg,
// description_en, sizes, price, old_price, image_url, is_active, priority, tags.

import { supabase } from '@/lib/supabase';
import type { Lang } from '@/lib/i18n';
import { getCurrentSeason } from '@/lib/season';

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
  showAsTile: boolean;
};

const FALLBACK_CATEGORIES: CategoryMeta[] = [
  { id: 2, nameBg: 'Дамски', nameEn: "Women's", image: '/images/categories/women-carnival-costumes.png', group: 'main', showAsTile: true },
  { id: 3, nameBg: 'Мъжки', nameEn: "Men's", image: '/images/categories/men-carnival-costumes.png', group: 'main', showAsTile: true },
  { id: 17, nameBg: 'Момчета', nameEn: "Boys'", image: '/images/categories/boys-carnival-costumes.png', group: 'main', showAsTile: true },
  { id: 4, nameBg: 'Момичета', nameEn: "Girls'", image: '/images/categories/girls-carnival-costumes.png', group: 'main', showAsTile: true },
  { id: 19, nameBg: 'Деца 0-3 г.', nameEn: 'Toddlers 0-3', image: '/images/categories/baby-costumes-0-3-years.png', group: 'main', showAsTile: true },
  { id: 5, nameBg: 'Маски', nameEn: 'Masks', image: '/images/categories/venetian-masks.png', group: 'other', showAsTile: true },
  { id: 6, nameBg: 'Шапки', nameEn: 'Hats', image: '/images/categories/carnival-hats.png', group: 'other', showAsTile: true },
  { id: 7, nameBg: 'Перуки', nameEn: 'Wigs', image: '/images/categories/carnival-wigs.png', group: 'other', showAsTile: true },
  { id: 8, nameBg: 'Аксесоари', nameEn: 'Accessories', image: '/images/categories/carnival-accessories.png', group: 'other', showAsTile: true },
  { id: 10, nameBg: 'Хелоуин', nameEn: 'Halloween', image: '/images/categories/halloween-scary-costumes.png', group: 'other', showAsTile: true },
  { id: 20, nameBg: 'Коледа', nameEn: 'Christmas', image: '/images/categories/christmas-carnival-costumes.png', group: 'other', showAsTile: true },
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
        showAsTile: r.show_as_tile ?? true,
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
  // Prefer the live (already-loaded) DB categories over the static fallback
  // list — loadCategories() only returns is_active categories, so a product
  // tagged with a hidden category (e.g. Masks/Hats/Wigs/Accessories) falls
  // through to "Other" here instead of surfacing a category that was
  // deliberately taken off public navigation.
  const source = _dbCategories ?? categoryMeta;
  const cat = source.find((c) => c.id === id);
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

// --- Seasonal Sorting ---
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

// Маски / Шапки / Перуки / Аксесоари — hidden by stakeholder decision
// (categories.is_active = false), not shown as tiles or filter chips.
const HIDDEN_CATEGORY_IDS = [5, 6, 7, 8];

function baseQuery() {
  return supabase
    .from('products')
    .select(selectColumns)
    .eq('is_active', true)
    .gt('price', 0)
    .not('image_url', 'is', null)
    .neq('image_url', '')
    .or(`category_id.is.null,category_id.not.in.(${HIDDEN_CATEGORY_IDS.join(',')})`);
}

function searchFilter(search: string): string {
  const term = search.trim().replace(/[,.()]/g, ' ').trim();
  if (!term) return '';
  const base = `name_bg.ilike.%${term}%,name_en.ilike.%${term}%`;
  // Catalog numbers (old_id) are searched exactly, as printed on the tag —
  // only meaningful when the whole term is numeric.
  if (/^\d+$/.test(term)) {
    return `${base},old_id.eq.${term}`;
  }
  return base;
}

/**
 * Fetches all matching IDs, applies sizes filtering, and sorts them globally
 * taking into account the current season.
 */
// Supabase/PostgREST caps a single request at its configured max row count
// (commonly 1000), so a catalog past that size needs paging to fetch all
// matching rows rather than silently truncating.
const FETCH_PAGE_SIZE = 1000;

export async function getFilteredAndSortedIds(
  primaryCategoryIds: number[] | null,
  secondaryCategoryIds: number[] | null,
  sizeFilters: string[] | null,
  search: string | null = null
): Promise<number[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  let from = 0;

  for (;;) {
    let query = supabase
      .from('products')
      .select('id, category_id, category_ids, priority, sizes')
      .eq('is_active', true)
      .gt('price', 0)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .range(from, from + FETCH_PAGE_SIZE - 1);

    // Masks/Hats/Wigs/Accessories (5/6/7/8) are hidden categories — not
    // shown as tiles or filter chips, not browsable at all — but the base
    // query wasn't excluding their products, so an unscoped keyword search
    // (or plain unfiltered browsing) could still surface them, e.g.
    // searching "pirate" pulling in a standalone "pirate shirt" accessory
    // alongside actual pirate costumes. Excluded unconditionally here
    // rather than only when no category filter is active, matching how
    // they're already unreachable via category navigation. category_id
    // IS NULL is explicitly preserved since PostgREST's not.in excludes
    // NULLs by default (three-valued SQL logic), which would otherwise
    // silently drop the handful of products with no category at all.
    query = query.or(`category_id.is.null,category_id.not.in.(${HIDDEN_CATEGORY_IDS.join(',')})`);

    // Primary demographic categories (Women/Men/Boys/...) and secondary
    // refinement tags (Halloween/Christmas/Sexy/Professions/...) are each
    // OR'd internally (selecting Men + Women shows both), but the two
    // groups are separate .or() calls, which PostgREST ANDs together — a
    // product must match one of the selected primaries AND one of the
    // selected refinements, rather than every selection being flattened
    // into one big OR (which previously let a "Men + Professions" search
    // surface women's costumes just because they were tagged Professions).
    if (primaryCategoryIds != null && primaryCategoryIds.length > 0) {
      const clause = primaryCategoryIds
        .map((id) => `category_ids.cs.{${id}},category_id.eq.${id}`)
        .join(',');
      query = query.or(clause);
    }

    if (secondaryCategoryIds != null && secondaryCategoryIds.length > 0) {
      const clause = secondaryCategoryIds
        .map((id) => `category_ids.cs.{${id}},category_id.eq.${id}`)
        .join(',');
      query = query.or(clause);
    }

    if (search) {
      const sf = searchFilter(search);
      if (sf) query = query.or(sf);
    }

    const { data, error } = await query;
    if (error) throw error;

    const page = data ?? [];
    items = items.concat(page);
    if (page.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }

  // 1. Apply Size Filter — OR across every selected size.
  if (sizeFilters != null && sizeFilters.length > 0) {
    items = items.filter((r) => {
      const sizes = (r.sizes ?? '').toUpperCase();
      const rowSizes = sizes.split(/[,;/]/).map((s: string) => s.trim());
      return sizeFilters.some((sizeFilter) => {
        if (sizeFilter === 'Kids') {
          const isKidsSize = [...KIDS_SIZES].some((ks) => sizes.includes(ks));
          const isKidsCat = hasCategory(r, 19);
          return isKidsSize || isKidsCat;
        }
        return rowSizes.includes(sizeFilter);
      });
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
  primaryCategoryIds: number[] | null,
  secondaryCategoryIds: number[] | null,
  sizeFilters: string[] | null,
  search: string | null = null
): Promise<number> {
  const ids = await getFilteredAndSortedIds(primaryCategoryIds, secondaryCategoryIds, sizeFilters, search);
  return ids.length;
}

export async function fetchProducts(
  primaryCategoryIds: number[] | null,
  secondaryCategoryIds: number[] | null,
  sizeFilters: string[] | null,
  page: number,
  search: string | null = null
): Promise<FetchResult> {
  // Get fully sorted and filtered IDs matching the query
  const allIds = await getFilteredAndSortedIds(primaryCategoryIds, secondaryCategoryIds, sizeFilters, search);

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

function categoryOrClause(ids: number[]): string {
  return ids.map((id) => `category_ids.cs.{${id}},category_id.eq.${id}`).join(',');
}

async function fetchByCategoryGroups(
  excludeId: number,
  primary: number[],
  secondary: number[],
  limit: number
): Promise<Product[]> {
  let query = baseQuery().neq('id', excludeId);
  if (primary.length > 0) query = query.or(categoryOrClause(primary));
  if (secondary.length > 0) query = query.or(categoryOrClause(secondary));
  query = query.order('priority', { ascending: false }).order('id', { ascending: true }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as ProductRow[] | null ?? []).map(mapRow);
}

// "Similar" products must match the same demographic/primary category
// (Women/Men/Boys/...) AND at least one shared theme/season tag
// (Halloween/Christmas/Pirates/...) where the source product has one —
// previously this only matched the primary category_id, so a Halloween-
// tagged women's costume could "similar-recommend" unrelated Christmas
// costumes purely because they shared the same demographic. Falls back to
// primary-only matches to top up the list when the tightly-matched set is
// too small (e.g. a product with a rare/unique theme combination).
export async function fetchSimilarProducts(
  categoryIds: number[],
  excludeId: number,
  limit: number
): Promise<Product[]> {
  if (categoryIds.length === 0) return [];

  const primary = categoryIds.filter((id) => PRIMARY_CATEGORY_IDS.has(id));
  const secondary = categoryIds.filter((id) => !PRIMARY_CATEGORY_IDS.has(id));

  const results =
    primary.length > 0 && secondary.length > 0
      ? await fetchByCategoryGroups(excludeId, primary, secondary, limit)
      : [];

  if (results.length < limit) {
    const have = new Set(results.map((p) => p.id));
    const fallbackIds = primary.length > 0 ? primary : categoryIds;
    const more = await fetchByCategoryGroups(excludeId, fallbackIds, [], limit * 2);
    for (const p of more) {
      if (results.length >= limit) break;
      if (!have.has(p.id)) {
        results.push(p);
        have.add(p.id);
      }
    }
  }

  return results.slice(0, limit);
}