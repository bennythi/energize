// Kostenplanung: Typen, Kategorien, Hardstyle-Vorlage und Rechenlogik.
// Bewusst ohne Svelte-/PB-Imports, damit die Rechnung isoliert testbar ist.

import type { Edition } from './booking';
import { t } from '$lib/i18n';

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
  pauschal: t('Pauschal', 'Flat rate'),
  stueck: t('Pro Stück', 'Per unit'),
  pro_tag: t('Pro Stück und Tag', 'Per unit and day'),
  stunden: t('Personal (Stunden)', 'Staff (hours)'),
};

export const STATUS_LABELS: Record<CostStatus, string> = {
  offen: t('Offen', 'Open'),
  angefragt: t('Angefragt', 'Requested'),
  angebot: t('Angebot liegt vor', 'Quote received'),
  beauftragt: t('Beauftragt', 'Commissioned'),
  abgesagt: t('Gestrichen', 'Cancelled'),
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
  { key: 'gelaende', label: t('Gelände & Genehmigungen', 'Site & permits') },
  { key: 'security', label: t('Security', 'Security') },
  { key: 'sanitaet', label: t('Sanität & Brandschutz', 'First aid & fire safety') },
  { key: 'awareness', label: t('Awareness', 'Awareness') },
  { key: 'buehne', label: t('Bühne & Produktion', 'Stage & production') },
  { key: 'technik', label: t('Ton, Licht & Video', 'Sound, lighting & video') },
  { key: 'sfx', label: t('Special Effects', 'Special effects') },
  { key: 'strom', label: t('Strom & Wasser', 'Power & water') },
  { key: 'toiletten', label: t('Toiletten & Hygiene', 'Toilets & hygiene') },
  { key: 'zaeune', label: t('Zäune & Absperrungen', 'Fences & barriers') },
  { key: 'verkehr', label: t('Verkehr, Beschilderung & Parken', 'Traffic, signage & parking') },
  { key: 'einlass', label: t('Einlass & Ticketing', 'Entry & ticketing') },
  { key: 'gastro', label: t('Gastro & Bars', 'Food & bars') },
  { key: 'zelte', label: t('Zelte, Mobiliar & Beleuchtung', 'Tents, furniture & lighting') },
  { key: 'backstage', label: t('Backstage & Artist-Care', 'Backstage & artist care') },
  { key: 'crew', label: t('Crew & Personal', 'Crew & staff') },
  { key: 'muell', label: t('Müll & Reinigung', 'Waste & cleaning') },
  { key: 'marketing', label: t('Marketing & Medien', 'Marketing & media') },
  { key: 'abgaben', label: t('Abgaben & Versicherungen', 'Fees & insurance') },
  { key: 'sonstiges', label: t('Sonstiges & Puffer', 'Miscellaneous & buffer') },
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
  { category: 'gelaende', title: t('Geländemiete', 'Site rental'), pricing: 'pauschal' },
  {
    category: 'gelaende',
    title: t(
      'Genehmigungen (Ordnungsamt, Bauamt, Sondernutzung)',
      'Permits (public order office, building authority, special use)',
    ),
    pricing: 'pauschal',
  },
  {
    category: 'gelaende',
    title: t('Sicherheits- und Brandschutzkonzept', 'Safety and fire protection concept'),
    pricing: 'pauschal',
  },
  {
    category: 'gelaende',
    title: t('Bodenschutz / Fahrplatten', 'Ground protection / track panels'),
    pricing: 'pro_tag',
    quantity: 50,
    days: 'alle',
  },
  // Security
  {
    category: 'security',
    title: t('Security Ordnungsdienst', 'Security stewards'),
    pricing: 'stunden',
    quantity: 20,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'security',
    title: t('Security Einlasskontrolle', 'Security entrance control'),
    pricing: 'stunden',
    quantity: 10,
    hours: 8,
    days: 'festival',
  },
  {
    category: 'security',
    title: t('Security Bühnengraben / Wellenbrecher', 'Security stage pit / crowd barrier'),
    pricing: 'stunden',
    quantity: 6,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'security',
    title: t('Nachtwache Gelände (Auf-/Abbau)', 'Night watch on site (setup/teardown)'),
    pricing: 'stunden',
    quantity: 2,
    hours: 12,
    days: 'aufbau_abbau',
  },
  // Sanitaet & Brandschutz
  {
    category: 'sanitaet',
    title: t('Sanitätsdienst', 'First aid service'),
    pricing: 'stunden',
    quantity: 6,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'sanitaet',
    title: t('Notarzt', 'Emergency doctor'),
    pricing: 'pauschal',
    days: 'festival',
  },
  {
    category: 'sanitaet',
    title: t('Brandsicherheitswache Feuerwehr', 'Fire safety watch (fire brigade)'),
    pricing: 'stunden',
    quantity: 2,
    hours: 10,
    days: 'festival',
  },
  // Awareness
  {
    category: 'awareness',
    title: t('Awareness-Team', 'Awareness team'),
    pricing: 'stunden',
    quantity: 4,
    hours: 10,
    days: 'festival',
  },
  {
    category: 'awareness',
    title: t('Awareness-Zelt / Ruhezone', 'Awareness tent / quiet zone'),
    pricing: 'pauschal',
  },
  // Buehne & Produktion
  { category: 'buehne', title: t('Bühne inkl. Dach', 'Stage incl. roof'), pricing: 'pauschal' },
  {
    category: 'buehne',
    title: t('Stage-Hands', 'Stagehands'),
    pricing: 'stunden',
    quantity: 8,
    hours: 10,
    days: 'alle',
  },
  { category: 'buehne', title: t('Rigging', 'Rigging'), pricing: 'pauschal' },
  {
    category: 'buehne',
    title: t('Teleskoplader / Stapler', 'Telehandler / forklift'),
    pricing: 'pro_tag',
    quantity: 1,
    days: 'aufbau_abbau',
  },
  {
    category: 'buehne',
    title: t('Produktionsleitung', 'Production management'),
    pricing: 'pauschal',
  },
  // Technik
  { category: 'technik', title: t('PA / Beschallung', 'PA / sound system'), pricing: 'pauschal' },
  { category: 'technik', title: t('Lichttechnik', 'Lighting'), pricing: 'pauschal' },
  { category: 'technik', title: t('LED-Wände / Video', 'LED walls / video'), pricing: 'pauschal' },
  {
    category: 'technik',
    title: t('DJ-Equipment (CDJs, Mixer)', 'DJ equipment (CDJs, mixer)'),
    pricing: 'pauschal',
  },
  {
    category: 'technik',
    title: t('Techniker vor Ort', 'On-site technicians'),
    pricing: 'stunden',
    quantity: 4,
    hours: 12,
    days: 'festival',
  },
  // Special Effects
  {
    category: 'sfx',
    title: t('CO2-Jets inkl. Flaschen', 'CO2 jets incl. bottles'),
    pricing: 'pauschal',
  },
  { category: 'sfx', title: t('Flammenprojektoren', 'Flame projectors'), pricing: 'pauschal' },
  {
    category: 'sfx',
    title: t('Pyrotechnik / Feuerwerk', 'Pyrotechnics / fireworks'),
    pricing: 'pauschal',
  },
  { category: 'sfx', title: t('Konfetti / Streamer', 'Confetti / streamers'), pricing: 'pauschal' },
  {
    category: 'sfx',
    title: t('Pyrotechniker mit Befähigungsschein', 'Licensed pyrotechnician'),
    pricing: 'pauschal',
  },
  { category: 'sfx', title: t('Nebel / Hazer', 'Fog / hazer'), pricing: 'pauschal' },
  // Strom & Wasser
  {
    category: 'strom',
    title: t('Generatoren / Aggregate', 'Generators'),
    pricing: 'pro_tag',
    quantity: 2,
    days: 'alle',
  },
  {
    category: 'strom',
    title: t('Diesel', 'Diesel'),
    pricing: 'stueck',
    quantity: 1000,
    notes: t('Menge in Litern', 'Quantity in litres'),
  },
  {
    category: 'strom',
    title: t('Stromverteilung / Elektriker', 'Power distribution / electrician'),
    pricing: 'pauschal',
  },
  {
    category: 'strom',
    title: t('Wasseranschluss / Abwasser', 'Water supply / wastewater'),
    pricing: 'pauschal',
  },
  // Toiletten (bewusst mehrere Lieferanten)
  {
    category: 'toiletten',
    title: t('Mobile Toiletten (Dixi)', 'Portable toilets'),
    pricing: 'stueck',
    quantity: 40,
    supplier: t('Lieferant A', 'Supplier A'),
  },
  {
    category: 'toiletten',
    title: t('Toilettenwagen', 'Toilet trailer'),
    pricing: 'pro_tag',
    quantity: 2,
    supplier: t('Lieferant B', 'Supplier B'),
    days: 'festival',
  },
  {
    category: 'toiletten',
    title: t('Urinalrinnen', 'Urinal troughs'),
    pricing: 'stueck',
    quantity: 6,
  },
  {
    category: 'toiletten',
    title: t('Handwaschstationen', 'Hand-washing stations'),
    pricing: 'stueck',
    quantity: 10,
  },
  {
    category: 'toiletten',
    title: t('Reinigungsservice Toiletten', 'Toilet cleaning service'),
    pricing: 'pro_tag',
    quantity: 1,
    days: 'festival',
  },
  // Zaeune
  {
    category: 'zaeune',
    title: t('Bauzaun', 'Construction fence'),
    pricing: 'stueck',
    quantity: 300,
    notes: t('Anzahl Elemente', 'Number of panels'),
  },
  {
    category: 'zaeune',
    title: t('Sichtschutz / Bannerplanen', 'Privacy screens / banner tarps'),
    pricing: 'stueck',
    quantity: 100,
  },
  {
    category: 'zaeune',
    title: t('Wellenbrecher / Bühnengraben-Absperrung', 'Crowd barrier / stage pit barrier'),
    pricing: 'pauschal',
  },
  {
    category: 'zaeune',
    title: t('Absperrgitter (Hamburger Gitter)', 'Crowd control barriers'),
    pricing: 'stueck',
    quantity: 100,
  },
  // Verkehr
  {
    category: 'verkehr',
    title: t('Verkehrsrechtliche Anordnung', 'Traffic management order'),
    pricing: 'pauschal',
  },
  {
    category: 'verkehr',
    title: t(
      'Verkehrsschilder / Beschilderung (Auf- und Abbau)',
      'Traffic signs / signage (setup and teardown)',
    ),
    pricing: 'pauschal',
  },
  {
    category: 'verkehr',
    title: t('Parkplatz-Einweiser', 'Parking marshals'),
    pricing: 'stunden',
    quantity: 4,
    hours: 8,
    days: 'festival',
  },
  { category: 'verkehr', title: t('Shuttlebusse', 'Shuttle buses'), pricing: 'pauschal' },
  // Einlass & Ticketing
  { category: 'einlass', title: t('Ticketing-Gebühren', 'Ticketing fees'), pricing: 'pauschal' },
  {
    category: 'einlass',
    title: t('Einlassbändchen', 'Entry wristbands'),
    pricing: 'stueck',
    quantity: 3000,
  },
  {
    category: 'einlass',
    title: t('Scanner / Einlass-Hardware', 'Scanners / entry hardware'),
    pricing: 'pauschal',
  },
  // Gastro & Bars
  {
    category: 'gastro',
    title: t('Barzelte / Theken', 'Bar tents / counters'),
    pricing: 'pauschal',
  },
  {
    category: 'gastro',
    title: t('Kühlwagen', 'Refrigerated trailer'),
    pricing: 'pro_tag',
    quantity: 1,
    days: 'festival',
  },
  { category: 'gastro', title: t('Getränkeeinkauf', 'Beverage purchasing'), pricing: 'pauschal' },
  {
    category: 'gastro',
    title: t('Barpersonal', 'Bar staff'),
    pricing: 'stunden',
    quantity: 12,
    hours: 10,
    days: 'festival',
  },
  { category: 'gastro', title: t('Cashless-System', 'Cashless system'), pricing: 'pauschal' },
  // Zelte & Mobiliar
  {
    category: 'zelte',
    title: t('Zelte (Backstage, Crew, Lager)', 'Tents (backstage, crew, storage)'),
    pricing: 'pauschal',
  },
  {
    category: 'zelte',
    title: t('Biertischgarnituren', 'Beer table sets'),
    pricing: 'stueck',
    quantity: 30,
  },
  {
    category: 'zelte',
    title: t('Geländebeleuchtung / Notbeleuchtung', 'Site lighting / emergency lighting'),
    pricing: 'pauschal',
  },
  // Backstage
  { category: 'backstage', title: t('Artist-Catering', 'Artist catering'), pricing: 'pauschal' },
  {
    category: 'backstage',
    title: t('Backstage-Ausstattung', 'Backstage furnishings'),
    pricing: 'pauschal',
  },
  // Crew & Personal
  {
    category: 'crew',
    title: t('Crew-Verpflegung', 'Crew catering'),
    pricing: 'pro_tag',
    quantity: 40,
    days: 'alle',
    notes: t('Personen pro Tag', 'People per day'),
  },
  {
    category: 'crew',
    title: t('Funkgeräte-Miete', 'Radio rental'),
    pricing: 'stueck',
    quantity: 30,
  },
  { category: 'crew', title: t('Crew-Shirts', 'Crew shirts'), pricing: 'stueck', quantity: 60 },
  // Muell
  {
    category: 'muell',
    title: t('Müllcontainer', 'Waste containers'),
    pricing: 'stueck',
    quantity: 4,
  },
  {
    category: 'muell',
    title: t('Geländereinigung nach dem Event', 'Site cleanup after the event'),
    pricing: 'pauschal',
  },
  // Marketing
  { category: 'marketing', title: t('Social-Media-Ads', 'Social media ads'), pricing: 'pauschal' },
  { category: 'marketing', title: t('Plakate / Flyer', 'Posters / flyers'), pricing: 'pauschal' },
  {
    category: 'marketing',
    title: t('Fotograf / Aftermovie', 'Photographer / aftermovie'),
    pricing: 'pauschal',
  },
  { category: 'marketing', title: t('Grafikdesign', 'Graphic design'), pricing: 'pauschal' },
  // Abgaben & Versicherungen
  { category: 'abgaben', title: t('GEMA', 'GEMA (music royalties)'), pricing: 'pauschal' },
  {
    category: 'abgaben',
    title: t('Künstlersozialabgabe (KSK)', 'Artist social security levy (KSK)'),
    pricing: 'pauschal',
  },
  {
    category: 'abgaben',
    title: t('Veranstalterhaftpflicht', 'Event liability insurance'),
    pricing: 'pauschal',
  },
  {
    category: 'abgaben',
    title: t('Ausfallversicherung (Wetter)', 'Cancellation insurance (weather)'),
    pricing: 'pauschal',
  },
  // Puffer
  {
    category: 'sonstiges',
    title: t('Puffer für Unvorhergesehenes (ca. 10 %)', 'Contingency buffer (approx. 10 %)'),
    pricing: 'pauschal',
  },
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
  const dayText = days === 1 ? t('1 Tag', '1 day') : t(`${days} Tage`, `${days} days`);
  switch (item.pricing) {
    case 'pauschal':
      return t('pauschal', 'flat rate');
    case 'stueck':
      return `${n(item.quantity)} × ${money(n(item.unit_price))}`;
    case 'pro_tag':
      return `${n(item.quantity)} × ${money(n(item.unit_price))} × ${dayText}`;
    case 'stunden':
      return t(
        `${n(item.quantity)} Pers. × ${n(item.hours)} h × ${money(n(item.unit_price))} × ${dayText}`,
        `${n(item.quantity)} ppl × ${n(item.hours)} h × ${money(n(item.unit_price))} × ${dayText}`,
      );
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
