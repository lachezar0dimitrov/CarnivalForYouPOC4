import { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

const ALL = 'all';

export default function ProductsPage() {
  const { t, lang } = useI18n();
  const { queryParams } = useRouter();

  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [sizeFilter, setSizeFilter] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dbCats, setDbCats] = useState<CategoryMeta[]>(categoryMeta);

  const availableSizes = getAvailableSizes();

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const needsScrollRef = useRef(false);

  // Скролване при зареждане на нови данни (когато loading спре)
  useEffect(() => {
    if (!loading && needsScrollRef.current) {
      needsScrollRef.current = false;
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [loading]);

  useEffect(() => {
    const urlCat = queryParams.category;
    if (urlCat != null && urlCat !== categoryFilter) {
      setCategoryFilter(urlCat);
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

  const seoCat =
    categoryFilter !== ALL
      ? dbCats.find((c) => String(c.id) === categoryFilter)
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

    const catId = categoryFilter === ALL ? null : Number(categoryFilter);
    const sizeId = sizeFilter === ALL ? null : sizeFilter;
    const search = debouncedSearch.trim() || null;

    fetchProducts(catId, sizeId, page, search)
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
  }, [categoryFilter, sizeFilter, page, debouncedSearch]);

  useEffect(() => {
    setPage(0);
  }, [categoryFilter, sizeFilter, debouncedSearch]);

  const scrollToResults = () => {
    needsScrollRef.current = true;
  };

  const handleCategoryCardClick = (catId: number) => {
    setCategoryFilter(String(catId));
    scrollToResults();
  };

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
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
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

      <section className="mt-12">
        <h2 className="mb-5 font-display text-lg font-semibold text-gold-100">
          {t('products.categories')}
        </h2>
        <CategoryGrid
          categories={dbCats}
          onSelect={handleCategoryCardClick}
          selectedId={categoryFilter}
          showAll
        />
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-start gap-2 rounded-2xl border border-gold-400/15 bg-ink-700/40 px-4 py-3">
        <button
          onClick={() => { setCategoryFilter(ALL); setSizeFilter(ALL); setSearchQuery(''); }}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
            categoryFilter === ALL && sizeFilter === ALL && !searchQuery
              ? 'btn-gold'
              : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
          }`}
        >
          {t('products.filterAll')}
        </button>

        {dbCats.map((cat) => {
          const catIdStr = String(cat.id);
          const isSelected = categoryFilter === catIdStr;
          const catName = lang === 'bg' ? cat.nameBg : cat.nameEn;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(catIdStr);
                scrollToResults();
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                isSelected
                  ? 'btn-gold'
                  : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
              }`}
            >
              {catName}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              searchOpen
                ? 'border-gold-400/60 bg-gold-400/10 text-gold-200'
                : 'border-gold-400/25 text-gold-300/70 hover:border-gold-400/50 hover:text-gold-200'
            }`}
            aria-label={t('products.searchPlaceholder')}
            aria-expanded={searchOpen}
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-gold-400/15 bg-ink-700/40 px-4 py-3 sm:flex-row sm:items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="номер или име на костюм"
            className="w-full rounded-lg border border-gold-400/20 bg-ink-700 px-4 py-2.5 text-sm text-gray-200 transition placeholder:text-gray-500 focus:border-gold-400/60 focus:outline-none sm:max-w-xs"
          />
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-gray-400">{t('products.filterSize')}:</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-lg border border-gold-400/20 bg-ink-700 px-3 py-1.5 text-sm text-gray-200 transition focus:border-gold-400/60 focus:outline-none"
            >
              <option value={ALL}>{t('products.filterAll')}</option>
              {availableSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
      )}

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
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3">
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
  );
}