import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { type CategoryMeta, getFeaturedCategories } from '@/lib/products';
import { ArrowRight } from 'lucide-react';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const image = category.image || FALLBACK_IMAGES[category.id] || '/no-image.svg';
  const videoSrc = CATEGORY_VIDEOS[category.id];

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && videoSrc) {
      videoRef.current.pause();
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border shadow-card transition-colors duration-300 ${
        isSelected
          ? 'border-gold-400/60 shadow-glow-sm'
          : 'border-gold-400/15'
      }`}
    >
      {/* 1. Снимка (без зуум/скалиране) */}
      <img
        src={image}
        alt={lang === 'bg' ? category.nameBg : category.nameEn}
        className={`h-full w-full object-cover object-center transition-opacity duration-500 ${
          isHovered && videoSrc ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        onError={(event) => {
          const fallback = FALLBACK_IMAGES[category.id] || '/no-image.svg';
          if (event.currentTarget.src.endsWith(fallback)) return;
          event.currentTarget.src = fallback;
        }}
      />

      {/* 2. Видео */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Градиентен овърлей */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/90" />

      {/* 4. Текст и икона (без зуум/скалиране) */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-left z-10">
        <h3 className="font-display text-base font-semibold leading-tight text-gold-100">
          {lang === 'bg' ? category.nameBg : category.nameEn}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-300 transition-colors duration-300 group-hover:text-gold-200">
          {isSelected ? '✓ ' : ''}
          {t('home.viewLooks')}
          <ArrowRight size={14} />
        </span>
      </div>

      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-gold-300 shadow-glow-sm transition-opacity duration-500 group-hover:opacity-100 z-10" />
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