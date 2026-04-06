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
      name: 'section',
      title: 'Section',
      type: 'string',
      description: 'Which section of the site this page belongs to.',
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
    // Keep old field hidden for migration
    defineField({
      name: 'category',
      title: 'Category (legacy)',
      type: 'string',
      hidden: true,
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
      title: 'Section',
      name: 'sectionAsc',
      by: [
        {field: 'section', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      titleSv: 'title_sv',
      section: 'section',
      brandName: 'brand.name',
    },
    prepare({title, titleSv, section, brandName}) {
      return {
        title: title || titleSv || 'Untitled',
        subtitle: [section, brandName].filter(Boolean).join(' | '),
      }
    },
  },
})
