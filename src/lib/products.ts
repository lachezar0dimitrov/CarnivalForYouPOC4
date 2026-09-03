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
  // Rounded to a whole euro so the site never shows odd cent amounts
  // (e.g. 14.73 €) — display-only rounding, the DB keeps the exact BGN price.
  return Math.round((bgn * MARKUP) / BGN_TO_EUR_RATE);
}

// Inverse of bgnToEur, for admin editing — the DB still stores BGN as the
// source of truth, but admins think and price in EUR, so the product form
// converts a typed EUR amount back to BGN on save. Kept at cent precision
// (unlike the whole-euro display rounding above) since this feeds storage,
// not a customer-facing label.
export function eurToBgn(eur: number): number {
  return Math.round(((eur * BGN_TO_EUR_RATE) / MARKUP) * 100) / 100;
}

export type Product = {
  id: number;
  oldId: number | null;
  oldCatalogNumber: string | null;
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
  isNew: boolean;
};

export type ProductRow = {
  id: number;
  old_id: number | null;
  old_catalog_number: string | null;
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
  is_new: boolean | null;
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
    oldCatalogNumber: r.old_catalog_number,
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
    isNew: r.is_new ?? false,
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

// The 5 demographic tiles (Women/Men/Boys/Girls/Toddlers) plus one seasonal
// tile — Christmas during the Christmas window, Halloween otherwise
// (matches getCurrentSeason()'s own 'halloween'-as-default-outside-Christmas
// behavior, and keeps the grid at a clean 6 cards / 2 full rows of 3 instead
// of a 5+2 mix). Single source of truth for both the home page and the
// products page category grid.
export function getHomepageCategories(categories: CategoryMeta[]): CategoryMeta[] {
  const featured = getFeaturedCategories(categories);
  const seasonalId = getCurrentSeason() === 'christmas' ? 20 : 10;
  const seasonal = categories.find((c) => c.id === seasonalId);
  return seasonal ? [...featured, seasonal] : featured;
}

export function getAllCategories(categories: CategoryMeta[]): CategoryMeta[] {
  return categories;
}

export function categoryName(id: number | null, lang: Lang): string {
  if (id == null) return lang === 'bg' ? 'Други' : 'Other';
  // loadCategories() only returns is_active categories, so a product cross-
  // tagged with a hidden category (e.g. Masks/Hats/Wigs/Accessories) won't
  // resolve against the live DB set — fall back to the static list (which
  // does include hidden categories) so its real name still displays,
  // instead of collapsing to "Other". Hidden categories still don't appear
  // as browsable tiles/filters since that's driven by loadCategories(), not
  // this display lookup.
  const source = _dbCategories ?? categoryMeta;
  const cat = source.find((c) => c.id === id) ?? categoryMeta.find((c) => c.id === id);
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

// --- SEO metadata -----------------------------------------------------------
// Product names in the DB are short catalogue names (avg ~18 chars), which
// produced <title> tags averaging 35 characters — well under the ~50-60 band
// search engines render — and 406 active products had no description at all,
// so their meta description fell back to the generic site blurb (duplicate
// meta across hundreds of URLs). Rather than pad the stored names with
// keywords (that would be keyword stuffing, and would leak into the catalogue
// UI and the admin editor), the high-intent terms are composed here at render
// time from data the product already has: its category, its rental price and
// the shop's city.

const SEO_MAX_TITLE = 60;
const SEO_MAX_DESC = 160;

/** Trim to a length limit on a word boundary, never mid-word. */
function clampWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.-]+$/, '')}…`;
}

// Per-category search phrasing. Category *names* can't just be concatenated
// with "костюм" — Bulgarian category labels are a mix of adjectives ("Дамски"
// -> "дамски костюм") and plural nouns ("Момичета" -> "костюм за момичета",
// not "Момичета костюм"). The accessory categories aren't costumes at all, so
// calling a wig a "костюм" would be both wrong and bad for search intent.
const SEO_CATEGORY_PHRASE: Record<number, { bg: string; en: string }> = {
  2:  { bg: 'дамски костюм под наем',          en: "women's costume rental" },
  3:  { bg: 'мъжки костюм под наем',           en: "men's costume rental" },
  4:  { bg: 'костюм за момичета под наем',     en: "girls' costume rental" },
  17: { bg: 'костюм за момчета под наем',      en: "boys' costume rental" },
  19: { bg: 'детски костюм под наем',          en: 'toddler costume rental' },
  10: { bg: 'костюм за Хелоуин под наем',      en: 'Halloween costume rental' },
  20: { bg: 'коледен костюм под наем',         en: 'Christmas costume rental' },
  5:  { bg: 'карнавална маска под наем',       en: 'carnival mask rental' },
  6:  { bg: 'парти шапка под наем',            en: 'party hat rental' },
  7:  { bg: 'перука под наем',                 en: 'wig rental' },
  8:  { bg: 'карнавален аксесоар под наем',    en: 'costume accessory rental' },
};

function seoQualifier(p: Product, lang: Lang): string {
  const phrase = p.categoryId != null ? SEO_CATEGORY_PHRASE[p.categoryId] : undefined;
  if (phrase) return lang === 'bg' ? phrase.bg : phrase.en;
  return lang === 'bg' ? 'карнавален костюм под наем' : 'carnival costume rental';
}

export function productSeoTitle(p: Product, lang: Lang): string {
  const name = productName(p, lang);
  // The qualifier carries the actual search intent ("костюм под наем" /
  // "costume rental"), which the bare catalogue name almost never contains.
  const core = `${name} — ${seoQualifier(p, lang)}`;
  const full = `${core} | CarnivalForYou`;
  if (full.length <= SEO_MAX_TITLE) return full;
  // Drop the brand suffix before truncating anything meaningful.
  return clampWords(core, SEO_MAX_TITLE);
}

export function productSeoDescription(p: Product, lang: Lang): string {
  const name = productName(p, lang);
  const body = productDescription(p, lang);
  const sizes = productSizes(p);
  const price = p.price > 0 ? `${p.price.toFixed(0)} EUR` : '';

  const parts: string[] = [];
  if (body) {
    parts.push(body.replace(/\s+/g, ' ').trim());
  } else {
    // No catalogue description: synthesise one from the category phrasing so
    // the URL still gets a unique meta description instead of falling back to
    // the generic site blurb shared by every other page.
    parts.push(`${name} — ${seoQualifier(p, lang)}.`);
  }
  if (sizes.length > 0) {
    parts.push(lang === 'bg' ? `Размери: ${sizes.join(', ')}.` : `Sizes: ${sizes.join(', ')}.`);
  }
  if (price) {
    parts.push(lang === 'bg' ? `Наем от ${price}/48 часа.` : `Rental from ${price}/48 hours.`);
  }
  parts.push(lang === 'bg' ? 'Вземете от нашата карнавална къща в София.' : 'Collect from our carnival house in Sofia.');

  return clampWords(parts.join(' '), SEO_MAX_DESC);
}

// Visible on-page fallback for the ~28% of active products with no catalogue
// description at all (see productSeoDescription for the <meta> equivalent).
// Deliberately shorter than the meta description — it skips price and the
// "collect in store" line since those already appear in the info tiles and
// CTA buttons elsewhere on the same page, so repeating them here would just
// be noise rather than filling genuinely thin content.
export function productFallbackDescription(p: Product, lang: Lang): string {
  const name = productName(p, lang);
  // productSizes() passes through whatever placeholder is in the DB —
  // ~456 active products literally have "-" as their sizes value, which
  // would otherwise print as the meaningless "Sizes: -." here.
  const sizes = productSizes(p).filter((s) => s !== '-');
  const parts = [`${name} — ${seoQualifier(p, lang)}.`];
  if (sizes.length > 0) {
    parts.push(lang === 'bg' ? `Размери: ${sizes.join(', ')}.` : `Sizes: ${sizes.join(', ')}.`);
  }
  return parts.join(' ');
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

const PAGE_SIZE = 25;

export type FetchResult = {
  products: Product[];
  hasMore: boolean;
  total: number;
  totalPages: number;
};

const selectColumns =
  'id, old_id, old_catalog_number, category_id, category_ids, name_bg, name_en, description_bg, description_en, sizes, price, old_price, image_url, priority, tags, is_new';

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
  // The number printed on the physical tag is old_catalog_number, not
  // old_id (which is just the legacy site's internal obid). Matched with
  // ilike since some catalog numbers have leading zeros staff may omit.
  // old_id is kept as a secondary fallback for internal reference lookups.
  if (/^\d+$/.test(term)) {
    return `${base},old_catalog_number.ilike.%${term}%,old_id.eq.${term}`;
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

export type AdjacentProducts = {
  prevId: number | null;
  nextId: number | null;
};

// Previous/next within the product's own primary category, in the same
// order the catalog/category listing shows them (seasonal weighting, then
// priority, then id — see getFilteredAndSortedIds). Deliberately scoped to
// the product's own category rather than whatever filters happened to be
// active on the page the user arrived from, so the buttons behave the same
// regardless of entry point (a direct link, a search result, a "similar
// suggestions" click).
export async function getAdjacentProductIds(product: Product): Promise<AdjacentProducts> {
  const categoryId = product.categoryId ?? product.categoryIds[0] ?? null;
  if (categoryId == null) return { prevId: null, nextId: null };

  const ids = await getFilteredAndSortedIds([categoryId], null, null);
  const index = ids.indexOf(product.id);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
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

// Products flagged "new" in the admin form, for the home page ribbon.
export async function fetchNewProducts(limit = 20): Promise<Product[]> {
  const { data, error } = await baseQuery()
    .eq('is_new', true)
    .order('priority', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as unknown as ProductRow[] | null ?? []).map(mapRow);
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