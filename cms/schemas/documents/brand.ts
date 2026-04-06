import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  icon: () => '🏷',
  fields: [
    defineField({
      name: 'name',
      title: 'Brand Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
      description: 'Primary domain for this brand (e.g. swedbet.se).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Primary logo for light backgrounds.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'logoLight',
      title: 'Logo (Light / Dark BG)',
      type: 'image',
      description: 'Logo variant for dark backgrounds.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Browser favicon. Recommended: 32x32px or 64x64px.',
    }),
    defineField({
      name: 'colors',
      title: 'Brand Colors',
      type: 'object',
      fields: [
        defineField({name: 'primary', title: 'Primary', type: 'string', description: 'Primary brand color (hex).'}),
        defineField({name: 'secondary', title: 'Secondary', type: 'string', description: 'Secondary brand color (hex).'}),
        defineField({name: 'accent', title: 'Accent', type: 'string', description: 'Accent color (hex).'}),
        defineField({name: 'background', title: 'Background', type: 'string', description: 'Background color (hex).'}),
        defineField({name: 'text', title: 'Text', type: 'string', description: 'Text color (hex).'}),
      ],
    }),
    defineField({
      name: 'defaultLanguage',
      title: 'Default Language',
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
      initialValue: 'sv',
    }),
    defineField({
      name: 'supportedLanguages',
      title: 'Supported Languages',
      type: 'array',
      of: [{type: 'string'}],
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
    }),
    defineField({
      name: 'supportEmail',
      title: 'Support Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'licenseText',
      title: 'License Text',
      type: 'text',
      rows: 4,
      description: 'Gambling license information displayed in the footer.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'Twitter / X', value: 'twitter'},
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'Telegram', value: 'telegram'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'platform', subtitle: 'url'},
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'domain',
      media: 'logo',
    },
  },
})
