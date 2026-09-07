import { useEffect, useState, type ReactNode } from 'react';
import {
  Scissors,
  Brush,
  Sparkles,
  Users,
  Camera,
  Gift,
  PenTool,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { fetchActiveServices, type Service } from '@/lib/services';
import { fetchSiteSettings } from '@/lib/siteSettings';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import ReservationSteps from '@/components/ReservationSteps';

const iconMap: Record<string, LucideIcon> = {
  Scissors,
  Brush,
  Sparkles,
  Users,
  Camera,
  Gift,
  PenTool,
};

// Content is stored as plain text: blank lines separate paragraphs, a line
// starting with "## " renders as a sub-heading, and single newlines inside
// a paragraph render as <br /> (same format as NewsPage's article content).
// Gallery images are spread out evenly between the text blocks so the
// expanded card reads as photos interleaved through the copy.
function ServiceContent({ text, images }: { text: string; images: string[] }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const totalSlots = images.length + 1;
  const step = Math.max(1, Math.ceil(blocks.length / totalSlots));

  const nodes: ReactNode[] = [];
  let imgIndex = 0;

  blocks.forEach((block, i) => {
    if (block.startsWith('## ')) {
      nodes.push(
        <h4 key={`b-${i}`} className="font-display text-base font-semibold text-gold-100">
          {block.slice(3).trim()}
        </h4>
      );
    } else {
      const lines = block.split('\n');
      nodes.push(
        <p key={`b-${i}`} className="text-sm leading-relaxed text-gray-400">
          {lines.map((line, j) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    }

    const isLastBlock = i === blocks.length - 1;
    if (!isLastBlock && imgIndex < images.length && (i + 1) % step === 0) {
      nodes.push(
        <img
          key={`img-${imgIndex}`}
          src={images[imgIndex]}
          alt=""
          loading="lazy"
          className="w-full rounded-xl border border-gold-400/15 object-cover"
        />
      );
      imgIndex++;
    }
  });

  while (imgIndex < images.length) {
    nodes.push(
      <img
        key={`img-${imgIndex}`}
        src={images[imgIndex]}
        alt=""
        loading="lazy"
        className="w-full rounded-xl border border-gold-400/15 object-cover"
      />
    );
    imgIndex++;
  }

  return <div className="space-y-4">{nodes}</div>;
}

export default function ServicesPage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useSEO({
    title: `${t('services.title')} | CarnivalForYou`,
    description: t('services.subtitle'),
  });

  useEffect(() => {
    fetchActiveServices().then(setServices).catch(() => setServices([]));
    fetchSiteSettings()
      .then((s) => {
        if (s && !s.servicesPageEnabled) navigate('home');
      })
      .catch(() => {});
  }, [navigate]);

  // Same expand-in-place behavior as NewsPage: toggling scrolls back to the
  // top and the expanded card is always reordered first so it opens flush
  // against the top of the grid, spanning full width.
  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const orderedServices =
    expandedId != null
      ? [
          ...services.filter((s) => s.id === expandedId),
          ...services.filter((s) => s.id !== expandedId),
        ]
      : services;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 2xl:max-w-[1680px]">
      <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {orderedServices.map((s) => {
          const Icon = iconMap[s.icon] ?? Sparkles;
          const title = lang === 'bg' ? s.titleBg : s.titleEn;
          const description = lang === 'bg' ? s.descriptionBg : s.descriptionEn;
          const content = lang === 'bg' ? s.contentBg : s.contentEn;
          const isExpanded = expandedId === s.id;
          const hasContent = content.trim().length > 0;

          return (
            <article
              key={s.id}
              onClick={() => hasContent && toggleExpanded(s.id)}
              className={`glass glass-hover group flex flex-col overflow-hidden rounded-2xl ${
                hasContent ? 'cursor-pointer' : ''
              } ${isExpanded ? 'sm:col-span-2 lg:col-span-4' : ''}`}
            >
              <div className="relative w-full shrink-0">
                <img
                  src={s.imageUrl}
                  alt={title}
                  className="block h-auto w-full"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold-400/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-gold-400/70" />
                <div className="absolute bottom-3 left-3 inline-flex rounded-xl border border-gold-400/30 bg-black/70 p-2.5 text-gold-300 backdrop-blur-sm">
                  <Icon size={22} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">
                  {description}
                </p>

                {hasContent && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className={`${isExpanded ? 'sm:columns-2 sm:gap-6' : ''} border-t border-gold-400/10 pt-4`}>
                        <ServiceContent text={content} images={s.galleryImages} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('contacts');
                    }}
                    className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  >
                    {t('services.inquire')}
                  </button>
                  {hasContent && (
                    <button className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-gold-300 transition hover:gap-2.5 hover:text-gold-200">
                      {isExpanded ? t('news.showLess') : t('news.readMore')}
                      <ArrowRight size={15} className={`transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-16">
        <ReservationSteps />
      </div>
    </div>
  );
}
