# Backlog sugerido para Azure Boards

Crear estos elementos en Azure Boards y asignar personas, prioridad, estimación y estado real. Los IDs no se inventan aquí: una vez creados, agregar sus IDs a ramas, commits y PR.

## Epics (2)
- E1: Gestión del ciclo de vida de incidentes
- E2: Entrega continua, calidad y seguridad

## Features (4)
- F1: Registro y consulta de incidentes (E1)
- F2: Asignación, estados y bitácora (E1)
- F3: Dashboard y filtros (E1)
- F4: Automatización DevOps y release (E2)

## User Stories (8)
1. Como usuario, quiero registrar un incidente con los datos requeridos.
2. Como usuario, quiero consultar los incidentes registrados.
3. Como soporte, quiero asignar un técnico responsable.
4. Como soporte, quiero cambiar el estado de un incidente.
5. Como soporte, quiero registrar comentarios en la bitácora.
6. Como coordinador, quiero filtrar incidentes por estado, prioridad, categoría y técnico.
7. Como coordinador, quiero consultar indicadores de incidentes.
8. Como equipo DevOps, quiero validar, probar y empaquetar cambios automáticamente.

## Tasks (16)
1. Crear estructura del backend.
2. Implementar almacenamiento inicial y persistencia.
3. Implementar endpoint de creación.
4. Implementar endpoint de listado y filtros.
5. Validar payloads y errores HTTP.
6. Implementar actualización de estado.
7. Implementar asignación de técnicos.
8. Implementar bitácora de comentarios.
9. Implementar tarjetas de indicadores.
10. Implementar distribución por categoría.
11. Implementar distribución por técnico.
12. Crear interfaz de registro.
13. Crear pruebas de API.
14. Configurar GitHub Actions.
15. Configurar Azure Pipelines y publicación de artefacto.
16. Documentar release, seguridad y deuda técnica.

El backlog debe reflejar el trabajo real y el avance observado. Las tareas de CI deben probarse en el proyecto remoto para registrar resultados reales.
