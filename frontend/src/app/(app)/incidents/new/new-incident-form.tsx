"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SEVERITY_FILL, SeverityMeter } from "@/components/badges";
import { Field, FormError, SubmitButton, buttonClass, inputClass } from "@/components/field";
import { SEVERITIES } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { Part } from "@/lib/types";
import { createIncident } from "../actions";

export function NewIncidentForm({ parts }: { parts: Part[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(createIncident, undefined);
  const values = state?.values;

  if (parts.length === 0) {
    return <p className="text-ink-muted">{t.newIncident.noParts}</p>;
  }

  // Las piezas se agrupan por proveedor para encontrarlas más fácilmente
  const bySupplier = Map.groupBy(parts, (part) => part.supplier.name);
  const defaultSeverity = values?.severity ?? "medium";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field id="part_id" label={t.newIncident.partLot}>
        <select
          id="part_id"
          name="part_id"
          required
          autoFocus
          defaultValue={values?.part_id ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            {t.newIncident.selectPart}
          </option>
          {[...bySupplier].map(([supplier, supplierParts]) => (
            <optgroup key={supplier} label={supplier}>
              {supplierParts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.reference} · {t.newIncident.lot} {part.lot}
                  {part.description ? ` · ${part.description}` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="label mb-2">{t.newIncident.severity}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEVERITIES.map((severity) => (
            <label
              key={severity}
              className="group relative flex cursor-pointer items-start gap-3 rounded-sm border border-line-strong bg-surface px-3 py-2.5 transition-colors hover:border-ink-subtle has-checked:border-ink has-checked:bg-sunken has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue"
            >
              <input
                type="radio"
                name="severity"
                value={severity}
                defaultChecked={defaultSeverity === severity}
                className="sr-only"
              />
              <span className="mt-1">
                <SeverityMeter severity={severity} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold tracking-[0.04em] uppercase">
                  {t.severity[severity]}
                </span>
                <span className="block text-sm text-ink-muted">
                  {t.newIncident.severityHint[severity]}
                </span>
              </span>
              <span
                aria-hidden
                className={`absolute top-2.5 right-2.5 size-2.5 scale-0 rounded-full transition-transform duration-200 ease-out group-has-checked:scale-100 ${SEVERITY_FILL[severity]}`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="title" label={t.newIncident.whatIsWrong}>
        <input
          id="title"
          name="title"
          required
          maxLength={150}
          defaultValue={values?.title}
          placeholder={t.newIncident.titlePlaceholder}
          className={inputClass}
        />
      </Field>

      <Field id="description" label={t.newIncident.details}>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={values?.description}
          placeholder={t.newIncident.detailsPlaceholder}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field id="photo_url" label={t.newIncident.photo} hint={t.common.optional}>
        <input
          id="photo_url"
          name="photo_url"
          type="url"
          maxLength={500}
          defaultValue={values?.photo_url}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <FormError message={state?.error} />

      <div className="flex items-center gap-3 border-t border-line pt-5">
        <SubmitButton
          pending={pending}
          idle={t.newIncident.submit}
          busy={t.newIncident.submitting}
          variant="attention"
        />
        <Link href="/incidents" className={buttonClass.quiet}>
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
