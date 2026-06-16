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

// Monate, die der Crew-Kalender standardmäßig zeigt. Decken das
// gesamte Crew-Fenster ab.
export const CREW_CALENDAR_MONTHS: { year: number; month: number }[] = [
  { year: 2027, month: 4 }, // Mai (0-indexiert)
  { year: 2027, month: 5 }, // Juni
];

// Erzeugt ein 7xN-Raster (Montag-Sonntag) für einen Monat.
// Padding-Tage vor und nach dem Monat sind als isPadding markiert.
export interface CalendarCell {
  iso: string;
  date: Date;
  day: number;
  isPadding: boolean;
  isFestival: boolean;
  isInWindow: boolean;
}

export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  // JS: 0=Sonntag, 1=Montag, ..., 6=Samstag. Wir wollen Montag-Start.
  const firstDow = (first.getDay() + 6) % 7;
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - firstDow;
    const d = new Date(year, month, 1 + dayOffset);
    const iso = isoDay(d);
    cells.push({
      iso,
      date: d,
      day: d.getDate(),
      isPadding: d.getMonth() !== month,
      isFestival: iso === FESTIVAL_DAY,
      isInWindow: isInCrewWindow(d),
    });
  }
  return cells;
}

export const WEEKDAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MONTH_LABELS_DE = [
  'Januar',
  'Februar',
  'Maerz',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];
