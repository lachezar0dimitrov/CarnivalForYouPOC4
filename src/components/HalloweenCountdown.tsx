import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

function getNextHalloween(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const thisYear = new Date(year, 9, 31, 0, 0, 0);
  return now < thisYear ? thisYear : new Date(year + 1, 9, 31, 0, 0, 0);
}

function getTimeLeft() {
  const diff = Math.max(0, getNextHalloween().getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2ch] font-display text-2xl font-bold tabular-nums text-gray-100 drop-shadow-[0_0_10px_rgba(217,119,6,0.35)] sm:text-4xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-ember-400 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

// Countdown to the next Halloween (Oct 31), recomputed every second on the
// client — no server/DB dependency, just today's date vs. a fixed calendar day.
export default function HalloweenCountdown() {
  const { t } = useI18n();
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden border-b border-gold-400/15 bg-mystical-radial bg-ink-900">
      {/* Night-sky glow + jack-o'-lanterns, built from theme tokens instead of
          a raster asset so it scales cleanly at every breakpoint. */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold-200/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-center sm:gap-8 sm:px-6 sm:py-7">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="text-2xl sm:text-3xl">🎃</span>
          <span className="font-display text-xl font-bold uppercase tracking-wide text-ember-400 drop-shadow-[0_0_12px_rgba(217,119,6,0.4)] sm:text-2xl">
            {t('home.countdownTitle')}
          </span>
          <span aria-hidden className="text-2xl sm:text-3xl">🎃</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-ink-800/70 px-4 py-3 shadow-glow-sm sm:gap-4 sm:px-6">
          <Digit value={time.days} label={t('home.countdownDays')} />
          <span className="pb-4 text-lg font-bold text-gold-400/40 sm:text-2xl">:</span>
          <Digit value={time.hours} label={t('home.countdownHours')} />
          <span className="pb-4 text-lg font-bold text-gold-400/40 sm:text-2xl">:</span>
          <Digit value={time.minutes} label={t('home.countdownMinutes')} />
          <span className="pb-4 text-lg font-bold text-gold-400/40 sm:text-2xl">:</span>
          <Digit value={time.seconds} label={t('home.countdownSeconds')} />
        </div>
      </div>
    </div>
  );
}
