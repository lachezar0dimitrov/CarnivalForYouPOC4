import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getNextHalloweenDate } from '@/lib/season';

// Native size of public/images/halloweenCounter.png — locking the wrapper to
// this ratio means the empty frame baked into the artwork always lands under
// the overlay below at the same relative spot, at any viewport width.
const IMAGE_RATIO = 1774 / 477;

function getTimeLeft() {
  const diff = Math.max(0, getNextHalloweenDate().getTime() - Date.now());
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
      <span className="min-w-[1.6ch] font-display text-[clamp(0.9rem,3.6vw,2.75rem)] font-bold tabular-nums text-gray-100 drop-shadow-[0_0_10px_rgba(217,119,6,0.45)]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-[0.3em] text-[clamp(0.45rem,0.9vw,0.7rem)] font-semibold uppercase tracking-widest text-ember-400">
        {label}
      </span>
    </div>
  );
}

// Countdown to the next Halloween (Oct 31 — see getNextHalloweenDate, the
// same boundary the products grid's seasonal sort already uses), overlaid
// onto the empty frame in halloweenCounter.png.
export default function HalloweenCountdown() {
  const { t } = useI18n();
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[1774px] overflow-hidden border-b border-gold-400/15 bg-ink-900"
      style={{ aspectRatio: IMAGE_RATIO }}
    >
      <img
        src="/images/halloweenCounter.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="absolute flex items-center justify-center gap-[2%]"
        style={{ left: '49%', top: '23%', width: '48.5%', height: '50%' }}
      >
        <Digit value={time.days} label={t('home.countdownDays')} />
        <span className="pb-[1.6em] text-[clamp(0.7rem,2.4vw,1.5rem)] font-bold text-gold-400/50">:</span>
        <Digit value={time.hours} label={t('home.countdownHours')} />
        <span className="pb-[1.6em] text-[clamp(0.7rem,2.4vw,1.5rem)] font-bold text-gold-400/50">:</span>
        <Digit value={time.minutes} label={t('home.countdownMinutes')} />
        <span className="pb-[1.6em] text-[clamp(0.7rem,2.4vw,1.5rem)] font-bold text-gold-400/50">:</span>
        <Digit value={time.seconds} label={t('home.countdownSeconds')} />
      </div>
    </div>
  );
}
