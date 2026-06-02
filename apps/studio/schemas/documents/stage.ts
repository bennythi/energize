import { defineType, defineField } from 'sanity';

export const stage = defineType({
  name: 'stage',
  title: 'Bühne',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
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
      name: 'color',
      title: 'Bühnen-Akzentfarbe',
      type: 'string',
      description: 'Hex-Code (z. B. #FFEC00). Default = Energize Yellow.',
      initialValue: '#FFEC00',
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'localizedString',
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
      title: 'Reihenfolge',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug.current' },
  },
});
