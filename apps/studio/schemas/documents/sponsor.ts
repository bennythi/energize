import { defineType, defineField } from 'sanity';

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor / Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      description: 'SVG bevorzugt, sonst PNG mit transparentem Hintergrund.',
      type: 'image',
      options: { hotspot: false },
      fields: [defineField({ name: 'alt', title: 'Alt-Text', type: 'string' })],
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Gold-Sponsor', value: 'gold' },
          { title: 'Silver-Sponsor', value: 'silver' },
          { title: 'Partner', value: 'partner' },
          { title: 'Media-Partner', value: 'media' },
        ],
        layout: 'radio',
      },
      initialValue: 'partner',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge im Tier',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Tier + Reihenfolge',
      name: 'tierThenOrder',
      by: [
        { field: 'tier', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'name', media: 'logo', subtitle: 'tier' },
  },
});
