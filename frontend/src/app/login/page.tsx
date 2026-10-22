import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusSign } from "@/components/badges";
import { LanguageSwitch } from "@/components/language-switch";
import { Mark } from "@/components/mark";
import { DEMO_ACCOUNTS, demoLoginsEnabled } from "@/lib/demo";
import { STATUS_FLOW } from "@/lib/format";
import { getDict } from "@/lib/i18n/server";
import { ExpiredNotice } from "./expired-notice";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).login.title };
}

export default async function LoginPage() {
  const t = await getDict();
  const showDemo = demoLoginsEnabled();

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-shell px-6 py-8 text-shell-ink sm:px-10 lg:px-14 lg:py-12">
        <div className="flex items-center gap-2.5">
          <Mark className="size-7" />
          <span className="font-display text-xl font-bold tracking-[0.06em] uppercase">
            SupplyGuard
          </span>
        </div>

        <div className="my-12 lg:my-0">
          <h1 className="display max-w-[14ch] text-[2.75rem] sm:text-[3.75rem]">
            {t.login.headline}
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg text-shell-muted">{t.login.pitch}</p>

          <ol
            className="mt-10 hidden max-w-xl grid-cols-4 gap-2 sm:grid"
            aria-label={t.login.workflow}
          >
            {STATUS_FLOW.map((status, index) => (
              <li key={status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-sm bg-white">
                    <StatusSign status={status} size={20} />
                  </span>
                  {index < STATUS_FLOW.length - 1 && (
                    <span className="h-px flex-1 bg-shell-line" aria-hidden />
                  )}
                </div>
                <span className="font-display text-sm font-semibold tracking-[0.06em] text-shell-muted uppercase">
                  {t.status[status]}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-shell-muted">{t.login.footer}</p>
        <div className="hazard absolute inset-y-0 right-0 hidden w-2 lg:block" aria-hidden />
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-10">
        <div className="enter w-full max-w-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="display text-[2rem]">{t.login.title}</h2>
              <p className="mt-1 text-ink-muted">{t.login.subtitle}</p>
            </div>
            <LanguageSwitch tone="light" />
          </div>
          <div className="mt-8">
            <Suspense>
              <ExpiredNotice />
            </Suspense>
            <LoginForm demoAccounts={showDemo ? DEMO_ACCOUNTS : []} />
          </div>
        </div>
      </section>
    </main>
  );
}
