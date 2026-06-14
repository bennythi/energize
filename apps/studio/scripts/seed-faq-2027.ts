/**
 * FAQ-Seed fuer Energize 2027.
 * Speist die FAQ aus dem 2026er Wix-Build plus aktuelle Updates ein.
 *
 * VOR DEM AUSFUEHREN: SANITY_AUTH_TOKEN in apps/studio/.env.local
 *
 * pnpm --filter @energize/studio seed:faq
 *
 * Idempotent ueber stable _id "faq-<slug>".
 */

import { createClient } from '@sanity/client';

const PROJECT_ID = 'oxliq7rf';
const DATASET = 'production';
const API_VERSION = '2025-01-01';

const token = process.env.SANITY_AUTH_TOKEN;
if (!token) {
  console.error('SANITY_AUTH_TOKEN fehlt in apps/studio/.env.local.');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

type Category = 'tickets' | 'anreise' | 'hausordnung' | 'cashless' | 'awareness' | 'general';

interface Entry {
  slug: string;
  category: Category;
  order: number;
  question: { de: string; en?: string };
  answer: { de: string; en?: string };
}

const entries: Entry[] = [
  // ============= TICKETS =============
  {
    slug: 'tageskasse',
    category: 'tickets',
    order: 10,
    question: { de: 'Gibt es eine Tageskasse?' },
    answer: {
      de:
        'Nein. Tickets gibt es ausschließlich über den Online-Shop von tickee auf unserer Homepage.\n\n' +
        'Wenn dort keine Festivaltickets mehr verfügbar sind, ist das Event ausverkauft.',
    },
  },
  {
    slug: 'ticketing-personalisierung',
    category: 'tickets',
    order: 20,
    question: { de: 'Muss ich mein Ticket personalisieren?' },
    answer: {
      de:
        'Ja. Einige von euch haben ihr Ticket noch nicht personalisiert. Erst mit der Personalisierung ' +
        'erhaltet ihr die fertigen Tickets von tickee.\n\n' +
        'Bei Fragen rund um den Ticketshop wendet euch bitte direkt an support@tickee.de.',
    },
  },

  // ============= ALLGEMEIN =============
  {
    slug: 'wann-geht-es-los',
    category: 'general',
    order: 10,
    question: { de: 'Wann geht es los?' },
    answer: {
      de:
        'Am 29.05.2027 um 14:30 Uhr öffnen wir die Türen zu unseren Overvoltage Grounds. ' +
        '"The Edge of Nowhere".\n\n' +
        'Die Veranstaltung endet nach 9,5 Stunden mit dem großen Finale um genau 24:00 Uhr.',
    },
  },
  {
    slug: 'timetable',
    category: 'general',
    order: 20,
    question: { de: 'Wann spielt wer? (Timetable)' },
    answer: {
      de:
        'Wir veröffentlichen keinen Timetable.\n\n' +
        'Wie auch in den vergangenen Jahren: Wir sind keine Headlinershow und kein Konzert eines ' +
        'großen Künstlers. Bei uns zählt ENERGIZE, das Gesamterlebnis, die Gemeinschaft und die ' +
        'Leidenschaft zur Musik insgesamt. Jedes Set auf unserem Line-up und Ihr, die gesamte Crowd, ' +
        'seid Teil des großen Ganzen. ⚡\n\n' +
        'Mit Community-Account und App wirst du 15 Minuten vor jedem Set deiner favorisierten Acts ' +
        'benachrichtigt, auch ohne Timetable.\n\n' +
        'Fix-Zeiten am Festival-Tag:\n\n' +
        '10:00 Uhr · ENERGIZE - The Awakening\n' +
        'Trefft euch zum Frühstück mit den ersten Kaltgetränken und macht euch gemeinsam fertig. ' +
        'Der ENERGIZE Warm-Up-Stream mit Alex & Reini läuft auf twitch.tv/beatfighterz.\n\n' +
        '14:30 Uhr · ☀️ Doors Open & Step into Reality\n' +
        '15:15 Uhr · 📯 The Ritual & Official Opening\n' +
        '23:40 Uhr · 💥 Big Bang Endshow',
    },
  },
  {
    slug: 'weitere-fragen',
    category: 'general',
    order: 999,
    question: { de: 'Ich habe noch weitere Fragen.' },
    answer: {
      de:
        'Schreib uns über das Support-Formular auf dieser Seite oder per Direct Message auf Instagram ' +
        '(@energize_offical). Beim Support landen die Anfragen direkt im Energize-Backoffice und du ' +
        'siehst den Status in deinem Account.',
    },
  },

  // ============= HAUSORDNUNG =============
  {
    slug: 'einlass',
    category: 'hausordnung',
    order: 10,
    question: { de: 'Ab wieviel Jahren ist der Einlass?' },
    answer: {
      de:
        'Der Einlass ist strikt ab 18 Jahren.\n\n' +
        'Bitte haltet eure Tickets (auf dem Handy reicht) und euren Personalausweis am Einlass bereit.',
    },
  },
  {
    slug: 'erlaubt',
    category: 'hausordnung',
    order: 20,
    question: { de: 'Was darf ich mitbringen?' },
    answer: {
      de:
        '✅ Was auf dem Gelände erlaubt ist:\n\n' +
        '· Kleine Accessoires wie Fächer oder Sonnenbrillen\n' +
        '· Fahnen, Kostüme, besondere Outfits\n' +
        '· Sonnencreme und medizinisch Notwendiges\n' +
        '· Kleine Taschen oder Rucksäcke (max. normaler Rucksack oder kleine Sporttasche)\n' +
        '· Tabak, Vapes und Feuerzeuge\n' +
        '· Marihuana (geringe Menge für den Eigenbedarf)',
    },
  },
  {
    slug: 'verboten',
    category: 'hausordnung',
    order: 30,
    question: { de: 'Was ist verboten?' },
    answer: {
      de:
        '❌ Auf dem Gelände nicht erlaubt:\n\n' +
        '· Messer, Waffen, Sprays oder andere gefährliche Gegenstände\n' +
        '· Spitze Gegenstände oder Glas\n' +
        '· Eigene Getränke oder Essen\n' +
        '· Campen auf dem Parkplatz oder anderswo im öffentlichen Raum',
    },
  },
  {
    slug: 'garderobe-locker',
    category: 'hausordnung',
    order: 40,
    question: { de: 'Wo lasse ich meine Jacke und meinen Rucksack?' },
    answer: {
      de:
        '🧥 Für einzelne Garderobenteile wie Jacken oder Pullis bieten wir euch eine Garderobe an. ' +
        'Bezahlung läuft über Guthaben.\n\n' +
        'Für mehrere Jacken/Pullis oder Taschen/Rucksäcke nutzt bitte die Schließfächer ' +
        '(Eventlocker, medium oder large) auf dem Gelände. Die Bezahlung läuft online vorab. ' +
        'Folgt den Anweisungen auf der Website.',
    },
  },

  // ============= CASHLESS =============
  {
    slug: 'cashless-grundlagen',
    category: 'cashless',
    order: 10,
    question: { de: 'Wie funktioniert das Cashless-Bezahlsystem?' },
    answer: {
      de:
        'Wir arbeiten dieses Jahr neu mit dem System von tickee zusammen.\n\n' +
        'Damit ändert sich auch das Bezahlsystem von TOKEN auf Cashless mit Festivalbändchen ' +
        'inklusive Guthabenchip. Das Bändchen lädst du selbst auf. Anschließend bezahlst du Essen, ' +
        'Getränke und Einzelgarderobe mit dem Bändchen.\n\n' +
        '‼️ Für das Aufladen vor Ort präferieren wir, wie überall, bargeldlos mit EC, Kreditkarte ' +
        'oder PayPal.',
    },
  },
  {
    slug: 'cashless-vorab-aufladen',
    category: 'cashless',
    order: 20,
    question: { de: 'Kann ich vorab Guthaben aufladen?' },
    answer: {
      de:
        'Ja. Lade vorab dein Ticket auf, dann ist das Guthaben direkt auf deinem Bändchen vor Ort. ' +
        'Nutze dafür:\n\n' +
        'https://cashless.energize-festival.de/',
    },
  },
  {
    slug: 'cashless-cash',
    category: 'cashless',
    order: 30,
    question: { de: 'Kann ich vor Ort mit Bargeld aufladen?' },
    answer: {
      de:
        'Ja, es gibt eine kleine Anzahl an Cash-Kassen vor Ort, an denen ihr Bargeld als Guthaben ' +
        'auf eure Bänder aufladen könnt.\n\n' +
        'Bargeldlos geht aber schneller und schont eure Nerven am Festival-Tag.',
    },
  },
  {
    slug: 'cashless-restguthaben',
    category: 'cashless',
    order: 40,
    question: { de: 'Was passiert mit meinem Restguthaben?' },
    answer: {
      de:
        'Das Restguthaben könnt ihr nach dem Event wieder auf euer Konto zurückbuchen lassen. ' +
        'Die Rückzahlung läuft direkt über das tickee-Cashless-System.',
    },
  },
  {
    slug: 'cashless-pfand',
    category: 'cashless',
    order: 50,
    question: { de: 'Wie funktioniert das Pfandsystem für Becher und Dosen?' },
    answer: {
      de:
        'Damit das Eventgelände sauber und der Dancefloor frei von Bechern bleibt, gibt es ein ' +
        'Pfandsystem mit Recycling-Chips.\n\n' +
        '1. Du erhältst deinen Recycling-Chip am Einlass.\n\n' +
        '2. Tausche den Chip an der Bar gegen jeweils ein Getränk.\n\n' +
        '3. Bringst du Becher oder Dose zurück, tauschst du sie gegen ein neues Getränk.\n\n' +
        '4. Kein Chip oder Becher dabei? Dann zahlst du an der Bar 1/2 TOKEN extra.\n\n' +
        'So bleibt der Floor sauber und die Crew vor Ort entspannt.',
    },
  },

  // ============= ANREISE =============
  {
    slug: 'adresse',
    category: 'anreise',
    order: 10,
    question: { de: 'Wo findet das Festival statt?' },
    answer: {
      de:
        '🎯 Adresse:\n\n' +
        'Am Dorfteich 4\n' +
        '23617 Dissau\n\n' +
        'Plant eure An- und Abreise frühzeitig.',
    },
  },
  {
    slug: 'taxi',
    category: 'anreise',
    order: 20,
    question: { de: 'Anreise mit Taxi oder Kiss & Ride?' },
    answer: {
      de:
        'Taxis sind um 00:10 Uhr spontan in Dissau nicht mehr so einfach zu bekommen.\n\n' +
        'Empfehlung: Taxi schon einige Tage vorab vorbestellen oder eine andere Abholmöglichkeit ' +
        'organisieren. Wer das vergisst, steht nachts länger in der Kälte.',
    },
  },
  {
    slug: 'pkw-parken',
    category: 'anreise',
    order: 30,
    question: { de: 'Anreise mit dem PKW?' },
    answer: {
      de:
        '🅿️ Nutzt den offiziellen Parkplatz, 2 Minuten vom Gelände entfernt. ' +
        'Besorgt euch für einen schnellen Ablauf vorab ein Parkticket in unserem Shop.\n\n' +
        'An den Straßen rund um das Gelände sind Parkverbote und Halteeinschränkungen eingerichtet. ' +
        'Riskiert keinen Abschlepper. 🛻',
    },
  },
  {
    slug: 'shuttle',
    category: 'anreise',
    order: 40,
    question: { de: 'Gibt es einen Shuttle-Bus?' },
    answer: {
      de:
        '🚌 Ja, ab und nach Lübeck Hauptbahnhof gibt es fest eingerichtete Shuttle-Touren. Hier gibt ' +
        'es ausschließlich Resttickets in unserem Shop. Sobald die weg sind, gibt es keine Möglichkeit ' +
        'mehr, dort mitzufahren.\n\n' +
        'Wichtiger Hinweis zum Ablauf: Wir buchen so viele Busse, dass alle Gäste um circa 00:15 Uhr ' +
        'gemeinsam zum Lübecker Hbf gebracht werden. Die Shuttle-Busse fahren also nicht im ' +
        'Pendelverkehr hin und her. Niemand wartet 1 oder 2 Stunden, bis ein Bus zurück ist. Alle ' +
        'fahren in derselben Welle.',
    },
  },
];

function localizedString(obj: { de: string; en?: string }) {
  return {
    _type: 'localizedString' as const,
    de: obj.de,
    ...(obj.en ? { en: obj.en } : {}),
  };
}

function localizedText(obj: { de: string; en?: string }) {
  return {
    _type: 'localizedText' as const,
    de: obj.de,
    ...(obj.en ? { en: obj.en } : {}),
  };
}

async function main() {
  console.log(`Seede ${entries.length} FAQ-Eintraege in Sanity ...`);
  const tx = client.transaction();
  for (const e of entries) {
    const id = `faq-${e.slug}`;
    tx.createOrReplace({
      _id: id,
      _type: 'faqEntry',
      question: localizedString(e.question),
      answer: localizedText(e.answer),
      category: e.category,
      order: e.order,
    });
  }
  const result = await tx.commit();
  console.log(`✓ ${result.results.length} Eintraege gespeichert.`);
  for (const r of result.results) console.log(`  - ${r.id}`);
}

main().catch((err) => {
  console.error('Seed fehlgeschlagen:', err);
  process.exit(1);
});
