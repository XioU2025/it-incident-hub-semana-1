const $ = (selector) => document.querySelector(selector);
const state = { meta: null, incidents: [], selectedId: null, toastTimer: null };
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const prettyDate = (value) => new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(new Date(value));
const prettyStatus = (value) => ({ NUEVO: "Nuevo", ASIGNADO: "Asignado", EN_PROCESO: "En proceso", RESUELTO: "Resuelto", CERRADO: "Cerrado" })[value] || value;
const priorityClass = (value) => value.toLowerCase().replace("í", "i");
async function api(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.details?.join(" ") || payload?.error?.message || `Error HTTP ${response.status}`);
  return payload;
}
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function fillSelect(selector, values, firstLabel = null) {
  const el = $(selector);
  const current = el.value;
  el.innerHTML = `${firstLabel === null ? "" : `<option value="">${escapeHtml(firstLabel)}</option>`}${values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("")}`;
  if (values.includes(current)) el.value = current;
}
function populateMeta(meta) {
  state.meta = meta;
  fillSelect("#statusFilter", meta.statuses, "Todos los estados");
  fillSelect("#priorityFilter", meta.priorities, "Todas las prioridades");
  fillSelect("#categoryFilter", meta.categories, "Todas las categorías");
  fillSelect("#technicianFilter", meta.technicians, "Todos los técnicos");
  fillSelect("#formCategory", meta.categories);
  fillSelect("#formPriority", meta.priorities);
  fillSelect("#formTechnician", meta.technicians, "Sin asignar");
}
function renderStats(stats) {
  $("#statTotal").textContent = stats.total;
  $("#statOpen").textContent = stats.open;
  $("#statClosed").textContent = stats.closed;
  $("#statCritical").textContent = stats.critical;
  renderChart("#categoryChart", stats.byCategory);
  const tech = { ...stats.byTechnician };
  if (tech[""]) { tech["Sin asignar"] = tech[""]; delete tech[""]; }
  renderChart("#technicianChart", tech);
}
function renderChart(selector, values) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  $(selector).innerHTML = entries.length ? entries.map(([label, count]) => `<div class="chart-row"><span>${escapeHtml(label || "Sin asignar")}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, count / max * 100)}%"></div></div><strong>${count}</strong></div>`).join("") : '<p class="empty">Sin datos disponibles.</p>';
}
function renderIncidents(items) {
  state.incidents = items;
  $("#resultCount").textContent = `${items.length} ${items.length === 1 ? "registro" : "registros"}`;
  $("#incidentRows").innerHTML = items.length ? items.map((item) => `<tr>
    <td><div class="incident-title"><span class="incident-symbol">${escapeHtml(item.category.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.user)}</small></div></div></td>
    <td>${escapeHtml(item.category)}</td><td><span class="priority priority-${priorityClass(item.priority)}">${escapeHtml(item.priority)}</span></td>
    <td><span class="status status-${escapeHtml(item.status)}">${escapeHtml(prettyStatus(item.status))}</span></td>
    <td>${escapeHtml(item.technician || "Sin asignar")}</td><td>${escapeHtml(prettyDate(item.createdAt))}</td>
    <td><button class="row-action" data-open="${escapeHtml(item.id)}">Ver detalle ↗</button></td></tr>`).join("") : '<tr><td colspan="7" class="empty">No se encontraron incidentes con esos filtros.</td></tr>';
}
async function refresh() {
  const [stats, incidents] = await Promise.all([
    api("/api/stats"), api(`/api/incidents?${new URLSearchParams({
      status: $("#statusFilter").value, priority: $("#priorityFilter").value, category: $("#categoryFilter").value,
      technician: $("#technicianFilter").value, search: $("#searchFilter").value.trim()
    })}`)
  ]);
  renderStats(stats.data); renderIncidents(incidents.data);
}
function openNewDialog() {
  $("#formError").textContent = ""; $("#incidentForm").reset(); $("#incidentDialog").showModal();
}
async function openDetail(id) {
  try {
    const { data: item } = await api(`/api/incidents/${encodeURIComponent(id)}`);
    state.selectedId = item.id;
    $("#detailContent").innerHTML = `<div class="modal-heading"><div><span class="eyebrow">${escapeHtml(item.id)}</span><h2 style="margin-top:7px">${escapeHtml(item.title)}</h2></div><button type="button" class="icon-button" data-close-detail aria-label="Cerrar">×</button></div>
      <div class="detail-meta"><div class="detail-box"><small>PRIORIDAD</small><strong><span class="priority priority-${priorityClass(item.priority)}">${escapeHtml(item.priority)}</span></strong></div><div class="detail-box"><small>ESTADO ACTUAL</small><strong><span class="status status-${escapeHtml(item.status)}">${escapeHtml(prettyStatus(item.status))}</span></strong></div><div class="detail-box"><small>USUARIO</small><strong>${escapeHtml(item.user)}</strong></div><div class="detail-box"><small>FECHA DE REGISTRO</small><strong>${escapeHtml(prettyDate(item.createdAt))}</strong></div></div>
      <div class="detail-description">${escapeHtml(item.description)}</div>
      <div class="detail-controls"><label>Estado<select id="detailStatus">${state.meta.statuses.map((v) => `<option value="${escapeHtml(v)}" ${v === item.status ? "selected" : ""}>${escapeHtml(prettyStatus(v))}</option>`).join("")}</select></label><label>Técnico asignado<select id="detailTechnician"><option value="">Sin asignar</option>${state.meta.technicians.map((v) => `<option value="${escapeHtml(v)}" ${v === item.technician ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}</select></label></div>
      <button type="button" class="button primary" id="saveDetail" style="margin-top:12px">Guardar cambios</button>
      <h3 class="detail-section-title">Bitácora de seguimiento</h3><div class="history-list">${item.history.slice().reverse().map((h) => `<div class="history-item"><p>${escapeHtml(h.message)}</p><small>${escapeHtml(h.author)} · ${escapeHtml(new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(h.at)))}</small></div>`).join("")}</div>
      <form id="commentForm" class="comment-form"><input name="message" maxlength="1000" required placeholder="Agregar comentario a la bitácora…"><button class="button secondary" type="submit">Comentar</button></form>`;
    $("#detailDialog").showModal();
  } catch (err) { toast(err.message); }
}
$("#newIncidentBtn").addEventListener("click", openNewDialog);
$("#closeDialog").addEventListener("click", () => $("#incidentDialog").close());
$("#cancelDialog").addEventListener("click", () => $("#incidentDialog").close());
$("#incidentForm").addEventListener("submit", async (event) => {
  event.preventDefault(); $("#formError").textContent = "";
  const form = new FormData(event.currentTarget);
  const body = Object.fromEntries(form.entries());
  try {
    const result = await api("/api/incidents", { method: "POST", body: JSON.stringify(body) });
    $("#incidentDialog").close(); await refresh(); toast(`Incidente ${result.data.id} creado correctamente.`);
    await openDetail(result.data.id);
  } catch (err) { $("#formError").textContent = err.message; }
});
let searchTimer;
["#statusFilter", "#priorityFilter", "#categoryFilter", "#technicianFilter"].forEach((selector) => $(selector).addEventListener("change", () => refresh().catch((err) => toast(err.message))));
$("#searchFilter").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => refresh().catch((err) => toast(err.message)), 250); });
$("#incidentRows").addEventListener("click", (event) => {
  const button = event.target.closest("[data-open]");
  if (button) openDetail(button.dataset.open);
});
$("#detailContent").addEventListener("click", async (event) => {
  if (event.target.closest("[data-close-detail]")) $("#detailDialog").close();
  if (event.target.closest("#saveDetail")) {
    const id = state.selectedId;
    try {
      await api(`/api/incidents/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: $("#detailStatus").value, technician: $("#detailTechnician").value }) });
      await refresh(); await openDetail(id); toast("Cambios guardados correctamente.");
    } catch (err) { toast(err.message); }
  }
});
$("#detailContent").addEventListener("submit", async (event) => {
  if (event.target.id !== "commentForm") return;
  event.preventDefault();
  const message = new FormData(event.target).get("message");
  try { await api(`/api/incidents/${encodeURIComponent(state.selectedId)}/comments`, { method: "POST", body: JSON.stringify({ message, author: "Soporte TI" }) }); await refresh(); await openDetail(state.selectedId); toast("Comentario agregado a la bitácora."); }
  catch (err) { toast(err.message); }
});
async function init() {
  try { const { data } = await api("/api/meta"); populateMeta(data); await refresh(); }
  catch (err) { $("#incidentRows").innerHTML = `<tr><td colspan="7" class="empty">No se pudo cargar la aplicación: ${escapeHtml(err.message)}. Reinicia el servidor con npm start.</td></tr>`; toast(err.message); }
}
init();
