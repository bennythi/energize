import { defineType, defineField } from 'sanity';

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media (Aftermovie, Endshow, Galerie)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Aftermovie', value: 'aftermovie' },
          { title: 'Endshow', value: 'endshow' },
          { title: 'Galerie', value: 'gallery' },
          { title: 'News / Blog', value: 'news' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Jahr',
      type: 'number',
      validation: (Rule) => Rule.required().min(2020).max(2099),
    }),
    defineField({
      name: 'youtubeId',
      title: 'YouTube Video-ID',
      type: 'string',
      description: 'Nur die ID (z. B. "dQw4w9WgXcQ"), nicht die ganze URL.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover-Bild',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      title: 'Kurzbeschreibung',
      type: 'localizedText',
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
      title: 'Neueste zuerst',
      name: 'yearDesc',
      by: [
        { field: 'year', direction: 'desc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title.de', subtitle: 'year', media: 'coverImage' },
    prepare: ({ title, subtitle, media }) => ({
      title: title ?? '(unbenannt)',
      subtitle: subtitle ? String(subtitle) : undefined,
      media,
    }),
  },
});
