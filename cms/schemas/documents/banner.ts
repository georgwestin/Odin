import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  fieldsets: [
    {name: 'content', title: 'Content', options: {collapsible: true}},
    {name: 'appearance', title: 'Appearance', options: {collapsible: true, collapsed: true}},
    {name: 'scheduling', title: 'Scheduling & Targeting', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      description: 'Internal name for this banner (not displayed to users).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
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
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'string',
      options: {
        list: [
          {title: 'Hero', value: 'hero'},
          {title: 'Sidebar', value: 'sidebar'},
          {title: 'Popup', value: 'popup'},
          {title: 'Inline', value: 'inline'},
          {title: 'Footer', value: 'footer'},
          {title: 'Category Header', value: 'category-header'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fieldset: 'content',
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional mobile-specific image.',
      fieldset: 'content',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      fieldset: 'content',
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'string',
      fieldset: 'content',
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA Text',
      type: 'string',
      fieldset: 'content',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'CTA URL',
      type: 'string',
      fieldset: 'content',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color value (e.g. #1a1a2e).',
      fieldset: 'appearance',
    }),
    defineField({
      name: 'gradientFrom',
      title: 'Gradient From',
      type: 'string',
      description: 'Start color for gradient background.',
      fieldset: 'appearance',
    }),
    defineField({
      name: 'gradientTo',
      title: 'Gradient To',
      type: 'string',
      description: 'End color for gradient background.',
      fieldset: 'appearance',
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color Scheme',
      type: 'string',
      options: {
        list: [
          {title: 'Light (white text)', value: 'light'},
          {title: 'Dark (dark text)', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      fieldset: 'appearance',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When this banner becomes visible.',
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When this banner stops being visible.',
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Higher number = higher priority (1-100).',
      validation: (Rule) => Rule.min(1).max(100).integer(),
      initialValue: 50,
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Master toggle for this banner.',
      initialValue: true,
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'targetSegment',
      title: 'Target Segment',
      type: 'string',
      options: {
        list: [
          {title: 'All Players', value: 'all'},
          {title: 'New Players', value: 'new-players'},
          {title: 'VIP', value: 'vip'},
          {title: 'Depositors', value: 'depositors'},
          {title: 'Non-Depositors', value: 'non-depositors'},
        ],
      },
      initialValue: 'all',
      fieldset: 'scheduling',
    }),
  ],
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [{field: 'priority', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      placement: 'placement',
      isActive: 'isActive',
      media: 'image',
    },
    prepare({title, placement, isActive, media}) {
      return {
        title,
        subtitle: `${placement || 'No placement'} ${isActive ? '(Active)' : '(Inactive)'}`,
        media,
      }
    },
  },
})
