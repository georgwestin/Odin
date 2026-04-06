export const defaultLocale = "en";

export const locales = ["en", "sv", "fi", "no"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  sv: "Svenska",
  fi: "Suomi",
  no: "Norsk",
};

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
