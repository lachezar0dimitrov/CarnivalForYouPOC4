import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import { loadCategories, type CategoryMeta } from '@/lib/products';
import { forestImage } from '@/data/catalog';
import SectionHeading from '@/components/SectionHeading';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryGrid from '@/components/CategoryGrid';

export default function HomePage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<CategoryMeta[]>([]);

  useEffect(() => {
    loadCategories().then((cats) => {
      setCategories(cats.filter((cat) => Boolean(cat.image?.trim())));
    });
  }, []);

  useSEO({
    title: t('seo.homeTitle'),
    description: t('seo.homeDesc'),
  });

  return (
    <div className="home-page relative">
      {/* HERO — banner rotator carousel */}
      <BannerCarousel />

      {/* Categories from DB metadata */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow={t('home.categoriesEyebrow')}
          title={t('home.categoriesTitle')}
          subtitle={t('home.categoriesSubtitle')}
        />

        <div className="mt-10">
          <CategoryGrid
            categories={categories}
            onSelect={(categoryId) => navigate('products', undefined, { category: String(categoryId) })}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-moss-500/20 blur-3xl" />
          <h3 className="relative font-display text-2xl font-semibold text-gray-100 sm:text-3xl">
            {t('home.ctaTitle')}
          </h3>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-gray-400 sm:text-base">
            {t('home.ctaBody')}
          </p>
          <button
            onClick={() => navigate('contacts')}
            className="btn-gold relative mt-7 inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm"
          >
            <Sparkles size={18} />
            {t('home.ctaButton')}
          </button>
        </div>
      </section>
    </div>
  );
}
