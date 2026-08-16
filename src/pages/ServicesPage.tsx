import {
  Scissors,
  Brush,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { services } from '@/data/catalog';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

const iconMap: Record<string, LucideIcon> = {
  Scissors,
  Brush,
  Sparkles,
  Users,
};

export default function ServicesPage() {
  const { navigate } = useRouter();
  const { t } = useI18n();

  useSEO({
    title: `${t('services.title')} | CarnivalForYou`,
    description: t('services.subtitle'),
  });

  const steps = [
    { n: '01', t: t('services.step1T'), d: t('services.step1D') },
    { n: '02', t: t('services.step2T'), d: t('services.step2D') },
    { n: '03', t: t('services.step3T'), d: t('services.step3D') },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        subtitle={t('services.subtitle')}
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => {
          const Icon = iconMap[s.icon] ?? Sparkles;
          return (
            <article
              key={s.id}
              className="glass glass-hover group flex flex-col overflow-hidden rounded-2xl"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
                <div className="absolute bottom-3 left-3 inline-flex rounded-xl border border-gold-400/30 bg-ink-900/70 p-2.5 text-gold-300 backdrop-blur-sm">
                  <Icon size={22} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {s.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">
                  {s.description}
                </p>
                <button
                  onClick={() => navigate('contacts')}
                  className="btn-ghost mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                >
                  {t('services.inquire')}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-16">
        <h3 className="text-center font-display text-2xl font-semibold text-gray-100 sm:text-3xl">
          {t('services.processTitle')}
        </h3>
        <div className="mx-auto mt-4 h-px w-20 bg-gold-grad shadow-glow-sm" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="glass rounded-2xl p-6 text-center">
              <span className="font-display text-3xl font-bold text-gold-grad">
                {step.n}
              </span>
              <h4 className="mt-3 font-display text-lg font-semibold text-gray-100">
                {step.t}
              </h4>
              <p className="mt-2 text-sm text-gray-400">{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
