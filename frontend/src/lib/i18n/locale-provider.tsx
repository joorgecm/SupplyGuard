import type { ReactNode } from "react";
import { I18nProvider } from "./provider";
import { getLocale } from "./server";

// Lee la preferencia de idioma de la cookie y la entrega a todo el árbol de componentes
export async function LocaleProvider({ children }: { children: ReactNode }) {
  return <I18nProvider locale={await getLocale()}>{children}</I18nProvider>;
}
