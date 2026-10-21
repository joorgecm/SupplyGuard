"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITIES } from "@/lib/format";
import type { MonthIntake, SupplierRank } from "@/lib/kpis";
import { useT } from "@/lib/i18n/provider";

// Mismos valores que los tokens de globals.css; Recharts necesita colores concretos
const INK = "#1d1d1b";
const LINE = "#dad8d1";
const LINE_STRONG = "#bebbb2";
const MUTED = "#55534d";
const SEVERITY_COLOR = {
  low: "#9a978f",
  medium: "#f5b301",
  high: "#e2580b",
  critical: "#c8231c",
} as const;

const AXIS_TICK = { fontSize: 13, fill: MUTED, fontFamily: "var(--font-sans)" };
const ROW_HEIGHT = 40;

export function SupplierChart({ data }: { data: SupplierRank[] }) {
  const t = useT();
  const rows = data.map((rank) => ({
    supplier: rank.supplier,
    active: rank.open,
    closed: rank.incidents - rank.open,
  }));

  return (
    <div>
      <div style={{ height: rows.length * ROW_HEIGHT + 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke={LINE} strokeDasharray="2 4" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="supplier"
              width={136}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "#f4f3ef" }}
              content={(props) => <ChartTooltip {...props} />}
            />
            <Bar dataKey="active" name={t.dashboard.active} stackId="a" fill={INK} barSize={18} />
            <Bar
              dataKey="closed"
              name={t.dashboard.closed}
              stackId="a"
              fill={LINE_STRONG}
              radius={[0, 2, 2, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { label: t.dashboard.active, color: INK },
          { label: t.dashboard.closed, color: LINE_STRONG },
        ]}
      />
    </div>
  );
}

export function IntakeChart({ data }: { data: MonthIntake[] }) {
  const t = useT();
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -16, right: 12, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={LINE} strokeDasharray="2 4" />
            <XAxis
              dataKey="month"
              tick={AXIS_TICK}
              axisLine={{ stroke: LINE_STRONG }}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#f4f3ef" }}
              content={(props) => <ChartTooltip {...props} />}
            />
            {SEVERITIES.map((severity, index) => (
              <Bar
                key={severity}
                dataKey={severity}
                name={t.severity[severity]}
                stackId="s"
                fill={SEVERITY_COLOR[severity]}
                barSize={36}
                radius={index === SEVERITIES.length - 1 ? [2, 2, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={SEVERITIES.map((s) => ({ label: t.severity[s], color: SEVERITY_COLOR[s] }))} />
    </div>
  );
}

type TooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ dataKey?: unknown; name?: unknown; value?: unknown; color?: string }>;
};

function ChartTooltip({ active, payload, label }: TooltipProps) {
  const t = useT();
  if (!active || !payload?.length) return null;
  const rows = payload.filter((item) => Number(item.value) > 0);
  return (
    <div className="rounded-sm bg-ink px-3 py-2 text-sm text-shell-ink">
      <p className="font-display font-semibold tracking-[0.04em] uppercase">{label}</p>
      {rows.length === 0 ? (
        <p className="text-shell-muted">{t.dashboard.noIncidents}</p>
      ) : (
        rows.map((item) => (
          <p key={String(item.dataKey)} className="flex items-center gap-2">
            <span className="size-2 rounded-[1px]" style={{ background: item.color }} aria-hidden />
            {String(item.name)}
            <span className="ml-auto pl-4 font-medium">{String(item.value)}</span>
          </p>
        ))
      )}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-2 text-sm text-ink-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[1px]" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
