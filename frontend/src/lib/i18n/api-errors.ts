import type { Locale } from "./locales";

// La API responde siempre en inglés; aquí se traducen sus mensajes conocidos
const EXACT: Record<string, string> = {
  "Incorrect email or password": "Correo o contraseña incorrectos",
  "Could not validate credentials": "No se han podido validar las credenciales",
  "Not enough permissions": "No tienes permisos suficientes",
  "Database unavailable": "Base de datos no disponible",
  "An action plan can only be created for incidents in analysis":
    "Solo se puede crear un plan de acción en incidencias en análisis",
  "Create an action plan to move to corrective action":
    "Crea un plan de acción para pasar a acción correctiva",
  "The action plan needs at least one task before closing":
    "El plan de acción necesita al menos una tarea antes de cerrar",
  "All action plan tasks must be completed before closing":
    "Todas las tareas del plan deben estar completadas antes de cerrar",
  "Only engineers or the assignee can update this task":
    "Solo los ingenieros o el responsable pueden modificar esta tarea",
  "The assignee can only mark the task as completed or not":
    "El responsable solo puede marcar la tarea como hecha o no hecha",
  "You cannot deactivate yourself or remove your own admin role":
    "No puedes desactivarte ni quitarte tu propio rol de admin",
};

const ENTITY: Record<string, string> = {
  "Action plan": "Plan de acción",
  "Action plan for incident": "Plan de acción de la incidencia",
  Incident: "Incidencia",
  Part: "Pieza",
  Supplier: "Proveedor",
  Task: "Tarea",
  User: "Usuario",
};

const PATTERNS: [RegExp, (m: string[]) => string][] = [
  [/^(.+) (\d+) not found$/, (m) => `No se ha encontrado: ${ENTITY[m[1]] ?? m[1]} ${m[2]}`],
  [
    /^Incident (\d+) already has an action plan$/,
    (m) => `La incidencia ${m[1]} ya tiene un plan de acción`,
  ],
  [/^Incident (\d+) is closed$/, (m) => `La incidencia ${m[1]} está cerrada`],
  [
    /^Cannot change status from '(.+)' to '(.+)'$/,
    (m) => `No se puede cambiar el estado de '${m[1]}' a '${m[2]}'`,
  ],
  [/^Supplier (\d+) is not active$/, (m) => `El proveedor ${m[1]} no está activo`],
  [/^User (\d+) is not active$/, (m) => `El usuario ${m[1]} no está activo`],
  [/^Supplier '(.+)' already exists$/, (m) => `El proveedor '${m[1]}' ya existe`],
  [
    /^User with email '(.+)' already exists$/,
    (m) => `Ya existe un usuario con el correo '${m[1]}'`,
  ],
  [
    /^Part '(.+)' lot '(.+)' already exists for this supplier$/,
    (m) => `La pieza '${m[1]}' con lote '${m[2]}' ya existe para este proveedor`,
  ],
  [/^Request failed \((\d+)\)$/, (m) => `La petición ha fallado (${m[1]})`],
];

export function translateApiError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  if (EXACT[message]) return EXACT[message];
  for (const [pattern, build] of PATTERNS) {
    const match = message.match(pattern);
    if (match) return build(match);
  }
  return message;
}
