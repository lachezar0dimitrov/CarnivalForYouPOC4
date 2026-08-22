import { Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

const CONSENT_KEY = 'cfy-cookie-consent';

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 animate-fadeUp">
      {/* Solid background, not .glass — this is a one-click utility banner,
          not decorative chrome, and translucency made the page text behind
          it bleed through and hurt readability. */}
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-gold-400/25 bg-ink-800 p-5 shadow-glow-lg sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <div className="flex shrink-0 items-start gap-3 sm:items-center">
          <div className="inline-flex rounded-xl border border-gold-400/20 bg-gold-400/5 p-2.5 text-gold-300">
            <Cookie size={22} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold text-gold-100">
            {t('cookie.title')}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {t('cookie.body')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 sm:flex-col sm:items-stretch">
          <button
            onClick={() => decide('accepted')}
            className="btn-gold flex-1 rounded-full px-5 py-2.5 text-sm sm:flex-none"
          >
            {t('cookie.accept')}
          </button>
          <button
            onClick={() => decide('declined')}
            className="btn-ghost flex-1 rounded-full px-5 py-2.5 text-sm sm:flex-none"
          >
            {t('cookie.decline')}
          </button>
        </div>
        <button
          onClick={() => decide('declined')}
          className="absolute right-3 top-3 text-gray-500 transition hover:text-gray-300 sm:hidden"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
