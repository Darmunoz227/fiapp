# Tasks - Feature 026 (Deuda tecnica auditoria)

- [ ] T001 - RED: en database.service.spec.ts, tests nuevos:
      - crearCliente sin created_at -> mockWebClientes tiene created_at number.
      - crearCliente con created_at explicito -> se respeta.
      - crearProducto sin created_at -> created_at number generado.
      - crearProducto con created_at explicito -> se respeta.
      Ejecutar y confirmar RED (hoy el mock no fija created_at generado).
- [ ] T002 - GREEN: reescribir crearCliente. Calcular const createdAt =
      cliente.created_at ?? Date.now(). INSERT con las 10 columnas de clientes.
      Usar createdAt en rama web y nativa. Suite verde.
- [ ] T003 - GREEN: reescribir crearProducto. Mismo patron, INSERT con las 11
      columnas de productos. Suite verde, sin regresiones.
- [ ] T004 - Gate: suite completa TOTAL SUCCESS.
- [ ] T005 - Device test Android: crear cliente y producto nuevos, exportar
      respaldo JSON, confirmar created_at con timestamp en los nuevos y null
      en registros viejos preexistentes.
- [ ] T006 - Redactar Decision 048 en docs/DECISIONS.md.
- [ ] T006b - Sincronizar docs/PROJECT_CONTEXT.md (Feature #26, 48 decisions).
- [ ] T007 - Commit final de codigo + docs.
- [ ] T008 - Merge --no-ff a main + gate post-merge.
