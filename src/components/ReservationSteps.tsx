import { useI18n } from '@/lib/i18n';

// "How reservation works" (01/02/03) — shown at the bottom of both the
// Services and Products pages.
export default function ReservationSteps() {
  const { t } = useI18n();

  const steps = [
    { n: '01', t: t('services.step1T'), d: t('services.step1D') },
    { n: '02', t: t('services.step2T'), d: t('services.step2D') },
    { n: '03', t: t('services.step3T'), d: t('services.step3D') },
  ];

  return (
    <div>
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
  );
}
