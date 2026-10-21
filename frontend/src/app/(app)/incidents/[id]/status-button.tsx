"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Spinner, buttonClass } from "@/components/field";
import { useT } from "@/lib/i18n/provider";
import type { IncidentStatus } from "@/lib/types";
import { changeStatus } from "../actions";
import { litKey } from "./workflow-rail";

export function StatusButton({
  incidentId,
  next,
  label,
  disabled,
}: {
  incidentId: number;
  next: IncidentStatus;
  label: string;
  disabled?: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  function advance() {
    startTransition(async () => {
      try {
        sessionStorage.setItem(litKey(incidentId), next);
      } catch {}
      const { error } = await changeStatus(incidentId, next);
      if (error) toast.error(error);
      else toast.success(t.detail.movedTo(t.status[next]));
    });
  }

  return (
    <button
      type="button"
      onClick={advance}
      disabled={disabled || pending}
      className={buttonClass.primary}
    >
      {pending && <Spinner />}
      {pending ? t.detail.updating : label}
    </button>
  );
}
