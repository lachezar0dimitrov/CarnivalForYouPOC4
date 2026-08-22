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

function calendarSeason(): Season {
  const now = new Date();
  const month = now.getMonth() + 1; // 1 - 12
  const day = now.getDate();

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
export function getNextHalloweenDate(): Date {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 9, 31, 0, 0, 0);
  return now < thisYear ? thisYear : new Date(now.getFullYear() + 1, 9, 31, 0, 0, 0);
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
