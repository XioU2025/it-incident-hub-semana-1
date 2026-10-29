# IT Incident Hub — Proyecto integrador DevOps

Aplicación web para registrar, asignar, consultar y dar seguimiento a incidentes de TI. El proyecto está basado en los requisitos del documento del curso: API REST, persistencia, estados, bitácora, filtros, dashboard, pruebas y archivos de CI.

## Requisitos
- Node.js 20 o posterior (recomendado Node.js 22 LTS).
- npm incluido con Node.js.
- No requiere instalar dependencias de terceros para ejecutar la aplicación.

## Instalación y ejecución
1. Descomprima el ZIP.
2. Abra una terminal dentro de la carpeta `incident-hub`.
3. Ejecute:

   ```bash
   npm ci
   npm run check
   npm start
   ```

4. Abra `http://localhost:3000`.
5. Para detener el servidor, presione `Ctrl+C`.

Modo de desarrollo con reinicio automático: `npm run dev`.

Si necesita otro puerto en PowerShell:
```powershell
$env:PORT=3001
npm start
```

## Funcionalidades
- Crear incidentes con título, descripción, categoría, prioridad y usuario.
- Consultar detalle, fecha, estado y técnico asignado.
- Asignar técnico y actualizar estado: `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`.
- Añadir comentarios a la bitácora de cada incidente.
- Filtrar por estado, prioridad, categoría y técnico; buscar por texto.
- Dashboard con total, pendientes, resueltos/cerrados, críticos abiertos y distribuciones por categoría/técnico.
- Persistencia en `backend/data/incidents.json`, inicializada automáticamente con datos de ejemplo.

## API REST
Todas las respuestas API se devuelven en JSON, salvo respuestas sin contenido.

| Método | Ruta | Uso | Respuesta principal |
|---|---|---|---|
| GET | `/api/health` | Estado del servicio | 200 |
| GET | `/api/meta` | Catálogos de estados, prioridades, categorías y técnicos | 200 |
| GET | `/api/stats` | Indicadores del dashboard | 200 |
| GET | `/api/incidents` | Listado; filtros opcionales `status`, `priority`, `category`, `technician`, `search` | 200 |
| GET | `/api/incidents/:id` | Detalle e historial | 200 / 404 |
| POST | `/api/incidents` | Crear incidente | 201 / 400 |
| PATCH | `/api/incidents/:id` | Cambiar `status` y/o `technician` | 200 / 400 / 404 |
| POST | `/api/incidents/:id/comments` | Agregar comentario a la bitácora | 201 / 400 / 404 |
| DELETE | `/api/incidents/:id` | No permitido; cerrar en su lugar para conservar auditoría | 405 |

### Códigos de estado
- `200 OK`: consulta o actualización exitosa.
- `201 Created`: incidente o comentario creado.
- `400 Bad Request`: JSON inválido, campos requeridos ausentes, valores inválidos o propiedades no permitidas.
- `404 Not Found`: ruta o incidente inexistente.
- `405 Method Not Allowed`: eliminación deshabilitada por trazabilidad.
- `413 Payload Too Large`: cuerpo mayor a 1 MB.
- `500 Internal Server Error`: error inesperado del servidor.

### Ejemplo para crear incidente
```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Internet lento","description":"Conexión lenta en recepción","category":"Red","priority":"Alta","user":"Usuario de prueba"}'
```

### Ejemplo para actualizar estado
```bash
curl -X PATCH http://localhost:3000/api/incidents/INC-1001 \
  -H "Content-Type: application/json" \
  -d '{"status":"EN_PROCESO","technician":"Carlos Méndez"}'
```

## Pruebas y calidad
- `npm test`: pruebas de integración de API, creación, validación, consulta, actualización, bitácora, estadísticas y 404.
- `npm run lint`: verificación sintáctica de archivos JavaScript.
- `npm run check`: ejecuta ambas verificaciones.

## Estructura
```text
incident-hub/
├── backend/                 # API REST y almacenamiento
├── frontend/                # Interfaz adaptable
├── tests/                   # Pruebas de integración
├── docs/                    # Arquitectura, seguridad, deuda, release y backlog
├── .github/workflows/ci.yml # CI complementario
├── azure-pipelines.yml      # Pipeline Azure DevOps
├── package.json
└── README.md
```

## DevOps: qué está incluido y qué falta hacer en las plataformas
Incluye workflow de GitHub Actions, pipeline de Azure DevOps, guía de ramas/PR, propuesta de backlog (2 Epics, 4 Features, 8 Stories, 16 Tasks), registro de deuda técnica, revisión de seguridad/dependencias y estrategia de release.

**Importante:** un ZIP no puede crear por sí solo las URL del proyecto, Work Items, seis PR reales, revisiones, un agente autohospedado, ejecuciones fallidas/exitosas ni aprobaciones de release. Esas evidencias obligatorias deben completarse en las cuentas reales de Azure DevOps y GitHub. La guía `docs/BRANCHING.md` explica el flujo; `docs/PLAN_AZURE_BOARDS.md` contiene el backlog inicial sugerido.