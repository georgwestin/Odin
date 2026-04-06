import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fieldsets: [
    {name: 'publishing', title: 'Publishing', options: {collapsible: true, collapsed: true}},
  ],
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
      description: 'Which brand this page belongs to.',
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
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      of: [
        {type: 'hero'},
        {type: 'textBlock'},
        {type: 'imageGrid'},
        {type: 'ctaBlock'},
        {type: 'faqSection'},
      ],
      description: 'Build the page by adding content sections.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      fieldset: 'publishing',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      fieldset: 'publishing',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      status: 'status',
      brandName: 'brand.name',
    },
    prepare({title, language, status, brandName}) {
      return {
        title,
        subtitle: [brandName, language?.toUpperCase(), status].filter(Boolean).join(' | '),
      }
    },
  },
})
