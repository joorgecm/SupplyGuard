import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

// 16px en móvil: iOS amplía la página al enfocar un campo de menos de 16px
export const inputClass =
  "w-full rounded-sm border border-control bg-surface px-3 py-2 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle hover:border-ink-subtle focus:border-blue focus:ring-3 focus:ring-blue/15 disabled:bg-sunken disabled:text-ink-muted sm:text-[0.9375rem] pointer-coarse:py-2.5";

const buttonBase =
  "pressable inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 font-display text-[0.9375rem] font-semibold tracking-[0.04em] uppercase whitespace-nowrap pointer-coarse:py-2.5 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClass = {
  primary: `${buttonBase} bg-ink text-shell-ink hover:bg-shell-raised`,
  attention: `${buttonBase} bg-yellow text-ink hover:bg-yellow-hover`,
  secondary: `${buttonBase} border border-control bg-surface text-ink hover:border-ink-subtle hover:bg-sunken`,
  quiet: `${buttonBase} px-2 text-ink-muted hover:text-ink`,
};

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
        {hint && (
          <span className="ml-2 font-sans font-normal tracking-normal normal-case text-ink-subtle">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

export function SubmitButton({
  pending,
  idle,
  busy,
  variant = "primary",
}: {
  pending: boolean;
  idle: string;
  busy: string;
  variant?: keyof typeof buttonClass;
}) {
  return (
    <button type="submit" disabled={pending} className={buttonClass[variant]}>
      {pending && <Spinner />}
      {pending ? busy : idle}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="enter flex items-start gap-2 rounded-sm bg-red-soft px-3 py-2 text-red-ink"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-line bg-surface ${className}`}>
      {title && (
        <header className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3">
          <h2 className="font-display text-base font-semibold tracking-[0.04em] uppercase">
            {title}
          </h2>
          {aside && <div className="text-sm text-ink-muted">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="display text-[2.25rem]">{title}</h1>
      {children}
    </div>
  );
}
