# Feature 008 - Fix native transaction nesting in db.run

## Problem

On a real device, registering a COMPRA fails with:
  Error beginTransaction: failed rc: 1 message: cannot start a transaction within a transaction

Xcode logs show our beginTransaction succeeds, the two reads succeed, and the failure happens on db.run.

## Root cause (verified in the plugin typings)

@capacitor-community/sqlite:
  run(statement, values?, transaction?, returnMode?, isSQL92?)

The transaction parameter DEFAULTS TO TRUE. Every db.run opens its own transaction. When called inside our explicit beginTransaction, SQLite rejects the nesting.

This is why crearCliente and crearProducto work: their db.run calls never run inside one of our transactions.

## Scope of the damage (worse than it first appears)

This bug was NOT introduced by Feature 006. registrarVenta (Feature 004) already wrapped crearMovimiento and insertVenta inside ejecutarEnTransaccion, so EVERY sale has been broken on device since Feature 004. Feature 006 only extended the breakage to COMPRA/MERMA/AJUSTE from the inventory UI.

Current device state: the app can create clients and products. Sales and inventory movements are unusable.

## Why no test caught it

Karma stubs Capacitor.getPlatform() to web, so ejecutarEnTransaccion always takes the in-memory snapshot path and db.run is NEVER called. 96 passing tests say nothing about this. This is the exact coverage limit recorded in Decision 026, now materialized.

## Call sites (verified by grep)

Always inside a transaction - must pass transaction: false
  line 341 crearMovimientoInterno
  line 406 insertVenta
  line 600 actualizarCostoPromedioProducto

Always standalone - keep current behavior
  228 crearCliente, 279 crearProducto, 500/513 movimiento soft-delete/restore,
  526/539 cliente, 563/576 transaccion, 626/630 backfillMontosVentas

Ambiguous - called from BOTH contexts
  crearTransaccion: database.service.ts:415 (inside registrarVenta) and
  cliente-detalle.page.ts:133 (manual fiado, no transaction)

## Solution (approved: option B)

A single private wrapper decides the flag:

    private async ejecutarRun(sql: string, values: any[], dentroDeTx = false) {
      return this.db.run(sql, values, !dentroDeTx);
    }

Every db.run in the service goes through it. crearTransaccion gains an optional
parameter (dentroDeTx = false) so the caller declares its context explicitly.
registrarVenta passes true; the UI call site is unchanged.

No hidden state, no runtime detection of an active transaction. Same discipline
as Decision 026: declare the context, do not guess it.

## In scope

- ejecutarRun wrapper; all db.run calls routed through it.
- transaction: false for the three always-inside-tx call sites.
- Optional dentroDeTx parameter on crearTransaccion; registrarVenta passes true.
- On-device verification of COMPRA, CONTADO sale, FIADO sale, MIXTO sale.

## Out of scope (note as future, do NOT implement)

- Migrating to executeSet instead of explicit beginTransaction.
- Making ejecutarEnTransaccion public or reentrant.
- Any schema change.
- Touching db.execute calls (table creation and migration run before any of our transactions).
- Adding a native-platform test harness.

## Acceptance criteria

- AC1: A COMPRA registers successfully on device.
- AC2: A CONTADO sale registers on device: stock drops, venta persisted.
- AC3: A FIADO sale registers on device and creates the client debt.
- AC4: A MIXTO sale registers on device with both amounts and a debt for the balance only.
- AC5: Manual fiado from cliente-detalle still works (standalone path unaffected).
- AC6: A failed sale still rolls back on device - nothing persists.
- AC7: The existing 96 tests remain green.

## Verification reality check

AC1 through AC6 CANNOT be verified by the test suite. They require a device.
Green tests are necessary but not sufficient for this feature.
