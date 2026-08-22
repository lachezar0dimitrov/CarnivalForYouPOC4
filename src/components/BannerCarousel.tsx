import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { fetchActiveBanners, type Banner } from '@/lib/banners';
import { getCurrentSeason } from '@/lib/season';
import HeroFireflies from '@/components/HeroFireflies';

export default function BannerCarousel() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  // Christmas skips the gold/green hero sparkles — the page-wide falling-snow
  // overlay (Snowflakes.tsx, rendered above everything in App.tsx) covers the
  // hero too, so a second hero-local particle layer would be redundant.
  const isChristmas = getCurrentSeason() === 'christmas';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActiveBanners()
      .then((data) => {
        if (cancelled) return;
        setBanners(data);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const next = () => {
    setCurrent((c) => (c + 1) % Math.max(banners.length, 1));
  };

  const prev = () => {
    setCurrent((c) => (c - 1 + banners.length) % Math.max(banners.length, 1));
  };

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Fallback: if no banners loaded, show the static forest background
  if (!loaded || banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-mystical-radial" />
        {!isChristmas && <HeroFireflies count={20} />}
        <div className="relative z-20 flex min-h-[50vh] flex-col items-center justify-center px-4 text-center md:min-h-[80vh]">
          <h1 className="font-display text-2xl font-bold leading-tight text-gray-100 sm:text-3xl md:text-4xl lg:text-5xl">
            {t('home.heroTitle1')}
            <br />
            <span className="text-magic-grad">{t('home.heroTitle2')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm text-gray-300 sm:text-base">
            {t('home.heroBody')}
          </p>
        </div>
      </section>
    );
  }

  // The whole banner is one click target now (the old "find your look" CTA
  // button was removed). Falls back to the products page — whose category
  // grid sits at the top — when a banner has no admin-configured link.
  const handleClick = (linkUrl: string) => {
    if (!linkUrl) {
      navigate('products');
      return;
    }
    if (linkUrl.startsWith('products')) {
      const queryPart = linkUrl.split('?')[1];
      const params: Record<string, string> = {};
      if (queryPart) {
        new URLSearchParams(queryPart).forEach((v, k) => {
          params[k] = v;
        });
      }
      navigate('products', undefined, params);
    } else if (linkUrl === 'contacts') {
      navigate('contacts');
    } else if (linkUrl === 'about') {
      navigate('about');
    }
  };

  return (
    <section className="banner-box relative w-full overflow-hidden">
      {/* Crossfade slides */}
      <div className="absolute inset-0">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`banner-slide ${i === current ? 'active' : ''}`}
          >
            <img
              src={banner.imageUrl}
              alt={lang === 'bg' ? banner.titleBg : banner.titleEn}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {!isChristmas && <HeroFireflies count={24} />}

      {/* Full-bleed click target: the entire banner navigates, replacing the
          old CTA button. Sits under the text overlay (which is
          pointer-events-none so clicks fall through to here) and under the
          slide dots, which are a sibling at a higher z-index and therefore
          still clickable on their own. */}
      <button
        type="button"
        onClick={() => handleClick(banners[current]?.linkUrl ?? '')}
        aria-label={t('home.findLook')}
        className="absolute inset-0 z-20 cursor-pointer"
      />

      {/* Slide content overlay */}
      <div className="pointer-events-none relative z-20 flex min-h-[50vh] flex-col items-center justify-end px-4 pb-[clamp(9rem,17vw,31rem)] text-center md:min-h-0 md:h-full">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            // bottom-8 on mobile keeps the subtitle clear of the slide dots:
            // the dots sit bottom-left, which used to clear the centered CTA
            // button, but with that button gone the full-width mobile subtitle
            // now reaches down into their row. Desktop centres the text in a
            // narrower column, so it never reaches the dots there.
            className={`absolute inset-x-4 bottom-8 flex flex-col items-center transition-all duration-1000 sm:bottom-0 ${
              i === current
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-4 opacity-0'
            }`}
          >
            {/* Fixed colors, not themed tokens — sits directly on an admin-
                uploaded banner photo, unrelated to the site's light/dark theme.
                Sized with clamp()/vw instead of breakpoint steps: .banner-box
                locks to a 16:9 ratio from md up, so the banner itself keeps
                growing with viewport width on wide monitors — text capped at
                a fixed breakpoint size (e.g. lg:text-4xl) stopped growing
                past 1024px and looked proportionally smaller on anything
                wider. The vw coefficients below are tuned so the max size
                (the plateau) is reached right around 1920px — the single
                most common desktop resolution — rather than an arbitrary
                point; anything wider just gets more background, the text
                doesn't keep growing, and anything narrower scales down
                smoothly toward that same reference look. The title's own
                scale was then dialled back (it plateaued at 5rem, which
                overpowered the photography) while keeping that same
                reach-the-cap-at-1920px shape. */}
            <h1 className="font-display text-[clamp(1.25rem,2.5vw,3rem)] font-bold leading-tight text-[#f7e9b8] drop-shadow-lg">
              {lang === 'bg' ? banner.titleBg : banner.titleEn}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[clamp(0.875rem,1.25vw,1.5rem)] text-[#e5e7eb] drop-shadow">
              {lang === 'bg' ? banner.subtitleBg : banner.subtitleEn}
            </p>
          </div>
        ))}
      </div>

      {/* Navigation dots — bottom-left so they never overlap the centered CTA */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2 sm:bottom-5 sm:left-6">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-7 bg-gold-300 shadow-glow-sm sm:w-8'
                  : 'w-2 bg-gold-400/30 hover:bg-gold-400/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}