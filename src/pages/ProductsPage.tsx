import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useRouter } from '@/lib/router';
import { useSEO } from '@/lib/useSEO';
import {
  categoryMeta,
  loadCategories,
  fetchProducts,
  getAvailableSizes,
  type Product,
  type CategoryMeta,
} from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import CategoryGrid from '@/components/CategoryGrid';

function parseIdList(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// Halloween (10) and Christmas (20) keep their tile cards alongside the
// demographic categories (Women/Men/...), but for filtering purposes they
// behave as refinement tags, not as another demographic to OR against —
// selecting Men + Christmas should narrow to Christmas costumes for men,
// not union Men with everything tagged Christmas.
const SEASONAL_CATEGORY_IDS = new Set([10, 20]);

function CategoryChips({
  cats,
  selected,
  onToggle,
  lang,
}: {
  cats: CategoryMeta[];
  selected: number[];
  onToggle: (id: number) => void;
  lang: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((cat) => {
        const isSelected = selected.includes(cat.id);
        const catName = lang === 'bg' ? cat.nameBg : cat.nameEn;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            aria-pressed={isSelected}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
              isSelected
                ? 'btn-gold'
                : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
            }`}
          >
            {catName}
          </button>
        );
      })}
    </div>
  );
}

type FilterFieldsProps = {
  t: (key: string) => string;
  lang: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  primaryCats: CategoryMeta[];
  primaryCategories: number[];
  onTogglePrimary: (id: number) => void;
  secondaryCats: CategoryMeta[];
  secondaryCategories: number[];
  onToggleSecondary: (id: number) => void;
  availableSizes: string[];
  sizeFilters: string[];
  onToggleSize: (s: string) => void;
};

function FilterFields({
  t,
  lang,
  searchQuery,
  onSearchChange,
  primaryCats,
  primaryCategories,
  onTogglePrimary,
  secondaryCats,
  secondaryCategories,
  onToggleSecondary,
  availableSizes,
  sizeFilters,
  onToggleSize,
}: FilterFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('products.searchPlaceholder')}
        className="w-full rounded-lg border border-gold-400/20 bg-ink-700 px-4 py-2.5 text-sm text-gray-200 transition placeholder:text-gray-500 focus:border-gold-400/60 focus:outline-none"
      />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('products.filterCategories')}
        </p>
        <CategoryChips cats={primaryCats} selected={primaryCategories} onToggle={onTogglePrimary} lang={lang} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('products.themeCategories')}
        </p>
        <CategoryChips cats={secondaryCats} selected={secondaryCategories} onToggle={onToggleSecondary} lang={lang} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('products.filterSize')}
        </p>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => {
            const isSelected = sizeFilters.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleSize(s)}
                aria-pressed={isSelected}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                  isSelected
                    ? 'btn-gold'
                    : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { t, lang } = useI18n();
  const { queryParams } = useRouter();

  const [primaryCategories, setPrimaryCategories] = useState<number[]>(() =>
    parseIdList(queryParams.category).filter((id) => !SEASONAL_CATEGORY_IDS.has(id))
  );
  const [secondaryCategories, setSecondaryCategories] = useState<number[]>(() => [
    ...parseIdList(queryParams.category).filter((id) => SEASONAL_CATEGORY_IDS.has(id)),
    ...parseIdList(queryParams.themes),
  ]);
  const [sizeFilters, setSizeFilters] = useState<string[]>(() =>
    queryParams.size ? queryParams.size.split(',').filter(Boolean) : []
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dbCats, setDbCats] = useState<CategoryMeta[]>(categoryMeta);

  const availableSizes = getAvailableSizes();
  const tileCats = dbCats.filter((c) => c.showAsTile);
  const primaryCats = dbCats.filter((c) => c.showAsTile && !SEASONAL_CATEGORY_IDS.has(c.id));
  const secondaryCats = dbCats.filter((c) => !c.showAsTile || SEASONAL_CATEGORY_IDS.has(c.id));

  const resultsRef = useRef<HTMLDivElement>(null);
  const needsScrollRef = useRef(false);

  useEffect(() => {
    if (!loading && needsScrollRef.current) {
      needsScrollRef.current = false;
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [loading]);

  useEffect(() => {
    if (queryParams.category == null) return;
    const urlCats = parseIdList(queryParams.category);
    const urlPrimary = urlCats.filter((id) => !SEASONAL_CATEGORY_IDS.has(id));
    const urlSecondary = urlCats.filter((id) => SEASONAL_CATEGORY_IDS.has(id));
    const samePrimary =
      urlPrimary.length === primaryCategories.length &&
      urlPrimary.every((id) => primaryCategories.includes(id));
    const sameSecondary =
      urlSecondary.length === secondaryCategories.length &&
      urlSecondary.every((id) => secondaryCategories.includes(id));
    if (!samePrimary || !sameSecondary) {
      setPrimaryCategories(urlPrimary);
      setSecondaryCategories(urlSecondary);
      scrollToResults();
    }
  }, [queryParams.category]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadCategories().then((cats) => setDbCats(cats));
  }, []);

  // Lock background scroll while the mobile full-screen filter overlay is
  // open. Desktop shows the panel as an inline sidebar, not an overlay, so
  // the results column should stay scrollable there.
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (filterOpen && !isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [filterOpen]);

  const seoCat =
    primaryCategories.length === 1 && secondaryCategories.length === 0
      ? dbCats.find((c) => c.id === primaryCategories[0])
      : null;
  const seoTitle = seoCat
    ? lang === 'bg'
      ? `${seoCat.nameBg} костюми под наем | CarnivalForYou`
      : `${seoCat.nameEn} costume rentals | CarnivalForYou`
    : t('seo.productsTitle');
  useSEO({
    title: seoTitle,
    description: t('seo.productsDesc'),
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const primary = primaryCategories.length > 0 ? primaryCategories : null;
    const secondary = secondaryCategories.length > 0 ? secondaryCategories : null;
    const sizes = sizeFilters.length > 0 ? sizeFilters : null;
    const search = debouncedSearch.trim() || null;

    fetchProducts(primary, secondary, sizes, page, search)
      .then((result) => {
        if (!cancelled) {
          setProducts(result.products);
          setTotalPages(result.totalPages);
          setTotal(result.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [primaryCategories, secondaryCategories, sizeFilters, page, debouncedSearch]);

  useEffect(() => {
    setPage(0);
  }, [primaryCategories, secondaryCategories, sizeFilters, debouncedSearch]);

  const scrollToResults = () => {
    needsScrollRef.current = true;
  };

  // Clicking a tile is navigation, not filtering — it jumps straight to that
  // category's products (replacing any other category selection), matching
  // how it worked before category chips became multi-select. The chip
  // toggles below (togglePrimary/toggleSecondary) are the only multi-select
  // affordance now.
  const handleCategoryCardClick = (catId: number) => {
    if (SEASONAL_CATEGORY_IDS.has(catId)) {
      setSecondaryCategories([catId]);
      setPrimaryCategories([]);
    } else {
      setPrimaryCategories([catId]);
      setSecondaryCategories([]);
    }
    scrollToResults();
  };

  const togglePrimary = (catId: number) => {
    setPrimaryCategories((prev) => toggleInArray(prev, catId));
  };

  const toggleSecondary = (catId: number) => {
    setSecondaryCategories((prev) => toggleInArray(prev, catId));
  };

  const toggleSize = (size: string) => {
    setSizeFilters((prev) => toggleInArray(prev, size));
  };

  const clearFilters = () => {
    setPrimaryCategories([]);
    setSecondaryCategories([]);
    setSizeFilters([]);
    setSearchQuery('');
  };

  const activeFilterCount =
    primaryCategories.length +
    secondaryCategories.length +
    sizeFilters.length +
    (debouncedSearch.trim() ? 1 : 0);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages - 1, start + maxVisible - 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
        <button
          onClick={() => {
            setPage((p) => Math.max(0, p - 1));
            scrollToResults();
          }}
          disabled={page === 0}
          className="flex items-center gap-1 rounded-lg border border-gold-400/25 px-3 py-2 text-sm text-gold-200 transition hover:bg-gold-400/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">{t('products.prev')}</span>
        </button>

        {start > 0 && (
          <>
            <button
              onClick={() => {
                setPage(0);
                scrollToResults();
              }}
              className="rounded-lg px-3.5 py-2 text-sm text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-200"
            >
              1
            </button>
            {start > 1 && <span className="px-1 text-gray-500">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPage(p);
              scrollToResults();
            }}
            className={`rounded-lg px-3.5 py-2 text-sm transition ${
              page === p
                ? 'btn-gold'
                : 'text-gray-300 hover:bg-gold-400/10 hover:text-gold-200'
            }`}
          >
            {p + 1}
          </button>
        ))}

        {end < totalPages - 1 && (
          <>
            {end < totalPages - 2 && <span className="px-1 text-gray-500">…</span>}
            <button
              onClick={() => {
                setPage(totalPages - 1);
                scrollToResults();
              }}
              className="rounded-lg px-3.5 py-2 text-sm text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-200"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => {
            setPage((p) => Math.min(totalPages - 1, p + 1));
            scrollToResults();
          }}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 rounded-lg border border-gold-400/25 px-3 py-2 text-sm text-gold-200 transition hover:bg-gold-400/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span className="hidden sm:inline">{t('products.next')}</span>
          <ChevronRight size={16} />
        </button>
      </nav>
    );
  };

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 2xl:max-w-[1680px]">
      <div className="text-center">
        <p className="eyebrow mb-3">{t('products.eyebrow')}</p>
        <h1 className="font-display text-3xl font-semibold text-gray-100 sm:text-4xl md:text-5xl">
          {t('products.title')}
        </h1>
        <div className="mx-auto mt-4 h-px w-20 bg-gold-grad shadow-glow-sm" />
        <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-400 sm:text-base">
          {t('products.subtitle')}
        </p>
      </div>

      <section className="relative mt-12 2xl:left-1/2 2xl:right-1/2 2xl:mx-[-50vw] 2xl:w-screen">
        <div className="2xl:mx-auto 2xl:max-w-[2184px] 2xl:px-6">
          <h2 className="mb-5 font-display text-lg font-semibold text-gold-100">
            {t('products.categories')}
          </h2>
          <CategoryGrid
            categories={tileCats}
            onSelect={handleCategoryCardClick}
            selectedIds={[...primaryCategories, ...secondaryCategories]}
            showAll
          />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-gold-400/15 bg-ink-700/40 px-4 py-3">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
            filterOpen
              ? 'btn-gold'
              : 'border border-gold-400/30 text-gold-200 hover:border-gold-400/60 hover:bg-gold-400/10'
          }`}
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal size={16} />
          {t('products.advancedFilter')}
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900/30 px-1.5 text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold-400/20 px-3.5 py-2 text-sm text-gray-400 transition hover:border-gold-400/50 hover:text-gold-200"
          >
            <X size={14} />
            {t('products.clearFilters')}
          </button>
        )}

        {activeFilterCount > 0 && (
          <span className="text-xs text-gray-500">
            {activeFilterCount} {t('products.activeFilters')}
          </span>
        )}
      </div>

      {/* Mobile / tablet: full-screen filter overlay with an explicit submit action.
          Portaled to document.body — the page root has its own `relative z-10`
          stacking context, which would otherwise cap this overlay's z-index
          and let the fixed site header (z-50) paint over it regardless of
          how high a z-index it's given here. */}
      {filterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-ink-900 lg:hidden">
            <div className="flex items-center justify-between border-b border-gold-400/15 px-4 py-4">
              <h2 className="font-display text-lg font-semibold text-gold-100">
                {t('products.advancedFilter')}
              </h2>
              <button
                onClick={() => setFilterOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-gray-400 transition hover:text-gold-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <FilterFields
                t={t}
                lang={lang}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                primaryCats={primaryCats}
                primaryCategories={primaryCategories}
                onTogglePrimary={togglePrimary}
                secondaryCats={secondaryCats}
                secondaryCategories={secondaryCategories}
                onToggleSecondary={toggleSecondary}
                availableSizes={availableSizes}
                sizeFilters={sizeFilters}
                onToggleSize={toggleSize}
              />
            </div>
            <div className="border-t border-gold-400/15 px-4 py-4">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mb-2 w-full text-center text-sm text-gray-400 transition hover:text-gold-200"
                >
                  {t('products.clearFilters')}
                </button>
              )}
              <button
                onClick={() => setFilterOpen(false)}
                className="btn-gold w-full rounded-full px-4 py-3 text-sm font-medium"
              >
                {t('products.showResults')} ({total})
              </button>
            </div>
          </div>,
          document.body
        )}

      <div className="relative mt-2 2xl:left-1/2 2xl:right-1/2 2xl:mx-[-50vw] 2xl:w-screen">
      <div className="lg:flex lg:items-start lg:gap-8 2xl:mx-auto 2xl:max-w-[2050px] 2xl:px-6">
        {/* Desktop: inline sidebar, pushes the results column instead of overlaying it */}
        {filterOpen && (
          <aside className="hidden lg:sticky lg:top-28 lg:block lg:w-72 lg:shrink-0 lg:rounded-2xl lg:border lg:border-gold-400/15 lg:bg-ink-700/40 lg:p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gold-200">{t('products.advancedFilter')}</span>
              <button
                onClick={() => setFilterOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-gray-400 transition hover:text-gold-200"
              >
                <X size={16} />
              </button>
            </div>
            <FilterFields
              t={t}
              lang={lang}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              primaryCats={primaryCats}
              primaryCategories={primaryCategories}
              onTogglePrimary={togglePrimary}
              secondaryCats={secondaryCats}
              secondaryCategories={secondaryCategories}
              onToggleSecondary={toggleSecondary}
              availableSizes={availableSizes}
              sizeFilters={sizeFilters}
              onToggleSize={toggleSize}
            />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          <div ref={resultsRef} />
          {!loading && !error && (
            <p className="mt-4 text-sm text-gray-500">
              {total} {t('products.results')}
              {seoCat && (
                <span className="text-gold-200/80">
                  {' '}
                  — {lang === 'bg' ? seoCat.nameBg : seoCat.nameEn}
                </span>
              )}
            </p>
          )}

          {loading ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-gold-300" />
              <p className="text-sm">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-gray-400">
              <AlertCircle size={32} className="text-error" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="mt-16 text-center text-gray-500">{t('common.noResults')}</p>
          )}

          {renderPagination()}

          {totalPages > 1 && !loading && !error && (
            <p className="mt-4 text-center text-xs text-gray-500">
              {t('products.page')} {page + 1} {t('products.of')} {totalPages}
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
