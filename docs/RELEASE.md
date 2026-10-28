# Estrategia de release

## Ambientes
1. **Desarrollo:** ejecución local y pruebas automatizadas.
2. **Validación:** artefacto producido por CI; ejecutar pruebas de humo y revisión manual.
3. **Producción/demo:** promover exactamente el artefacto aprobado, con aprobación manual del responsable.

## Versionado
Se usa Semantic Versioning `MAJOR.MINOR.PATCH`. `v1.0.0` identifica la primera versión funcional de demostración. Las versiones siguientes deben corresponder a cambios integrados y a notas de release reales.

## Checklist de salida
- [ ] PR de release aprobado y enlazado a Work Items.
- [ ] Pipeline de CI exitoso y artefacto descargable.
- [ ] Pruebas automatizadas y prueba de humo completadas.
- [ ] Revisión de seguridad y dependencias documentada.
- [ ] Variables/secretos configurados fuera del repositorio.
- [ ] Aprobación del ambiente de validación y evidencia de despliegue.
- [ ] Etiqueta Git y notas de release publicadas.

## Limitación importante
El repositorio inicial contiene el código y las definiciones de pipeline, pero no puede fabricar evidencia real de aprobaciones, agentes autohospedados, PR, fallos de pipeline o releases remotos. Configúrelos en las plataformas correspondientes y documente los resultados observados.
