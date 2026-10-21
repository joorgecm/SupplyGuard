"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { getDict } from "@/lib/i18n/server";
import type { Incident, IncidentStatus } from "@/lib/types";

// Estado que devuelven los formularios: el error y los valores escritos para no perderlos
export type FormState = { error?: string; values?: Record<string, string> } | undefined;
export type ActionResult = { error?: string };

// Los errores de la API se convierten en mensajes; cualquier otro error (p. ej. redirect) se propaga
async function attempt(request: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await request();
    return {};
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function refreshIncident(incidentId: number) {
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function createIncident(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getDict();
  const values = {
    part_id: text(formData, "part_id"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    severity: text(formData, "severity"),
    photo_url: text(formData, "photo_url"),
  };
  if (!values.part_id || !values.title || !values.description || !values.severity) {
    return { error: t.newIncident.errorMissing, values };
  }

  let incident: Incident;
  try {
    incident = await apiFetch<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify({
        part_id: Number(values.part_id),
        title: values.title,
        description: values.description,
        severity: values.severity,
        photo_url: values.photo_url || null,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message, values };
    throw error;
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  redirect(`/incidents/${incident.id}`);
}

export async function changeStatus(
  incidentId: number,
  status: IncidentStatus,
): Promise<ActionResult> {
  const result = await attempt(() =>
    apiFetch(`/incidents/${incidentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
  refreshIncident(incidentId);
  return result;
}

export async function createActionPlan(
  incidentId: number,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getDict();
  const description = text(formData, "description");
  if (!description) return { error: t.detail.planError, values: { description } };

  const result = await attempt(() =>
    apiFetch(`/incidents/${incidentId}/action-plan`, {
      method: "POST",
      body: JSON.stringify({ description }),
    }),
  );
  refreshIncident(incidentId);
  return result.error ? { error: result.error, values: { description } } : undefined;
}

export async function addTask(
  planId: number,
  incidentId: number,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getDict();
  const values = {
    title: text(formData, "title"),
    assigned_to_id: text(formData, "assigned_to_id"),
    due_date: text(formData, "due_date"),
  };
  if (!values.title || !values.assigned_to_id || !values.due_date) {
    return { error: t.detail.taskError, values };
  }

  const result = await attempt(() =>
    apiFetch(`/action-plans/${planId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ ...values, assigned_to_id: Number(values.assigned_to_id) }),
    }),
  );
  refreshIncident(incidentId);
  return result.error ? { error: result.error, values } : undefined;
}

export async function setTaskCompleted(
  taskId: number,
  incidentId: number,
  completed: boolean,
): Promise<ActionResult> {
  const result = await attempt(() =>
    apiFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ completed }) }),
  );
  refreshIncident(incidentId);
  return result;
}

export async function deleteTask(taskId: number, incidentId: number): Promise<ActionResult> {
  const result = await attempt(() => apiFetch(`/tasks/${taskId}`, { method: "DELETE" }));
  refreshIncident(incidentId);
  return result;
}
