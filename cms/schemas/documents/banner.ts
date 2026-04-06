import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  fieldsets: [
    {name: 'swedish', title: '🇸🇪 Svenska', options: {collapsible: true}},
    {name: 'english', title: '🇬🇧 English', options: {collapsible: true, collapsed: true}},
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

    // Images (shared across languages)
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional mobile-specific image.',
    }),

    // Swedish content
    defineField({
      name: 'headline_sv',
      title: 'Rubrik',
      type: 'string',
      fieldset: 'swedish',
    }),
    defineField({
      name: 'subheadline_sv',
      title: 'Underrubrik',
      type: 'string',
      fieldset: 'swedish',
    }),
    defineField({
      name: 'ctaText_sv',
      title: 'Knapptext',
      type: 'string',
      fieldset: 'swedish',
    }),

    // English content
    defineField({
      name: 'headline_en',
      title: 'Headline',
      type: 'string',
      fieldset: 'english',
    }),
    defineField({
      name: 'subheadline_en',
      title: 'Subheadline',
      type: 'string',
      fieldset: 'english',
    }),
    defineField({
      name: 'ctaText_en',
      title: 'Button Text',
      type: 'string',
      fieldset: 'english',
    }),

    // Shared fields (not language-specific)
    defineField({
      name: 'ctaUrl',
      title: 'CTA URL',
      type: 'string',
      description: 'Link destination for the button (same for all languages).',
    }),

    // Keep old fields for backward compat during migration
    defineField({
      name: 'headline',
      title: 'Headline (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA Text (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'language',
      title: 'Language (legacy)',
      type: 'string',
      hidden: true,
    }),

    // Appearance
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
      fieldset: 'appearance',
    }),
    defineField({
      name: 'gradientTo',
      title: 'Gradient To',
      type: 'string',
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

    // Scheduling
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
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
        subtitle: `${placement || 'No placement'} ${isActive ? '✅ Active' : '⏸ Inactive'}`,
        media,
      }
    },
  },
})
