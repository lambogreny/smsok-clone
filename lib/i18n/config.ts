export const defaultLocale = "th" as const;
export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
