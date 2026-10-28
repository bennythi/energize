// DJ-/Artist-Planung: Typen, Checklisten- und Kostenlogik.
// Bewusst ohne Svelte-/PB-Imports, damit die Rechenlogik isoliert testbar ist.

import { t, locale } from '$lib/i18n';

export type ArtistStatus = 'idee' | 'anfrage' | 'angebot' | 'bestaetigt' | 'abgesagt';
export type ItemKind = 'anreise' | 'hotel' | 'transfer' | 'zusatzkosten';
/** Die vier Checkpunkte pro Artist. */
export type CheckKey = 'vertrag' | 'anreise' | 'hotel' | 'transfer';
export type CheckState = 'done' | 'open' | 'na';

export interface Edition {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  archived: boolean;
  /** Aufbautage vor dem ersten Festivaltag (Kostenplanung). */
  setup_days: number;
  /** Abbautage nach dem letzten Festivaltag (Kostenplanung). */
  teardown_days: number;
  /** Gesamtbudget des Festivals (Kostenplanung inkl. Artists). */
  total_budget: number;
}

export interface Artist {
  id: string;
  edition: string;
  name: string;
  sanity_slug: string;
  status: ArtistStatus;
  day: string;
  slot_start: string;
  slot_end: string;
  stage: string;
  agency: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  fee: number;
  fee_note: string;
  contract_signed: boolean;
  invoice_received: boolean;
  fee_paid: boolean;
  rider_tech: string;
  rider_hospitality: string;
  rider_files: string[];
  not_needed: CheckKey[] | null;
  notes: string;
  updated: string;
}

export interface BookingItem {
  id: string;
  artist: string;
  kind: ItemKind;
  title: string;
  provider: string;
  start_at: string;
  end_at: string;
  location: string;
  reference: string;
  persons: number;
  cost: number;
  booked: boolean;
  paid: boolean;
  notes: string;
}

export const STATUS_LABELS: Record<ArtistStatus, string> = {
  idee: t('Idee, Anfrage offen', 'Idea, not yet requested'),
  anfrage: t('Anfrage', 'Requested'),
  angebot: t('Angebot', 'Offer'),
  bestaetigt: t('Bestaetigt', 'Confirmed'),
  abgesagt: t('Abgesagt', 'Cancelled'),
};

export const KIND_LABELS: Record<ItemKind, string> = {
  anreise: t('Anreise', 'Travel'),
  hotel: t('Hotel', 'Hotel'),
  transfer: t('Transfer', 'Transfer'),
  zusatzkosten: t('Zusatzkosten', 'Extra costs'),
};

export const CHECK_LABELS: Record<CheckKey, string> = {
  vertrag: t('Vertrag', 'Contract'),
  anreise: t('Anreise', 'Travel'),
  hotel: t('Hotel', 'Hotel'),
  transfer: t('Transfer', 'Transfer'),
};

export const CHECK_KEYS: CheckKey[] = ['vertrag', 'anreise', 'hotel', 'transfer'];
export const ITEM_KINDS: ItemKind[] = ['anreise', 'hotel', 'transfer', 'zusatzkosten'];

/** Feldbeschriftungen je Art: was start_at/end_at/provider/location bedeuten. */
export const KIND_FIELDS: Record<
  ItemKind,
  { provider: string; start: string; end: string; location: string; placeholder: string }
> = {
  anreise: {
    provider: t('Airline / Bahn', 'Airline / rail'),
    start: t('Abfahrt', 'Departure'),
    end: t('Ankunft', 'Arrival'),
    location: t('Strecke', 'Route'),
    placeholder: t('z. B. Flug AMS → HAM', 'e.g. flight AMS → HAM'),
  },
  hotel: {
    provider: t('Hotel', 'Hotel'),
    start: t('Check-in', 'Check-in'),
    end: t('Check-out', 'Check-out'),
    location: t('Adresse', 'Address'),
    placeholder: t('z. B. Doppelzimmer, 2 Naechte', 'e.g. double room, 2 nights'),
  },
  transfer: {
    provider: t('Fahrer / Firma', 'Driver / company'),
    start: t('Abholung', 'Pickup'),
    end: t('Ankunft', 'Arrival'),
    location: t('Von → Nach', 'From → To'),
    placeholder: t('z. B. Flughafen → Hotel', 'e.g. airport → hotel'),
  },
  zusatzkosten: {
    provider: t('Anbieter', 'Provider'),
    start: t('Datum', 'Date'),
    end: t('Bis', 'Until'),
    location: t('Ort', 'Location'),
    placeholder: t('z. B. Catering, Backline-Miete', 'e.g. catering, backline rental'),
  },
};

function notNeeded(artist: Pick<Artist, 'not_needed'>): CheckKey[] {
  return Array.isArray(artist.not_needed) ? artist.not_needed : [];
}

/**
 * Status eines Checkpunkts:
 * - vertrag: erledigt, wenn Vertrag unterschrieben ist.
 * - anreise/hotel/transfer: erledigt, wenn es mind. ein Item dieser Art gibt
 *   und alle davon gebucht sind; 'na', wenn als "nicht noetig" markiert.
 */
export function checkState(
  artist: Pick<Artist, 'contract_signed' | 'not_needed'>,
  items: Pick<BookingItem, 'kind' | 'booked'>[],
  key: CheckKey,
): CheckState {
  if (notNeeded(artist).includes(key)) return 'na';
  if (key === 'vertrag') return artist.contract_signed ? 'done' : 'open';
  const ofKind = items.filter((i) => i.kind === key);
  return ofKind.length > 0 && ofKind.every((i) => i.booked) ? 'done' : 'open';
}

/** Anzahl offener Checkpunkte (ohne 'na'). */
export function openChecks(
  artist: Pick<Artist, 'contract_signed' | 'not_needed'>,
  items: Pick<BookingItem, 'kind' | 'booked'>[],
): number {
  return CHECK_KEYS.filter((k) => checkState(artist, items, k) === 'open').length;
}

export interface CostBreakdown {
  fee: number;
  anreise: number;
  hotel: number;
  transfer: number;
  zusatzkosten: number;
  total: number;
  /** Bereits bezahlt: Gage (wenn fee_paid) + Items mit paid. */
  paid: number;
}

function emptyCosts(): CostBreakdown {
  return { fee: 0, anreise: 0, hotel: 0, transfer: 0, zusatzkosten: 0, total: 0, paid: 0 };
}

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Kosten eines Artists. Abgesagte Artists zaehlen nur ihre bereits bezahlten Posten. */
export function artistCosts(
  artist: Pick<Artist, 'fee' | 'fee_paid' | 'status'>,
  items: Pick<BookingItem, 'kind' | 'cost' | 'paid'>[],
): CostBreakdown {
  const c = emptyCosts();
  const cancelled = artist.status === 'abgesagt';
  if (!cancelled || artist.fee_paid) c.fee = n(artist.fee);
  if (artist.fee_paid) c.paid += n(artist.fee);
  for (const i of items) {
    if (cancelled && !i.paid) continue;
    c[i.kind] += n(i.cost);
    if (i.paid) c.paid += n(i.cost);
  }
  c.total = c.fee + c.anreise + c.hotel + c.transfer + c.zusatzkosten;
  return c;
}

/** Summe ueber alle Artists einer Edition. */
export function editionCosts(
  artists: Pick<Artist, 'id' | 'fee' | 'fee_paid' | 'status'>[],
  items: Pick<BookingItem, 'artist' | 'kind' | 'cost' | 'paid'>[],
): CostBreakdown {
  const sum = emptyCosts();
  for (const a of artists) {
    const c = artistCosts(
      a,
      items.filter((i) => i.artist === a.id),
    );
    for (const k of Object.keys(sum) as (keyof CostBreakdown)[]) sum[k] += c[k];
  }
  return sum;
}

export function formatMoney(value: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** 'YYYY-MM-DD' -> 'Fr, 28.05.' */
export function formatDay(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
}

/**
 * Alle Tage einer Edition als 'YYYY-MM-DD' (Start bis Ende inklusive).
 * Ohne Startdatum leer; ohne Enddatum nur der Starttag. Max. 31 Tage.
 */
export function editionDays(edition: Pick<Edition, 'start_date' | 'end_date'> | null): string[] {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!edition || !re.test(edition.start_date)) return [];
  const end = re.test(edition.end_date) ? edition.end_date : edition.start_date;
  const days: string[] = [];
  // UTC-Mittag, damit Sommerzeit-Wechsel keinen Tag verschluckt.
  const d = new Date(`${edition.start_date}T12:00:00Z`);
  while (days.length < 31) {
    const iso = d.toISOString().slice(0, 10);
    if (iso > end) break;
    days.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/** 'YYYY-MM-DDTHH:MM' -> '28.05. 14:30' */
export function formatDateTime(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v);
  if (!m) return '';
  const date = t(`${m[3]}.${m[2]}.`, `${m[3]}/${m[2]}`);
  return `${date}${m[4] ? ` ${m[4]}:${m[5]}` : ''}`;
}

/** Sortierung fuer die Uebersicht: Tag, dann Slot-Beginn, dann Name. */
export function compareArtists(a: Artist, b: Artist): number {
  const ka = `${a.day || '9999'}${a.slot_start || '99:99'}${a.name.toLowerCase()}`;
  const kb = `${b.day || '9999'}${b.slot_start || '99:99'}${b.name.toLowerCase()}`;
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}
