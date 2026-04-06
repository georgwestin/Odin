import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// --- Sanity Client Setup ---

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'mqk9lpso',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

/** Returns true when Sanity credentials have been configured. */
export function isSanityConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'your-project-id'
  );
}

// --- TypeScript Interfaces ---

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
}

export interface SanityBanner {
  _id: string;
  title: string;
  headline: string;
  subheadline?: string;
  image?: SanityImage;
  gradientFrom?: string;
  gradientTo?: string;
  ctaText?: string;
  ctaUrl?: string;
  placement: string;
  brand: string;
  language: string;
  startDate: string;
  endDate: string;
}

export interface SanityTranslation {
  _id: string;
  namespace: string;
  language: string;
  key: string;
  value: string;
}

export interface SanityPage {
  _id: string;
  title: string;
  slug: string;
  brand: string;
  language: string;
  body: any[]; // Portable Text blocks
  metaTitle?: string;
  metaDescription?: string;
}

export interface SanityPromotion {
  _id: string;
  title: string;
  description: string;
  image?: SanityImage;
  ctaText?: string;
  ctaUrl?: string;
  brand: string;
  language: string;
  startDate: string;
  endDate: string;
  badge?: string;
  terms?: string;
}

export interface SanityFaqItem {
  _id: string;
  question: string;
  answer: any[]; // Portable Text blocks
  category: string;
  brand: string;
  language: string;
  order: number;
}

export interface SanitySiteSettings {
  _id: string;
  brand: string;
  siteName: string;
  siteDescription: string;
  logo?: SanityImage;
  favicon?: SanityImage;
  headerLinks: { label: string; url: string }[];
  footerLinks: { label: string; url: string }[];
  socialLinks: { platform: string; url: string }[];
  supportEmail: string;
  licenseText: string;
}

export interface SanityInfoPage {
  _id: string;
  title: string;
  slug: string;
  brand: string;
  language: string;
  body: any[]; // Portable Text blocks
  lastUpdated: string;
}

export interface SanityGameContent {
  _id: string;
  gameSlug: string;
  brand: string;
  language: string;
  displayName: string;
  description?: any[]; // Portable Text blocks
  features?: string[];
  rtp?: number;
  volatility?: string;
  provider?: string;
  heroImage?: SanityImage;
}

// --- Query Helper Functions ---

const NOW = 'now()';

export async function getBanners(
  brand: string,
  placement: string,
  language: string
): Promise<SanityBanner[]> {
  if (!isSanityConfigured()) return [];

  const query = `*[
    _type == "banner"
    && brand->slug.current == $brand
    && placement == $placement
    && isActive == true
  ] | order(priority desc) {
    _id,
    title,
    headline,
    subheadline,
    ctaText,
    ctaUrl,
    image,
    mobileImage,
    gradientFrom,
    gradientTo,
    textColor,
    placement,
    "brand": brand->slug.current,
    language
  }`;

  return sanityClient.fetch<SanityBanner[]>(query, { brand, placement });
}

export async function getTranslations(
  namespace: string,
  language: string
): Promise<Record<string, string>> {
  if (!isSanityConfigured()) return {};

  // Translation docs store languages inside a translations[] array.
  // Extract the value for the requested language from each doc.
  const query = `*[
    _type == "translation"
    && namespace == $namespace
  ]{
    key,
    "value": translations[language == $language][0].value
  }[defined(value)]`;

  const results = await sanityClient.fetch<{ key: string; value: string }[]>(
    query,
    { namespace, language }
  );

  const map: Record<string, string> = {};
  for (const item of results) {
    // Strip namespace prefix from key for lookup: "nav.casino" -> "casino"
    const shortKey = item.key.includes(".")
      ? item.key.split(".").slice(1).join(".")
      : item.key;
    map[shortKey] = item.value;
  }
  return map;
}

export async function getPage(
  slug: string,
  brand: string,
  language: string
): Promise<SanityPage | null> {
  if (!isSanityConfigured()) return null;

  const query = `*[
    _type == "page"
    && slug.current == $slug
    && brand == $brand
    && language == $language
  ][0]`;

  return sanityClient.fetch<SanityPage | null>(query, { slug, brand, language });
}

export async function getPromotions(
  brand: string,
  language: string
): Promise<SanityPromotion[]> {
  if (!isSanityConfigured()) return [];

  const query = `*[
    _type == "promotion"
    && brand == $brand
    && language == $language
    && startDate <= ${NOW}
    && endDate >= ${NOW}
  ] | order(startDate desc)`;

  return sanityClient.fetch<SanityPromotion[]>(query, { brand, language });
}

export async function getFaqItems(
  category: string,
  brand: string,
  language: string
): Promise<SanityFaqItem[]> {
  if (!isSanityConfigured()) return [];

  const query = `*[
    _type == "faqItem"
    && category == $category
    && brand == $brand
    && language == $language
  ] | order(order asc)`;

  return sanityClient.fetch<SanityFaqItem[]>(query, { category, brand, language });
}

export async function getSiteSettings(
  brand: string
): Promise<SanitySiteSettings | null> {
  if (!isSanityConfigured()) return null;

  const query = `*[
    _type == "siteSettings"
    && brand == $brand
  ][0]`;

  return sanityClient.fetch<SanitySiteSettings | null>(query, { brand });
}

export async function getInfoPage(
  slug: string,
  brand: string,
  language: string
): Promise<SanityInfoPage | null> {
  if (!isSanityConfigured()) return null;

  const query = `*[
    _type == "infoPage"
    && slug.current == $slug
    && brand == $brand
    && language == $language
  ][0]`;

  return sanityClient.fetch<SanityInfoPage | null>(query, { slug, brand, language });
}

export async function getGameContent(
  gameSlug: string,
  brand: string,
  language: string
): Promise<SanityGameContent | null> {
  if (!isSanityConfigured()) return null;

  const query = `*[
    _type == "gameContent"
    && gameSlug == $gameSlug
    && brand == $brand
    && language == $language
  ][0]`;

  return sanityClient.fetch<SanityGameContent | null>(query, {
    gameSlug,
    brand,
    language,
  });
}
