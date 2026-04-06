import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'promotion',
  title: 'Promotion',
  type: 'document',
  fieldsets: [
    {name: 'details', title: 'Bonus Details', options: {collapsible: true}},
    {name: 'scheduling', title: 'Scheduling', options: {collapsible: true, collapsed: true}},
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
      name: 'type',
      title: 'Promotion Type',
      type: 'string',
      options: {
        list: [
          {title: 'Welcome Bonus', value: 'welcome-bonus'},
          {title: 'Deposit Bonus', value: 'deposit-bonus'},
          {title: 'Free Spins', value: 'free-spins'},
          {title: 'Cashback', value: 'cashback'},
          {title: 'Tournament', value: 'tournament'},
          {title: 'Loyalty', value: 'loyalty'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Full promotion description with rich text.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      description: 'Brief summary for cards and listings.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Promotion image. Recommended: 800x450px.',
    }),
    defineField({
      name: 'termsAndConditions',
      title: 'Terms & Conditions',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'bonusAmount',
      title: 'Bonus Amount',
      type: 'string',
      description: 'Display value, e.g. "100%" or "500 kr".',
      fieldset: 'details',
    }),
    defineField({
      name: 'wagering',
      title: 'Wagering Requirement',
      type: 'number',
      description: 'Wagering multiplier (e.g. 35 for 35x).',
      fieldset: 'details',
    }),
    defineField({
      name: 'minDeposit',
      title: 'Minimum Deposit',
      type: 'number',
      description: 'Minimum deposit amount in base currency.',
      fieldset: 'details',
    }),
    defineField({
      name: 'maxBonus',
      title: 'Maximum Bonus',
      type: 'number',
      description: 'Maximum bonus amount in base currency.',
      fieldset: 'details',
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid From',
      type: 'datetime',
      fieldset: 'scheduling',
    }),
    defineField({
      name: 'validTo',
      title: 'Valid To',
      type: 'datetime',
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
      name: 'promoCode',
      title: 'Promo Code',
      type: 'string',
      description: 'Optional promotion code players can use.',
    }),
  ],
  orderings: [
    {
      title: 'Type',
      name: 'typeAsc',
      by: [{field: 'type', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      isActive: 'isActive',
      media: 'image',
    },
    prepare({title, type, isActive, media}) {
      return {
        title,
        subtitle: `${type || 'No type'} ${isActive ? '(Active)' : '(Inactive)'}`,
        media,
      }
    },
  },
})
