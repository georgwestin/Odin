import {defineType, defineField} from 'sanity'

const richTextBlock = {
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
}

export default defineType({
  name: 'infoPage',
  title: 'Page',
  type: 'document',
  description: 'CMS-managed pages with multi-language support.',
  fieldsets: [
    {name: 'swedish', title: '🇸🇪 Svenska', options: {collapsible: true}},
    {name: 'english', title: '🇬🇧 English', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      description: 'Internal name to identify this page (not shown to users).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path for this page, e.g. "about" → /about or /sv/about',
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

    // Swedish content
    defineField({
      name: 'title_sv',
      title: 'Titel',
      type: 'string',
      fieldset: 'swedish',
      description: 'Sidtitel på svenska.',
    }),
    defineField({
      name: 'body_sv',
      title: 'Innehåll',
      type: 'array',
      fieldset: 'swedish',
      of: [richTextBlock, {type: 'image', options: {hotspot: true}}],
    }),

    // English content
    defineField({
      name: 'title_en',
      title: 'Title',
      type: 'string',
      fieldset: 'english',
      description: 'Page title in English.',
    }),
    defineField({
      name: 'body_en',
      title: 'Content',
      type: 'array',
      fieldset: 'english',
      of: [richTextBlock, {type: 'image', options: {hotspot: true}}],
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
      titleSv: 'title_sv',
      category: 'category',
      brandName: 'brand.name',
    },
    prepare({title, titleSv, category, brandName}) {
      return {
        title: title || titleSv || 'Untitled',
        subtitle: [category, brandName].filter(Boolean).join(' | '),
      }
    },
  },
})
