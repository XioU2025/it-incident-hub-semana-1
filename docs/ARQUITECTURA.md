# Arquitectura

## Componentes
- **Frontend:** HTML semántico, CSS adaptable y JavaScript sin framework. Se sirve desde el backend para evitar configuración CORS y errores de compilación del cliente.
- **API REST:** servidor HTTP nativo de Node.js, con validación de entrada y respuestas JSON.
- **Persistencia:** archivo JSON local en `backend/data/incidents.json`, creado automáticamente al iniciar. Es adecuado para una demostración académica; para producción se recomienda PostgreSQL.
- **Pruebas:** `node:test` y `fetch` contra un servidor real en puerto efímero.

## Flujo
Navegador → interfaz web → API REST → validación → almacenamiento JSON → respuesta HTTP.

## Decisiones
Se eligió Node.js sin dependencias de ejecución para reducir instalación, superficie de ataque y problemas de compatibilidad. El proyecto funciona con Node.js 20 o posterior. El dashboard presenta métricas calculadas desde los datos persistidos.
