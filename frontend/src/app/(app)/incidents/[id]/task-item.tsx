"use client";

import { Check, Trash2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/provider";
import { deleteTask, setTaskCompleted } from "../actions";

export function TaskItem({
  taskId,
  incidentId,
  title,
  assignee,
  isMine,
  dueLabel,
  overdue,
  completedLabel,
  canToggle,
  canDelete,
}: {
  taskId: number;
  incidentId: number;
  title: string;
  assignee: string;
  isMine: boolean;
  dueLabel: string;
  overdue: boolean;
  completedLabel: string | null;
  canToggle: boolean;
  canDelete: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  // La casilla cambia al instante; si la API falla, vuelve a su estado real
  const [completed, setCompleted] = useOptimistic(completedLabel !== null);

  function toggle() {
    startTransition(async () => {
      setCompleted(!completed);
      const { error } = await setTaskCompleted(taskId, incidentId, !completed);
      if (error) toast.error(error);
    });
  }

  function remove() {
    startTransition(async () => {
      const { error } = await deleteTask(taskId, incidentId);
      if (error) toast.error(error);
      else toast.success(t.detail.taskDeleted);
    });
  }

  return (
    <li className="group flex items-start gap-3 px-5 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        disabled={!canToggle || pending}
        onClick={toggle}
        aria-label={completed ? t.detail.markUndone(title) : t.detail.markDone(title)}
        className={`pressable mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors disabled:cursor-not-allowed ${
          completed
            ? "border-green bg-green text-white"
            : canToggle
              ? "border-line-strong bg-surface hover:border-ink"
              : "border-line bg-sunken"
        }`}
      >
        <Check
          className={`size-3.5 transition-[scale,opacity] duration-200 ease-out ${completed ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          strokeWidth={3}
          aria-hidden
        />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`transition-colors ${completed ? "text-ink-muted line-through decoration-ink-subtle" : "font-medium"}`}
        >
          {title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
          <span>
            {assignee}
            {isMine && (
              <span className="ml-1.5 rounded-xs bg-blue-soft px-1 text-xs font-medium text-blue-ink">
                {t.common.you}
              </span>
            )}
          </span>
          <span aria-hidden>·</span>
          {completed ? (
            <span className="text-green-ink">
              {t.detail.doneOn(completedLabel ?? t.detail.justNow)}
            </span>
          ) : overdue ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-red-ink">
              <span className="hazard h-2.5 w-4 rounded-xs" aria-hidden />
              {t.detail.overdueSince(dueLabel)}
            </span>
          ) : (
            <span>{t.detail.due(dueLabel)}</span>
          )}
        </p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={t.detail.deleteTaskNamed(title)}
          title={t.detail.deleteTask}
          className="pressable rounded-sm p-1.5 text-ink-subtle opacity-100 hover:bg-red-soft hover:text-red-ink disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </li>
  );
}
