// Reine Rechenfunktionen fuer die Cashless-Kassen (ohne Svelte/PB-Abhaengigkeit,
// damit sie direkt mit node --experimental-strip-types testbar sind).
// Port von cashless_shift_summary aus Supabase 0015:
//   erwartet  = start + wechsel_rein - (wechsel_raus + entnahme)
//   differenz = gezaehlt - erwartet

export type MovementKind = 'withdrawal' | 'exchange_in' | 'exchange_out';

export interface SummaryShift {
  starting_cents?: number;
  ending_cents?: number;
  has_ending?: boolean;
}

export interface SummaryMovement {
  kind: MovementKind;
  amount_cents: number;
}

export interface ShiftSummary {
  starting_cents: number;
  movement_in_cents: number;
  movement_out_cents: number;
  expected_cents: number;
  /** null, solange kein Endbestand gezaehlt ist. */
  ending_cents: number | null;
  /** gezaehlt - erwartet; negativ = Fehlbetrag. null ohne Endbestand. */
  difference_cents: number | null;
}

export function computeShiftSummary(
  shift: SummaryShift,
  movements: readonly SummaryMovement[],
): ShiftSummary {
  const starting = shift.starting_cents ?? 0;
  let inCents = 0;
  let outCents = 0;
  for (const m of movements) {
    if (m.kind === 'exchange_in') inCents += m.amount_cents;
    else outCents += m.amount_cents;
  }
  const expected = starting + inCents - outCents;
  const ending = shift.has_ending ? (shift.ending_cents ?? 0) : null;
  return {
    starting_cents: starting,
    movement_in_cents: inCents,
    movement_out_cents: outCents,
    expected_cents: expected,
    ending_cents: ending,
    difference_cents: ending === null ? null : ending - expected,
  };
}

/** Summe einer Stueckelung { cents: anzahl }. */
export function countsTotal(counts: Record<number, number>): number {
  let sum = 0;
  for (const [cents, count] of Object.entries(counts)) {
    sum += Number(cents) * (count || 0);
  }
  return sum;
}

/** Stueckelungs-Zeilen aus PB in { cents: anzahl } fuer eine Art (start/end). */
export function countsFromRows(
  rows: readonly { kind: string; denomination_cents: number; count?: number }[],
  kind: 'start' | 'end',
): Record<number, number> {
  const out: Record<number, number> = {};
  for (const r of rows) {
    if (r.kind === kind) out[r.denomination_cents] = r.count ?? 0;
  }
  return out;
}

/**
 * Euro-Eingabe ("12,50", "12.5", "1.234,56", "1234") in Cent. null bei ungueltig
 * oder <= 0.
 */
export function parseEuroToCents(raw: string): number | null {
  let s = raw.trim().replace(/\s|€/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    // Deutsches Format: Punkte sind Tausendertrenner.
    s = s.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function formatEur(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '–';
  return EUR.format(cents / 100);
}

/** Differenz mit Vorzeichen (+/-), 0 ohne. */
export function formatSignedEur(cents: number): string {
  if (cents === 0) return EUR.format(0);
  return (cents > 0 ? '+' : '−') + EUR.format(Math.abs(cents) / 100);
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '–';
  // PB liefert "2026-10-26 12:00:00.000Z"; Safari parst das nur mit "T".
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MOVEMENT_LABELS: Record<MovementKind, string> = {
  withdrawal: 'Entnahme',
  exchange_in: 'Wechselgeld rein',
  exchange_out: 'Wechselgeld raus',
};
