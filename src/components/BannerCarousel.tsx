import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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

  const handleClick = (linkUrl: string) => {
    if (!linkUrl) return;
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

      {/* Slide content overlay */}
      <div className="relative z-20 flex min-h-[50vh] flex-col items-center justify-end px-4 pb-[clamp(5rem,14vw,18rem)] text-center md:min-h-0 md:h-full">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-x-4 bottom-0 flex flex-col items-center transition-all duration-1000 ${
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
                smoothly toward that same reference look. */}
            <h1 className="font-display text-[clamp(1.5rem,4.2vw,5rem)] font-bold leading-tight text-[#f7e9b8] drop-shadow-lg">
              {lang === 'bg' ? banner.titleBg : banner.titleEn}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[clamp(0.875rem,1.25vw,1.5rem)] text-[#e5e7eb] drop-shadow">
              {lang === 'bg' ? banner.subtitleBg : banner.subtitleEn}
            </p>
            {banner.linkUrl && (
              <button
                onClick={() => handleClick(banner.linkUrl)}
                className="btn-gold mt-4 inline-flex items-center gap-2 rounded-full px-[clamp(1.25rem,2.1vw,2.5rem)] py-[clamp(0.65rem,0.92vw,1.1rem)] text-[clamp(0.75rem,1.05vw,1.25rem)] sm:mt-5"
              >
                {t('home.findLook')}
                <ArrowRight size={16} />
              </button>
            )}
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