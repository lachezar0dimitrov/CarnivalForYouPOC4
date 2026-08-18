import { Calendar, ArrowRight } from 'lucide-react';
import { newsPosts } from '@/data/catalog';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

export default function NewsPage() {
  const { navigate } = useRouter();
  const { t } = useI18n();

  useSEO({
    title: `${t('news.title')} | CarnivalForYou`,
    description: t('news.subtitle'),
  });

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('news.eyebrow')}
        title={t('news.title')}
        subtitle={t('news.subtitle')}
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {newsPosts.map((post) => (
          <article
            key={post.id}
            className="glass glass-hover group flex flex-col overflow-hidden rounded-2xl sm:flex-row"
          >
            <div className="relative h-52 shrink-0 overflow-hidden sm:h-auto sm:w-2/5">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 to-transparent sm:bg-gradient-to-r" />
              <span className="absolute left-3 top-3 rounded-full bg-gold-400/90 px-3 py-1 text-xs font-semibold text-ink-900">
                {post.category}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={14} className="text-gold-300" />
                {post.date}
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-gold-100 clamp-2">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400 clamp-3">
                {post.excerpt}
              </p>
              <button
                onClick={() => navigate('contacts')}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-300 transition hover:gap-2.5 hover:text-gold-200"
              >
                {t('news.readMore')}
                <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
