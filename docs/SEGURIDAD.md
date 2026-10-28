# Seguridad y validación

- No se almacenan tokens, contraseñas ni credenciales en el repositorio.
- Copie `.env.example` a `.env` si necesita personalizar `PORT`; `.env` está excluido por Git.
- El servidor valida campos obligatorios, longitud, enumeraciones y propiedades desconocidas.
- Los valores dinámicos que se muestran en la interfaz se escapan antes de insertarse en HTML.
- El servidor limita los cuerpos de solicitud a 1 MB y añade `X-Content-Type-Options: nosniff` y una política CSP.
- La eliminación está deshabilitada para conservar la trazabilidad; cierre los incidentes con estado `CERRADO`.
- Este proyecto académico no incorpora autenticación/autorización. No exponerlo a Internet ni usar datos personales reales sin implementar controles adecuados.
- CI ejecuta pruebas y validaciones sintácticas. Para el proyecto de curso, ejecutar también un escáner de dependencias/SCA en Azure DevOps y adjuntar la salida real; este proyecto no usa dependencias de ejecución de terceros.
