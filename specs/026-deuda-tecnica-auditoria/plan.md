# Plan - Feature 026 (Deuda tecnica auditoria)

## crearCliente - cambios

### Rama nativa (INSERT)
SQL nuevo con las 10 columnas:
INSERT INTO clientes (id, nombre, telefono, habeas_data_flag, fecha_creacion,
  created_at, updated_at, deleted_at, store_id, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

values:
  cliente.id
  cliente.nombre
  cliente.telefono
  cliente.habeas_data_flag ? 1 : 0
  cliente.fecha_creacion
  cliente.created_at ?? Date.now()   <- generado si falta (recomendacion A)
  cliente.updated_at ?? null
  cliente.deleted_at ?? null
  cliente.store_id ?? null
  cliente.created_by ?? null

### Rama web (mock)
Empujar el cliente con created_at resuelto:
this.mockWebClientes.push({ ...cliente,
  created_at: cliente.created_at ?? <mismo valor generado>,
  deleted_at: cliente.deleted_at ?? null });
Para que web y nativo coincidan, calcular created_at UNA vez al inicio del
metodo (const createdAt = cliente.created_at ?? Date.now();) y usar esa misma
variable en ambas ramas.

## crearProducto - cambios

### Rama nativa (INSERT)
SQL nuevo con las 11 columnas:
INSERT INTO productos (id, nombre, precio_venta, tipo_venta, minimo_stock,
  costo_promedio, created_at, updated_at, deleted_at, store_id, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

values:
  producto.id, nombre, precio_venta, tipo_venta, minimo_stock, costo_promedio,
  producto.created_at ?? Date.now(), updated_at ?? null, deleted_at ?? null,
  store_id ?? null, created_by ?? null

### Rama web (mock)
Mismo patron: const createdAt = producto.created_at ?? Date.now(); usar esa
variable en el push del mock y en el INSERT.

## Tests (TDD, RED antes de GREEN)
En database.service.spec.ts (que corre en web con los mocks):
- RED nuevos tests:
  1. crearCliente sin created_at: el cliente en mockWebClientes queda con
     created_at que es un number (Date.now generado), no null/undefined.
  2. crearCliente con created_at explicito (ej. 1700000000000): se respeta
     ese valor, no se sobrescribe.
  3. crearProducto sin created_at: queda con created_at number generado.
  4. crearProducto con created_at explicito: se respeta.
- Nota: como los tests unitarios corren en web (rama mock), verifican el
  comportamiento del mock. El INSERT nativo con todas las columnas se
  verifica por inspeccion de codigo + device test (crear registro real y
  ver created_at no-null en el respaldo exportado).
- Verificar que los tests existentes de crearCliente/crearProducto y de
  reemplazarTodo siguen verdes (no-regresion).

## Riesgos
- Bajo: replica un patron ya probado (Decision 032). Sin schema, sin
  migracion. Las columnas ya existen DEFAULT NULL.
- Atencion: usar la MISMA variable createdAt en la rama web y en la nativa
  para que no diverjan (el bug que este feature justamente busca cerrar).
- reemplazarTodo (import de respaldo) hace su propio INSERT con todas las
  columnas ya (lo vimos en el grep historico); NO se toca, solo se alinea
  crearCliente/crearProducto que eran los rezagados.

## Pasos de ejecucion
T001 - RED: tests de created_at generado/respetado para crearCliente y
       crearProducto en database.service.spec.ts. Confirmar fallo.
T002 - GREEN: reescribir crearCliente (INSERT 10 columnas + createdAt
       compartido web/nativo). Suite verde.
T003 - GREEN: reescribir crearProducto (INSERT 11 columnas + createdAt
       compartido web/nativo). Suite verde.
T004 - Gate: suite completa TOTAL SUCCESS.
T005 - Device test Android: crear cliente y producto, exportar respaldo,
       confirmar created_at con timestamp en los nuevos y null en los viejos.
T006 - Decision 048 + PROJECT_CONTEXT sync.
T007 - Merge --no-ff a main.
