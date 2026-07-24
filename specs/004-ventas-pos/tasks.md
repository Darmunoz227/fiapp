# Tasks: Ventas / POS (venta de un solo ítem)

**Input**: Design documents from `/specs/004-ventas-pos/`

**Prerequisites**: spec.md (required), plan.md (required)

**Tests**: Test-first for the data layer. The transaction rollback test is mandatory and is the crown jewel. Confirm green BEFORE each commit.

**Organization**: Grouped by layer/user story. The atomic transaction primitive is the riskiest piece and is built first, test-first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (contado), US2 (fiado), US3 (ganancia)

---

## Phase 1: Foundation — schema + model (Blocking)

- [ ] T001 Bump SCHEMA_VERSION 3→4 and add the `ventas` table (+ `ventas_producto_id_idx`) in `crearTablasSiFaltan()` using CREATE TABLE IF NOT EXISTS, with the frozen-snapshot columns and standard metadata, in `src/app/core/database/database.service.ts`. Add `mockWebVentas: Venta[] = []`.
- [ ] T002 [P] Add `src/app/core/models/venta.model.ts` with `TipoPago = 'CONTADO' | 'FIADO'` and the `Venta` interface (id, producto_id, cantidad, precio_venta, costo_unitario, ganancia, tipo_pago, cliente_id?, fecha, metadata).

**Checkpoint**: Schema v4 + model compile.

---

## Phase 2: Atomic transaction primitive (Blocking, test-first) — CROWN JEWEL

- [ ] T003 Add data-layer tests (test-first) in `src/app/core/database/database.service.spec.ts` for the transaction primitive + registrarVenta. These target methods that do NOT exist yet (should fail):
  - CONTADO sale: registrarVenta creates a VENTA movement (stock drops), inserts a `ventas` row with correct frozen precio/costo/ganancia, and creates NO client debt.
  - FIADO sale: registrarVenta atomically creates the `ventas` row + VENTA movement + a fiado Transaccion (client debt).
  - ROLLBACK (mandatory): when one of the writes fails (e.g., movement guard throws on over-stock, OR force a failure), assert NOTHING persisted — no `ventas` row, no movement, no debt.
  - Over-stock sale: registrarVenta rejects and persists nothing (reuses the negative-stock guard).
  - Ganancia immutability: after a sale, a later COMPRA that changes costo_promedio does NOT change the stored `ventas.ganancia`.
- [ ] T004 Implement in `database.service.ts` to make T003 pass:
  - `ejecutarEnTransaccion<T>(operacion)` (web snapshot/restore of mockWebVentas/Movim/Transacciones/Productos; native beginTransaction/commit/rollback).
  - `insertVenta(venta)` (web push / native INSERT; no guard).
  - `registrarVenta(venta, movimiento, transaccionFiado?)` running the 3 writes inside `ejecutarEnTransaccion`.
  - `obtenerVentas()` (optional read; filter deleted_at).
  - Do NOT modify costo_promedio on sale (FR-011).

**Checkpoint**: Transaction primitive + registrarVenta green, including the rollback test.

---

## Phase 3: US1 Contado + US3 Ganancia — UI (Priority: P1/P2)

- [ ] T005 Create `src/app/features/ventas/ventas.page.ts/.html/.scss` (standalone) and add a lazy `ventas` route in `src/app/app.routes.ts`. Flow: pick product (obtenerProductos) → editable price (default precio_venta) → cantidad → tipo de pago. For CONTADO: compute frozen snapshot, build Venta + VENTA movimiento, call registrarVenta inside try/catch, success toast shows ganancia (US3), reset form; error → danger toast.
- [ ] T006 [P] Add validation: cantidad > 0, precio > 0; show derived stock; block over-stock at UI level (service also guards). PESO quantity in grams.

**Checkpoint**: A CONTADO sale works end-to-end and shows ganancia.

---

## Phase 4: US2 Fiado — client selection + debt (Priority: P1)

- [ ] T007 [US2] Add tipo de pago FIADO to the ventas page: when FIADO, show a client picker (obtenerClientes) and require a selected client. Build the fiado Transaccion (client debt) and pass it to registrarVenta so the sale is atomic {venta + movimiento + deuda}.
- [ ] T008 [US2] Validation: FIADO requires a selected client (block with message otherwise).

**Checkpoint**: A FIADO sale atomically creates venta + movement + client debt.

---

## Phase 5: UI tests

- [ ] T009 [P] Add UI-flow tests in `src/app/features/ventas/ventas.page.spec.ts`:
  - CONTADO valid sale calls registrarVenta once with correct snapshot and no client.
  - FIADO without client selected does NOT call registrarVenta and shows a danger toast.
  - FIADO with client calls registrarVenta once with a fiado transaccion.
  - invalid cantidad/precio blocks the call.

---

## Phase 6: Polish & Validation

- [ ] T010 Final validation: `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`. Confirm all tests pass (existing 63 + new).

---

## Dependencies & Execution Order

- **Phase 1 (T001-T002)**: foundation, blocks all.
- **Phase 2 (T003-T004)**: transaction primitive, blocks all UI; test-first, rollback mandatory.
- **Phase 3 (T005-T006)**: CONTADO UI + ganancia. Depends on Phase 2.
- **Phase 4 (T007-T008)**: FIADO. Depends on Phase 3.
- **Phase 5 (T009)**: UI tests.
- **Phase 6 (T010)**: final.

## Notes

- Commit in small green logical groups: T001+T002 (foundation); T003+T004 (primitive + tests, must be green incl. rollback); T005+T006; T007+T008; T009.
- Confirm green BEFORE each commit.
- The rollback test (T003) is the crown jewel — it proves atomicity (FR-009).
- Reuses crearMovimiento (stock guard), crearTransaccion (fiado), obtenerClientes/obtenerProductos.
- No cart, no inline client creation, no reportes, no returns/void (all out of scope).
