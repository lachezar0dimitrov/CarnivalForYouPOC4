import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

// 00:00, 16.10.2026, Europe/Sofia (UTC+3 in mid-October, still EEST) --
// baked in as an explicit offset so the target instant doesn't shift with
// the visitor's or server's own timezone.
const TARGET_MS = new Date('2026-10-16T00:00:00+03:00').getTime();

function getRemaining() {
  const diffMs = TARGET_MS - Date.now();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diffMs <= 0,
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Sits inside the empty gold plate baked into baner_valia1.png -- position
// below is that plate's exact bounding box (measured off the 1672x941
// source), not a general banner feature, so it's a fixed overlay rather
// than something driven by banner data. Rendered only for that one banner
// (see BannerCarousel's HALLOWEEN_VALIA_BANNER_ID).
export default function BannerCountdown() {
  const { lang } = useI18n();
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (remaining.done) return null;

  const unit = (value: number, bg: string, en: string) =>
    `${value}${lang === 'bg' ? bg : en}`;

  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center justify-center"
      style={{ left: '10.2%', top: '62.2%', width: '19.3%', height: '6.5%' }}
    >
      <span
        className="font-display font-bold text-[#2a1608] drop-shadow-[0_1px_0_rgba(255,244,210,0.35)]"
        style={{ fontSize: 'clamp(0.6rem, 2vw, 2.4rem)', letterSpacing: '0.02em' }}
      >
        {unit(remaining.days, 'д ', 'd ')}
        {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
      </span>
    </div>
  );
}
