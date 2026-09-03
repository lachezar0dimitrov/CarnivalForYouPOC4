import { useEffect, useState } from 'react';
import { Sparkles, Clock, Heart, Users, PartyPopper, type LucideIcon } from 'lucide-react';
import { fetchAboutContent, type AboutContent } from '@/lib/aboutContent';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

const valueIconMap: Record<string, LucideIcon> = { Sparkles, Clock, Heart };

export default function AboutPage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [content, setContent] = useState<AboutContent | null>(null);

  useSEO({
    title: `${t('about.title')} | CarnivalForYou`,
    description: t('about.subtitle'),
  });

  useEffect(() => {
    fetchAboutContent().then(setContent).catch(() => setContent(null));
  }, []);

  if (!content) return null;

  const bg = lang === 'bg';
  const values = content.valuesList.map((v) => ({
    icon: valueIconMap[v.icon] ?? Sparkles,
    title: bg ? v.titleBg : v.titleEn,
    text: bg ? v.bodyBg : v.bodyEn,
  }));
  const heroList = content.heroList.map((item) => (bg ? item.bg : item.en));
  const occasions = content.occasions.map((item) => (bg ? item.bg : item.en));

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow={t('about.eyebrow')}
          title={t('about.title')}
          subtitle={t('about.subtitle')}
        />
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-gray-400 sm:text-base">
        {bg ? content.hookBodyBg : content.hookBodyEn}
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/15 shadow-card">
          <img
            src={content.storyImageUrl}
            alt={bg ? 'Изложение с костюми в карнавалната къща' : 'Costume showroom display'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-2xl font-semibold text-gold-100">
            {bg ? content.storyTitleBg : content.storyTitleEn}
          </h3>
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            {bg ? content.story1Bg : content.story1En}
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            {bg ? content.story2Bg : content.story2En}
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="glass rounded-2xl p-6 sm:p-8 md:order-1">
          <h3 className="font-display text-xl font-semibold text-gold-100 sm:text-2xl">
            {bg ? content.heroListTitleBg : content.heroListTitleEn}
          </h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {heroList.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-gray-300 sm:text-base"
              >
                <Sparkles size={16} className="mt-1 shrink-0 text-gold-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-gold-400/15 shadow-card md:order-2">
          <img
            src={content.heroImageUrl}
            alt={bg ? 'Карнавална къща за костюми' : 'Costume carnival house'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      <div className="mt-16 space-y-4 text-center">
        <h3 className="mx-auto max-w-2xl font-display text-2xl font-semibold text-gold-100">
          {bg ? content.offerTitleBg : content.offerTitleEn}
        </h3>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
          {bg ? content.offerBodyBg : content.offerBodyEn}
        </p>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400">
          {bg ? content.addonsBodyBg : content.addonsBodyEn}
        </p>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-gold-400/15 shadow-card">
          <img
            src={content.offerImageUrl}
            alt={bg ? 'Пробна със огледала' : 'Fitting room with mirrors'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="glass glass-hover rounded-2xl p-6">
            <div className="mb-4 inline-flex rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-gold-300">
              <v.icon size={24} />
            </div>
            <h4 className="font-display text-lg font-semibold text-gray-100">
              {v.title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4 md:order-2">
          <div className="mb-2 inline-flex rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-gold-300">
            <Users size={24} />
          </div>
          <h3 className="font-display text-2xl font-semibold text-gold-100">
            {bg ? content.originTitleBg : content.originTitleEn}
          </h3>
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            {bg ? content.originBodyBg : content.originBodyEn}
          </p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8 md:order-1">
          <div className="mb-4 inline-flex items-center gap-2 text-gold-300">
            <PartyPopper size={20} />
            <h4 className="font-display text-lg font-semibold text-gray-100">
              {bg ? content.occasionsTitleBg : content.occasionsTitleEn}
            </h4>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {occasions.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-gray-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-16 max-w-xl text-center text-sm leading-relaxed text-gray-400 sm:text-base">
        {bg ? content.closingBodyBg : content.closingBodyEn}
      </p>

      <div className="relative mt-8 overflow-hidden rounded-3xl">
        <img
          src={content.forestImageUrl}
          alt={bg ? 'Магическа гора' : 'Magical forest'}
          className="h-64 w-full object-cover sm:h-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="max-w-xl text-center font-serif text-xl italic leading-relaxed text-gold-100 sm:text-2xl">
            {bg ? content.quoteBg : content.quoteEn}
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => navigate('products')}
          className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm"
        >
          <Sparkles size={18} />
          {t('about.browseBtn')}
        </button>
      </div>
    </div>
  );
}
