import { Sparkles, Clock, Heart, Users, PartyPopper } from 'lucide-react';
import { forestImage } from '@/data/catalog';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

export default function AboutPage() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();

  useSEO({
    title: `${t('about.title')} | CarnivalForYou`,
    description: t('about.subtitle'),
  });

  const values = [
    { icon: Sparkles, title: t('about.v1Title'), text: t('about.v1Body') },
    { icon: Clock, title: t('about.v2Title'), text: t('about.v2Body') },
    { icon: Heart, title: t('about.v3Title'), text: t('about.v3Body') },
  ];

  const heroList = [
    t('about.hero1'),
    t('about.hero2'),
    t('about.hero3'),
    t('about.hero4'),
    t('about.hero5'),
  ];

  const occasions = [
    t('about.occasion1'),
    t('about.occasion2'),
    t('about.occasion3'),
    t('about.occasion4'),
    t('about.occasion5'),
    t('about.occasion6'),
    t('about.occasion7'),
    t('about.occasion8'),
    t('about.occasion9'),
  ];

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
        {t('about.hookBody')}
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/15 shadow-card">
          <img
            src="/images/shop2.jpg"
            alt={lang === 'bg' ? 'Изложение с костюми в карнавалната къща' : 'Costume showroom display'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-2xl font-semibold text-gold-100">
            {t('about.storyTitle')}
          </h3>
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            {t('about.story1')}
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            {t('about.story2')}
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="glass rounded-2xl p-6 sm:p-8 md:order-1">
          <h3 className="font-display text-xl font-semibold text-gold-100 sm:text-2xl">
            {t('about.heroListTitle')}
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
            src="/images/shop.jpg"
            alt={lang === 'bg' ? 'Карнавална къща за костюми' : 'Costume carnival house'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      <div className="mt-16 space-y-4 text-center">
        <h3 className="mx-auto max-w-2xl font-display text-2xl font-semibold text-gold-100">
          {t('about.offerTitle')}
        </h3>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
          {t('about.offerBody')}
        </p>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400">
          {t('about.addonsBody')}
        </p>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-gold-400/15 shadow-card">
          <img
            src="/images/shop3.jpg"
            alt={lang === 'bg' ? 'Пробна със огледала' : 'Fitting room with mirrors'}
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
            {t('about.originTitle')}
          </h3>
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            {t('about.originBody')}
          </p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8 md:order-1">
          <div className="mb-4 inline-flex items-center gap-2 text-gold-300">
            <PartyPopper size={20} />
            <h4 className="font-display text-lg font-semibold text-gray-100">
              {t('about.occasionsTitle')}
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
        {t('about.closingBody')}
      </p>

      <div className="relative mt-8 overflow-hidden rounded-3xl">
        <img
          src={forestImage}
          alt={lang === 'bg' ? 'Магическа гора' : 'Magical forest'}
          className="h-64 w-full object-cover sm:h-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="max-w-xl text-center font-serif text-xl italic leading-relaxed text-gold-100 sm:text-2xl">
            {t('about.quote')}
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
