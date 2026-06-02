import { defineType, defineField } from 'sanity';

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Lokalisierter Fließtext',
  type: 'object',
  fields: [
    defineField({
      name: 'de',
      title: 'Deutsch',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'text',
      rows: 4,
    }),
  ],
});
