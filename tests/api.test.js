
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../backend/server.js";

const dataFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../backend/data/incidents.json"
);

test("API REST: validación, consulta, actualización, bitácora y estadísticas", async (t) => {
  const hadData = fs.existsSync(dataFile);
  const originalData = hadData ? fs.readFileSync(dataFile, "utf8") : null;
  const server = createServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );

    if (hadData) {
      fs.writeFileSync(dataFile, originalData, "utf8");
    } else if (fs.existsSync(dataFile)) {
      fs.unlinkSync(dataFile);
    }
  });

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");

  const invalid = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "" })
  });
  assert.equal(invalid.status, 400);

  const create = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Prueba automatizada",
      description: "Incidente de prueba",
      category: "Software",
      priority: "Media",
      user: "Usuario de pruebas"
    })
  });
  assert.equal(create.status, 201);

  const created = (await create.json()).data;
  assert.match(created.id, /^INC-\d+$/);

  const get = await fetch(`${base}/api/incidents/${created.id}`);
  assert.equal(get.status, 200);
  assert.equal((await get.json()).data.title, "Prueba automatizada");

  const patch = await fetch(`${base}/api/incidents/${created.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "EN_PROCESO", technician: "Ana García" })
  });
  assert.equal(patch.status, 200);

  const updated = (await patch.json()).data;
  assert.equal(updated.status, "EN_PROCESO");
  assert.equal(updated.technician, "Ana García");

  const comment = await fetch(`${base}/api/incidents/${created.id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Validado en prueba" })
  });
  assert.equal(comment.status, 201);
  assert.ok(
    (await comment.json()).data.history.some(
      (entry) => entry.message === "Validado en prueba"
    )
  );

  const stats = await fetch(`${base}/api/stats`);
  assert.equal(stats.status, 200);
  assert.ok((await stats.json()).data.total >= 1);

  const missing = await fetch(`${base}/api/incidents/INC-NO-EXISTE`);
  assert.equal(missing.status, 404);

  const unknown = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "No permitido",
      description: "Prueba",
      category: "Software",
      priority: "Baja",
      user: "Test",
      admin: true
    })
  });
  assert.equal(unknown.status, 400);

  const longTitle = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "T".repeat(121),
      description: "Prueba de longitud",
      category: "Software",
      priority: "Media",
      user: "Usuario de pruebas"
    })
  });
  assert.equal(longTitle.status, 400);

  const invalidPriority = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Prioridad inválida",
      description: "Prueba de prioridad",
      category: "Software",
      priority: "Urgente",
      user: "Usuario de pruebas"
    })
  });
  assert.equal(invalidPriority.status, 400);

  const invalidCategory = await fetch(`${base}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Categoría inválida",
      description: "Prueba de categoría",
      category: "Categoría inexistente",
      priority: "Media",
      user: "Usuario de pruebas"
    })
  });
  assert.equal(invalidCategory.status, 400);

  // Pruebas de filtros de consulta de incidentes
  const filterStatus = await fetch(`${base}/api/incidents?status=NUEVO`);
  assert.equal(filterStatus.status, 200);
  const statusResults = (await filterStatus.json()).data;
  assert.ok(statusResults.length > 0);
  assert.ok(statusResults.every((incident) => incident.status === "NUEVO"));

  const filterPriority = await fetch(`${base}/api/incidents?priority=Alta`);
  assert.equal(filterPriority.status, 200);
  const priorityResults = (await filterPriority.json()).data;
  assert.ok(priorityResults.every((incident) => incident.priority === "Alta"));

  const filterCategory = await fetch(`${base}/api/incidents?category=Hardware`);
  assert.equal(filterCategory.status, 200);
  const categoryResults = (await filterCategory.json()).data;
  assert.ok(categoryResults.every((incident) => incident.category === "Hardware"));

  const filterTechnician = await fetch(
    `${base}/api/incidents?technician=${encodeURIComponent("Carlos Méndez")}`
  );
  assert.equal(filterTechnician.status, 200);
  const technicianResults = (await filterTechnician.json()).data;
  assert.ok(technicianResults.every((incident) => incident.technician === "Carlos Méndez"));

  const filterSearch = await fetch(
    `${base}/api/incidents?search=${encodeURIComponent("correo")}`
  );
  assert.equal(filterSearch.status, 200);
  const searchResults = (await filterSearch.json()).data;
  assert.ok(searchResults.length > 0);
  assert.ok(
    searchResults.every((incident) =>
      `${incident.id} ${incident.title} ${incident.description} ${incident.user}`
        .toLowerCase()
        .includes("correo")
    )
  );


  // Pruebas adicionales de manejo de errores
  const invalidStatus = await fetch(`${base}/api/incidents/${created.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ESTADO_INVALIDO" })
  });
  assert.equal(invalidStatus.status, 400);

  const missingComment = await fetch(
    `${base}/api/incidents/INC-NO-EXISTE/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Comentario de prueba" })
    }
  );
  assert.equal(missingComment.status, 404);

  const emptyComment = await fetch(
    `${base}/api/incidents/${created.id}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" })
    }
  );
  assert.equal(emptyComment.status, 400);


  // Verificar que un filtro sin coincidencias devuelve una lista vacía
  const filterNoResults = await fetch(
    `${base}/api/incidents?status=ESTADO_INEXISTENTE`
  );
  assert.equal(filterNoResults.status, 200);

  const noResults = (await filterNoResults.json()).data;
  assert.ok(Array.isArray(noResults));
  assert.equal(noResults.length, 0);

});
