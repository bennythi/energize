// Kostenplanung: Typen, Kategorien, Hardstyle-Vorlage und Rechenlogik.
// Bewusst ohne Svelte-/PB-Imports, damit die Rechnung isoliert testbar ist.

import type { Edition } from './booking';

export type Pricing = 'pauschal' | 'stueck' | 'pro_tag' | 'stunden';
export type CostStatus = 'offen' | 'angefragt' | 'angebot' | 'beauftragt' | 'abgesagt';

export interface CostItem {
  id: string;
  edition: string;
  category: string;
  title: string;
  supplier: string;
  pricing: Pricing;
  quantity: number;
  hours: number;
  unit_price: number;
  days: string[] | null;
  status: CostStatus;
  paid: boolean;
  sort: number;
  notes: string;
}

export interface CostOffer {
  id: string;
  item: string;
  supplier: string;
  contact: string;
  unit_price: number;
  valid_until: string;
  chosen: boolean;
  notes: string;
  file: string;
}

export const PRICING_LABELS: Record<Pricing, string> = {
  pauschal: 'Pauschal',
  stueck: 'Pro Stück',
  pro_tag: 'Pro Stück und Tag',
  stunden: 'Personal (Stunden)',
};

export const STATUS_LABELS: Record<CostStatus, string> = {
  offen: 'Offen',
  angefragt: 'Angefragt',
  angebot: 'Angebot liegt vor',
  beauftragt: 'Beauftragt',
  abgesagt: 'Gestrichen',
};

export const COST_STATUSES: CostStatus[] = [
  'offen',
  'angefragt',
  'angebot',
  'beauftragt',
  'abgesagt',
];

/** Kategorien in Anzeige-Reihenfolge (Schluessel bleiben stabil in der DB). */
export const CATEGORIES: { key: string; label: string }[] = [
  { key: 'gelaende', label: 'Gelände & Genehmigungen' },
  { key: 'security', label: 'Security' },
  { key: 'sanitaet', label: 'Sanität & Brandschutz' },
  { key: 'awareness', label: 'Awareness' },
  { key: 'buehne', label: 'Bühne & Produktion' },
  { key: 'technik', label: 'Ton, Licht & Video' },
  { key: 'sfx', label: 'Special Effects' },
  { key: 'strom', label: 'Strom & Wasser' },
  { key: 'toiletten', label: 'Toiletten & Hygiene' },
  { key: 'zaeune', label: 'Zäune & Absperrungen' },
  { key: 'verkehr', label: 'Verkehr, Beschilderung & Parken' },
  { key: 'einlass', label: 'Einlass & Ticketing' },
  { key: 'gastro', label: 'Gastro & Bars' },
  { key: 'zelte', label: 'Zelte, Mobiliar & Beleuchtung' },
  { key: 'backstage', label: 'Backstage & Artist-Care' },
  { key: 'crew', label: 'Crew & Personal' },
  { key: 'muell', label: 'Müll & Reinigung' },
  { key: 'marketing', label: 'Marketing & Medien' },
  { key: 'abgaben', label: 'Abgaben & Versicherungen' },
  { key: 'sonstiges', label: 'Sonstiges & Puffer' },
];

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Welche Tage eine Vorlagen-Position standardmaessig belegt. */
export type DayPreset = 'festival' | 'alle' | 'aufbau_abbau' | 'keine';

export interface TemplatePosition {
  category: string;
  title: string;
  pricing: Pricing;
  quantity?: number;
  hours?: number;
  supplier?: string;
  days?: DayPreset;
  notes?: string;
}

/**
 * Vorlage fuer ein Hardstyle-Festival. Mengen sind Platzhalter zum Anpassen,
 * Preise starten bei 0 (kommen aus den Angeboten).
 */
export const HARDSTYLE_TEMPLATE: TemplatePosition[] = [
  // Gelaende & Genehmigungen
  { category: 'gelaende', title: 'Geländemiete', pricing: 'pauschal' },
  {
    category: 'gelaende',
    title: 'Genehmigungen (Ordnungsamt, Bauamt, Sondernutzung)',
    pricing: 'pauschal',
  },
  { category: 'gelaende', title: 'Sicherheits- und Brandschutzkonzept', pricing: 'pauschal' },
  {
    category: 'gelaende',
    title: 'Bodenschutz / Fahrplatten',
    pricing: 'pro_tag',
    quantity: 50,
    days: 'alle',
  },
  // Security
  {
    category: 'security',
    title: 'Security Ordnungsdienst',
    pricing: 'stunden',
    quantity: 20,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'security',
    title: 'Security Einlasskontrolle',
    pricing: 'stunden',
    quantity: 10,
    hours: 8,
    days: 'festival',
  },
  {
    category: 'security',
    title: 'Security Bühnengraben / Wellenbrecher',
    pricing: 'stunden',
    quantity: 6,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'security',
    title: 'Nachtwache Gelände (Auf-/Abbau)',
    pricing: 'stunden',
    quantity: 2,
    hours: 12,
    days: 'aufbau_abbau',
  },
  // Sanitaet & Brandschutz
  {
    category: 'sanitaet',
    title: 'Sanitätsdienst',
    pricing: 'stunden',
    quantity: 6,
    hours: 10,
    days: 'festival',
  },
  { category: 'sanitaet', title: 'Notarzt', pricing: 'pauschal', days: 'festival' },
  {
    category: 'sanitaet',
    title: 'Brandsicherheitswache Feuerwehr',
    pricing: 'stunden',
    quantity: 2,
    hours: 10,
    days: 'festival',
  },
  // Awareness
  {
    category: 'awareness',
    title: 'Awareness-Team',
    pricing: 'stunden',
    quantity: 4,
    hours: 10,
    days: 'festival',
  },
  { category: 'awareness', title: 'Awareness-Zelt / Ruhezone', pricing: 'pauschal' },
  // Buehne & Produktion
  { category: 'buehne', title: 'Bühne inkl. Dach', pricing: 'pauschal' },
  {
    category: 'buehne',
    title: 'Stage-Hands',
    pricing: 'stunden',
    quantity: 8,
    hours: 10,
    days: 'alle',
  },
  { category: 'buehne', title: 'Rigging', pricing: 'pauschal' },
  {
    category: 'buehne',
    title: 'Teleskoplader / Stapler',
    pricing: 'pro_tag',
    quantity: 1,
    days: 'aufbau_abbau',
  },
  { category: 'buehne', title: 'Produktionsleitung', pricing: 'pauschal' },
  // Technik
  { category: 'technik', title: 'PA / Beschallung', pricing: 'pauschal' },
  { category: 'technik', title: 'Lichttechnik', pricing: 'pauschal' },
  { category: 'technik', title: 'LED-Wände / Video', pricing: 'pauschal' },
  { category: 'technik', title: 'DJ-Equipment (CDJs, Mixer)', pricing: 'pauschal' },
  {
    category: 'technik',
    title: 'Techniker vor Ort',
    pricing: 'stunden',
    quantity: 4,
    hours: 12,
    days: 'festival',
  },
  // Special Effects
  { category: 'sfx', title: 'CO2-Jets inkl. Flaschen', pricing: 'pauschal' },
  { category: 'sfx', title: 'Flammenprojektoren', pricing: 'pauschal' },
  { category: 'sfx', title: 'Pyrotechnik / Feuerwerk', pricing: 'pauschal' },
  { category: 'sfx', title: 'Konfetti / Streamer', pricing: 'pauschal' },
  { category: 'sfx', title: 'Pyrotechniker mit Befähigungsschein', pricing: 'pauschal' },
  { category: 'sfx', title: 'Nebel / Hazer', pricing: 'pauschal' },
  // Strom & Wasser
  {
    category: 'strom',
    title: 'Generatoren / Aggregate',
    pricing: 'pro_tag',
    quantity: 2,
    days: 'alle',
  },
  {
    category: 'strom',
    title: 'Diesel',
    pricing: 'stueck',
    quantity: 1000,
    notes: 'Menge in Litern',
  },
  { category: 'strom', title: 'Stromverteilung / Elektriker', pricing: 'pauschal' },
  { category: 'strom', title: 'Wasseranschluss / Abwasser', pricing: 'pauschal' },
  // Toiletten (bewusst mehrere Lieferanten)
  {
    category: 'toiletten',
    title: 'Mobile Toiletten (Dixi)',
    pricing: 'stueck',
    quantity: 40,
    supplier: 'Lieferant A',
  },
  {
    category: 'toiletten',
    title: 'Toilettenwagen',
    pricing: 'pro_tag',
    quantity: 2,
    supplier: 'Lieferant B',
    days: 'festival',
  },
  { category: 'toiletten', title: 'Urinalrinnen', pricing: 'stueck', quantity: 6 },
  { category: 'toiletten', title: 'Handwaschstationen', pricing: 'stueck', quantity: 10 },
  {
    category: 'toiletten',
    title: 'Reinigungsservice Toiletten',
    pricing: 'pro_tag',
    quantity: 1,
    days: 'festival',
  },
  // Zaeune
  {
    category: 'zaeune',
    title: 'Bauzaun',
    pricing: 'stueck',
    quantity: 300,
    notes: 'Anzahl Elemente',
  },
  { category: 'zaeune', title: 'Sichtschutz / Bannerplanen', pricing: 'stueck', quantity: 100 },
  { category: 'zaeune', title: 'Wellenbrecher / Bühnengraben-Absperrung', pricing: 'pauschal' },
  {
    category: 'zaeune',
    title: 'Absperrgitter (Hamburger Gitter)',
    pricing: 'stueck',
    quantity: 100,
  },
  // Verkehr
  { category: 'verkehr', title: 'Verkehrsrechtliche Anordnung', pricing: 'pauschal' },
  {
    category: 'verkehr',
    title: 'Verkehrsschilder / Beschilderung (Auf- und Abbau)',
    pricing: 'pauschal',
  },
  {
    category: 'verkehr',
    title: 'Parkplatz-Einweiser',
    pricing: 'stunden',
    quantity: 4,
    hours: 8,
    days: 'festival',
  },
  { category: 'verkehr', title: 'Shuttlebusse', pricing: 'pauschal' },
  // Einlass & Ticketing
  { category: 'einlass', title: 'Ticketing-Gebühren', pricing: 'pauschal' },
  { category: 'einlass', title: 'Einlassbändchen', pricing: 'stueck', quantity: 3000 },
  { category: 'einlass', title: 'Scanner / Einlass-Hardware', pricing: 'pauschal' },
  // Gastro & Bars
  { category: 'gastro', title: 'Barzelte / Theken', pricing: 'pauschal' },
  { category: 'gastro', title: 'Kühlwagen', pricing: 'pro_tag', quantity: 1, days: 'festival' },
  { category: 'gastro', title: 'Getränkeeinkauf', pricing: 'pauschal' },
  {
    category: 'gastro',
    title: 'Barpersonal',
    pricing: 'stunden',
    quantity: 12,
    hours: 10,
    days: 'festival',
  },
  { category: 'gastro', title: 'Cashless-System', pricing: 'pauschal' },
  // Zelte & Mobiliar
  { category: 'zelte', title: 'Zelte (Backstage, Crew, Lager)', pricing: 'pauschal' },
  { category: 'zelte', title: 'Biertischgarnituren', pricing: 'stueck', quantity: 30 },
  { category: 'zelte', title: 'Geländebeleuchtung / Notbeleuchtung', pricing: 'pauschal' },
  // Backstage
  { category: 'backstage', title: 'Artist-Catering', pricing: 'pauschal' },
  { category: 'backstage', title: 'Backstage-Ausstattung', pricing: 'pauschal' },
  // Crew & Personal
  {
    category: 'crew',
    title: 'Crew-Verpflegung',
    pricing: 'pro_tag',
    quantity: 40,
    days: 'alle',
    notes: 'Personen pro Tag',
  },
  { category: 'crew', title: 'Funkgeräte-Miete', pricing: 'stueck', quantity: 30 },
  { category: 'crew', title: 'Crew-Shirts', pricing: 'stueck', quantity: 60 },
  // Muell
  { category: 'muell', title: 'Müllcontainer', pricing: 'stueck', quantity: 4 },
  { category: 'muell', title: 'Geländereinigung nach dem Event', pricing: 'pauschal' },
  // Marketing
  { category: 'marketing', title: 'Social-Media-Ads', pricing: 'pauschal' },
  { category: 'marketing', title: 'Plakate / Flyer', pricing: 'pauschal' },
  { category: 'marketing', title: 'Fotograf / Aftermovie', pricing: 'pauschal' },
  { category: 'marketing', title: 'Grafikdesign', pricing: 'pauschal' },
  // Abgaben & Versicherungen
  { category: 'abgaben', title: 'GEMA', pricing: 'pauschal' },
  { category: 'abgaben', title: 'Künstlersozialabgabe (KSK)', pricing: 'pauschal' },
  { category: 'abgaben', title: 'Veranstalterhaftpflicht', pricing: 'pauschal' },
  { category: 'abgaben', title: 'Ausfallversicherung (Wetter)', pricing: 'pauschal' },
  // Puffer
  { category: 'sonstiges', title: 'Puffer für Unvorhergesehenes (ca. 10 %)', pricing: 'pauschal' },
];

export interface PlanDay {
  iso: string;
  phase: 'aufbau' | 'festival' | 'abbau';
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Aufbau-, Festival- und Abbautage einer Edition (fuer die Tagesauswahl). */
export function planDays(
  edition: Pick<Edition, 'start_date' | 'end_date' | 'setup_days' | 'teardown_days'> | null,
): PlanDay[] {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!edition || !re.test(edition.start_date)) return [];
  const end = re.test(edition.end_date) ? edition.end_date : edition.start_date;
  const out: PlanDay[] = [];
  const setup = Math.max(0, Math.min(14, edition.setup_days || 0));
  const teardown = Math.max(0, Math.min(14, edition.teardown_days || 0));
  for (let i = setup; i > 0; i--)
    out.push({ iso: shiftDay(edition.start_date, -i), phase: 'aufbau' });
  for (let d = edition.start_date; d <= end && out.length < 60; d = shiftDay(d, 1)) {
    out.push({ iso: d, phase: 'festival' });
  }
  for (let i = 1; i <= teardown; i++) out.push({ iso: shiftDay(end, i), phase: 'abbau' });
  return out;
}

export function presetDays(preset: DayPreset | undefined, days: PlanDay[]): string[] {
  if (!preset || preset === 'keine') return [];
  if (preset === 'alle') return days.map((d) => d.iso);
  if (preset === 'festival') return days.filter((d) => d.phase === 'festival').map((d) => d.iso);
  return days.filter((d) => d.phase !== 'festival').map((d) => d.iso);
}

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Anzahl abgerechneter Tage: ausgewaehlte Tage, mindestens 1. */
export function dayCount(item: Pick<CostItem, 'days'>): number {
  return Math.max(1, Array.isArray(item.days) ? item.days.length : 0);
}

/** Betrag einer Position (mit dem uebergebenen Einzelpreis, z.B. aus einem Angebot). */
export function itemAmount(
  item: Pick<CostItem, 'pricing' | 'quantity' | 'hours' | 'unit_price' | 'days'>,
  unitPrice: number = item.unit_price,
): number {
  const price = n(unitPrice);
  switch (item.pricing) {
    case 'pauschal':
      return price;
    case 'stueck':
      return n(item.quantity) * price;
    case 'pro_tag':
      return n(item.quantity) * price * dayCount(item);
    case 'stunden':
      return n(item.quantity) * n(item.hours) * price * dayCount(item);
    default:
      return 0;
  }
}

/** Rechenweg als Text, z.B. "8 Pers. × 10 h × 25 € × 4 Tage". */
export function formula(
  item: Pick<CostItem, 'pricing' | 'quantity' | 'hours' | 'unit_price' | 'days'>,
  money: (v: number) => string,
): string {
  const days = dayCount(item);
  const t = days === 1 ? '1 Tag' : `${days} Tage`;
  switch (item.pricing) {
    case 'pauschal':
      return 'pauschal';
    case 'stueck':
      return `${n(item.quantity)} × ${money(n(item.unit_price))}`;
    case 'pro_tag':
      return `${n(item.quantity)} × ${money(n(item.unit_price))} × ${t}`;
    case 'stunden':
      return `${n(item.quantity)} Pers. × ${n(item.hours)} h × ${money(n(item.unit_price))} × ${t}`;
    default:
      return '';
  }
}

export interface CostSummary {
  planned: number;
  commissioned: number;
  paid: number;
  open: number;
}

/** Summen: geplant (ohne Gestrichene), beauftragt, bezahlt, offen (= geplant - beauftragt). */
export function summarize(items: CostItem[]): CostSummary {
  const s: CostSummary = { planned: 0, commissioned: 0, paid: 0, open: 0 };
  for (const i of items) {
    if (i.status === 'abgesagt') continue;
    const a = itemAmount(i);
    s.planned += a;
    if (i.status === 'beauftragt') s.commissioned += a;
    if (i.paid) s.paid += a;
  }
  s.open = s.planned - s.commissioned;
  return s;
}

/** Positionen nach Kategorie gruppiert, in Kategorie-Reihenfolge (unbekannte zuletzt). */
export function groupByCategory(
  items: CostItem[],
): { key: string; label: string; items: CostItem[] }[] {
  const order = new Map(CATEGORIES.map((c, i) => [c.key, i]));
  const groups = new Map<string, CostItem[]>();
  for (const i of items) {
    if (!groups.has(i.category)) groups.set(i.category, []);
    groups.get(i.category)!.push(i);
  }
  return [...groups.entries()]
    .sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999) || a[0].localeCompare(b[0]))
    .map(([key, list]) => ({
      key,
      label: categoryLabel(key),
      items: list.sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title)),
    }));
}
