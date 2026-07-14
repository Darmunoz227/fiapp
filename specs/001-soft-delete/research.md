# Research: Borrado seguro y recuperable (soft-delete)

## Decisions

### 1) Soft-delete con `deleted_at` como fuente de ocultamiento
Usar `deleted_at` en clientes y transacciones para ocultar registros sin perder historial. Esto permite deshacer inmediato en el contexto actual y mantiene compatibilidad con sincronización posterior.

### 2) Deshacer solo en memoria/UI del contexto actual
La especificación exige deshacer inmediato y temporal. No se diseña una papelera persistente ni recuperación tras cerrar la app. Esto reduce complejidad y evita introducir nuevos estados de almacenamiento.

### 3) Cliente con deuda activa bloquea borrado
Para esta feature, deuda activa se interpreta como saldo total mayor que cero. La validación puede calcularse a partir de transacciones vivas, sin agregar un nuevo campo de estado.

### 4) Las consultas deben excluir registros borrados
Los conteos freemium, listados y cargas de detalle deben usar filtros consistentes `deleted_at IS NULL` para evitar fugas de datos borrados.

### 5) El borrado lógico debe coexistir con la base actual
La base actual todavía usa `DELETE` físico y no tiene columnas de auditoría/tombstone. El plan asume una migración de esquema para agregar los metacampos necesarios y luego ajustar servicios y vistas.

## Open Questions Resolved by Spec Clarification

- Undo: inmediato y temporal, no persistente tras cerrar app.
- Debt rule: saldo total mayor que cero.
- Permissions: esta feature asume permiso equivalente a OWNER y no implementa autenticación ni roles.

## Risks

- Si no se migran consultas y contadores al filtro de `deleted_at`, los borrados seguirán apareciendo en listas o conteos.
- Si se mantiene `DELETE` físico en el servicio de base de datos, se perderá historial y el undo no podrá funcionar.
- Si los cálculos de saldo no excluyen transacciones borradas, el estado visible del cliente quedará inconsistente.
