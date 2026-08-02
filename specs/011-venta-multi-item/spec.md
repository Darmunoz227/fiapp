# Feature 011 - Multi-item sale

## Problem

A sale holds exactly ONE product. A customer buying three products forces the merchant to register three separate sales. This is the biggest daily-use friction reported in the backlog as P2.

## Approved product decisions

- D1 - The cart is editable before confirming: the merchant can REMOVE a line and EDIT its quantity. Scenarios covered: mistyped price, customer changing their mind, miscounted quantity.
- D2 - Insufficient stock blocks ONLY the offending line, never the whole sale. A stale inventory count must not cost the merchant an entire sale at the counter. The block MUST be visible before confirming; a line must never disappear silently.
- D3 - The same product MAY appear in more than one line, with different prices. Real case: two panelas at 3000 and a third at 2500 because it is broken. Lines are NOT auto-merged. Repeated lines must be visually distinguishable so it does not look like a bug.
- D4 - Single source of truth: per-product columns are REMOVED from ventas and live only in the new line table. Keeping them would recreate the ambiguity that motivated Decision 027.
- D5 - Migration strategy A1: rebuild the ventas table. SQLite cannot drop a NOT NULL constraint with ALTER TABLE, and agregarColumnaSiFalta only supports ADD COLUMN. Existing rows are PRESERVED and converted into one line each. Rejected: dropping the table, which is destructive and relies on the unverified claim that no installation contains sales.

## Current state (verified in code)

- src/app/core/database/database.service.ts holds the whole schema. SCHEMA_VERSION = 5 at line 26.
- ventas columns today: id, producto_id NOT NULL, cantidad NOT NULL, precio_venta NOT NULL, costo_unitario NOT NULL, ganancia NOT NULL, tipo_pago NOT NULL, monto_contado, monto_fiado, cliente_id, fecha NOT NULL, created_at, updated_at, deleted_at, store_id, created_by, FK to productos.
- registrarVenta(venta, movimiento, transaccionFiado?) at line 409, wrapped in ejecutarEnTransaccion.
- ejecutarRun(sql, values, dentroDeTx) already implements Decision 028.
- crearTablasSiFaltan runs ALWAYS, before the version check.
- migrarEsquemaSiNecesario is a flat idempotent list, not a version switch.

## Data model change

New table venta_items:

- id TEXT PRIMARY KEY NOT NULL
- venta_id TEXT NOT NULL REFERENCES ventas(id)
- producto_id TEXT NOT NULL REFERENCES productos(id)
- cantidad INTEGER NOT NULL (integer grams for PESO products)
- precio_venta REAL NOT NULL
- costo_unitario REAL NOT NULL (frozen at sale time)
- ganancia REAL NOT NULL
- created_at, updated_at, deleted_at, store_id, created_by
- Index on venta_id and on producto_id

Rebuilt ventas keeps ONLY sale-level data: id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha, created_at, updated_at, deleted_at, store_id, created_by.

Removed from ventas: producto_id, cantidad, precio_venta, costo_unitario, ganancia.

Schema version goes from 5 to 6.

## Migration v5 to v6

Inside a transaction:
1. Create venta_items if missing.
2. If ventas still has producto_id, create ventas_nueva with the reduced shape.
3. Copy sale-level columns from ventas into ventas_nueva.
4. For every row in ventas, insert ONE venta_items row carrying producto_id, cantidad, precio_venta, costo_unitario and ganancia. Generate the line id deterministically from the sale id so the step is idempotent.
5. Drop ventas, rename ventas_nueva to ventas, recreate indexes.
6. Set schema version to 6.

The migration MUST be idempotent and MUST be a no-op when ventas already has the reduced shape.

## Functional requirements

- FR1 - A sale holds one or more lines. Every line stores its own quantity, price, frozen unit cost and ganancia.
- FR2 - monto_contado and monto_fiado stay at SALE level. They are never split per line. Decision 027 stands.
- FR3 - tipo_pago remains a projection derived from the sale amounts via derivarTipoPago.
- FR4 - Every line produces exactly one VENTA movement in movim_inventario.
- FR5 - The whole sale is atomic: the sale row, all its lines, all its movements and the optional fiado transaction commit together or not at all. All writes use ejecutarRun with dentroDeTx set to true.
- FR6 - registrarVenta accepts a list of lines and a list of movements instead of a single pair.
- FR7 - The cart allows removing a line and editing its quantity before confirming.
- FR8 - A line whose quantity exceeds derived stock is flagged and blocked, showing the available quantity. The rest of the sale can still be confirmed.
- FR9 - The same product may appear in several lines; lines are never auto-merged.
- FR10 - Soft-deleting a sale soft-deletes its lines. No physical DELETE.
- FR11 - Reports derive totals and ganancia by summing lines, filtering deleted_at IS NULL.

## Acceptance criteria

- AC1 - Registering a sale with three different products creates one ventas row, three venta_items rows and three VENTA movements.
- AC2 - Derived stock for each of the three products decreases by exactly its line quantity.
- AC3 - A mixed payment on a three-line sale stores monto_contado and monto_fiado once, at sale level, and derivarTipoPago returns MIXTO.
- AC4 - Total ganancia of the sale equals the sum of its line ganancias.
- AC5 - If any write fails mid-sale, NOTHING is persisted: no sale, no lines, no movements, no fiado transaction.
- AC6 - A line exceeding available stock is visibly blocked with the available quantity shown, and the remaining lines can still be sold.
- AC7 - The same product added twice with different prices produces two distinct, visually distinguishable lines.
- AC8 - Removing a line and editing a quantity update the totals before confirming.
- AC9 - Upgrading a v5 database IN PLACE preserves every existing sale, converted into exactly one line each, with identical amounts and ganancia.
- AC10 - Running the migration twice leaves the database unchanged.
- AC11 - Verified BY HAND on iOS simulator AND Android emulator Pixel_8, including an in-place v5 to v6 upgrade over a database that already contains sales. The Karma suite never executes the native write path, so a green suite is a precondition and never evidence.

## Out of scope

- Integer-cents migration for money (P5). REAL stays, with the float tolerance of Decision 027.
- Later abonos against existing debt (P3).
- Editing or splitting a sale after it is confirmed.
- Discounts, taxes, barcode scanning.
- Merging duplicate lines.

## Risks

- R1 - Table rebuild is the most invasive migration in the project so far. Mitigation: wrap it in a transaction, make it idempotent, and verify an in-place upgrade on BOTH platforms with a database that actually contains sales.
- R2 - Removing ganancia and producto_id from ventas breaks every current consumer. The plan MUST enumerate them by grep before any edit.
- R3 - N lines multiply the writes inside one transaction. Every db.run must declare dentroDeTx explicitly per Decision 028.
