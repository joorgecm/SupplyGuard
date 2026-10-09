"use client";

import { useActionState } from "react";
import { login } from "./actions";

const inputClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-medium">
          Email
        </label>
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
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="pressable mt-2 rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
