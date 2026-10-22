import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SeverityBadge, StatusBadge, StatusSign } from "@/components/badges";
import { PageTitle, buttonClass } from "@/components/field";
import { apiFetch } from "@/lib/api";
import { SEVERITIES, STATUS_FLOW, daysSince, formatAge, formatDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import type { Incident, IncidentStatus, Supplier } from "@/lib/types";
import { IncidentFilters, type StatusView } from "./incident-filters";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).incidents.title };
}

export default async function IncidentsPage({ searchParams }: PageProps<"/incidents">) {
  const t = await getDict();
  return (
    <>
      <PageTitle title={t.incidents.title}>
        <Link href="/incidents/new" className={buttonClass.attention}>
          <Plus className="size-4" aria-hidden />
          {t.dashboard.report}
        </Link>
      </PageTitle>
      <Suspense fallback={<ListSkeleton />}>
        <IncidentList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function IncidentList({ searchParams }: Pick<PageProps<"/incidents">, "searchParams">) {
  const params = await searchParams;
  const view = pick(params.status, ["active", ...STATUS_FLOW] as StatusView[]);
  const severity = pick(params.severity, SEVERITIES);
  const supplierId = typeof params.supplier_id === "string" ? params.supplier_id : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  // Se pide la lista completa para poder contar cada estado en las pestañas
  const [all, suppliers, t, locale] = await Promise.all([
    apiFetch<Incident[]>("/incidents"),
    apiFetch<Supplier[]>("/suppliers"),
    getDict(),
    getLocale(),
  ]);
  const now = new Date();

  const scoped = all.filter(
    (incident) =>
      (!severity || incident.severity === severity) &&
      (!supplierId || String(incident.part.supplier.id) === supplierId) &&
      matches(incident, q),
  );
  const counts = countByView(scoped);
  const incidents = scoped.filter((incident) => inView(incident.status, view));
  const hasFilters = Boolean(view || severity || supplierId || q);

  return (
    <>
      <IncidentFilters
        suppliers={suppliers}
        counts={counts}
        current={{ status: view, severity, supplier_id: supplierId, q }}
      />

      {incidents.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <p className="display text-xl">
            {hasFilters ? t.incidents.emptyFiltered : t.incidents.empty}
          </p>
          <p className="mt-1 text-ink-muted">
            {hasFilters ? t.incidents.emptyFilteredHint : t.incidents.emptyHint}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-md border border-line bg-surface md:block">
            <table className="w-full text-left">
              <thead className="border-b border-line bg-sunken">
                <tr>
                  <th className="label px-5 py-2.5">{t.incidents.colIncident}</th>
                  <th className="label px-4 py-2.5">{t.incidents.colSupplier}</th>
                  <th className="label px-4 py-2.5">{t.incidents.colSeverity}</th>
                  <th className="label px-4 py-2.5">{t.incidents.colStatus}</th>
                  <th className="label px-5 py-2.5 text-right">{t.incidents.colAge}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="group relative transition-colors hover:bg-sunken"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="font-medium after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-3"
                      >
                        {incident.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[0.8125rem] text-ink-muted">
                        #{incident.id} · {incident.part.reference} · {incident.part.lot}
                      </p>
                    </td>
                    <td className="px-4 py-3">{incident.part.supplier.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <SeverityBadge severity={incident.severity} />
                        {incident.severity === "critical" && incident.status !== "closed" && (
                          <span
                            className="hazard h-3 w-5 rounded-xs"
                            title={t.incidents.criticalActive}
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Age
                        incident={incident}
                        now={now}
                        locale={locale}
                        closedLabel={t.incidents.closedOn}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-surface md:hidden">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/incidents/${incident.id}`}
                  className="flex gap-3 px-4 py-3 active:bg-sunken"
                >
                  <span className="mt-1">
                    <StatusSign status={incident.status} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{incident.title}</span>
                    <span className="block text-sm text-ink-muted">
                      {incident.part.supplier.name} ·{" "}
                      <span className="font-mono text-[0.8125rem]">{incident.part.lot}</span>
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                      <SeverityBadge severity={incident.severity} />
                      <Age
                        incident={incident}
                        now={now}
                        locale={locale}
                        closedLabel={t.incidents.closedOn}
                      />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">
            {t.incidents.showing(incidents.length, all.length)}
          </p>
        </>
      )}
    </>
  );
}

function Age({
  incident,
  now,
  locale,
  closedLabel,
}: {
  incident: Incident;
  now: Date;
  locale: Locale;
  closedLabel: (date: string) => string;
}) {
  if (incident.status === "closed" && incident.closed_at) {
    return (
      <span className="text-ink-muted">{closedLabel(formatDate(incident.closed_at, locale))}</span>
    );
  }
  const days = daysSince(incident.created_at, now);
  return (
    <span
      className={days > 30 ? "font-medium text-red-ink" : "text-ink"}
      title={formatDate(incident.created_at, locale)}
    >
      {formatAge(days, locale)}
    </span>
  );
}

function matches(incident: Incident, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [
    incident.title,
    incident.part.reference,
    incident.part.lot,
    incident.part.supplier.name,
    `#${incident.id}`,
  ].some((field) => field.toLowerCase().includes(needle));
}

function inView(status: IncidentStatus, view: StatusView | undefined): boolean {
  if (!view) return true;
  if (view === "active") return status !== "closed";
  return status === view;
}

function countByView(incidents: Incident[]): Record<StatusView | "all", number> {
  const counts = {
    all: incidents.length,
    active: 0,
    open: 0,
    in_analysis: 0,
    corrective_action: 0,
    closed: 0,
  };
  for (const incident of incidents) {
    counts[incident.status] += 1;
    if (incident.status !== "closed") counts.active += 1;
  }
  return counts;
}

// Descarta valores de la URL que no existan en el catálogo
function pick<T extends string>(value: string | string[] | undefined, allowed: T[]): T | undefined {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : undefined;
}

function ListSkeleton() {
  return (
    <div className="mt-6 motion-safe:animate-pulse" aria-busy>
      <div className="h-10 w-full max-w-2xl rounded-sm bg-surface" />
      <div className="mt-4 h-96 rounded-md bg-surface" />
    </div>
  );
}
