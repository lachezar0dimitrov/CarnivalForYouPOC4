import { useEffect, useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { fetchActiveNewsPosts, type NewsPostRecord } from '@/lib/newsPosts';
import { fetchSiteSettings } from '@/lib/siteSettings';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';

// Content is stored as plain text: blank lines separate paragraphs, a line
// starting with "## " renders as a sub-heading, and single newlines inside
// a paragraph render as <br /> (used for short list-style lines).
function NewsContent({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h4 key={i} className="font-display text-base font-semibold text-gold-100">
              {block.slice(3).trim()}
            </h4>
          );
        }
        const lines = block.split('\n');
        return (
          <p key={i} className="text-sm leading-relaxed text-gray-400">
            {lines.map((line, j) => (
              <span key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function NewsPage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [newsPosts, setNewsPosts] = useState<NewsPostRecord[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useSEO({
    title: `${t('news.title')} | CarnivalForYou`,
    description: t('news.subtitle'),
  });

  useEffect(() => {
    fetchActiveNewsPosts().then(setNewsPosts).catch(() => setNewsPosts([]));
    fetchSiteSettings()
      .then((s) => {
        if (s && !s.newsPageEnabled) navigate('home');
      })
      .catch(() => {});
  }, [navigate]);

  const dateFormatter = new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Toggling either direction returns the viewport to the same spot the
  // page loads at, so the expanded card always opens flush against the top
  // (see reorder below) and hiding it feels like a fresh visit to the page.
  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The expanded post (if any) is always rendered first so it opens at the
  // top of the grid — spanning both columns — with every other post
  // pushed below it, regardless of that post's original position.
  const orderedPosts =
    expandedId != null
      ? [
          ...newsPosts.filter((p) => p.id === expandedId),
          ...newsPosts.filter((p) => p.id !== expandedId),
        ]
      : newsPosts;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 2xl:max-w-[1680px]">
      {/* Hidden rather than visible: this page deliberately opens straight
          into the article grid, so the h1 exists for crawlers and screen
          readers without adding a heading the design doesn't have. */}
      <h1 className="sr-only">{t('news.title')}</h1>

      <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {orderedPosts.map((post) => {
          const title = lang === 'bg' ? post.titleBg : post.titleEn;
          const excerpt = lang === 'bg' ? post.excerptBg : post.excerptEn;
          const content = lang === 'bg' ? post.contentBg : post.contentEn;
          const isExpanded = expandedId === post.id;

          return (
            <article
              key={post.id}
              onClick={() => toggleExpanded(post.id)}
              className={`glass glass-hover group flex cursor-pointer flex-col overflow-hidden rounded-2xl ${
                isExpanded ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="relative w-full shrink-0">
                <img
                  src={post.imageUrl}
                  alt={title}
                  className="block h-auto w-full"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold-400/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-gold-400/70" />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} className="text-gold-300" />
                  {dateFormatter.format(new Date(post.postDate))}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-gold-100">
                  {title}
                </h3>
                <div className="mt-2 flex-1">
                  {!isExpanded && (
                    <p className="text-sm leading-relaxed text-gray-400 clamp-3">{excerpt}</p>
                  )}
                </div>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gold-400/10 pt-4">
                      <NewsContent text={content} />
                    </div>
                  </div>
                </div>

                <button
                  className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-gold-300 transition hover:gap-2.5 hover:text-gold-200"
                >
                  {isExpanded ? t('news.showLess') : t('news.readMore')}
                  <ArrowRight size={15} className={`transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
