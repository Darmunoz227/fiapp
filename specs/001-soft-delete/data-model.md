# Data Model: Borrado seguro y recuperable (soft-delete)

## Entities

### Cliente
Represents a customer record visible in the app.

**Key fields**
- `id`
- `nombre`
- `telefono`
- `habeas_data_flag`
- `fecha_creacion`
- `created_at`
- `updated_at`
- `deleted_at`
- `store_id`
- `created_by`

**Notes**
- A cliente is considered active only when `deleted_at IS NULL`.
- Cliente deletion is logical only; no physical delete.
- Existing installations must be migrated with `ALTER TABLE` so the table gains
	`created_at`, `updated_at`, `deleted_at`, `store_id`, and `created_by` without
	recreating the table.
- New metadata columns are nullable and may use safe defaults for legacy rows so
	the migration does not break installed devices.
- Within this feature's scope, `created_at` and `updated_at` may remain `NULL`
  on existing rows; they will be populated when the sync feature is implemented.

### Transaccion
Represents a debt or payment movement associated with a cliente.

**Key fields**
- `id`
- `cliente_id`
- `tipo`
- `monto`
- `concepto`
- `fecha`
- `created_at`
- `updated_at`
- `deleted_at`
- `store_id`
- `created_by`

**Notes**
- Transacciones are soft-deleted and excluded from balances when `deleted_at` is set.
- Undo restores the tombstone state in the current context only.
- Existing installations must be migrated with `ALTER TABLE` so the table gains
	`created_at`, `updated_at`, `deleted_at`, `store_id`, and `created_by` without
	recreating the table.
- New metadata columns are nullable and may use safe defaults for legacy rows so
	the migration does not break installed devices.
- Within this feature's scope, `created_at` and `updated_at` may remain `NULL`
  on existing rows; they will be populated when the sync feature is implemented.

### Deuda Cliente
Derived view of a cliente's current balance.

**Derived from**
- Sum of active transacciones: `fiado` adds, `abono` subtracts.

**Notes**
- This is not a stored source of truth.
- A cliente can be deleted only when this derived value is `0`.

## Relationships

- A `Cliente` has many `Transaccion` records.
- Soft-deleted `Cliente` rows should no longer appear in active lists.
- Soft-deleted `Transaccion` rows should no longer participate in balance calculations.

## State Changes

### Soft-delete Cliente
- Set `deleted_at`
- Keep row intact for undo during current context
- Remove from active lists and freemium counts

### Soft-delete Transaccion
- Set `deleted_at`
- Remove from active transaction views and derived balance

### Undo
- Clear `deleted_at` for the target record if the undo window is still active in the UI context

## Migration Notes

- The app ships to devices that may already contain the old schema without the
	tombstone and audit columns.
- Migration must be version-gated and executed once per device using the local
	database version or schema flag.
- The migration path should use `ALTER TABLE` on `clientes` and `transacciones`
	rather than `CREATE TABLE IF NOT EXISTS`, because the latter does not update
	existing tables.
- `PRAGMA foreign_keys = ON` is a connection requirement for the data layer and
	must be enabled by the database service during initialization.
