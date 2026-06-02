import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website-Einstellungen',
  type: 'document',
  // Singleton: nur ein Dokument pro Dataset.
  // Die Erzwingung läuft über structure.ts (Sidebar zeigt direkt das eine Dokument).
  groups: [
    { name: 'general', title: 'Allgemein', default: true },
    { name: 'venue', title: 'Venue & Anreise' },
    { name: 'times', title: 'Zeitplan' },
    { name: 'tickets', title: 'Tickets & Cashless' },
    { name: 'stream', title: 'Twitch-Stream' },
    { name: 'social', title: 'Social Media' },
  ],
  fields: [
    // ===== ALLGEMEIN =====
    defineField({
      name: 'festivalName',
      title: 'Festival-Name',
      type: 'string',
      initialValue: 'ENERGIZE Festival',
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'edition',
      title: 'Ausgabe / Jahr',
      type: 'number',
      initialValue: 2027,
      validation: (Rule) => Rule.required().min(2024).max(2099),
      group: 'general',
    }),
    defineField({
      name: 'seasonMotto',
      title: 'Saison-Motto',
      description: '2026 war "The Ultimate Reality". Für 2027 noch offen.',
      type: 'localizedString',
      group: 'general',
    }),
    defineField({
      name: 'venueSubtitle',
      title: 'Venue-Subtitle',
      description: '2026: "Overvoltage Grounds — The Edge of Nowhere". Kann pro Edition wechseln.',
      type: 'localizedString',
      group: 'general',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Kontakt-E-Mail',
      type: 'string',
      group: 'general',
    }),

    // ===== VENUE & ANREISE =====
    defineField({
      name: 'venueAddress',
      title: 'Venue-Adresse',
      type: 'object',
      group: 'venue',
      fields: [
        defineField({
          name: 'street',
          title: 'Straße + Hausnummer',
          type: 'string',
          initialValue: 'Am Dorfteich 4',
        }),
        defineField({
          name: 'postalCode',
          title: 'PLZ',
          type: 'string',
          initialValue: '23617',
        }),
        defineField({
          name: 'city',
          title: 'Stadt',
          type: 'string',
          initialValue: 'Dissau',
        }),
        defineField({
          name: 'region',
          title: 'Region / Bemerkung',
          type: 'string',
          initialValue: 'Stockelsdorf/Dissau bei Lübeck',
        }),
        defineField({
          name: 'geo',
          title: 'Geo-Koordinaten',
          type: 'geopoint',
          description: 'Optional, für externe Karten (Google Maps Anfahrt).',
        }),
      ],
    }),
    defineField({
      name: 'parkingTicketUrl',
      title: 'Parkticket-URL',
      type: 'url',
      description: 'Deep-Link in den Tickee-Shop zur Parkticket-Kategorie.',
      group: 'venue',
    }),
    defineField({
      name: 'shuttleTicketUrl',
      title: 'Shuttleticket-URL',
      type: 'url',
      description: 'Deep-Link zum Lübeck-HBF-Shuttle-Ticket.',
      group: 'venue',
    }),
    defineField({
      name: 'shuttleNote',
      title: 'Shuttle-Hinweis',
      type: 'localizedText',
      description: 'Ablauf-Erklärung (z. B. "alle Gäste kommen um ca. 00:15 mit dem Bus...").',
      group: 'venue',
    }),

    // ===== ZEITPLAN =====
    defineField({
      name: 'festivalStart',
      title: 'Festival-Beginn (Doors Open)',
      type: 'datetime',
      description: 'Empfehlung 2027: Sa 29.05.2027 14:30 (analog 2026).',
      group: 'times',
    }),
    defineField({
      name: 'festivalEnd',
      title: 'Festival-Ende',
      type: 'datetime',
      description: 'Big Bang Endshow um 23:40, harter Schluss 24:00.',
      group: 'times',
    }),
    defineField({
      name: 'warmupStreamStart',
      title: 'Warm-Up Twitch-Stream Start',
      type: 'datetime',
      description: 'z. B. 10:00 Uhr "ENERGIZE — The Awakening" mit den Beatfighterz.',
      group: 'times',
    }),
    defineField({
      name: 'openingRitual',
      title: '„Ritual & Official Opening"',
      type: 'datetime',
      description: 'z. B. 15:15 Uhr.',
      group: 'times',
    }),
    defineField({
      name: 'endshowStart',
      title: '„Big Bang Endshow"',
      type: 'datetime',
      description: 'z. B. 23:40 Uhr.',
      group: 'times',
    }),

    // ===== TICKETS & CASHLESS =====
    defineField({
      name: 'ticketUrl',
      title: 'Tickee-Shop URL',
      type: 'url',
      initialValue: 'https://shop.tickee.de/shop/84/',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
      group: 'tickets',
    }),
    defineField({
      name: 'cashlessUrl',
      title: 'Cashless-Portal URL',
      type: 'url',
      initialValue: 'https://cashless.energize-festival.de/',
      group: 'tickets',
    }),
    defineField({
      name: 'tickeeSupportEmail',
      title: 'Tickee-Support-E-Mail',
      type: 'string',
      initialValue: 'support@tickee.de',
      group: 'tickets',
    }),

    // ===== TWITCH =====
    defineField({
      name: 'twitchChannel',
      title: 'Twitch-Kanal (ohne @)',
      type: 'string',
      initialValue: 'beatfighterz',
      description: 'Wird via https://twitch.tv/{channel} eingebunden.',
      group: 'stream',
    }),
    defineField({
      name: 'twitchLive',
      title: 'Live-Stream aktiv?',
      type: 'boolean',
      initialValue: false,
      description: 'Festival-Tag manuell auf TRUE setzen für Hero-Badge + Live-Tab.',
      group: 'stream',
    }),

    // ===== SOCIAL =====
    defineField({
      name: 'socials',
      title: 'Social Media',
      type: 'object',
      group: 'social',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube URL', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'festivalName', subtitle: 'edition' },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle: subtitle ? `Ausgabe ${subtitle}` : undefined,
    }),
  },
});
