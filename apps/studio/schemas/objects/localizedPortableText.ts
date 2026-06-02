import { defineType, defineField } from 'sanity';

const blockArray = {
  type: 'array' as const,
  of: [
    {
      type: 'block' as const,
      styles: [
        { title: 'Standard', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Number', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Underline', value: 'underline' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object' as const,
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (Rule: { uri: (args: object) => unknown }) =>
                  Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
              },
            ],
          },
        ],
      },
    },
    {
      type: 'image' as const,
      options: { hotspot: true },
    },
  ],
};

export const localizedPortableText = defineType({
  name: 'localizedPortableText',
  title: 'Lokalisierter Rich-Text',
  type: 'object',
  fields: [
    defineField({ name: 'de', title: 'Deutsch', ...blockArray }),
    defineField({ name: 'en', title: 'English', ...blockArray }),
  ],
});
