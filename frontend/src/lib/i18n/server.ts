import "server-only";

import { cookies } from "next/headers";
import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locales";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Diccionario del idioma elegido, para componentes de servidor y acciones
export async function getDict() {
  return dictionaries[await getLocale()];
}
