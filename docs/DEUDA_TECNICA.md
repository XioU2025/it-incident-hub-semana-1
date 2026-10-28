# Registro de deuda técnica

| ID | Deuda / riesgo | Impacto | Prioridad | Acción recomendada |
|---|---|---|---|---|
| DT-01 | Persistencia en archivo JSON, no BD transaccional | Concurrencia y escalabilidad limitadas | Alta | Migrar a PostgreSQL con migraciones |
| DT-02 | Autenticación y autorización no implementadas | Cualquier usuario con acceso puede modificar datos | Alta | Añadir identidad, roles y auditoría |
| DT-03 | No existe paginación en listado | Respuestas crecen con el volumen | Media | Añadir cursor/limit y ordenamiento |
| DT-04 | Catálogos de técnicos definidos en código | Cambios requieren despliegue | Media | Administrar catálogo desde base de datos |
| DT-05 | Sin observabilidad centralizada | Diagnóstico de fallos limitado | Media | Añadir logs estructurados, métricas y alertas |
| DT-06 | Sin protección CSRF dedicada | Riesgo si se añade autenticación basada en cookies | Media | Definir estrategia CSRF al incorporar sesiones |

## Resolución propuesta y trazabilidad
- DT-03: antes de implementar paginación, el conjunto de datos es pequeño y el filtro funciona en servidor. Registrar una Story/Task para paginación antes de uso real.
- DT-05: el endpoint `/api/health` ya ofrece una comprobación básica; registrar una mejora para logging estructurado.
- No declarar deudas como resueltas en Azure Boards hasta que exista rama, commit, PR y validación vinculados al Work Item.
