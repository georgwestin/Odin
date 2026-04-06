import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

const deskStructure = (S: any) =>
  S.list()
    .title('Odin CMS')
    .items([
      // Content
      S.listItem()
        .title('Content')
        .child(
          S.list()
            .title('Content')
            .items([
              S.listItem()
                .title('Pages')
                .schemaType('page')
                .child(S.documentTypeList('page').title('Pages')),
              S.listItem()
                .title('Info Pages')
                .schemaType('infoPage')
                .child(S.documentTypeList('infoPage').title('Info Pages')),
              S.listItem()
                .title('FAQ Items')
                .schemaType('faqItem')
                .child(S.documentTypeList('faqItem').title('FAQ Items')),
              S.listItem()
                .title('Banners')
                .schemaType('banner')
                .child(S.documentTypeList('banner').title('Banners')),
            ]),
        ),

      S.divider(),

      // Casino
      S.listItem()
        .title('Casino')
        .child(
          S.list()
            .title('Casino')
            .items([
              S.listItem()
                .title('Game Content')
                .schemaType('gameContent')
                .child(S.documentTypeList('gameContent').title('Game Content')),
            ]),
        ),

      // Promotions
      S.listItem()
        .title('Promotions')
        .child(
          S.list()
            .title('Promotions')
            .items([
              S.listItem()
                .title('All Promotions')
                .schemaType('promotion')
                .child(S.documentTypeList('promotion').title('Promotions')),
              S.listItem()
                .title('By Type')
                .child(
                  S.list()
                    .title('Promotions by Type')
                    .items([
                      S.listItem()
                        .title('Welcome Bonuses')
                        .child(
                          S.documentList()
                            .title('Welcome Bonuses')
                            .filter('_type == "promotion" && type == "welcome-bonus"'),
                        ),
                      S.listItem()
                        .title('Deposit Bonuses')
                        .child(
                          S.documentList()
                            .title('Deposit Bonuses')
                            .filter('_type == "promotion" && type == "deposit-bonus"'),
                        ),
                      S.listItem()
                        .title('Free Spins')
                        .child(
                          S.documentList()
                            .title('Free Spins')
                            .filter('_type == "promotion" && type == "free-spins"'),
                        ),
                      S.listItem()
                        .title('Cashback')
                        .child(
                          S.documentList()
                            .title('Cashback')
                            .filter('_type == "promotion" && type == "cashback"'),
                        ),
                      S.listItem()
                        .title('Tournaments')
                        .child(
                          S.documentList()
                            .title('Tournaments')
                            .filter('_type == "promotion" && type == "tournament"'),
                        ),
                      S.listItem()
                        .title('Loyalty')
                        .child(
                          S.documentList()
                            .title('Loyalty')
                            .filter('_type == "promotion" && type == "loyalty"'),
                        ),
                    ]),
                ),
            ]),
        ),

      S.divider(),

      // Translations
      S.listItem()
        .title('Translations')
        .child(
          S.list()
            .title('Translations')
            .items([
              S.listItem()
                .title('All Translations')
                .schemaType('translation')
                .child(S.documentTypeList('translation').title('Translations')),
              S.listItem()
                .title('By Namespace')
                .child(
                  S.list()
                    .title('Translations by Namespace')
                    .items(
                      ['common', 'casino', 'sports', 'wallet', 'auth', 'footer', 'nav', 'bonuses', 'account'].map(
                        (ns) =>
                          S.listItem()
                            .title(ns.charAt(0).toUpperCase() + ns.slice(1))
                            .child(
                              S.documentList()
                                .title(`${ns} translations`)
                                .filter('_type == "translation" && namespace == $ns')
                                .params({ns}),
                            ),
                      ),
                    ),
                ),
            ]),
        ),

      S.divider(),

      // Settings
      S.listItem()
        .title('Settings')
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('Brands')
                .schemaType('brand')
                .child(S.documentTypeList('brand').title('Brands')),
              S.listItem()
                .title('Site Settings')
                .schemaType('siteSettings')
                .child(S.documentTypeList('siteSettings').title('Site Settings')),
            ]),
        ),
    ])

export default defineConfig({
  name: 'odin-cms',
  title: 'Odin iGaming CMS',

  projectId: 'your-project-id',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool({defaultApiVersion: '2024-01-01'}),
  ],

  schema: {
    types: schemaTypes,
  },
})
