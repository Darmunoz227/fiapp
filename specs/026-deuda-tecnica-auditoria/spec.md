# Feature 026 - Deuda tecnica: crearCliente y crearProducto escriben todas sus columnas

## Contexto
crearCliente escribe solo 5 de 10 columnas de la tabla clientes; crearProducto
escribe solo 6 de 11 de la tabla productos. Las 5 columnas de auditoria que se
omiten en ambos son: created_at, updated_at, deleted_at, store_id, created_by.
Son el MISMO defecto que Decision 032 ya corrigio en crearTransaccion (que
silenciosamente descartaba cinco columnas tombstone).

## Por que importa ahora
- created_by es el campo natural para registrar quien creo el registro
  (Administrador vs Empleado): cimiento de la futura feature de roles.
- created_at / updated_at son la traza temporal. updated_at en particular es
  requisito tecnico de cualquier futura sincronizacion entre turnos con merge
  (resolver "cual version es mas reciente" es imposible sin este campo).
- Inconsistencia web vs nativo: en la rama web (mock) crearCliente/crearProducto
  conservan el objeto completo con spread, pero en la rama nativa el INSERT
  descarta las 5 columnas. Web y nativo divergen, el mismo tipo de trampa que
  rompio las ventas en Feature #8.

## Decision - alinear al patron de Decision 032
crearCliente y crearProducto se reescriben para que su INSERT nativo liste
TODAS las columnas de su tabla y su array de values pase cada campo de auditoria
con fallback (?? null), exactamente como crearTransaccion quedo tras Decision 032.

## Decision - created_at se genera automaticamente (recomendacion A)
Al crear un cliente o producto, si created_at no viene en el objeto se genera
Date.now() en el momento de la creacion. Esto activa la trazabilidad temporal
real (sabemos cuando se creo cada registro), objetivo central de pagar esta
deuda. Los otros cuatro campos (updated_at, deleted_at, store_id, created_by)
se pasan con ?? null por ahora: se llenaran cuando se construyan roles
(created_by) y edicion/borrado con timestamp (updated_at, deleted_at).

## Decision - alinear tambien la rama web
La rama web (mock) debe reflejar el mismo created_at generado, para que web y
nativo se comporten igual. El mock ya hace spread del objeto; se ajusta para
que el created_at generado quede tambien en el objeto mockeado.

## Alcance
- src/app/core/database/database.service.ts:
  - crearCliente: INSERT con las 10 columnas de clientes; generar created_at
    si falta; resto de auditoria con ?? null. Alinear el mock web.
  - crearProducto: INSERT con las 11 columnas de productos; generar created_at
    si falta; resto de auditoria con ?? null. Alinear el mock web.
- Los modelos Cliente y Producto ya tienen los campos opcionales de auditoria.

## Fuera de alcance
- NO se cambia el schema ni SCHEMA_VERSION: las 5 columnas de auditoria YA
  existen en ambas tablas (DEFAULT NULL). Solo se empiezan a escribir.
- NO se implementan roles todavia (created_by se deja en null por ahora).
- NO se toca updated_at en actualizarProducto en este feature; se limita a
  la creacion.
- NO se migran registros historicos existentes.
- NO se toca crearTransaccion (ya esta correcto desde Decision 032).

## Reuso de precedentes
- Decision 032: patron exacto de INSERT completo + values con ?? null.
- Date.now() ya se usa en el proyecto para timestamps.

## Acceptance criteria
AC-01. crearCliente ejecuta un INSERT que menciona las 10 columnas de clientes.
AC-02. crearProducto ejecuta un INSERT que menciona las 11 columnas de productos.
AC-03. Cliente creado sin created_at queda con created_at numerico generado.
AC-04. Producto creado sin created_at queda con created_at numerico generado.
AC-05. Si el objeto trae created_at explicito, se respeta (no se sobrescribe).
AC-06. updated_at, deleted_at, store_id, created_by se guardan null cuando no
       vienen, sin romper.
AC-07. El comportamiento observable de alta no cambia para el usuario.
AC-08. Sin regresiones: suite completa verde, incluidos tests de respaldo.

## Gate de pruebas
- TDD: RED antes de GREEN en database.service.spec.ts para crearCliente y
  crearProducto (columnas del INSERT y created_at generado).
- Suite completa TOTAL SUCCESS antes de cada commit de codigo.
- Toca SQLite nativo: verificacion BY HAND en Android. Crear cliente y
  producto nuevos, exportar respaldo JSON, confirmar que created_at trae
  timestamp (no null) en los nuevos, mientras los viejos siguen en null.
