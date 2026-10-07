"use server";

import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { clearToken, saveToken } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  // FastAPI espera un formulario OAuth2, donde el campo del email se llama "username"
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      body: new URLSearchParams({ username: email, password }),
    });
  } catch {
    return { error: "Can't reach the API. Is the backend running?", email };
  }
  if (response.status === 401) return { error: "Incorrect email or password.", email };
  if (!response.ok) return { error: "Something went wrong. Try again.", email };

  const { access_token } = await response.json();
  await saveToken(access_token);
  redirect("/incidents");
}

export async function logout(): Promise<void> {
  await clearToken();
  redirect("/login");
}
