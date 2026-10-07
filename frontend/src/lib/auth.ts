import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { apiFetch } from "./api";
import { getToken } from "./session";
import type { Role, User } from "./types";

// cache() evita repetir la llamada a /auth/me si varios componentes la piden en la misma petición
export const getCurrentUser = cache(async (): Promise<User> => {
  if (!(await getToken())) redirect("/login");
  return apiFetch<User>("/auth/me");
});

export function hasRole(user: User, ...roles: Role[]): boolean {
  return roles.includes(user.role);
}
