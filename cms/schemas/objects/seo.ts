import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'seo',
  title: 'SEO Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Title for search engines. Recommended: 50-60 characters.',
      validation: (Rule) => Rule.max(70).warning('Meta titles longer than 70 characters may be truncated in search results.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Description for search engines. Recommended: 150-160 characters.',
      validation: (Rule) => Rule.max(160).warning('Meta descriptions longer than 160 characters may be truncated.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image displayed when sharing on social media. Recommended: 1200x630px.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'If enabled, search engines will not index this page.',
      initialValue: false,
    }),
  ],
})
