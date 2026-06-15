export const FESTIVAL_DATE = '2027-05-29T14:30:00+02:00';
export const FESTIVAL_DAY = '2027-05-29';

const FESTIVAL_TS = new Date(FESTIVAL_DATE).getTime();
const ONE_DAY = 24 * 60 * 60 * 1000;

export const CREW_WINDOW_DAYS_BEFORE = 14;
export const CREW_WINDOW_DAYS_AFTER = 14;

export const CREW_WINDOW_START = new Date(FESTIVAL_TS - CREW_WINDOW_DAYS_BEFORE * ONE_DAY);
export const CREW_WINDOW_END = new Date(FESTIVAL_TS + CREW_WINDOW_DAYS_AFTER * ONE_DAY);

export function isInCrewWindow(date: Date | string): boolean {
  const t = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  return t >= CREW_WINDOW_START.getTime() && t <= CREW_WINDOW_END.getTime();
}

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
