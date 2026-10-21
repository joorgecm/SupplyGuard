"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getDict } from "@/lib/i18n/server";
import type { Role } from "@/lib/types";

export type UserFormState =
  { error?: string; success?: string; values?: Record<string, string> } | undefined;

export async function createUser(_: UserFormState, formData: FormData): Promise<UserFormState> {
  const t = await getDict();
  const values = {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    role: String(formData.get("role") ?? ""),
  };
  const password = String(formData.get("password") ?? "");
  if (!values.full_name || !values.email || !values.role) {
    return { error: t.users.errorMissing, values };
  }
  if (password.length < 8) return { error: t.users.errorPassword, values };

  try {
    await apiFetch("/users", { method: "POST", body: JSON.stringify({ ...values, password }) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message, values };
    throw error;
  }
  revalidatePath("/users");
  return { success: t.users.created(values.full_name) };
}

export async function updateUser(
  userId: number,
  changes: { role?: Role; is_active?: boolean },
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(changes) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/users");
  return {};
}
