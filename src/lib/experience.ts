// "Над {years} години опит" on the value cards should keep climbing without
// a manual text edit every year. BASE_VALUE is correct for all of BASE_YEAR
// up to (not including) Dec 1; from Dec 1 BASE_YEAR onward it's +1, and +1
// again on every subsequent Dec 1. Update BASE_YEAR/BASE_VALUE together if
// the anchor ever needs correcting (e.g. actual founding date confirmed).
const BASE_YEAR = 2026;
const BASE_VALUE = 17;

export function getYearsOfExperience(date: Date = new Date()): number {
  const year = date.getFullYear();
  const dec1ThisYear = new Date(year, 11, 1);
  const increments = year - BASE_YEAR + (date >= dec1ThisYear ? 1 : 0);
  return BASE_VALUE + increments;
}
