import { es } from "./dictionaries";
import type { Locale } from "./locales";

const statusName = (value: string) => es.status[value as keyof typeof es.status] ?? value;

// La API responde siempre en inglés; aquí se traducen sus mensajes conocidos
const EXACT: Record<string, string> = {
  "Incorrect email or password": "El correo o la contraseña no son correctos",
  "Could not validate credentials": "No se ha podido comprobar tu identidad. Vuelve a iniciar sesión",
  "Not enough permissions": "No tienes permiso para hacer esta acción",
  "Database unavailable": "La base de datos no está disponible",
  "An action plan can only be created for incidents in analysis":
    "Solo se puede crear un plan de acción si la incidencia está en análisis",
  "Create an action plan to move to corrective action":
    "Crea un plan de acción para pasar a acción correctiva",
  "The action plan needs at least one task before closing":
    "El plan de acción necesita al menos una tarea para poder cerrar la incidencia",
  "All action plan tasks must be completed before closing":
    "Todas las tareas del plan deben estar completadas para poder cerrar la incidencia",
  "Only engineers or the assignee can update this task":
    "Solo los ingenieros o el responsable pueden modificar esta tarea",
  "The assignee can only mark the task as completed or not":
    "El responsable solo puede marcar la tarea como completada o pendiente",
  "You cannot deactivate yourself or remove your own admin role":
    "No puedes desactivar tu propia cuenta ni quitarte el rol de administrador",
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
  [/^(.+) (\d+) not found$/, (m) => `No existe: ${ENTITY[m[1]] ?? m[1]} ${m[2]}`],
  [
    /^Incident (\d+) already has an action plan$/,
    (m) => `La incidencia ${m[1]} ya tiene un plan de acción`,
  ],
  [/^Incident (\d+) is closed$/, (m) => `La incidencia ${m[1]} está cerrada`],
  [
    /^Cannot change status from '(.+)' to '(.+)'$/,
    (m) => `No se puede pasar de «${statusName(m[1])}» a «${statusName(m[2])}»`,
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
  [/^Request failed \((\d+)\)$/, (m) => `La solicitud ha fallado (código ${m[1]})`],
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
