"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { RoleTag } from "@/components/badges";
import { Field, FormError, SubmitButton, inputClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";
import type { Role } from "@/lib/types";
import { login } from "./actions";

type DemoAccount = { email: string; name: string; role: Role };

export function LoginForm({ demoAccounts }: { demoAccounts: DemoAccount[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <>
      <form id="login" action={formAction} className="flex flex-col gap-5">
        <Field id="email" label={t.login.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            defaultValue={state?.email}
            className={inputClass}
          />
        </Field>
        <Field id="password" label={t.login.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </Field>

        <FormError message={state?.error} />

        <SubmitButton pending={pending} idle={t.login.submit} busy={t.login.submitting} />
      </form>

      {demoAccounts.length > 0 && (
        <div className="mt-10 border-t border-line pt-6">
          <p className="label">{t.login.demoTitle}</p>
          <p className="mt-1 text-sm text-ink-muted">{t.login.demoNote}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {demoAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="submit"
                  form="login"
                  formNoValidate
                  name="demo"
                  value={account.email}
                  disabled={pending}
                  className="pressable group flex w-full items-center gap-3 rounded-sm border border-line bg-surface px-3 py-2.5 text-left hover:border-ink-subtle disabled:opacity-50"
                >
                  <RoleTag role={account.role} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{account.name}</span>
                    <span className="block truncate text-sm text-ink-muted">{account.email}</span>
                  </span>
                  <ArrowRight
                    className="size-4 text-ink-subtle transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
