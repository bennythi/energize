import { defineType, defineField } from 'sanity';

export const artist = defineType({
  name: 'artist',
  title: 'Künstler / DJ',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Künstlername',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 64 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt-Text', type: 'string' })],
    }),
    defineField({
      name: 'bio',
      title: 'Biografie',
      type: 'localizedText',
    }),
    defineField({
      name: 'stage',
      title: 'Bühne',
      type: 'reference',
      to: [{ type: 'stage' }],
    }),
    defineField({
      name: 'slotStart',
      title: 'Slot-Beginn',
      type: 'datetime',
      description:
        'Wird nicht öffentlich angezeigt — nur intern für Set-Reminder-Push (15 min Vorlauf).',
    }),
    defineField({
      name: 'slotEnd',
      title: 'Slot-Ende',
      type: 'datetime',
    }),
    defineField({
      name: 'isLive',
      title: 'Jetzt LIVE?',
      type: 'boolean',
      initialValue: false,
      description: 'Stage-Manager am Festival-Tag setzen für "Now Playing"-Badge.',
    }),
    defineField({
      name: 'featured',
      title: 'Headliner / Featured?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'links',
      title: 'Streaming / Social',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'spotify', title: 'Spotify', type: 'url' }),
        defineField({ name: 'soundcloud', title: 'SoundCloud', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
      ],
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Featured zuerst, dann Slot',
      name: 'featuredFirst',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: 'slotStart', direction: 'asc' },
      ],
    },
    {
      title: 'Alphabetisch',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photo',
      stage: 'stage.name',
      live: 'isLive',
    },
    prepare: ({ title, media, stage, live }) => ({
      title: live ? `${title} (LIVE)` : title,
      subtitle: stage ?? undefined,
      media,
    }),
  },
});
