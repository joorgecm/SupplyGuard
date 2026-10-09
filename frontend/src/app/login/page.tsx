import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpiredNotice } from "./expired-notice";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="enter w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-ink-subtle uppercase">SupplyGuard</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Sign in to your account</h1>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <Suspense>
            <ExpiredNotice />
          </Suspense>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
