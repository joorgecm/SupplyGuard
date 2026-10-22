"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { RoleTag } from "@/components/badges";
import { inputClass } from "@/components/field";
import { formatDate } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n/provider";
import { ROLE_ORDER } from "@/lib/i18n/roles";
import type { Role, User } from "@/lib/types";
import { updateUser } from "./actions";

export function UserRow({ user, isMe }: { user: User; isMe: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { role: user.role, is_active: user.is_active },
    (state, changes: Partial<Pick<User, "role" | "is_active">>) => ({ ...state, ...changes }),
  );

  function save(changes: { role?: Role; is_active?: boolean }, message: string) {
    startTransition(async () => {
      setOptimistic(changes);
      const { error } = await updateUser(user.id, changes);
      if (error) toast.error(error);
      else toast.success(message);
    });
  }

  const initials = user.full_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-opacity ${optimistic.is_active ? "" : "opacity-60"}`}
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-sunken font-display font-semibold text-ink-muted"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {user.full_name}
          {isMe && (
            <span className="ml-2 rounded-xs bg-blue-soft px-1 text-xs font-medium text-blue-ink">
              {t.common.you}
            </span>
          )}
        </p>
        <p className="truncate text-sm text-ink-muted">
          {user.email} · {t.users.since(formatDate(user.created_at, locale))}
        </p>
      </div>

      {isMe ? (
        <RoleTag role={user.role} />
      ) : (
        <>
          <select
            aria-label={t.users.roleOf(user.full_name)}
            value={optimistic.role}
            disabled={pending}
            onChange={(e) => {
              const role = e.target.value as Role;
              save({ role }, t.users.roleChanged(user.full_name, t.role[role]));
            }}
            className={`${inputClass.replace("w-full", "w-auto")} py-1.5 pr-8`}
          >
            {ROLE_ORDER.map((role) => (
              <option key={role} value={role}>
                {t.role[role]}
              </option>
            ))}
          </select>
          <button
            type="button"
            role="switch"
            aria-checked={optimistic.is_active}
            aria-label={t.users.canSignIn(user.full_name)}
            disabled={pending}
            onClick={() =>
              save(
                { is_active: !optimistic.is_active },
                optimistic.is_active
                  ? t.users.deactivated(user.full_name)
                  : t.users.reactivated(user.full_name),
              )
            }
            className="pressable flex items-center gap-2 text-sm disabled:opacity-50 pointer-coarse:min-h-11"
          >
            <span
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${optimistic.is_active ? "bg-green" : "bg-line-strong"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform duration-200 ease-out ${optimistic.is_active ? "translate-x-4" : ""}`}
              />
            </span>
            <span className="w-14 text-left text-ink-muted">
              {optimistic.is_active ? t.users.active : t.users.inactive}
            </span>
          </button>
        </>
      )}
    </li>
  );
}
