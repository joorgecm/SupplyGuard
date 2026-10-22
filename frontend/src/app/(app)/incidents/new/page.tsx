import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusSign } from "@/components/badges";
import { PageTitle } from "@/components/field";
import { apiFetch } from "@/lib/api";
import { getDict } from "@/lib/i18n/server";
import { STATUS_FLOW } from "@/lib/format";
import type { Part } from "@/lib/types";
import { NewIncidentForm } from "./new-incident-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).newIncident.title };
}

export default async function NewIncidentPage() {
  const t = await getDict();
  return (
    <>
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.newIncident.back}
      </Link>
      <div className="mt-3">
        <PageTitle title={t.newIncident.title} />
        <p className="mt-1 text-ink-muted">{t.newIncident.subtitle}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-md border border-line bg-surface p-5 sm:p-7">
          <Suspense fallback={<div className="h-96 motion-safe:animate-pulse rounded-sm bg-sunken" />}>
            <FormLoader />
          </Suspense>
        </div>

        <aside className="lg:sticky lg:top-24">
          <h2 className="label">{t.newIncident.whatNext}</h2>
          <ol className="mt-4 flex flex-col">
            {STATUS_FLOW.map((status, index) => (
              <li key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StatusSign status={status} size={18} />
                  {index < STATUS_FLOW.length - 1 && (
                    <span className="my-1 w-px flex-1 bg-line-strong" />
                  )}
                </div>
                <p className="pb-5 text-sm text-ink-muted">{t.newIncident.steps[status]}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

async function FormLoader() {
  const parts = await apiFetch<Part[]>("/parts");
  return <NewIncidentForm parts={parts} />;
}
