import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const dataFile = path.join(dataDir, "incidents.json");

const seed = [
  {
    id: "INC-1001", title: "No se puede acceder al correo", description: "El equipo de Finanzas no puede iniciar sesión en el correo corporativo.",
    category: "Correo", priority: "Alta", user: "María López", technician: "Carlos Méndez",
    status: "EN_PROCESO", createdAt: "2026-10-20T14:30:00.000Z",
    history: [{ id: randomUUID(), message: "Incidente registrado por el usuario.", author: "Sistema", at: "2026-10-20T14:30:00.000Z" }]
  },
  {
    id: "INC-1002", title: "Impresora sin conexión", description: "La impresora del área de recepción aparece desconectada.",
    category: "Hardware", priority: "Media", user: "José Pérez", technician: "Ana García",
    status: "ASIGNADO", createdAt: "2026-10-22T09:15:00.000Z",
    history: [{ id: randomUUID(), message: "Incidente registrado por el usuario.", author: "Sistema", at: "2026-10-22T09:15:00.000Z" }]
  },
  {
    id: "INC-1003", title: "Acceso al sistema bloqueado", description: "La cuenta quedó bloqueada después de varios intentos de inicio de sesión.",
    category: "Accesos", priority: "Crítica", user: "Ana Ruiz", technician: "",
    status: "NUEVO", createdAt: "2026-10-25T11:00:00.000Z",
    history: [{ id: randomUUID(), message: "Incidente registrado por el usuario.", author: "Sistema", at: "2026-10-25T11:00:00.000Z" }]
  },
  {
    id: "INC-1004", title: "Actualización completada", description: "Se instaló la actualización solicitada en el equipo de soporte.",
    category: "Software", priority: "Baja", user: "Pedro Díaz", technician: "Carlos Méndez",
    status: "RESUELTO", createdAt: "2026-10-18T08:00:00.000Z",
    history: [{ id: randomUUID(), message: "Incidente registrado por el usuario.", author: "Sistema", at: "2026-10-18T08:00:00.000Z" }]
  }
];

export function initializeStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seed, null, 2), "utf8");
  }
}

function readAll() {
  initializeStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("No se pudo leer el archivo de datos. Verifique backend/data/incidents.json.");
  }
}
function writeAll(items) {
  initializeStore();
  const tempFile = `${dataFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(items, null, 2), "utf8");
  fs.renameSync(tempFile, dataFile);
}
export function listIncidents(filters = {}) {
  const items = readAll();
  return items.filter((item) =>
    (!filters.status || item.status === filters.status) &&
    (!filters.priority || item.priority === filters.priority) &&
    (!filters.category || item.category === filters.category) &&
    (!filters.technician || item.technician === filters.technician) &&
    (!filters.search || `${item.id} ${item.title} ${item.description} ${item.user}`.toLowerCase().includes(filters.search.toLowerCase()))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function getIncident(id) {
  return readAll().find((item) => item.id === id) ?? null;
}
export function createIncident(input) {
  const items = readAll();
  const number = items.reduce((max, item) => Math.max(max, Number(item.id.replace("INC-", "")) || 1000), 1000) + 1;
  const now = new Date().toISOString();
  const incident = {
    id: `INC-${number}`, ...input, technician: input.technician || "", status: "NUEVO", createdAt: now,
    history: [{ id: randomUUID(), message: "Incidente registrado.", author: input.user, at: now }]
  };
  items.push(incident);
  writeAll(items);
  return incident;
}
export function updateIncident(id, changes) {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = items[index];
  const updated = { ...current, ...changes };
  const now = new Date().toISOString();
  if (changes.status && changes.status !== current.status) {
    updated.history = [...current.history, { id: randomUUID(), message: `Estado cambiado de ${current.status} a ${changes.status}.`, author: "Soporte TI", at: now }];
  }
  if (changes.technician !== undefined && changes.technician !== current.technician) {
    updated.history = [...updated.history, { id: randomUUID(), message: `Técnico asignado: ${changes.technician || "Sin asignar"}.`, author: "Soporte TI", at: now }];
    if (changes.technician && updated.status === "NUEVO") updated.status = "ASIGNADO";
  }
  items[index] = updated;
  writeAll(items);
  return updated;
}
export function addComment(id, message, author) {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const entry = { id: randomUUID(), message, author, at: new Date().toISOString() };
  items[index].history.push(entry);
  writeAll(items);
  return items[index];
}
export function getStats() {
  const items = readAll();
  const countBy = (key) => items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
  return {
    total: items.length,
    open: items.filter((i) => !["RESUELTO", "CERRADO"].includes(i.status)).length,
    closed: items.filter((i) => ["RESUELTO", "CERRADO"].includes(i.status)).length,
    critical: items.filter((i) => i.priority === "Crítica" && !["RESUELTO", "CERRADO"].includes(i.status)).length,
    byCategory: countBy("category"),
    byTechnician: countBy("technician")
  };
}
export const allowedStatuses = ["NUEVO", "ASIGNADO", "EN_PROCESO", "RESUELTO", "CERRADO"];
export const allowedPriorities = ["Baja", "Media", "Alta", "Crítica"];
export const allowedCategories = ["Hardware", "Software", "Red", "Correo", "Accesos", "Otro"];
