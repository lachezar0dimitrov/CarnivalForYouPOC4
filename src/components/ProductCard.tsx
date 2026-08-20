import { useI18n } from '@/lib/i18n';
import { useRouter } from '@/lib/router';
import { productName, type Product } from '@/lib/products';

export default function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useI18n();
  const { navigate } = useRouter();

  const name = productName(product, lang);

  const goToDetail = () => navigate('product-detail', String(product.id));

  return (
    <article
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      }}
      role="button"
      tabIndex={0}
      className="glass-hover group flex cursor-pointer flex-col rounded-2xl border border-gold-400/15 bg-ink-900/75 shadow-card backdrop-blur-sm"
      style={{ backfaceVisibility: 'hidden' }}
      aria-label={name}
    >
      {/* PRODUCT IMAGE */}
      <div className="product-photo-frame relative aspect-[2/3] w-full overflow-hidden p-2">

        {/* CSS Frame - Двойна линия с 8px отстояние (inset-2) */}
        <div className="pointer-events-none absolute inset-2 z-10 border-[3px] border-double border-[#8B5A2B]/70 shadow-[inset_0_0_8px_rgba(139,90,43,0.15)]"></div>

        {/* Viewport bg - Ограничен до същите граници (inset-2) */}
        <div className="absolute inset-2 z-0 flex items-center justify-center bg-white p-2">
          <img
            src={product.imageUrl ?? ''}
            alt={name}
            loading="lazy"
            className="pointer-events-none h-full w-full select-none object-contain object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
            }}
          />
        </div>

        {/* Hover Overlay - Приравнен към границите на снимката */}
        <span className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center bg-ink-900/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-gold-400/50 bg-ink-900/70 px-5 py-2.5 text-sm font-medium text-gold-100 shadow-glow-sm">
            {lang === 'bg' ? 'Виж повече' : 'See more'}
          </span>
        </span>

        {/* Discount Badge */}
        {product.oldPrice != null && product.oldPrice > product.price && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-error/90 px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-glow-sm">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="clamp-2 font-display text-base font-semibold leading-snug text-gray-100">
          {name}
        </h3>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display text-lg font-semibold text-gold-200">
            {product.price.toFixed(0)} {t('common.eur')}
          </span>

          <span className="text-xs text-gray-500">
            {t('common.perDay')}
          </span>
        </div>
      </div>
    </article>
  );
}