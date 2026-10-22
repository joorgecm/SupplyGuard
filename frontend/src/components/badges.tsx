"use client";

import { useT } from "@/lib/i18n/provider";
import type { IncidentStatus, Role, Severity } from "@/lib/types";

// Cada estado usa la forma y el color de una señal ISO:
// triángulo amarillo = atención, círculo azul = acción obligatoria, cuadrado verde = condición segura
export function StatusSign({ status, size = 16 }: { status: IncidentStatus; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    className: "shrink-0",
    "aria-hidden": true,
  } as const;

  if (status === "open") {
    return (
      <svg {...common}>
        <path
          d="M8 1.5 15 14.2H1Z"
          fill="var(--color-yellow)"
          stroke="var(--color-ink)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.6" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.8" r="0.95" fill="var(--color-ink)" />
      </svg>
    );
  }
  if (status === "in_analysis") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="var(--color-blue)" strokeWidth="2.6" />
      </svg>
    );
  }
  if (status === "corrective_action") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="7.5" fill="var(--color-blue)" />
        <path d="M4.6 8h6.8" stroke="var(--color-surface)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="1" y="1" width="14" height="14" rx="1.5" fill="var(--color-green)" />
      <path
        d="m4.6 8.2 2.3 2.3 4.6-4.9"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_TEXT: Record<IncidentStatus, string> = {
  open: "text-yellow-ink",
  in_analysis: "text-blue-ink",
  corrective_action: "text-blue-ink",
  closed: "text-green-ink",
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${STATUS_TEXT[status]}`}
    >
      <StatusSign status={status} />
      {t.status[status]}
    </span>
  );
}

// Las clases completas van escritas a mano para que Tailwind las detecte
export const SEVERITY_FILL: Record<Severity, string> = {
  low: "bg-ink-subtle",
  medium: "bg-yellow",
  high: "bg-orange",
  critical: "bg-red",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  low: "text-ink-muted",
  medium: "text-yellow-ink",
  high: "text-orange-ink",
  critical: "text-red-ink",
};

const SEVERITY_LEVEL: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

// Medidor de cuatro barras: la carga se lee por cuántas están llenas, no solo por el color
export function SeverityMeter({ severity }: { severity: Severity }) {
  const level = SEVERITY_LEVEL[severity];
  return (
    <span className="inline-flex h-3.5 items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((step) => (
        <span
          key={step}
          className={`w-0.75 rounded-[1px] ${step <= level ? SEVERITY_FILL[severity] : "bg-line"}`}
          style={{ height: `${4 + step * 2.5}px` }}
        />
      ))}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-2 font-medium whitespace-nowrap ${SEVERITY_TEXT[severity]}`}
    >
      <SeverityMeter severity={severity} />
      {t.severity[severity]}
    </span>
  );
}

const ROLE_STYLE: Record<Role, string> = {
  operator: "bg-yellow text-ink",
  engineer: "bg-blue text-white",
  admin: "bg-ink text-shell-ink ring-1 ring-shell-muted/40 ring-inset",
};

export function RoleTag({ role }: { role: Role }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center rounded-[3px] px-1.5 py-px font-display text-[0.6875rem] font-semibold tracking-[0.08em] uppercase ${ROLE_STYLE[role]}`}
    >
      {t.role[role]}
    </span>
  );
}
