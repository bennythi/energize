import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website-Einstellungen',
  type: 'document',
  // Singleton: nur ein Dokument pro Dataset.
  // Die Erzwingung läuft über structure.ts (Sidebar zeigt direkt das eine Dokument).
  fields: [
    defineField({
      name: 'festivalName',
      title: 'Festival-Name',
      type: 'string',
      initialValue: 'ENERGIZE Festival',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'edition',
      title: 'Ausgabe / Jahr',
      type: 'number',
      initialValue: 2027,
      validation: (Rule) => Rule.required().min(2024).max(2099),
    }),
    defineField({
      name: 'seasonMotto',
      title: 'Saison-Motto',
      description: '2026 war "The Ultimate Reality". Für 2027 noch offen.',
      type: 'localizedString',
    }),
    defineField({
      name: 'festivalStart',
      title: 'Festival-Beginn',
      type: 'datetime',
      description: 'Empfehlung: Sa 29.05.2027 14:30 (analog 2026)',
    }),
    defineField({
      name: 'festivalEnd',
      title: 'Festival-Ende',
      type: 'datetime',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'Stockelsdorf/Dissau bei Lübeck',
    }),

    defineField({
      name: 'ticketUrl',
      title: 'Tickee-Shop URL',
      type: 'url',
      initialValue: 'https://shop.tickee.de/shop/84/',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'cashlessUrl',
      title: 'Cashless-Portal URL',
      type: 'url',
      initialValue: 'https://cashless.energize-festival.de/',
    }),

    defineField({
      name: 'twitchChannel',
      title: 'Twitch-Kanal (ohne @)',
      type: 'string',
      initialValue: 'beatfighterz',
      description: 'Wird via https://twitch.tv/{channel} eingebunden.',
    }),
    defineField({
      name: 'twitchLive',
      title: 'Live-Stream aktiv?',
      type: 'boolean',
      initialValue: false,
      description: 'Festival-Tag manuell auf TRUE setzen für Hero-Badge + Live-Tab.',
    }),

    defineField({
      name: 'socials',
      title: 'Social Media',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube URL', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
      ],
      options: { collapsible: true, collapsed: false },
    }),

    defineField({
      name: 'contactEmail',
      title: 'Kontakt-E-Mail',
      type: 'string',
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
