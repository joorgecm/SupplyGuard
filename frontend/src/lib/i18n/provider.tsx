"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// Diccionario del idioma elegido, para componentes de cliente
export function useT() {
  return dictionaries[useContext(LocaleContext)];
}
