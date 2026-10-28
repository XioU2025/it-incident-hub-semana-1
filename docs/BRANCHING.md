# Estrategia de ramas y pull requests

- `main`: versión estable y liberable.
- `develop`: integración de trabajo validado.
- `feature/AB#<id>-descripcion`: nueva funcionalidad.
- `fix/AB#<id>-descripcion`: corrección.
- `refactor/AB#<id>-descripcion`: mejora interna sin cambiar comportamiento.

## Flujo requerido
1. Crear o seleccionar el Work Item en Azure Boards.
2. Crear rama a partir de `develop` e incluir `AB#ID` en el nombre/commit.
3. Realizar cambios pequeños y commits convencionales (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
4. Abrir PR hacia `develop`, describir alcance, Work Items y evidencia de pruebas.
5. Solicitar revisión, resolver comentarios y confirmar que GitHub Actions y Azure Pipelines pasan.
6. Integrar a `main` mediante PR de release, etiquetar versión SemVer y publicar artefacto.

## Evidencia honesta
Este ZIP contiene plantillas de CI y documentación, pero no crea por sí solo un proyecto remoto, PR, revisiones, Work Items ni ejecuciones históricas. Esos elementos deben realizarse en las cuentas reales de Azure DevOps/GitHub y conservarse como evidencia verificable.
