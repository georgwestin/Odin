import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'gameContent',
  title: 'Game Content',
  type: 'document',
  description: 'CMS content overlay for games. Supplements database game data with localized marketing content.',
  fields: [
    defineField({
      name: 'gameSlug',
      title: 'Game Slug',
      type: 'string',
      description: 'Must match the game slug in the database.',
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
      name: 'displayName',
      title: 'Display Name',
      type: 'string',
      description: 'Localized name override. If blank, the database name is used.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Full game description with rich text formatting.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      description: 'Brief summary for listings and cards.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'promoText',
      title: 'Promo Text',
      type: 'string',
      description: 'Short promotional badge text, e.g. "Nytt!", "Exklusivt hos SwedBet".',
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {hotspot: true},
      description: 'CMS-managed image. Overrides the database image URL when set.',
    }),
    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      description: 'Game screenshots for the detail page.',
    }),
    defineField({
      name: 'howToPlay',
      title: 'How to Play',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Instructions or tips for playing the game.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'CMS-managed tags for filtering and categorization.',
    }),
  ],
  orderings: [
    {
      title: 'Game Slug (A-Z)',
      name: 'gameSlugAsc',
      by: [{field: 'gameSlug', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'displayName',
      gameSlug: 'gameSlug',
      language: 'language',
      media: 'featuredImage',
    },
    prepare({title, gameSlug, language, media}) {
      return {
        title: title || gameSlug || 'Untitled',
        subtitle: [gameSlug && `slug: ${gameSlug}`, language?.toUpperCase()].filter(Boolean).join(' | '),
        media,
      }
    },
  },
})
