"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton, inputClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";
import { createActionPlan } from "../actions";

export function ActionPlanForm({ incidentId }: { incidentId: number }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    createActionPlan.bind(null, incidentId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field id="description" label={t.detail.planDescription}>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={state?.values?.description}
          placeholder={t.detail.planPlaceholder}
          className={inputClass}
        />
      </Field>
      <FormError message={state?.error} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubmitButton pending={pending} idle={t.detail.createPlan} busy={t.detail.creating} />
        <p className="text-sm text-ink-muted">{t.detail.planNote}</p>
      </div>
    </form>
  );
}
