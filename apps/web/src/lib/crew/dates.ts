// Datums-Helfer fuer die Crew-Seiten.

/** PB-Datum ('2027-05-29 10:00:00.000Z') robust parsen (Safari mag kein Leerzeichen). */
export function parsePbDate(value: string): Date {
  return new Date(value.includes('T') ? value : value.replace(' ', 'T'));
}

/** 'YYYY-MM-DD' als lokales Datum (new Date('YYYY-MM-DD') waere UTC). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Lokaler Zeitpunkt aus Tag + 'HH:MM' als ISO-String (UTC). */
export function localDateTimeIso(day: string, time: string): string {
  const d = parseDay(day);
  const [h, min] = time.split(':').map(Number);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function fmtLongDay(iso: string): string {
  return parseDay(iso).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Ganze Tage von heute bis zum Tag (negativ = vorbei). */
export function daysFromToday(iso: string): number {
  const due = parseDay(iso).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / 86_400_000);
}
