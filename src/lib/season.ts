import { fetchSiteSettings } from '@/lib/siteSettings';

// --- Seasonal theme & sorting logic ---
export type Season = 'christmas' | 'halloween' | 'normal';

// Admin-controlled site theme (Admin panel → Theme tab). 'auto' follows the
// real calendar (same date ranges as getCurrentSeason below); 'main' and
// 'christmas' force that look/sorting year-round regardless of date. Add
// new values here (and a matching CHECK constraint + migration, and
// [data-theme="..."] CSS block in index.css) to introduce another seasonal
// theme later — everything else in this file already generalizes to it.
export type ThemeOverride = 'auto' | 'main' | 'christmas';

const VALID_SEASONS: Season[] = ['christmas', 'halloween', 'normal'];

// Cached admin override, loaded once via loadThemeOverride(). Read
// synchronously by getCurrentSeason() so existing (synchronous) call sites
// don't need to change; defaults to 'auto' (pure calendar behavior) until
// the DB fetch resolves.
let themeOverride: ThemeOverride = 'auto';
let loaded = false;
let loadPromise: Promise<ThemeOverride> | null = null;

export function loadThemeOverride(): Promise<ThemeOverride> {
  if (loaded) return Promise.resolve(themeOverride);
  if (loadPromise) return loadPromise;

  loadPromise = fetchSiteSettings()
    .then((settings) => {
      themeOverride = settings?.themeOverride ?? 'auto';
      return themeOverride;
    })
    .catch(() => themeOverride)
    .finally(() => {
      loaded = true;
    });

  return loadPromise;
}

// Lets the admin Theme tab apply a saved change immediately, without a full
// reload, by updating the same cache getCurrentSeason() reads from.
export function setThemeOverrideCache(value: ThemeOverride) {
  themeOverride = value;
  loaded = true;
}

// The shop and every date boundary below are Sofia-local — a visitor's own
// device timezone must never shift which season (or how much Halloween
// countdown) they see. `Date`'s local getters/constructor use the browser's
// OS timezone, which silently breaks that for any visitor not on Bulgarian
// time (e.g. this flips the countdown's target instant by hours, and can
// even flip calendarSeason's verdict for someone right at a date boundary).
const SOFIA_TZ = 'Europe/Sofia';

const sofiaPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SOFIA_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function sofiaParts(date: Date) {
  const parts = Object.fromEntries(
    sofiaPartsFormatter.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month), // 1 - 12
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Converts a Sofia-local wall-clock time (e.g. "Oct 31, 00:00") to the
// correct UTC instant, accounting for EET/EEST DST — Bulgaria's DST
// transition falls in the last week of October, sometimes on Oct 31 itself,
// so this can't be a fixed +2/+3 offset without risking an hour of drift.
// The correction must be done at full (sub-day) precision: comparing only
// the Sofia-vs-UTC *date* would miss the offset entirely whenever the guess
// and the corrected instant fall on the same calendar day, which is exactly
// the case right around a Sofia midnight target like this one.
function sofiaWallClockToUtc(year: number, monthIndex: number, day: number): Date {
  const utcGuess = Date.UTC(year, monthIndex, day, 0, 0, 0);
  const seenInSofia = sofiaParts(new Date(utcGuess));
  const asIfUtc = Date.UTC(
    seenInSofia.year,
    seenInSofia.month - 1,
    seenInSofia.day,
    seenInSofia.hour,
    seenInSofia.minute,
    seenInSofia.second
  );
  return new Date(utcGuess - (asIfUtc - utcGuess));
}

function calendarSeason(): Season {
  const { month, day } = sofiaParts(new Date());

  // Коледа: 1 ноември – 10 януари
  if (month === 11 || month === 12 || (month === 1 && day <= 10)) {
    return 'christmas';
  }

  // Хелоуин: 15 август – 1 ноември
  if ((month === 8 && day >= 15) || month === 9 || month === 10 || (month === 11 && day === 1)) {
    return 'halloween';
  }

  return 'normal';
}

// Same Oct 31 boundary the Halloween window above is built around — kept
// here as the single source of truth so a footer countdown (or anything
// else that needs "how long until Halloween") never drifts from the season
// the products grid actually sorts by, and never needs a yearly manual bump.
// Always Oct 31, 00:00 *Sofia time*, regardless of the visitor's own
// timezone — see sofiaWallClockToUtc above.
export function getNextHalloweenDate(): Date {
  const now = new Date();
  const { year } = sofiaParts(now);
  const thisYear = sofiaWallClockToUtc(year, 9, 31);
  return now < thisYear ? thisYear : sofiaWallClockToUtc(year + 1, 9, 31);
}

export function getCurrentSeason(): Season {
  // QA/demo override: ?season=christmas|halloween|normal forces a season
  // regardless of the real date or the admin setting, for testing/preview.
  if (typeof window !== 'undefined') {
    const override = new URLSearchParams(window.location.search).get('season');
    if (override && (VALID_SEASONS as string[]).includes(override)) {
      return override as Season;
    }
  }

  if (themeOverride === 'christmas') return 'christmas';
  if (themeOverride === 'main') return 'normal';
  return calendarSeason();
}
