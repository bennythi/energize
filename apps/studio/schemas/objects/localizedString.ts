import { defineType, defineField } from 'sanity';

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Lokalisierter Text (kurz)',
  type: 'object',
  fields: [
    defineField({
      name: 'de',
      title: 'Deutsch',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'de', subtitle: 'en' },
  },
});
