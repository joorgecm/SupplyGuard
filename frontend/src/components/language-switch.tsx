"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { useLocale, useT } from "@/lib/i18n/provider";

const LABEL: Record<Locale, string> = { es: "ES", en: "EN" };

export function LanguageSwitch({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const locale = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const dark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`inline-flex items-center rounded-sm p-0.5 font-display text-sm font-semibold tracking-[0.06em] ${
        dark ? "bg-shell-raised" : "bg-sunken"
      } ${pending ? "opacity-60" : ""}`}
    >
      {LOCALES.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            disabled={pending}
            onClick={() => startTransition(() => setLocale(code))}
            className={`rounded-xs px-2 py-1 transition-colors ${
              selected
                ? dark
                  ? "bg-shell-ink text-ink"
                  : "bg-ink text-shell-ink"
                : dark
                  ? "text-shell-muted hover:text-shell-ink"
                  : "text-ink-muted hover:text-ink"
            }`}
          >
            {LABEL[code]}
          </button>
        );
      })}
    </div>
  );
}
