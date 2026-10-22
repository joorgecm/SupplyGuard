"use server";

import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoLoginsEnabled } from "@/lib/demo";
import { getDict } from "@/lib/i18n/server";
import { clearToken, saveToken } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

async function signIn(email: string, password: string): Promise<LoginState> {
  const t = await getDict();

  // FastAPI espera un formulario OAuth2, donde el campo del email se llama "username"
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      body: new URLSearchParams({ username: email, password }),
    });
  } catch {
    return { error: t.login.errors.unreachable, email };
  }
  if (response.status === 401) return { error: t.login.errors.invalid, email };
  if (!response.ok) return { error: t.login.errors.generic, email };

  const { access_token } = await response.json();
  await saveToken(access_token);
  redirect("/dashboard");
}

// El botón de cuenta demo envía solo su email; la contraseña se resuelve en el servidor
export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getDict();

  const demoEmail = formData.get("demo");
  if (typeof demoEmail === "string") {
    const account = demoLoginsEnabled() && DEMO_ACCOUNTS.find((demo) => demo.email === demoEmail);
    if (!account) return { error: t.login.errors.invalid };
    return signIn(account.email, DEMO_PASSWORD);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: t.login.errors.missing, email };
  return signIn(email, password);
}

export async function logout(): Promise<void> {
  await clearToken();
  redirect("/login");
}
