import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Incidents" };

// Página provisional para comprobar el login; se sustituirá por el listado de incidencias
export default function IncidentsPage() {
  return (
    <main className="enter mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-xl font-semibold tracking-tight">Incidents</h1>
      <Suspense fallback={<p className="mt-4 text-ink-subtle">Loading…</p>}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  return (
    <div className="mt-4 flex items-center gap-4">
      <p>
        Hello, {user.full_name} <span className="text-ink-muted">({user.role})</span>
      </p>
      <form action={logout}>
        <button type="submit" className="pressable text-accent hover:text-accent-hover">
          Sign out
        </button>
      </form>
    </div>
  );
}
