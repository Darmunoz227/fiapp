# Implementation Plan: Ventas / POS (venta de un solo ítem)

**Branch**: `004-ventas-pos` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-ventas-pos/spec.md`

## Summary

Add single-item sales (CONTADO or FIADO) to FiApp. A sale records an immutable `venta` row with frozen snapshots (precio cobrado, costo unitario al momento de la venta, ganancia), creates a VENTA inventory movement that reduces derived stock, and — for FIADO — creates a client debt transaction. All writes of a sale are wrapped in a reusable atomic transaction primitive so they either all apply or none do. This also pays down Decision 025 (the COMPRA cost-update + movement-insert can adopt the same primitive later). The immutable movement log remains the source of truth for stock; the `ventas` table is a first-class sales record, not a stock source.

## Technical Context

**Language/Version**: TypeScript 5.9 on Angular 20
**Primary Dependencies**: Ionic 8, Capacitor 8, `@capacitor-community/sqlite`
**Storage**: Local SQLite (`SQLiteDBConnection`) with in-memory web mock arrays
**Testing**: Jasmine/Karma via `npm test`, Angular build via `npm run build`
**Constraints**: Offline-first, TypeScript strict, standalone components, no mutable stock, cost frozen per sale (Constitution III), atomic multi-write

## Schema Migration Strategy

- Bump `SCHEMA_VERSION` from 3 to 4.
- Add a `ventas` table via `crearTablasSiFaltan()` using `CREATE TABLE IF NOT EXISTS` (idempotent; covers fresh installs AND existing v3 devices, exactly as the inventory tables were added in Feature #2).
- `ventas` columns:
  - `id TEXT PRIMARY KEY NOT NULL`
  - `producto_id TEXT NOT NULL`
  - `cantidad INTEGER NOT NULL`
  - `precio_venta REAL NOT NULL`        (frozen snapshot of price charged)
  - `costo_unitario REAL NOT NULL`      (frozen snapshot = product costo_promedio at sale time)
  - `ganancia REAL NOT NULL`            (frozen = (precio_venta - costo_unitario) * cantidad)
  - `tipo_pago TEXT NOT NULL`           ('CONTADO' | 'FIADO')
  - `cliente_id TEXT DEFAULT NULL`      (only for FIADO)
  - `fecha INTEGER NOT NULL`
  - standard metadata: `created_at, updated_at, deleted_at, store_id, created_by` (all DEFAULT NULL)
  - `FOREIGN KEY (producto_id) REFERENCES productos(id)`
- Add index `ventas_producto_id_idx` (future reportes will query by product).
- No ALTER needed; migrarEsquemaSiNecesario stays idempotent and unchanged for v3→v4 (new table only).
- Add `mockWebVentas: Venta[] = []` for the web path.

## The Atomic Transaction Primitive (centerpiece)

Add a reusable helper:

```
private async ejecutarEnTransaccion<T>(operacion: () => Promise<T>): Promise<T>
```

- **Web platform**: take a shallow snapshot of the mock arrays that the operation may touch
  (mockWebVentas, mockWebMovimInventario, mockWebTransacciones, mockWebProductos). Run
  `operacion()`. On success, return its result. On throw, RESTORE the arrays from the
  snapshot and rethrow. (Simulated atomicity for the dev/test path.)
- **Native platform**: `await this.db.beginTransaction();` run `operacion()`;
  `await this.db.commitTransaction();` on throw → `await this.db.rollbackTransaction();`
  then rethrow. Ensure `this.isInitialized` before starting.

Design notes:
- The helper wraps EXISTING methods (crearMovimiento, crearTransaccion, and a new
  insertVenta) called INSIDE the operation. Those methods keep their own web/native
  branching; the primitive only manages the transaction boundary + rollback.
- Guard-before-write still holds: crearMovimiento throws on negative stock BEFORE
  persisting, so an over-stock sale aborts the transaction with nothing applied.

## Data Layer (database.service.ts)

- `mockWebVentas: Venta[] = []`
- Schema: bump to 4, add `ventas` table + index in `crearTablasSiFaltan()`.
- `private insertVenta(venta: Venta): Promise<void>` — web push / native INSERT (no guard;
  the guard is the movement's stock check).
- `ejecutarEnTransaccion<T>(operacion)` — the primitive above.
- `registrarVenta(venta: Venta, movimiento: MovimInventario, transaccionFiado?: Transaccion): Promise<void>`
  - Runs inside `ejecutarEnTransaccion`:
    1. `await this.crearMovimiento(movimiento)` (VENTA; stock guard fires here)
    2. `await this.insertVenta(venta)`
    3. if `venta.tipo_pago === 'FIADO'` → `await this.crearTransaccion(transaccionFiado!)`
  - The caller (UI/service) computes the frozen snapshot (precio, costo_promedio-at-sale,
    ganancia) BEFORE calling and passes fully-formed objects. registrarVenta does NOT
    recompute cost and does NOT modify costo_promedio (FR-011).
- `obtenerVentas(): Promise<Venta[]>` (optional read for confirmation/US3; filter deleted).

## UI Layer (new feature: features/ventas)

- New standalone page `ventas.page` (+ route `ventas` via loadComponent).
- Flow: pick product (from obtenerProductos) → show default precio_venta (editable) →
  quantity → tipo de pago (CONTADO/FIADO) → if FIADO, pick existing client (obtenerClientes).
- On "Registrar venta":
  - validate cantidad > 0, precio > 0, and (FIADO ⇒ cliente selected).
  - compute frozen snapshot: costo_unitario = producto.costo_promedio (current);
    ganancia = (precio - costo_unitario) * cantidad.
  - build Venta + VENTA MovimInventario (+ fiado Transaccion if FIADO).
  - call dbService.registrarVenta(...) inside try/catch.
  - on success: toast with the ganancia; reset form.
  - on error (stock guard / rollback): danger toast; nothing persisted.
- Show the resulting ganancia (US3).

## New model

- `src/app/core/models/venta.model.ts`:
  `export type TipoPago = 'CONTADO' | 'FIADO';`
  `export interface Venta { id; producto_id; cantidad; precio_venta; costo_unitario; ganancia; tipo_pago: TipoPago; cliente_id?: string | null; fecha; + metadata nullable fields }`

## Explicitly NOT Touched

- `calcularStockDerivado`, `esStockBajo`, `calcularCostoPromedioPonderado` (pure helpers) — unchanged.
- `costo_promedio` is never modified by a sale (FR-011).
- No multi-item cart, no inline client creation, no reportes, no returns/void.

## Constitution Check

- Stack locked (Angular standalone + Ionic + Capacitor SQLite). ✅
- Stock remains derived from the immutable movement log; `ventas` is a record, not a stock source. ✅
- Cost frozen per sale; historical ganancia immutable (Principle III). ✅
- Offline-first; all writes local. ✅
- No physical deletes (ventas carries deleted_at for future soft-delete/returns). ✅
- Multi-write integrity enforced via the transaction primitive. ✅

## Project Structure

```text
specs/004-ventas-pos/            spec.md, plan.md, tasks.md
src/app/core/models/venta.model.ts
src/app/core/database/database.service.ts        # schema v4, ventas table, insertVenta, ejecutarEnTransaccion, registrarVenta, obtenerVentas, mockWebVentas
src/app/core/database/database.service.spec.ts   # transaction primitive + registrarVenta tests (incl. rollback)
src/app/features/ventas/ventas.page.ts/.html/.scss/.spec.ts
src/app/app.routes.ts            # add 'ventas' lazy route
```

## Complexity Tracking

The transaction primitive is the only notable complexity. It is justified by FR-009/FR-010 (atomic multi-write) and pays down Decision 025. The web-path rollback is a snapshot/restore simulation; the native path uses real SQLite transactions. The rollback failure-path test is mandatory (force the 2nd/3rd write to fail; assert no partial state).
