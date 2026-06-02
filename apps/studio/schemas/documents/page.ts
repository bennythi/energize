import { defineType, defineField } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Seite (Background, La Familia, Impressum, …)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => (doc as { title?: { de?: string } }).title?.de ?? '',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'audience',
      title: 'Sichtbarkeit',
      type: 'string',
      options: {
        list: [
          { title: 'Öffentlich', value: 'public' },
          { title: 'Nur Login (App)', value: 'login' },
          { title: 'Public Teaser + Login-Tiefe', value: 'hybrid' },
        ],
        layout: 'radio',
      },
      initialValue: 'public',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero-Bild',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'body',
      title: 'Inhalt',
      type: 'localizedPortableText',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge in Navigation',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'title.de', subtitle: 'slug.current' },
  },
});
