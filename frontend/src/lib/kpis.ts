import { INTL_LOCALE, type Locale } from "./i18n/locales";
import type { Incident, Severity } from "./types";

export type SupplierRank = { supplier: string; incidents: number; open: number };
export type MonthIntake = { month: string } & Record<Severity, number>;

export type Kpis = {
  total: number;
  open: number;
  criticalOpen: number;
  closed: number;
  closedLast30: number;
  averageCloseDays: number | null;
  bySupplier: SupplierRank[];
  bySeverity: Record<Severity, number>;
  byMonth: MonthIntake[];
  attention: { incident: Incident; ageDays: number }[];
  safety: {
    daysSinceCritical: number | null;
    recordDays: number | null;
    lastCritical: Incident | null;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function emptySeverity(): Record<Severity, number> {
  return { low: 0, medium: 0, high: 0, critical: 0 };
}

// Se calculan en el front a partir del listado; si crece mucho, conviene moverlo a un endpoint
export function computeKpis(incidents: Incident[], now: Date, locale: Locale): Kpis {
  const bySeverity = emptySeverity();
  const suppliers = new Map<number, SupplierRank>();
  let open = 0;
  let criticalOpen = 0;
  let closeMs = 0;
  let closed = 0;
  let closedLast30 = 0;

  for (const incident of incidents) {
    const isClosed = incident.status === "closed";
    bySeverity[incident.severity] += 1;

    const { id, name } = incident.part.supplier;
    const rank = suppliers.get(id) ?? { supplier: name, incidents: 0, open: 0 };
    rank.incidents += 1;

    if (isClosed && incident.closed_at) {
      const closedAt = new Date(incident.closed_at).getTime();
      closed += 1;
      closeMs += closedAt - new Date(incident.created_at).getTime();
      if (now.getTime() - closedAt <= 30 * DAY_MS) closedLast30 += 1;
    } else if (!isClosed) {
      open += 1;
      rank.open += 1;
      if (incident.severity === "critical") criticalOpen += 1;
    }
    suppliers.set(id, rank);
  }

  const attention = incidents
    .filter((incident) => incident.status !== "closed")
    .map((incident) => ({ incident, ageDays: daysBetween(incident.created_at, now) }))
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.incident.severity] - SEVERITY_RANK[b.incident.severity] ||
        b.ageDays - a.ageDays,
    )
    .slice(0, 6);

  return {
    total: incidents.length,
    open,
    criticalOpen,
    closed,
    closedLast30,
    averageCloseDays: closed > 0 ? closeMs / closed / DAY_MS : null,
    bySupplier: [...suppliers.values()].sort((a, b) => b.incidents - a.incidents),
    bySeverity,
    byMonth: intakeByMonth(incidents, now, locale),
    attention,
    safety: safetyBoard(incidents, now),
  };
}

function daysBetween(from: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / DAY_MS));
}

// Últimos 6 meses, incluido el actual, con las incidencias recibidas por severidad
function intakeByMonth(incidents: Incident[], now: Date, locale: Locale): MonthIntake[] {
  const monthFormat = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    timeZone: "Europe/Madrid",
  });
  const months: (MonthIntake & { key: string })[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 15));
    months.push({
      key: date.toISOString().slice(0, 7),
      month: monthFormat.format(date),
      ...emptySeverity(),
    });
  }
  for (const incident of incidents) {
    const month = months.find((m) => m.key === incident.created_at.slice(0, 7));
    if (month) month[incident.severity] += 1;
  }
  return months.map(({ month, low, medium, high, critical }) => ({
    month,
    low,
    medium,
    high,
    critical,
  }));
}

// Como el cartel de "días sin accidentes": días desde la última incidencia crítica y el récord
function safetyBoard(incidents: Incident[], now: Date): Kpis["safety"] {
  const critical = incidents
    .filter((incident) => incident.severity === "critical")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (critical.length === 0)
    return { daysSinceCritical: null, recordDays: null, lastCritical: null };

  const lastCritical = critical[critical.length - 1];
  const daysSinceCritical = daysBetween(lastCritical.created_at, now);
  let recordDays = daysSinceCritical;
  for (let i = 1; i < critical.length; i++) {
    const gap = Math.floor(
      (new Date(critical[i].created_at).getTime() -
        new Date(critical[i - 1].created_at).getTime()) /
        DAY_MS,
    );
    recordDays = Math.max(recordDays, gap);
  }
  return { daysSinceCritical, recordDays, lastCritical };
}
