import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

const deskStructure = (S: any) =>
  S.list()
    .title('Odin CMS')
    .items([
      // Content — all text, banners, and page content
      S.listItem()
        .title('Content')
        .child(
          S.list()
            .title('Content')
            .items([
              S.listItem()
                .title('Banners')
                .schemaType('banner')
                .child(S.documentTypeList('banner').title('Banners')),
              S.listItem()
                .title('Pages')
                .schemaType('page')
                .child(S.documentTypeList('page').title('Pages')),
              S.listItem()
                .title('Info Pages')
                .schemaType('infoPage')
                .child(S.documentTypeList('infoPage').title('Info & Legal Pages')),
              S.listItem()
                .title('FAQ')
                .schemaType('faqItem')
                .child(S.documentTypeList('faqItem').title('FAQ Items')),
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
                      ['common', 'casino', 'sports', 'wallet', 'auth', 'footer', 'nav', 'account'].map(
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

  projectId: 'mqk9lpso',
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
