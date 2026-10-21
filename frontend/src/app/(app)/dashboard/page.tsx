import { ArrowRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SeverityBadge, StatusSign } from "@/components/badges";
import { PageTitle, Panel, buttonClass } from "@/components/field";
import { apiFetch } from "@/lib/api";
import { formatAge, formatDate, formatDays } from "@/lib/format";
import { type Kpis, computeKpis } from "@/lib/kpis";
import type { Locale } from "@/lib/i18n/locales";
import { getDict, getLocale } from "@/lib/i18n/server";
import type { Incident } from "@/lib/types";
import { IntakeChart, SupplierChart } from "./charts";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).dashboard.title };
}

export default async function DashboardPage() {
  const t = await getDict();
  return (
    <>
      <PageTitle title={t.dashboard.title}>
        <Link href="/incidents/new" className={buttonClass.attention}>
          <Plus className="size-4" aria-hidden />
          {t.dashboard.report}
        </Link>
      </PageTitle>
      <Suspense fallback={<DashboardSkeleton />}>
        <Board />
      </Suspense>
    </>
  );
}

async function Board() {
  const [incidents, t, locale] = await Promise.all([
    apiFetch<Incident[]>("/incidents"),
    getDict(),
    getLocale(),
  ]);
  const kpis = computeKpis(incidents, new Date(), locale);

  if (kpis.total === 0) {
    return (
      <div className="mt-8 rounded-md border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="display text-2xl">{t.dashboard.emptyTitle}</p>
        <p className="mt-2 text-ink-muted">{t.dashboard.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <SafetyBoard safety={kpis.safety} criticalOpen={kpis.criticalOpen} locale={locale} />
        <Figures kpis={kpis} locale={locale} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title={t.dashboard.attention}
          aside={
            <Link
              href="/incidents?status=active"
              className="inline-flex items-center gap-1 hover:text-ink"
            >
              {t.dashboard.allActive} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          <Attention items={kpis.attention} locale={locale} />
        </Panel>
        <Panel title={t.dashboard.suppliers} aside={t.dashboard.suppliersAside}>
          <div className="px-3 pt-4 pb-2">
            <SupplierChart data={kpis.bySupplier} />
          </div>
        </Panel>
      </div>

      <Panel title={t.dashboard.intake} aside={t.dashboard.intakeAside}>
        <div className="px-3 pt-5 pb-2">
          <IntakeChart data={kpis.byMonth} />
        </div>
      </Panel>
    </div>
  );
}

async function SafetyBoard({
  safety,
  criticalOpen,
  locale,
}: {
  safety: Kpis["safety"];
  criticalOpen: number;
  locale: Locale;
}) {
  const t = await getDict();
  const days = safety.daysSinceCritical;
  const digits = days === null ? "—" : String(days);
  const record = safety.recordDays;

  return (
    <section
      aria-label={t.dashboard.boardAria}
      className="relative flex flex-col overflow-hidden rounded-md bg-green text-white"
    >
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-3">
        <h2 className="font-display text-base font-semibold tracking-[0.08em] uppercase">
          {t.dashboard.boardTitle}
        </h2>
        <svg viewBox="0 0 16 16" className="size-5" aria-hidden>
          <rect x="1" y="1" width="14" height="14" rx="1.5" fill="#fff" />
          <path d="M8 4v8M4 8h8" stroke="var(--color-green)" strokeWidth="2.6" />
        </svg>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4 px-5 py-6 sm:py-8">
        <div className="flex gap-1.5" aria-hidden>
          {[...digits].map((digit, index) => (
            <span
              key={index}
              className="count-up flex h-28 w-20 items-center justify-center rounded-sm bg-white font-display text-[5.5rem] leading-none font-bold text-ink sm:h-32 sm:w-24 sm:text-[6rem]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {digit}
            </span>
          ))}
        </div>
        <div className="min-w-[12rem] flex-1">
          <p className="display text-[2rem] sm:text-[2.25rem]">
            <span className="sr-only">{digits} </span>
            {days === null ? "" : t.dashboard.daysWithout(days)}
          </p>
          {record !== null && (
            <p className="mt-2 text-white/80">
              {t.dashboard.record(record)}
              {safety.lastCritical && (
                <>
                  {" · "}
                  {t.dashboard.lastOn}{" "}
                  <Link
                    href={`/incidents/${safety.lastCritical.id}`}
                    className="underline decoration-white/40 underline-offset-3 hover:decoration-white"
                  >
                    {formatDate(safety.lastCritical.created_at, locale)}
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {criticalOpen > 0 && (
        <Link
          href="/incidents?status=active&severity=critical"
          className="group flex items-center gap-3 bg-ink px-5 py-2.5 text-shell-ink"
        >
          <span className="hazard h-4 w-8 shrink-0 rounded-xs" aria-hidden />
          <span className="font-medium">{t.dashboard.criticalOpen(criticalOpen)}</span>
          <ArrowRight
            className="ml-auto size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </section>
  );
}

async function Figures({ kpis, locale }: { kpis: Kpis; locale: Locale }) {
  const t = await getDict();
  const rows = [
    {
      label: t.dashboard.activeIncidents,
      value: String(kpis.open),
      note: t.dashboard.ofTotal(kpis.total),
    },
    {
      label: t.dashboard.criticalActive,
      value: String(kpis.criticalOpen),
      note: kpis.criticalOpen > 0 ? t.dashboard.containmentFirst : t.dashboard.noneNow,
      danger: kpis.criticalOpen > 0,
    },
    {
      label: t.dashboard.averageClose,
      value: kpis.averageCloseDays === null ? "—" : formatDays(kpis.averageCloseDays, locale),
      note: t.dashboard.closedTotal(kpis.closed),
    },
    {
      label: t.dashboard.closedLast30,
      value: String(kpis.closedLast30),
      note: t.dashboard.closedLast30Note,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-1">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col justify-center gap-1 bg-surface px-5 py-4">
          <dt className="label">{row.label}</dt>
          <dd
            className={`font-display text-[2rem] leading-none font-bold ${row.danger ? "text-red" : ""}`}
          >
            {row.value}
          </dd>
          <dd className="text-sm text-ink-muted">{row.note}</dd>
        </div>
      ))}
    </dl>
  );
}

async function Attention({ items, locale }: { items: Kpis["attention"]; locale: Locale }) {
  const t = await getDict();
  if (items.length === 0) {
    return <p className="px-5 py-10 text-center text-ink-muted">{t.dashboard.allClosed}</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {items.map(({ incident, ageDays }) => (
        <li key={incident.id}>
          <Link
            href={`/incidents/${incident.id}`}
            className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-sunken"
          >
            <StatusSign status={incident.status} size={18} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium group-hover:underline group-hover:underline-offset-3">
                {incident.title}
              </p>
              <p className="truncate text-sm text-ink-muted">
                {incident.part.supplier.name} ·{" "}
                <span className="font-mono text-[0.8125rem]">{incident.part.lot}</span>
              </p>
            </div>
            <div className="hidden sm:block">
              <SeverityBadge severity={incident.severity} />
            </div>
            <span className="w-16 text-right text-sm text-ink-muted">
              {formatAge(ageDays, locale)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]" aria-busy>
      <div className="h-64 rounded-md bg-green/20" />
      <div className="h-64 rounded-md bg-surface" />
      <div className="h-72 rounded-md bg-surface" />
      <div className="h-72 rounded-md bg-surface" />
    </div>
  );
}
