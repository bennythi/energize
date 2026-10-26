// Slugs der Crew-Resources. Muessen mit dem Seed der crew_resources-Collection
// uebereinstimmen (pb_migrations 1700000040 + 1700004000).

export const CREW_RESOURCES = {
  kalender: 'crew.kalender',
  fungeraete: 'crew.fungeraete',
  kasse: 'crew.kasse',
  briefings: 'crew.briefings',
  meilensteine: 'crew.meilensteine',
  booking: 'crew.booking',
} as const;

export type CrewResource = (typeof CREW_RESOURCES)[keyof typeof CREW_RESOURCES];

export const CREW_RESOURCE_LABELS: Record<CrewResource, { label: string; description: string }> = {
  'crew.kalender': {
    label: 'Crew-Kalender',
    description: 'Verfügbarkeiten der Crew pro Tag und Zeitfenster',
  },
  'crew.fungeraete': {
    label: 'Funkgeräte',
    description: 'Tagesbedarf und Bestellempfehlung',
  },
  'crew.kasse': {
    label: 'Cashless-Kassen',
    description: 'Top-Up-Kassen-Abrechnung mit Schichten',
  },
  'crew.briefings': {
    label: 'Briefings',
    description: 'Briefing-Dokumente nach Abteilung',
  },
  'crew.meilensteine': {
    label: 'Meilensteine',
    description: 'Jahres-Deadlines und Bestellungen',
  },
  'crew.booking': {
    label: 'DJ-Planung',
    description: 'Gagen, Rider, Hotel, Anreise und was schon gebucht ist',
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
