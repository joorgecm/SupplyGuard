"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Field, FormError, SubmitButton, inputClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";
import { ROLE_ORDER } from "@/lib/i18n/roles";
import { createUser } from "./actions";

export function NewUserForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(createUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const values = state?.values;

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="rounded-md border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-3 font-display text-base font-semibold tracking-[0.04em] uppercase">
        {t.users.addUser}
      </h2>
      <form ref={formRef} action={formAction} className="flex flex-col gap-4 px-5 py-4">
        <Field id="full_name" label={t.users.fullName}>
          <input
            id="full_name"
            name="full_name"
            required
            maxLength={100}
            autoComplete="off"
            defaultValue={values?.full_name}
            className={inputClass}
          />
        </Field>
        <Field id="new_email" label={t.users.email}>
          <input
            id="new_email"
            name="email"
            type="email"
            required
            autoComplete="off"
            defaultValue={values?.email}
            className={inputClass}
          />
        </Field>
        <Field id="role" label={t.users.role}>
          <select
            id="role"
            name="role"
            required
            defaultValue={values?.role ?? "operator"}
            className={inputClass}
          >
            {ROLE_ORDER.map((role) => (
              <option key={role} value={role}>
                {t.role[role]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="new_password" label={t.users.initialPassword} hint={t.users.passwordHint}>
          <input
            id="new_password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <FormError message={state?.error} />
        <SubmitButton pending={pending} idle={t.users.addUser} busy={t.users.adding} />
      </form>
    </section>
  );
}
