import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "sg_token";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function saveToken(token: string): Promise<void> {
  // httpOnly: el JavaScript del navegador no puede leer el token
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function clearToken(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
