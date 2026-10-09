"use client";

import { useSearchParams } from "next/navigation";

export function ExpiredNotice() {
  if (useSearchParams().get("expired") !== "1") return null;
  return (
    <p className="mb-4 rounded-md bg-sunken px-3 py-2 text-ink-muted">
      Your session has expired. Please sign in again.
    </p>
  );
}
