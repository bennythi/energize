import { defineType, defineField } from 'sanity';

export const faqEntry = defineType({
  name: 'faqEntry',
  title: 'FAQ-Eintrag',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Frage',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Antwort',
      type: 'localizedText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: [
          { title: 'Tickets', value: 'tickets' },
          { title: 'Anreise', value: 'anreise' },
          { title: 'Hausordnung', value: 'hausordnung' },
          { title: 'Cashless', value: 'cashless' },
          { title: 'Awareness', value: 'awareness' },
          { title: 'Allgemein', value: 'general' },
        ],
        layout: 'radio',
      },
      initialValue: 'general',
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
      title: 'Kategorie + Reihenfolge',
      name: 'categoryThenOrder',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'question.de', subtitle: 'category' },
  },
});
