// Slugs der Crew-Resources. Muessen mit Migration 0018 / seed der
// crew_resources-Tabelle uebereinstimmen.

export const CREW_RESOURCES = {
  kalender: 'crew.kalender',
  fungeraete: 'crew.fungeraete',
  kasse: 'crew.kasse',
  briefings: 'crew.briefings',
  meilensteine: 'crew.meilensteine',
} as const;

export type CrewResource = (typeof CREW_RESOURCES)[keyof typeof CREW_RESOURCES];

export const CREW_RESOURCE_LABELS: Record<CrewResource, { label: string; description: string }> = {
  'crew.kalender': {
    label: 'Crew-Kalender',
    description: 'Verfuegbarkeiten der Crew pro Tag und Zeitfenster',
  },
  'crew.fungeraete': {
    label: 'Funkgeraete',
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
};

// Default-Rollen, die wir im Admin-UI als Vorschlaege anbieten.
// Frei erweiterbar, der String wird einfach in profiles.crew_roles[] gespeichert.
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
];

export type Level = 'read' | 'write' | 'delete';
