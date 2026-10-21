"use client";

import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

export function ExpiredNotice() {
  const t = useT();
  if (useSearchParams().get("expired") !== "1") return null;
  return (
    <p className="mb-5 flex items-center gap-2 rounded-sm bg-yellow-soft px-3 py-2 text-yellow-ink">
      <Clock className="size-4 shrink-0" aria-hidden />
      {t.login.expired}
    </p>
  );
}
