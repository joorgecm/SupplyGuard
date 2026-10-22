import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SeverityBadge, StatusBadge, StatusSign } from "@/components/badges";
import { Panel } from "@/components/field";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser, hasRole } from "@/lib/auth";
import {
  daysSince,
  formatAge,
  formatDate,
  formatDateTime,
  formatDays,
  isOverdue,
} from "@/lib/format";
import type { Dict } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { getDict, getLocale } from "@/lib/i18n/server";
import type { HistoryEvent, IncidentDetail, IncidentStatus, User, UserSummary } from "@/lib/types";
import { ActionPlanForm } from "./action-plan-form";
import { AddTaskForm } from "./add-task-form";
import { StatusButton } from "./status-button";
import { TaskItem } from "./task-item";
import { WorkflowRail } from "./workflow-rail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).detail.back };
}

export default async function IncidentPage({ params }: PageProps<"/incidents/[id]">) {
  const t = await getDict();
  return (
    <>
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.detail.back}
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <IncidentView params={params} />
      </Suspense>
    </>
  );
}

async function IncidentView({ params }: Pick<PageProps<"/incidents/[id]">, "params">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [user, incident, t, locale] = await Promise.all([
    getCurrentUser(),
    loadIncident(id),
    getDict(),
    getLocale(),
  ]);
  const canManage = hasRole(user, "engineer", "admin");
  const isClosed = incident.status === "closed";
  const plan = incident.action_plan;
  const now = new Date();

  const assignees =
    canManage && plan && !isClosed ? await apiFetch<UserSummary[]>("/assignees") : [];

  return (
    <div className="mt-4 flex flex-col gap-6">
      <header>
        <p className="font-mono text-sm text-ink-muted">
          #{incident.id} · {incident.part.reference} · {t.detail.lot} {incident.part.lot}
        </p>
        <h1 className="display mt-1 max-w-[40ch] text-[2.25rem] sm:text-[2.75rem]">
          {incident.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <StatusBadge status={incident.status} />
          <SeverityBadge severity={incident.severity} />
          <span className="text-ink-muted">{incident.part.supplier.name}</span>
          {incident.severity === "critical" && !isClosed && (
            <span className="inline-flex items-center gap-2 rounded-sm bg-ink py-1 pr-2.5 pl-1 text-sm font-medium text-shell-ink">
              <span className="hazard h-4 w-6 rounded-xs" aria-hidden />
              {t.detail.containLot}
            </span>
          )}
        </div>
      </header>

      <WorkflowRail
        incidentId={incident.id}
        current={incident.status}
        reached={reachedDates(incident, locale)}
      />

      <NextStep incident={incident} canManage={canManage} t={t} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Panel title={t.detail.whatFound}>
            <div className="px-5 py-4">
              <p className="max-w-[70ch] whitespace-pre-wrap">{incident.description}</p>
              {incident.photo_url && (
                <a
                  href={incident.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 font-medium text-blue underline-offset-3 hover:underline"
                >
                  {t.detail.viewPhoto}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          </Panel>

          <ActionPlanSection
            incident={incident}
            user={user}
            canManage={canManage}
            assignees={assignees}
            t={t}
            locale={locale}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Panel title={t.detail.facts}>
            <dl className="divide-y divide-line">
              <Fact label={t.detail.supplier}>{incident.part.supplier.name}</Fact>
              <Fact label={t.detail.part}>
                <span className="font-mono text-sm">{incident.part.reference}</span>
                {incident.part.description && (
                  <span className="block text-sm text-ink-muted">{incident.part.description}</span>
                )}
              </Fact>
              <Fact label={t.detail.lot}>
                <span className="font-mono text-sm">{incident.part.lot}</span>
              </Fact>
              <Fact label={t.detail.reportedBy}>
                {incident.reported_by.full_name}
                <span className="block text-sm text-ink-muted">
                  {formatDateTime(incident.created_at, locale)}
                </span>
              </Fact>
              <Fact label={t.detail.analysedBy}>
                {incident.analyzed_by?.full_name ?? t.detail.notYet}
              </Fact>
              {incident.closed_at ? (
                <Fact label={t.detail.timeToClose}>
                  {formatDays(
                    (new Date(incident.closed_at).getTime() -
                      new Date(incident.created_at).getTime()) /
                      86_400_000,
                    locale,
                  )}
                  <span className="block text-sm text-ink-muted">
                    {t.detail.closedAt(formatDateTime(incident.closed_at, locale))}
                  </span>
                </Fact>
              ) : (
                <Fact label={t.detail.openFor}>
                  {formatAge(daysSince(incident.created_at, now), locale)}
                </Fact>
              )}
            </dl>
          </Panel>

          <Panel title={t.detail.history}>
            <History events={incident.history} t={t} locale={locale} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

async function loadIncident(id: string): Promise<IncidentDetail> {
  try {
    return await apiFetch<IncidentDetail>(`/incidents/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Fecha en la que la incidencia llegó a cada paso, sacada del historial
function reachedDates(
  incident: IncidentDetail,
  locale: Locale,
): Partial<Record<IncidentStatus, string>> {
  const reached: Partial<Record<IncidentStatus, string>> = {
    open: formatDate(incident.created_at, locale),
  };
  for (const event of incident.history) {
    if (event.to_status) reached[event.to_status] = formatDate(event.created_at, locale);
  }
  return reached;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-3">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function NextStep({
  incident,
  canManage,
  t,
}: {
  incident: IncidentDetail;
  canManage: boolean;
  t: Dict;
}) {
  const tasks = incident.action_plan?.tasks ?? [];
  const pendingTasks = tasks.filter((task) => task.completed_at === null).length;

  let text: string;
  let action: ReactNode = null;

  if (incident.status === "open") {
    text = canManage ? t.detail.openManage : t.detail.openWaiting;
    if (canManage)
      action = (
        <StatusButton incidentId={incident.id} next="in_analysis" label={t.detail.startAnalysis} />
      );
  } else if (incident.status === "in_analysis") {
    text = canManage
      ? t.detail.analysisManage
      : t.detail.analysisBy(incident.analyzed_by?.full_name ?? t.detail.anEngineer);
  } else if (incident.status === "corrective_action") {
    text =
      tasks.length === 0
        ? t.detail.needTask
        : pendingTasks > 0
          ? t.detail.pendingTasks(pendingTasks)
          : canManage
            ? t.detail.allDoneManage
            : t.detail.allDoneOther;
    if (canManage) {
      action = (
        <StatusButton
          incidentId={incident.id}
          next="closed"
          label={t.detail.closeIncident}
          disabled={tasks.length === 0 || pendingTasks > 0}
        />
      );
    }
  } else {
    return (
      <div className="flex items-center gap-3 rounded-md bg-green-soft px-5 py-3.5 text-green-ink">
        <StatusSign status="closed" size={20} />
        <p className="font-medium">{t.detail.closedBanner}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md bg-yellow-soft px-5 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StatusSign status={incident.status} size={20} />
        <p className="font-medium text-ink">
          <span className="label mr-2 block text-yellow-ink sm:inline">{t.detail.nextStep}</span>
          {text}
        </p>
      </div>
      {action}
    </div>
  );
}

function ActionPlanSection({
  incident,
  user,
  canManage,
  assignees,
  t,
  locale,
}: {
  incident: IncidentDetail;
  user: User;
  canManage: boolean;
  assignees: UserSummary[];
  t: Dict;
  locale: Locale;
}) {
  const plan = incident.action_plan;
  const isClosed = incident.status === "closed";

  if (!plan) {
    return (
      <Panel title={t.detail.actionPlan}>
        <div className="px-5 py-4">
          {canManage && incident.status === "in_analysis" ? (
            <ActionPlanForm incidentId={incident.id} />
          ) : (
            <p className="text-ink-muted">
              {incident.status === "open" ? t.detail.planAfterAnalysis : t.detail.noPlan}
            </p>
          )}
        </div>
      </Panel>
    );
  }

  const done = plan.tasks.filter((task) => task.completed_at !== null).length;

  return (
    <Panel
      title={t.detail.actionPlan}
      aside={plan.tasks.length > 0 ? t.detail.tasksDone(done, plan.tasks.length) : undefined}
    >
      <div className="px-5 py-4">
        {plan.tasks.length > 0 && (
          <div className="mb-4 flex gap-1" aria-hidden>
            {plan.tasks.map((task) => (
              <span
                key={task.id}
                className={`h-1.5 flex-1 rounded-xs ${
                  task.completed_at
                    ? "bg-green"
                    : !isClosed && isOverdue(task.due_date)
                      ? "bg-red"
                      : "bg-line"
                }`}
              />
            ))}
          </div>
        )}
        <p className="max-w-[70ch] whitespace-pre-wrap">{plan.description}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {t.detail.writtenBy(plan.created_by.full_name, formatDate(plan.created_at, locale))}
        </p>
      </div>

      {plan.tasks.length === 0 ? (
        <p className="border-t border-line px-5 py-6 text-ink-muted">{t.detail.noTasks}</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {plan.tasks.map((task) => (
            <TaskItem
              key={task.id}
              taskId={task.id}
              incidentId={incident.id}
              title={task.title}
              assignee={task.assigned_to.full_name}
              isMine={task.assigned_to.id === user.id}
              dueLabel={formatDate(task.due_date, locale)}
              overdue={!isClosed && isOverdue(task.due_date)}
              completedLabel={task.completed_at ? formatDate(task.completed_at, locale) : null}
              canToggle={!isClosed && (canManage || task.assigned_to.id === user.id)}
              canDelete={!isClosed && canManage}
            />
          ))}
        </ul>
      )}

      {canManage && !isClosed && (
        <div className="border-t border-line bg-sunken px-5 py-5">
          <h3 className="label mb-3">{t.detail.addTask}</h3>
          <AddTaskForm planId={plan.id} incidentId={incident.id} assignees={assignees} />
        </div>
      )}
    </Panel>
  );
}

type HistoryAction = Exclude<keyof Dict["history"], "toStatus">;

function History({ events, t, locale }: { events: HistoryEvent[]; t: Dict; locale: Locale }) {
  return (
    <ol className="px-5 py-4">
      {[...events].reverse().map((event, index, list) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex size-5 items-center justify-center">
              {event.to_status ? (
                <StatusSign status={event.to_status} size={14} />
              ) : (
                <span className="size-2 rounded-full bg-ink-subtle" />
              )}
            </span>
            {index < list.length - 1 && <span className="w-px flex-1 bg-line" />}
          </div>
          <div className="pb-4 text-sm">
            <p>
              <span className="font-medium">{event.user.full_name}</span>{" "}
              {t.history[event.action as HistoryAction] ?? event.action}
              {event.from_status && event.to_status && (
                <span className="text-ink-muted">
                  {t.history.toStatus(t.status[event.to_status], event.action === "status_changed")}
                </span>
              )}
            </p>
            <p className="text-ink-muted">{formatDateTime(event.created_at, locale)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-4 motion-safe:animate-pulse" aria-busy>
      <div className="h-4 w-48 rounded-xs bg-line" />
      <div className="mt-3 h-10 w-2/3 rounded-sm bg-line" />
      <div className="mt-6 h-24 rounded-md bg-surface" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-80 rounded-md bg-surface" />
        <div className="h-80 rounded-md bg-surface" />
      </div>
    </div>
  );
}
