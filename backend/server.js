import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  initializeStore, listIncidents, getIncident, createIncident, updateIncident, addComment,
  getStats, allowedStatuses, allowedPriorities, allowedCategories
} from "./store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRONTEND = path.join(ROOT, "frontend");
const PORT = Number(process.env.PORT) || 3000;
const technicians = ["Carlos Méndez", "Ana García", "Luis Hernández", "Sofía Morales"];

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", ...headers });
  res.end(payload === null ? "" : JSON.stringify(payload));
}
function error(res, status, message, details) {
  send(res, status, { error: { message, ...(details ? { details } : {}) } });
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error("El cuerpo de la solicitud supera el límite de 1 MB."), { status: 413 });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error("El cuerpo debe contener JSON válido."), { status: 400 }); }
}
function validateCreate(body) {
  const errors = [];
  const required = ["title", "description", "category", "priority", "user"];
  for (const key of required) {
    if (typeof body[key] !== "string" || !body[key].trim()) errors.push(`${key} es obligatorio.`);
  }
  if (typeof body.title === "string" && body.title.trim().length > 120) errors.push("title no puede superar 120 caracteres.");
  if (typeof body.description === "string" && body.description.trim().length > 2000) errors.push("description no puede superar 2000 caracteres.");
  if (body.category && !allowedCategories.includes(body.category)) errors.push("category no es válida.");
  if (body.priority && !allowedPriorities.includes(body.priority)) errors.push("priority no es válida.");
  if (body.technician !== undefined && typeof body.technician !== "string") errors.push("technician debe ser texto.");
  const allowed = new Set([...required, "technician"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push(`Propiedad no permitida: ${key}.`);
  return errors;
}
function serveStatic(req, res, pathname) {
  const routes = { "/": "index.html", "/index.html": "index.html", "/styles.css": "styles.css", "/app.js": "app.js" };
  const relative = routes[pathname];
  if (!relative) return false;
  const file = path.join(FRONTEND, relative);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end("Archivo no encontrado"); return true; }
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
  res.writeHead(200, { "Content-Type": types[path.extname(file)], "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" });
  res.end(fs.readFileSync(file));
  return true;
}
export function createServer() {
  initializeStore();
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);
    if (req.method === "GET" && pathname === "/api/health") return send(res, 200, { status: "ok", service: "IT Incident Hub" });
    if (pathname.startsWith("/api/")) {
      try {
        if (req.method === "GET" && pathname === "/api/incidents") {
          const filters = Object.fromEntries(["status", "priority", "category", "technician", "search"].map((key) => [key, url.searchParams.get(key) || ""]));
          return send(res, 200, { data: listIncidents(filters) });
        }
        if (req.method === "GET" && pathname === "/api/stats") return send(res, 200, { data: getStats() });
        if (req.method === "GET" && pathname === "/api/meta") return send(res, 200, { data: { statuses: allowedStatuses, priorities: allowedPriorities, categories: allowedCategories, technicians } });
        if (req.method === "POST" && pathname === "/api/incidents") {
          const body = await readBody(req);
          const issues = validateCreate(body);
          if (issues.length) return error(res, 400, "Datos de incidente inválidos.", issues);
          const input = Object.fromEntries(["title", "description", "category", "priority", "user", "technician"].filter((key) => body[key] !== undefined).map((key) => [key, body[key].trim()]));
          return send(res, 201, { data: createIncident(input) }, { Location: `/api/incidents` });
        }
        const commentMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/comments$/);
        if (req.method === "POST" && commentMatch) {
          const id = commentMatch[1], body = await readBody(req);
          if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 1000) return error(res, 400, "El comentario es obligatorio y debe tener máximo 1000 caracteres.");
          if (body.author !== undefined && (typeof body.author !== "string" || !body.author.trim())) return error(res, 400, "author debe ser texto no vacío.");
          const incident = addComment(id, body.message.trim(), (body.author || "Soporte TI").trim());
          return incident ? send(res, 201, { data: incident }) : error(res, 404, "Incidente no encontrado.");
        }
        const incidentMatch = pathname.match(/^\/api\/incidents\/([^/]+)$/);
        if (incidentMatch && req.method === "GET") {
          const incident = getIncident(incidentMatch[1]);
          return incident ? send(res, 200, { data: incident }) : error(res, 404, "Incidente no encontrado.");
        }
        if (incidentMatch && req.method === "PATCH") {
          const id = incidentMatch[1], body = await readBody(req), changes = {};
          const allowed = new Set(["status", "technician"]);
          const unknown = Object.keys(body).filter((key) => !allowed.has(key));
          if (unknown.length) return error(res, 400, "Propiedades no permitidas.", unknown);
          if (!Object.keys(body).length) return error(res, 400, "Debe enviar al menos un campo para actualizar.");
          if (body.status !== undefined) {
            if (!allowedStatuses.includes(body.status)) return error(res, 400, "Estado no válido.");
            changes.status = body.status;
          }
          if (body.technician !== undefined) {
            if (typeof body.technician !== "string" || (body.technician && !technicians.includes(body.technician))) return error(res, 400, "Técnico no válido.");
            changes.technician = body.technician;
          }
          const incident = updateIncident(id, changes);
          return incident ? send(res, 200, { data: incident }) : error(res, 404, "Incidente no encontrado.");
        }
        if (req.method === "DELETE" && incidentMatch) {
          // Se evita borrar historial de auditoría accidentalmente; los incidentes se cierran mediante PATCH.
          return error(res, 405, "La eliminación está deshabilitada; cambie el estado a CERRADO.", { allowedMethod: "PATCH" });
        }
        return error(res, 404, "Ruta API no encontrada.");
      } catch (err) {
        return error(res, err.status || 500, err.status ? err.message : "Error interno del servidor.");
      }
    }
    if (req.method === "GET" && serveStatic(req, res, pathname)) return;
    return error(res, 404, "Recurso no encontrado.");
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.listen(PORT, () => console.log(`IT Incident Hub disponible en http://localhost:${PORT}`));
}
