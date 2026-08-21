import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Tag,
  Ruler,
  Coins,
  Info,
  FileText,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import {
  fetchProductById,
  fetchSimilarProducts,
  productName,
  productDescription,
  productSeoTitle,
  productSeoDescription,
  productSizes,
  categoryName,
  type Product,
} from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailPage() {
  const { productId, navigate } = useRouter();
  const { t, lang } = useI18n();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const depositRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDepositInfo) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (depositRef.current && !depositRef.current.contains(e.target as Node)) {
        setShowDepositInfo(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showDepositInfo]);

  const numericId = productId ? Number(productId) : NaN;

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchProductById(numericId)
      .then(async (p) => {
        if (cancelled) return;
        if (!p) {
          setLoading(false);
          return;
        }
        setProduct(p);
        setLoading(false);

        try {
          const sim = await fetchSimilarProducts(p.categoryIds, p.id, 4);
          if (!cancelled) setSimilar(sim);
        } catch {
          // similar products are non-critical
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
  }, [numericId]);

  // SEO — title/description are composed from the product's category, sizes
  // and price so every product URL gets a unique, length-appropriate tag pair
  // even when the catalogue description is missing (see productSeoTitle).
  const name = product ? productName(product, lang) : t('seo.homeTitle');
  useSEO({
    title: product ? productSeoTitle(product, lang) : t('seo.homeTitle'),
    description: product ? productSeoDescription(product, lang) : t('seo.homeDesc'),
    image: product?.imageUrl ?? undefined,
    type: 'product',
  });

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-28 text-gray-400">
        <Loader2 size={32} className="animate-spin text-gold-300" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-28 text-gray-400">
        <AlertCircle size={32} className="text-error" />
        <p className="text-sm">{t('common.error')}</p>
        <button
          onClick={() => navigate('products')}
          className="btn-gold mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
        >
          <ArrowLeft size={16} />
          {t('common.backToCatalog')}
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-40 pb-32 text-center">
        <p className="font-display text-2xl text-gray-100">
          {t('common.notFoundTitle')}
        </p>
        <p className="mt-2 text-sm text-gray-400">{t('common.notFoundBody')}</p>
        <button
          onClick={() => navigate('products')}
          className="btn-gold mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
        >
          <ArrowLeft size={16} />
          {t('common.backToCatalog')}
        </button>
      </div>
    );
  }

  const sizes = productSizes(product);
  const description = productDescription(product, lang);
  const categoriesList = product.categoryIds && product.categoryIds.length > 0
    ? product.categoryIds
    : [product.categoryId].filter((id): id is number => id !== null);

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <button
        onClick={() => navigate('products')}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-gold-200"
      >
        <ArrowLeft size={16} />
        {t('common.backToCatalog')}
      </button>

      {/* Main detail — stacks on mobile: image on top, details below */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="product-photo-frame relative aspect-[2/3] w-full overflow-hidden p-2 shadow-card">

          {/* CSS Frame - Двойна линия с 8px отстояние (inset-2) */}
          <div className="pointer-events-none absolute inset-2 z-10 border-[3px] border-double border-[#8B5A2B]/70 shadow-[inset_0_0_8px_rgba(139,90,43,0.15)]"></div>

          {/* Viewport bg - Ограничен до същите граници (inset-2) */}
          <div className="absolute inset-2 z-0 flex items-center justify-center bg-white p-2">
            <img
              src={product.imageUrl ?? ''}
              alt={name}
              className="pointer-events-none h-full w-full select-none object-contain object-center"
              loading="eager"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
              }}
            />
          </div>

          {/* Етикетите са с z-20, за да са над CSS рамката */}
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-1.5 max-w-[80%]">
            {categoriesList.map((catId) => (
              <span
                key={catId}
                className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-[#f0d985] backdrop-blur-sm"
              >
                {categoryName(catId, lang)}
              </span>
            ))}
          </div>

          {product.oldPrice != null && product.oldPrice > product.price && (
            <span className="absolute right-4 top-4 z-20 rounded-full bg-error/90 px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-display text-2xl font-bold leading-tight text-gray-100 sm:text-3xl">
            {name}
          </h1>

          {product.oldId != null && (
            <p className="mt-1.5 text-sm font-medium text-gold-300/80">
              {t('common.catalogNumber')}: {product.oldId}
            </p>
          )}

          {description && (
            <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">
              {description}
            </p>
          )}

          {/* Info grid */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InfoTile
              icon={Coins}
              label={t('common.rentalPrice')}
              value={`${product.price.toFixed(0)} ${t('common.eur')} ${t('common.perDay')}`}
              accent
            />
            <div ref={depositRef} className="relative">
              <InfoTile
                icon={Coins}
                label={
                  <span className="inline-flex items-center gap-1">
                    {t('common.deposit')}
                    <Info size={12} />
                  </span>
                }
                value={`${Math.round(product.price) * 2 + 10} ${t('common.eur')}`}
                onClick={() => setShowDepositInfo((v) => !v)}
                expanded={showDepositInfo}
              />
              {showDepositInfo && (
                <div className="absolute right-0 top-full z-30 mt-2 w-[min(15rem,calc(100vw-2rem))] rounded-xl border border-gold-400/20 bg-ink-900/95 p-3 text-xs leading-relaxed text-gray-300 shadow-card backdrop-blur-sm">
                  {t('common.depositInfo')}
                </div>
              )}
            </div>
            {sizes.length > 0 && (
              <InfoTile
                icon={Ruler}
                label={t('common.sizes')}
                value={sizes.join(', ')}
              />
            )}
            <InfoTile
              icon={Tag}
              label={t('common.category')}
              value={
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {categoriesList.map((catId) => (
                    <span key={catId} className="inline-block">
                      {categoryName(catId, lang)}
                    </span>
                  ))}
                </div>
              }
            />
          </div>

          {/* Terms link */}
          <button
            onClick={() => navigate('terms')}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg border-b border-gold-400/30 pb-1 text-sm font-medium text-gold-200 transition hover:border-gold-400/60 hover:text-gold-100"
          >
            <FileText size={16} />
            {t('common.rentalTerms')}
          </button>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => navigate('contacts')}
              className="btn-gold flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm"
            >
              {t('common.reserveInStore')}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('contacts')}
              className="btn-ghost flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm"
            >
              {t('common.contactUs')}
            </button>
          </div>
        </div>
      </div>

      {/* Similar suggestions */}
      {similar.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-gray-100 sm:text-2xl">
              {t('common.similarSuggestions')}
            </h2>
            <div className="h-px flex-1 bg-gold-400/15" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similar.map((c) => (
              <ProductCard key={c.id} product={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
  expanded,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
  accent?: boolean;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const interactive = onClick != null;
  return (
    <div
      className={`glass rounded-xl p-4 ${accent ? 'border-gold-400/30' : ''} ${
        interactive ? 'cursor-pointer transition hover:border-gold-400/40' : ''
      }`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={interactive ? expanded : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 text-gold-300">
        <Icon size={15} />
        <span className="eyebrow text-[0.6rem]">{label}</span>
      </div>
      <div
        className={`mt-1.5 text-sm ${
          accent
            ? 'font-display text-lg font-semibold text-gold-100'
            : 'text-gray-200'
        }`}
      >
        {value}
      </div>
    </div>
  );
}