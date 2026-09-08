import { useI18n } from '@/lib/i18n';
import { type Product } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';

// Static grid, not a marquee — an admin curates this set by ticking
// "Популярен костюм" on however many products they like (see is_popular /
// fetchPopularProducts in src/lib/products.ts), so there's no long list to
// loop-scroll through; the grid just wraps to more rows as more get flagged.
// Renders nothing while loading or if nothing is flagged yet — same "don't
// show a broken empty section" rule as the New Arrivals ribbon.
export default function PopularCostumes({ products }: { products: Product[] }) {
  const { t } = useI18n();

  if (products.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto w-full max-w-[1920px] px-4 pb-4 pt-16 sm:px-6 sm:pt-20 lg:px-8">
      <SectionHeading title={t('home.popularCostumesTitle')} />

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
