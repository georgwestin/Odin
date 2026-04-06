import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'translation',
  title: 'Translation',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      description: 'Translation key, e.g. "nav.casino", "footer.responsible_gambling".',
      validation: (Rule) =>
        Rule.required().custom((key) => {
          if (typeof key === 'string' && !/^[a-z0-9_.]+$/.test(key)) {
            return 'Key must be lowercase with dots and underscores only (e.g. "nav.casino").'
          }
          return true
        }),
    }),
    defineField({
      name: 'namespace',
      title: 'Namespace',
      type: 'string',
      description: 'Group translations by feature area.',
      options: {
        list: [
          {title: 'Common', value: 'common'},
          {title: 'Casino', value: 'casino'},
          {title: 'Sports', value: 'sports'},
          {title: 'Wallet', value: 'wallet'},
          {title: 'Auth', value: 'auth'},
          {title: 'Footer', value: 'footer'},
          {title: 'Navigation', value: 'nav'},
          {title: 'Bonuses', value: 'bonuses'},
          {title: 'Account', value: 'account'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'translations',
      title: 'Translations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'language',
              title: 'Language',
              type: 'string',
              options: {
                list: [
                  {title: 'Swedish', value: 'sv'},
                  {title: 'English', value: 'en'},
                  {title: 'Finnish', value: 'fi'},
                  {title: 'Norwegian', value: 'no'},
                  {title: 'Danish', value: 'da'},
                  {title: 'German', value: 'de'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'language',
              subtitle: 'value',
            },
            prepare({title, subtitle}) {
              return {
                title: title?.toUpperCase() || 'Unknown',
                subtitle: subtitle?.substring(0, 80) || '',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Context for translators about where and how this string is used.',
    }),
  ],
  orderings: [
    {
      title: 'Key (A-Z)',
      name: 'keyAsc',
      by: [{field: 'key', direction: 'asc'}],
    },
    {
      title: 'Namespace',
      name: 'namespaceAsc',
      by: [
        {field: 'namespace', direction: 'asc'},
        {field: 'key', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'key',
      namespace: 'namespace',
      translations: 'translations',
    },
    prepare({title, namespace, translations}) {
      const langCount = translations?.length || 0
      return {
        title: title || 'Untitled',
        subtitle: `${namespace || 'no namespace'} (${langCount} language${langCount !== 1 ? 's' : ''})`,
      }
    },
  },
})
