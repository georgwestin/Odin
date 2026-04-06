import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'infoPage',
  title: 'Info Page',
  type: 'document',
  description: 'Static informational and legal pages.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'reference',
      to: [{type: 'brand'}],
    }),
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
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {name: 'href', type: 'url', title: 'URL'},
                  {name: 'openInNewTab', type: 'boolean', title: 'Open in new tab', initialValue: false},
                ],
              },
            ],
          },
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
        },
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Legal', value: 'legal'},
          {title: 'Help', value: 'help'},
          {title: 'About', value: 'about'},
          {title: 'Responsible Gambling', value: 'responsible-gambling'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastReviewed',
      title: 'Last Reviewed',
      type: 'datetime',
      description: 'Date this page was last reviewed for accuracy.',
    }),
  ],
  orderings: [
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [
        {field: 'category', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      language: 'language',
      brandName: 'brand.name',
    },
    prepare({title, category, language, brandName}) {
      return {
        title: title || 'Untitled',
        subtitle: [category, brandName, language?.toUpperCase()].filter(Boolean).join(' | '),
      }
    },
  },
})
