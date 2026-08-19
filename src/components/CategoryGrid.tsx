import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { type CategoryMeta, getFeaturedCategories } from '@/lib/products';
import { ArrowRight } from 'lucide-react';

// Touch devices have no meaningful ":hover" — on those, video playback is
// instead driven by scroll visibility (see useAutoplayOnVisible below).
function useSupportsHoverPreview(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setSupported(mq.matches);
    const listener = (e: MediaQueryListEvent) => setSupported(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  return supported;
}

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

// Respect the user's own data preference — Data Saver mode or a visibly slow
// connection (Chrome/Android only; Safari doesn't expose the Network
// Information API, so this is a bonus rather than a guaranteed check).
function usePrefersReducedData(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!connection) return;
    const update = () => {
      const slow = connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType ?? '');
      setReduced(Boolean(slow));
    };
    update();
    connection.addEventListener?.('change', update);
    return () => connection.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

// At most this many category-preview videos play at once. On a phone only
// one or two cards are ever fully visible together anyway, so this keeps
// bandwidth/decoding bounded without needing to be aggressive about it.
const MAX_CONCURRENT_VIDEOS = 2;
const activeVideos = new Set<HTMLVideoElement>();

function requestPlay(video: HTMLVideoElement) {
  if (activeVideos.has(video)) return;
  if (activeVideos.size >= MAX_CONCURRENT_VIDEOS) {
    const oldest = activeVideos.values().next().value;
    if (oldest) {
      oldest.pause();
      activeVideos.delete(oldest);
    }
  }
  activeVideos.add(video);
  video.play().catch(() => {
    // Autoplay can be rejected in rare cases (e.g. low-power mode) — the
    // static image stays visible underneath, so this is a silent no-op.
  });
}

function releasePlay(video: HTMLVideoElement) {
  video.pause();
  activeVideos.delete(video);
}

// Touch-device equivalent of hover: play while the card is meaningfully
// on-screen, pause once it scrolls away. Mirrors the "comes alive" feel of
// desktop hover without requiring a tap.
function useAutoplayOnVisible(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean,
  onActiveChange: (active: boolean) => void
) {
  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestPlay(video);
          onActiveChange(true);
        } else {
          releasePlay(video);
          onActiveChange(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      releasePlay(video);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

type CategoryGridProps = {
  categories: CategoryMeta[];
  onSelect: (categoryId: number) => void;
  selectedId?: string;
  limit?: number;
  showAll?: boolean;
};

const FALLBACK_IMAGES: Record<number, string> = {
  2: '/images/categories/women-carnival-costumes.png',
  3: '/images/categories/men-carnival-costumes.png',
  4: '/images/categories/girls-carnival-costumes.png',
  5: '/images/categories/venetian-masks.png',
  6: '/images/categories/carnival-hats.png',
  7: '/images/categories/carnival-wigs.png',
  8: '/images/categories/carnival-accessories.png',
  10: '/images/categories/halloween-scary-costumes.png',
  17: '/images/categories/boys-carnival-costumes.png',
  19: '/images/categories/baby-costumes-0-3-years.png',
  20: '/images/categories/christmas-carnival-costumes.png',
};

const CATEGORY_VIDEOS: Record<number, string> = {
  2: '/video/womens-carnival-costumes.mp4',
  3: '/video/mens-carnival-costumes.mp4',
  4: '/video/girls-carnival-costumes.mp4',
  17: '/video/boys-carnival-costumes.mp4',
  19: '/video/toddler-carnival-costumes.mp4',
};

function CategoryCardItem({
  category,
  isSelected,
  onSelect,
  lang,
  t,
}: {
  category: CategoryMeta;
  isSelected: boolean;
  onSelect: (id: number) => void;
  lang: string;
  t: (key: string) => string;
}) {
  const image = category.image || FALLBACK_IMAGES[category.id] || '/no-image.svg';
  const videoSrc = CATEGORY_VIDEOS[category.id];
  const supportsHoverPreview = useSupportsHoverPreview();
  const prefersReducedData = usePrefersReducedData();
  const showVideo = Boolean(videoSrc) && !prefersReducedData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);

  useAutoplayOnVisible(videoRef, showVideo && !supportsHoverPreview, setIsActive);

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      onMouseEnter={() => {
        if (!supportsHoverPreview) return;
        videoRef.current?.play();
        setIsActive(true);
      }}
      onMouseLeave={() => {
        if (!supportsHoverPreview) return;
        videoRef.current?.pause();
        setIsActive(false);
      }}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border shadow-card transition-colors duration-300 ${
        isSelected
          ? 'border-gold-400/60 shadow-glow-sm'
          : 'border-gold-400/15'
      }`}
    >
      {/* 1. Снимка - изчезва щом видеото стане активно (hover на десктоп,
          видимост в скрола на мобилно) */}
      <img
        src={image}
        alt={lang === 'bg' ? category.nameBg : category.nameEn}
        className={`h-full w-full object-cover object-center transition-opacity duration-500 ${
          showVideo && isActive ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        onError={(event) => {
          const fallback = FALLBACK_IMAGES[category.id] || '/no-image.svg';
          if (event.currentTarget.src.endsWith(fallback)) return;
          event.currentTarget.src = fallback;
        }}
      />

      {/* 2. Видео - на десктоп зарежда/върти при hover; на мобилно (без
          реален hover) зарежда/върти докато картата се вижда в скрола,
          максимум MAX_CONCURRENT_VIDEOS едновременно. */}
      {showVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          preload="none"
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Градиентен овърлей */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/90" />

      {/* 4. Текст и икона */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-left">
        <h3 className="font-display text-base font-semibold leading-tight text-gold-100">
          {lang === 'bg' ? category.nameBg : category.nameEn}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-300 transition-colors duration-300 group-hover:text-gold-200">
          {isSelected ? '✓ ' : ''}
          {t('home.viewLooks')}
          <ArrowRight size={14} />
        </span>
      </div>

      <span className="absolute right-3 top-3 z-10 h-2 w-2 rounded-full bg-gold-300 shadow-glow-sm transition-opacity duration-500 group-hover:opacity-100" />
    </button>
  );
}

export default function CategoryGrid({
  categories,
  onSelect,
  selectedId,
  limit,
  showAll = false,
}: CategoryGridProps) {
  const { lang, t } = useI18n();
  const visibleCategories = showAll
    ? categories
    : limit != null
      ? categories.slice(0, limit)
      : getFeaturedCategories(categories);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {visibleCategories.map((category) => (
        <CategoryCardItem
          key={category.id}
          category={category}
          isSelected={selectedId === String(category.id)}
          onSelect={onSelect}
          lang={lang}
          t={t}
        />
      ))}
    </div>
  );
}
