// Slugs der Crew-Resources. Muessen mit dem Seed der crew_resources-Collection
// uebereinstimmen (pb_migrations 1700000040 + 1700004000).

import { t } from '$lib/i18n';

export const CREW_RESOURCES = {
  kalender: 'crew.kalender',
  fungeraete: 'crew.fungeraete',
  kasse: 'crew.kasse',
  briefings: 'crew.briefings',
  meilensteine: 'crew.meilensteine',
  booking: 'crew.booking',
  kosten: 'crew.kosten',
} as const;

export type CrewResource = (typeof CREW_RESOURCES)[keyof typeof CREW_RESOURCES];

export const CREW_RESOURCE_LABELS: Record<CrewResource, { label: string; description: string }> = {
  'crew.kalender': {
    label: t('Crew-Kalender', 'Crew calendar'),
    description: t(
      'Verfügbarkeiten der Crew pro Tag und Zeitfenster',
      'Crew availability per day and time slot',
    ),
  },
  'crew.fungeraete': {
    label: t('Funkgeräte', 'Radios'),
    description: t('Tagesbedarf und Bestellempfehlung', 'Daily demand and order recommendation'),
  },
  'crew.kasse': {
    label: t('Cashless-Kassen', 'Cashless registers'),
    description: t(
      'Top-Up-Kassen-Abrechnung mit Schichten',
      'Top-up register accounting with shifts',
    ),
  },
  'crew.briefings': {
    label: 'Briefings',
    description: t('Briefing-Dokumente nach Abteilung', 'Briefing documents by department'),
  },
  'crew.meilensteine': {
    label: t('Meilensteine', 'Milestones'),
    description: t('Jahres-Deadlines und Bestellungen', 'Annual deadlines and orders'),
  },
  'crew.booking': {
    label: t('DJ-Planung', 'DJ planning'),
    description: t(
      'Gagen, Rider, Hotel, Anreise und was schon gebucht ist',
      'Fees, rider, hotel, travel and what is already booked',
    ),
  },
  'crew.kosten': {
    label: t('Kostenplanung', 'Cost planning'),
    description: t(
      'Festival-Budget: Positionen, Angebote, Lieferanten und Tage',
      'Festival budget: items, quotes, suppliers and days',
    ),
  },
};

// Default-Rollen, die wir im Admin-UI als Vorschlaege anbieten.
// Frei erweiterbar, der String wird in account_flags.crew_roles gespeichert.
export const DEFAULT_CREW_ROLES = [
  'einlass',
  'security_einlass',
  'topup_kassierer',
  'gastropersonal',
  'technik',
  'supporter',
  'awareness',
  'medical',
  'logistik',
  'booking',
];

export type Level = 'read' | 'write' | 'delete';
