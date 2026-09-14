import type { CategoryOption } from './categories';

// Best-effort category guess from the scraped title/breadcrumb tags/
// description — this only pre-checks a couple of checkbox columns in the
// Excel sheet. The admin Import panel (AdminPage.tsx) re-validates the
// final checked category names against the real `categories` table before
// allowing upload, so a wrong or missing guess just means the admin ticks a
// different box, never a silent bad import.
//
// Retail copy often drops the apostrophe ("adult mens costume", "womens
// fancy dress") or pluralizes loosely, so "men"/"women" need optional
// 's/'s suffixes rather than a strict \bmen\b word match.
export function guessCategoryNames(
  categories: CategoryOption[],
  title: string,
  tags: string[],
  description = ''
): string[] {
  const text = `${title} ${tags.join(' ')} ${description}`.toLowerCase();

  const byNameEn = (re: RegExp) => categories.find((c) => re.test(c.nameEn));

  let primary: CategoryOption | undefined;
  if (/toddler|infant|baby|newborn/.test(text)) primary = byNameEn(/^toddler/i);
  else if (/\bgirls?\b/.test(text)) primary = byNameEn(/^girl/i);
  else if (/\bboys?\b/.test(text)) primary = byNameEn(/^boy/i);
  else if (/\bwomen'?s?\b|\bladies\b|\bfemale\b/.test(text)) primary = byNameEn(/^women/i);
  else if (/\bmen'?s?\b|\bmale\b/.test(text)) primary = byNameEn(/^men/i);
  else if (/\bwig\b/.test(text)) primary = byNameEn(/^wig/i);
  else if (/\bmask\b/.test(text)) primary = byNameEn(/^mask/i);
  else if (/\bhat\b/.test(text)) primary = byNameEn(/^hat/i);
  else if (/\bglove|\bcane\b|\bcigarette holder\b|\baccessor/.test(text)) primary = byNameEn(/^accessor/i);

  // A more specific theme (a named franchise, pirates, historical, retro,
  // fairytale) is a more useful pre-check than the generic "Halloween" tag
  // that applies to most spooky costumes in this catalog anyway — checked
  // last, only as a fallback when nothing more specific matched.
  let theme: CategoryOption | undefined;
  if (/star wars|marvel|dc comics|batman|mortal kombat|harry potter|gryffindor|teenage mutant ninja turtles|how to train your dragon|minion|despicable me/.test(text)) {
    theme = byNameEn(/^licen/i);
  } else if (/\bpirate\b/.test(text)) {
    theme = byNameEn(/^pirat/i);
  } else if (/roman senator|medieval|king arthur|judge'?s gown/.test(text)) {
    theme = byNameEn(/^histor/i);
  } else if (/\b70s\b|1920s|disco|retro/.test(text)) {
    theme = byNameEn(/^retro/i);
  } else if (/fairytale|red riding hood|gothic alice|princess/.test(text)) {
    theme = byNameEn(/^fairy/i) ?? categories.find((c) => c.nameBg === 'Приказни');
  } else if (/\bclown\b/.test(text)) {
    theme = categories.find((c) => c.nameBg === 'Забавни костюми');
  } else if (/christmas|xmas/.test(text)) {
    theme = byNameEn(/^christmas/i);
  } else if (/halloween/.test(text)) {
    theme = byNameEn(/^halloween/i);
  }

  return [primary?.nameBg, theme?.nameBg].filter((n): n is string => Boolean(n));
}
