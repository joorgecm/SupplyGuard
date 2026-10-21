"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton, inputClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";
import type { UserSummary } from "@/lib/types";
import { addTask } from "../actions";

export function AddTaskForm({
  planId,
  incidentId,
  assignees,
}: {
  planId: number;
  incidentId: number;
  assignees: UserSummary[];
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    addTask.bind(null, planId, incidentId),
    undefined,
  );
  const values = state?.values;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <Field id="title" label={t.detail.task}>
          <input
            id="title"
            name="title"
            required
            maxLength={150}
            defaultValue={values?.title}
            placeholder={t.detail.taskPlaceholder}
            className={inputClass}
          />
        </Field>
        <Field id="assigned_to_id" label={t.detail.responsible}>
          <select
            id="assigned_to_id"
            name="assigned_to_id"
            required
            defaultValue={values?.assigned_to_id ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              {t.detail.choose}
            </option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="due_date" label={t.detail.dueDate}>
          <input
            id="due_date"
            name="due_date"
            type="date"
            required
            defaultValue={values?.due_date}
            className={inputClass}
          />
        </Field>
      </div>
      <FormError message={state?.error} />
      <div>
        <SubmitButton
          pending={pending}
          idle={t.detail.addTaskButton}
          busy={t.detail.adding}
          variant="secondary"
        />
      </div>
    </form>
  );
}
