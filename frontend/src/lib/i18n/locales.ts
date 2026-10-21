export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "sg_locale";

// Código que entiende Intl para formatear fechas y números
export const INTL_LOCALE: Record<Locale, string> = { es: "es-ES", en: "en-GB" };

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}
