import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useRouter } from '@/lib/router';
import { fetchNewProducts, productName, type Product } from '@/lib/products';
import SectionHeading from '@/components/SectionHeading';

function RibbonCard({ product, name }: { product: Product; name: string }) {
  const { navigate } = useRouter();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => navigate('product-detail', String(product.id))}
      className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-gold-400/15 bg-ink-900/60 shadow-card transition hover:border-gold-400/40 sm:w-48"
    >
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-error/90 px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-glow-sm">
        <Sparkles size={10} />
        NEW
      </span>
      <div className="aspect-[2/3] w-full overflow-hidden bg-white/5">
        <img
          src={product.imageUrl ?? ''}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-2.5 text-left sm:p-3">
        <p className="clamp-1 text-xs font-medium text-gray-200 sm:text-sm">{name}</p>
        <p className="mt-0.5 text-xs font-semibold text-gold-300">
          {product.price.toFixed(0)} {t('common.eur')}
        </p>
      </div>
    </button>
  );
}

// Right-to-left scrolling strip of admin-flagged "new" products, sitting
// above the closing CTA. Renders nothing if there are no new products —
// an empty ribbon with a heading and no content would look broken.
export default function NewArrivalsRibbon() {
  const { t, lang } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchNewProducts(20)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || products.length === 0) return null;

  // Duplicated once for a seamless loop (the track scrolls exactly -50%,
  // i.e. one full copy, then resets with no visible jump).
  const track = [...products, ...products];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 pb-4 pt-16 sm:px-6 sm:pt-20 2xl:max-w-[1680px]">
      <SectionHeading
        eyebrow={t('home.newArrivalsEyebrow')}
        title={t('home.newArrivalsTitle')}
      />

      <div className="marquee-mask relative mt-10 overflow-hidden">
        <div
          className="marquee-track flex w-max gap-4"
          style={{ ['--marquee-duration' as string]: `${products.length * 4}s` }}
        >
          {track.map((product, i) => (
            <RibbonCard
              key={`${product.id}-${i}`}
              product={product}
              name={productName(product, lang)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
