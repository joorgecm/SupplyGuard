import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/field";
import { apiFetch } from "@/lib/api";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import type { Role, User } from "@/lib/types";
import { NewUserForm } from "./new-user-form";
import { UserRow } from "./user-row";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).users.title };
}

export default async function UsersPage() {
  const t = await getDict();
  return (
    <>
      <PageTitle title={t.users.title} />
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-md bg-surface" />}>
        <UsersView />
      </Suspense>
    </>
  );
}

async function UsersView() {
  const [me, t] = await Promise.all([getCurrentUser(), getDict()]);
  if (!hasRole(me, "admin")) {
    return (
      <p className="mt-8 rounded-md border border-line bg-surface px-6 py-12 text-center text-ink-muted">
        {t.users.onlyAdmins}
      </p>
    );
  }

  const users = await apiFetch<User[]>("/users");
  const counts = users.reduce<Record<Role, number>>(
    (acc, user) => ({ ...acc, [user.role]: acc[user.role] + (user.is_active ? 1 : 0) }),
    { operator: 0, engineer: 0, admin: 0 },
  );
  const roles: Role[] = ["operator", "engineer", "admin"];

  return (
    <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <ul className="divide-y divide-line">
          {users.map((user) => (
            <UserRow key={user.id} user={user} isMe={user.id === me.id} />
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <NewUserForm />
        <section>
          <h2 className="label">{t.users.roles}</h2>
          <dl className="mt-3 flex flex-col gap-3">
            {roles.map((role) => (
              <div key={role}>
                <dt className="font-medium">
                  {t.role[role]}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {t.users.activeCount(counts[role])}
                  </span>
                </dt>
                <dd className="text-sm text-ink-muted">{t.users.scope[role]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
