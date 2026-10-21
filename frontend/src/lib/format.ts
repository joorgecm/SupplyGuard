import { dictionaries } from "./i18n/dictionaries";
import { INTL_LOCALE, type Locale } from "./i18n/locales";
import type { IncidentStatus, Severity } from "./types";

export const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

// Orden del flujo: abierta → en análisis → acción correctiva → cerrada
export const STATUS_FLOW: IncidentStatus[] = ["open", "in_analysis", "corrective_action", "closed"];

const TIME_ZONE = "Europe/Madrid";

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  return dueDate < today;
}

export function formatDays(days: number, locale: Locale): string {
  const time = dictionaries[locale].time;
  if (days < 1) return time.lessThanDay;
  const value = new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(days);
  return time.daysDecimal(value);
}

export function formatAge(days: number, locale: Locale): string {
  const time = dictionaries[locale].time;
  return days === 0 ? time.today : time.days(days);
}

export function daysSince(value: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 86_400_000));
}
