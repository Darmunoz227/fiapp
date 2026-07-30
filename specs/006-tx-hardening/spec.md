# Feature 006 — Transaction-atomicity hardening of crearMovimiento

## Problem

`crearMovimiento` (database.service.ts:275) performs TWO sequential writes for
COMPRA movements, with no transaction boundary:

1. WRITE `actualizarCostoPromedioProducto()` — updates producto.costo_promedio
2. WRITE `INSERT INTO movim_inventario` — persists the movement

If step 2 fails, step 1 is already committed. Result:

- producto.costo_promedio reflects a purchase that does not exist in the log
- derived stock is unchanged (the COMPRA never happened)
- the derived value is permanently desynchronized from the immutable log

### Why this is severe

- Every future sale freezes `costo_unitario` from `producto.costo_promedio`.
  A poisoned cost silently corrupts ganancia on ALL subsequent sales.
- There is no UI path to repair it. AJUSTE corrects stock, never costo_promedio.
- It violates Constitution: derived business values must not drift from the log.

## Constraint discovered (verified in code)

`registrarVenta` (line 397) already opens a transaction via
`ejecutarEnTransaccion` and calls `crearMovimiento` INSIDE it (line 398).

Naively adding beginTransaction() inside crearMovimiento would break sales with
"cannot start a transaction within a transaction".

Call sites verified:
- database.service.ts:398          -> inside a transaction
- inventory-movement.page.ts:135   -> no transaction
- inventory-movement.page.ts:180   -> no transaction

## Solution — method separation

    private crearMovimientoInterno(mov)  // current body, assumes caller owns tx
    async  crearMovimiento(mov)          // public entry, wraps in ejecutarEnTransaccion

`registrarVenta` calls the internal version. UI call sites are unchanged.
Nesting becomes structurally impossible (no runtime detection needed).

Side benefit: the stock-guard reads move inside the transaction, giving
read-write consistency for the negative-stock check.

Web platform: `ejecutarEnTransaccion` already snapshots and restores
mockWebProductos and mockWebMovimInventario, so rollback behavior is
equivalent on web with no extra code.

## In scope

- Extract current body into `crearMovimientoInterno` (private, no tx).
- Public `crearMovimiento` wraps it in `ejecutarEnTransaccion`.
- Point `registrarVenta` (line 398) at the internal version.
- Failure-path test: COMPRA fails at the movement insert -> costo_promedio unchanged.
- Full suite stays green (no regression in Ventas).

## Out of scope (note as future, do NOT implement)

- Changing the weighted-average cost formula.
- Reordering writes (INSERT before UPDATE) — the transaction makes it unnecessary.
- Touching UI, Reportes, or Ventas beyond line 398.
- Pago parcial / abono (that is Feature 007).
- Making the transaction primitive public or exportable.
- SAVEPOINT / reentrant-transaction machinery.

## Acceptance criteria

- AC1: COMPRA that fails at the movement insert leaves costo_promedio unchanged.
- AC2: COMPRA that fails at the movement insert persists no movement.
- AC3: Successful COMPRA still updates cost and persists the movement.
- AC4: registrarVenta works unchanged; no nested-transaction error.
- AC5: Existing 80 tests remain green.
