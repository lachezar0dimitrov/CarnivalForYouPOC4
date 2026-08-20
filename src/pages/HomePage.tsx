import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import { loadCategories, getHomepageCategories, type CategoryMeta } from '@/lib/products';
import { getCurrentSeason } from '@/lib/season';
import SectionHeading from '@/components/SectionHeading';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import HeroFireflies from '@/components/HeroFireflies';

export default function HomePage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const isChristmas = getCurrentSeason() === 'christmas';

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
    <div className="home-page relative -mt-20 sm:-mt-24">
      {/* HERO — banner rotator carousel with light overlay & fireflies */}
      <div className="relative w-full overflow-hidden">
        <BannerCarousel />

        {/* Fireflies / butterflies layer */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {!isChristmas && <HeroFireflies count={25} />}
        </div>

        {/* Minimal bottom gradient for text contrast */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Categories from DB metadata */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 2xl:max-w-[2184px]">
        <SectionHeading
          eyebrow={t('home.categoriesEyebrow')}
          title={t('home.categoriesTitle')}
          subtitle={t('home.categoriesSubtitle')}
        />

        <div className="mt-10">
          <CategoryGrid
            categories={getHomepageCategories(categories)}
            onSelect={(categoryId) => navigate('products', { category: String(categoryId) })}
            showAll
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 2xl:max-w-[1680px]">
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