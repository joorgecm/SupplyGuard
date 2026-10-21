"use client";

import { buttonClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="hazard mx-auto block h-2 w-24 rounded-xs" aria-hidden />
      <h1 className="display mt-6 text-[2rem]">{t.errors.title}</h1>
      <p className="mt-2 text-ink-muted">{t.errors.body}</p>
      <button type="button" onClick={reset} className={`${buttonClass.primary} mt-6`}>
        {t.errors.retry}
      </button>
    </div>
  );
}
