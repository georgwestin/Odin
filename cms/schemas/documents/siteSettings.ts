import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fieldsets: [
    {name: 'maintenance', title: 'Maintenance Mode', options: {collapsible: true, collapsed: true}},
    {name: 'announcement', title: 'Announcement Bar', options: {collapsible: true, collapsed: true}},
    {name: 'legal', title: 'Legal & Compliance', options: {collapsible: true, collapsed: true}},
    {name: 'defaults', title: 'Defaults', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'reference',
      to: [{type: 'brand'}],
      validation: (Rule) => Rule.required(),
      description: 'Settings apply to this brand.',
    }),
    defineField({
      name: 'maintenanceMode',
      title: 'Maintenance Mode',
      type: 'boolean',
      description: 'Enable to show maintenance page to all visitors.',
      initialValue: false,
      fieldset: 'maintenance',
    }),
    defineField({
      name: 'maintenanceMessage',
      title: 'Maintenance Message',
      type: 'text',
      rows: 3,
      description: 'Message to display during maintenance.',
      fieldset: 'maintenance',
    }),
    defineField({
      name: 'announcement',
      title: 'Announcement',
      type: 'object',
      fieldset: 'announcement',
      fields: [
        defineField({
          name: 'text',
          title: 'Text',
          type: 'string',
          description: 'Announcement bar text.',
        }),
        defineField({
          name: 'type',
          title: 'Type',
          type: 'string',
          options: {
            list: [
              {title: 'Info', value: 'info'},
              {title: 'Warning', value: 'warning'},
              {title: 'Success', value: 'success'},
            ],
            layout: 'radio',
          },
          initialValue: 'info',
        }),
        defineField({
          name: 'isActive',
          title: 'Is Active',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'link',
          title: 'Link',
          type: 'string',
          description: 'Optional URL the announcement links to.',
        }),
      ],
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Rich text content for the site footer.',
      fieldset: 'legal',
    }),
    defineField({
      name: 'responsibleGamblingText',
      title: 'Responsible Gambling Text',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Responsible gambling information displayed site-wide.',
      fieldset: 'legal',
    }),
    defineField({
      name: 'cookieConsentText',
      title: 'Cookie Consent Text',
      type: 'text',
      rows: 3,
      description: 'Text displayed in the cookie consent banner.',
      fieldset: 'legal',
    }),
    defineField({
      name: 'defaultCurrency',
      title: 'Default Currency',
      type: 'string',
      description: 'Default currency code (e.g. SEK, EUR, NOK).',
      fieldset: 'defaults',
    }),
    defineField({
      name: 'minAge',
      title: 'Minimum Age',
      type: 'number',
      description: 'Minimum age requirement.',
      initialValue: 18,
      validation: (Rule) => Rule.min(18).max(21).integer(),
      fieldset: 'defaults',
    }),
  ],
  preview: {
    select: {
      brandName: 'brand.name',
      maintenance: 'maintenanceMode',
    },
    prepare({brandName, maintenance}) {
      return {
        title: `Settings: ${brandName || 'No Brand'}`,
        subtitle: maintenance ? 'MAINTENANCE MODE ON' : 'Normal operation',
      }
    },
  },
})
