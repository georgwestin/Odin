// Document schemas
import brand from './documents/brand'
import banner from './documents/banner'

import translation from './documents/translation'
import gameContent from './documents/gameContent'
import faqItem from './documents/faqItem'
import infoPage from './documents/infoPage'
import siteSettings from './documents/siteSettings'

// Object schemas
import seo from './objects/seo'
import hero from './objects/hero'
import textBlock from './objects/textBlock'
import ctaBlock from './objects/ctaBlock'
import imageGrid from './objects/imageGrid'
import faqSection from './objects/faqSection'

export const schemaTypes = [
  // Documents
  brand,
  banner,

  translation,
  gameContent,
  faqItem,
  infoPage,
  siteSettings,

  // Objects
  seo,
  hero,
  textBlock,
  ctaBlock,
  imageGrid,
  faqSection,
]
