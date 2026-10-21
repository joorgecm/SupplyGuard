"use client";

import { useEffect, useState } from "react";
import { StatusSign } from "@/components/badges";
import { STATUS_FLOW } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { IncidentStatus } from "@/lib/types";

export const litKey = (incidentId: number) => `sg-lit-${incidentId}`;

export function WorkflowRail({
  incidentId,
  current,
  reached,
}: {
  incidentId: number;
  current: IncidentStatus;
  reached: Partial<Record<IncidentStatus, string>>;
}) {
  const t = useT();
  const currentIndex = STATUS_FLOW.indexOf(current);
  const progress = currentIndex / (STATUS_FLOW.length - 1);
  const [lit, setLit] = useState(false);

  // Si el usuario acaba de cambiar el estado, el paso nuevo se queda iluminado hasta que lo mire
  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(litKey(incidentId)) === current;
      if (flagged) sessionStorage.removeItem(litKey(incidentId));
    } catch {}
    if (!flagged) return;
    const frame = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(frame);
  }, [incidentId, current]);

  return (
    <div
      className="rounded-md border border-line bg-surface px-2 pt-5 pb-4 sm:px-5"
      onPointerEnter={() => lit && setTimeout(() => setLit(false), 1200)}
    >
      <ol className="relative grid grid-cols-4" aria-label={t.detail.progress}>
        <span
          aria-hidden
          className="absolute top-[1.125rem] h-1 sm:top-5 -translate-y-1/2 rounded-full bg-line"
          style={{ left: "12.5%", right: "12.5%" }}
        />
        <span
          aria-hidden
          className="tape-fill absolute top-[1.125rem] h-1 sm:top-5 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: "12.5%", width: `${progress * 75}%` }}
        />
        {STATUS_FLOW.map((status, index) => {
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          return (
            <li
              key={status}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              <span
                className={`flex size-9 items-center justify-center sm:size-10 rounded-sm bg-surface transition-[box-shadow,opacity] duration-300 ${
                  isCurrent ? "ring-2 ring-ink" : "ring-1 ring-line-strong"
                } ${isFuture ? "opacity-40" : ""} ${isCurrent && lit ? "lit ring-3 ring-yellow" : ""}`}
              >
                <StatusSign status={status} size={22} />
              </span>
              <span
                className={`font-display text-xs leading-tight font-semibold tracking-[0.06em] uppercase sm:text-sm ${
                  isFuture ? "text-ink-subtle" : "text-ink"
                }`}
              >
                {t.status[status]}
              </span>
              <span className="text-xs text-ink-muted">
                {isCurrent && current !== "closed" ? (
                  <span className="rounded-xs bg-ink px-1.5 py-px font-medium text-shell-ink">
                    {t.detail.now}
                  </span>
                ) : (
                  (reached[status] ?? (isFuture ? t.detail.pending : ""))
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
