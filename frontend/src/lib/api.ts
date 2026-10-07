import "server-only";

import { redirect } from "next/navigation";
import { getToken } from "./session";

export const API_URL = process.env.API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  // Token caducado o inválido: se borra la cookie y se vuelve al login
  if (response.status === 401) redirect("/logout");
  if (!response.ok) throw new ApiError(response.status, await readDetail(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function readDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    // FastAPI devuelve un texto en "detail", o una lista de errores si falla la validación
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((e: { msg: string }) => e.msg).join(", ");
  } catch {}
  return `Request failed (${response.status})`;
}
