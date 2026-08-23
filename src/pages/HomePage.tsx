import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import { loadCategories, getHomepageCategories, type CategoryMeta } from '@/lib/products';
import { getCurrentSeason } from '@/lib/season';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import HeroFireflies from '@/components/HeroFireflies';
import NewArrivalsRibbon from '@/components/NewArrivalsRibbon';

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
    // No negative margin here at any width -- the hero used to bleed up
    // under the fixed header from lg (1024px) up (cancelling .site-main's
    // padding-top compensation for it), on the assumption that a tall-
    // enough box would absorb a fixed 96px header overlap unnoticed. On a
    // very wide monitor that's true as a *fraction* of the box (the box
    // scales with viewport width, so it's proportionally an even smaller
    // slice there) but the ABSOLUTE 96px chunk of the source photo it
    // hides is the same regardless of viewport width, and on a big
    // screen that's still a visibly cropped-looking strip along the top
    // of the image (moon, treetops, the arch's crown). The banner box
    // now just starts cleanly below the header at every width -- full
    // image, always, matching how mobile already behaves.
    <div className="home-page relative">
      {/* HERO — banner rotator carousel with light overlay & fireflies */}
      <div className="relative mx-auto w-full max-w-[1920px] overflow-hidden">
        <BannerCarousel />

        {/* Fireflies / butterflies layer */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {!isChristmas && <HeroFireflies count={25} />}
        </div>

        {/* Minimal bottom gradient for text contrast */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Categories from DB metadata. Same mx-auto w-full max-w-[1920px]
          wrapper as the banner (no horizontal padding) so this section's
          left/right edges land on the exact same x as the banner's,
          instead of the narrower max-w-7xl column it used to sit in. */}
      <section className="relative z-10 mx-auto w-full max-w-[1920px] py-16 sm:py-24">
        <div className="flex items-center justify-center gap-2.5 sm:gap-3">
          <Sparkles
            size={18}
            className="shrink-0 text-gold-300 drop-shadow-[0_0_8px_rgba(212,175,55,0.65)]"
          />
          {/* Same size as the banner title (text-[clamp(1.25rem,2.5vw,3rem)]) */}
          <span className="font-display text-[clamp(1.25rem,2.5vw,3rem)] font-bold text-[#176b4b] drop-shadow-[0_0_14px_rgba(23,107,75,0.45)]">
            {t('home.categoriesEyebrow')}
          </span>
          <Sparkles
            size={14}
            className="shrink-0 text-[#b93232] drop-shadow-[0_0_8px_rgba(185,50,50,0.6)]"
          />
        </div>

        <div className="mt-10">
          <CategoryGrid
            categories={getHomepageCategories(categories)}
            onSelect={(categoryId) => navigate('products', { category: String(categoryId) })}
            showAll
          />
        </div>
      </section>

      <NewArrivalsRibbon />

      {/* CTA — same mx-auto w-full max-w-[1920px] wrapper (no horizontal
          padding) as the banner/categories above, for the same
          shared-edge reason. The glass panel keeps its own p-8/sm:p-14
          padding so its text doesn't sit flush against the section's
          now-wider edges. */}
      <section className="relative z-10 mx-auto w-full max-w-[1920px] py-16 sm:py-20">
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