import "server-only";

import type { Role } from "./types";

// Cuentas creadas por backend/app/scripts/seed_demo.py. La contraseña nunca sale del servidor
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS: { email: string; name: string; role: Role }[] = [
  { email: "operario@demo.com", name: "Lucía Navarro", role: "operator" },
  { email: "ingeniero@demo.com", name: "Elena Soler", role: "engineer" },
  { email: "admin@demo.com", name: "Pablo Martí", role: "admin" },
];

// Solo en desarrollo o con DEMO_LOGINS=true
export function demoLoginsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_LOGINS === "true";
}
