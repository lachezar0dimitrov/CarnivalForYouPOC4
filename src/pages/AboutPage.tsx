import { Sparkles, Clock, Heart } from 'lucide-react';
import { aboutImage, forestImage } from '@/data/catalog';
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

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('about.eyebrow')}
        title={t('about.title')}
        subtitle={t('about.subtitle')}
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/15 shadow-card">
          <img
            src={aboutImage}
            alt={lang === 'bg' ? 'Магазин за костюми' : 'Costume store'}
            className="h-72 w-full object-cover sm:h-96"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
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

      <div className="relative mt-16 overflow-hidden rounded-3xl">
        <img
          src={forestImage}
          alt={lang === 'bg' ? 'Магическа гора' : 'Magical forest'}
          className="h-64 w-full object-cover sm:h-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-ink-900/70" />
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
