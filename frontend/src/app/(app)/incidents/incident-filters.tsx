"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { StatusSign } from "@/components/badges";
import { inputClass } from "@/components/field";
import { SEVERITIES, STATUS_FLOW } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { IncidentStatus, Supplier } from "@/lib/types";

export type StatusView = "active" | IncidentStatus;
type Filters = { status?: StatusView; severity?: string; supplier_id?: string; q?: string };

const selectClass = `${inputClass.replace("w-full", "w-auto")} pr-8`;

export function IncidentFilters({
  suppliers,
  counts,
  current,
}: {
  suppliers: Supplier[];
  counts: Record<StatusView | "all", number>;
  current: Filters;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(current.q ?? "");
  const skipSearch = useRef(true);

  const tabs: { value?: StatusView; label: string }[] = [
    { label: t.incidents.tabAll },
    { value: "active", label: t.incidents.tabActive },
    ...STATUS_FLOW.map((status) => ({ value: status, label: t.status[status] })),
  ];

  function update(changes: Partial<Filters>) {
    const next = { ...current, ...changes };
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(next)) if (value) query.set(name, value);
    startTransition(() =>
      router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  }

  // La búsqueda espera a que el usuario deje de escribir antes de actualizar la URL
  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const timer = setTimeout(() => update({ q: search.trim() || undefined }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className={`mt-6 transition-opacity duration-150 ${pending ? "opacity-60" : ""}`}>
      <div
        role="group"
        aria-label={t.incidents.filterStatus}
        className="-mx-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line-strong px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((tab) => {
          const selected = current.status === tab.value;
          const count = counts[tab.value ?? "all"];
          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={selected}
              onClick={() => update({ status: tab.value })}
              className={`relative flex shrink-0 items-center gap-2 px-3 pt-1 pb-2.5 font-display text-[0.9375rem] font-semibold tracking-[0.04em] uppercase transition-colors ${
                selected ? "text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.value && tab.value !== "active" && <StatusSign status={tab.value} size={14} />}
              {tab.label}
              <span
                className={`rounded-xs px-1.5 font-sans text-xs font-medium tracking-normal ${
                  selected ? "bg-ink text-shell-ink" : "bg-line text-ink-muted"
                }`}
              >
                {count}
              </span>
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-px h-0.75 bg-ink transition-transform duration-200 ease-out ${
                  selected ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">{t.incidents.searchLabel}</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.incidents.searchPlaceholder}
            className={`${inputClass} pl-9`}
          />
        </label>
        <select
          aria-label={t.incidents.filterSeverity}
          value={current.severity ?? ""}
          onChange={(e) => update({ severity: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">{t.incidents.allSeverities}</option>
          {SEVERITIES.map((value) => (
            <option key={value} value={value}>
              {t.severity[value]}
            </option>
          ))}
        </select>
        <select
          aria-label={t.incidents.filterSupplier}
          value={current.supplier_id ?? ""}
          onChange={(e) => update({ supplier_id: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">{t.incidents.allSuppliers}</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              skipSearch.current = search !== "";
              setSearch("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="pressable inline-flex items-center gap-1 text-ink-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden />
            {t.incidents.clearFilters}
          </button>
        )}
      </div>
    </div>
  );
}
