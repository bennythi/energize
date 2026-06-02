import { defineType, defineField } from 'sanity';

export const poi = defineType({
  name: 'poi',
  title: 'POI (Karten-Punkt)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'svgId',
      title: 'SVG-Marker-ID',
      type: 'string',
      description:
        'Muss exakt zum id-Attribut des Markers in der Karten-SVG passen (z. B. "poi-mainstage").',
      validation: (Rule) => Rule.required().regex(/^poi-[a-z0-9-]+$/, { name: 'poi-slug-format' }),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Bühne', value: 'stage' },
          { title: 'Toilette', value: 'toilet' },
          { title: 'Sanitäter / Awareness', value: 'medic' },
          { title: 'Bar', value: 'bar' },
          { title: 'Food', value: 'food' },
          { title: 'Eingang / Einlass', value: 'entry' },
          { title: 'Cashless-Ladestation', value: 'cashless' },
          { title: 'Parkplatz / Shuttle', value: 'parking' },
          { title: 'Info-Punkt', value: 'info' },
          { title: 'Sonstiges', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'localizedText',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge in Legende',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Typ + Reihenfolge',
      name: 'typeThenOrder',
      by: [
        { field: 'type', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'name.de', subtitle: 'type', svgId: 'svgId' },
    prepare: ({ title, subtitle, svgId }) => ({
      title: title ?? '(unbenannt)',
      subtitle: `${subtitle ?? '?'} — ${svgId ?? '?'}`,
    }),
  },
});
