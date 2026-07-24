# Tasks: Soft-delete y restauración de movimientos de inventario

**Input**: Design documents from `/specs/003-soft-delete-movimientos/`

**Prerequisites**: spec.md (required), plan.md (required)

**Tests**: Include data-layer and UI-flow unit tests to keep each user story independently verifiable. Work test-first: write failing tests before implementation, confirm green before each commit.

**Organization**: Tasks grouped by layer and user story. This is a small feature that reuses the proven Feature #1 soft-delete/restore pattern and the existing `deleted_at` infrastructure; no schema migration or new entities.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Data Layer (Blocking Prerequisite)

**Purpose**: Soft-delete/restore persistence + COMPRA guard. All UI depends on this.

- [ ] T001 [US1] Add data-layer tests (test-first) in `src/app/core/database/database.service.spec.ts`:
  - soft-delete a VENTA → excluded from `obtenerMovimientosPorProducto`; derived stock recomputes (movement no longer counted).
  - soft-delete a MERMA → excluded; derived stock recomputes.
  - soft-delete an AJUSTE → excluded; derived stock recomputes (delta no longer applied).
  - soft-delete a COMPRA → REJECTED (throws); the movement remains active and is still returned by `obtenerMovimientosPorProducto`.
  - restore a previously soft-deleted VENTA → counts again in derived stock and reappears in active history.
  - These tests target `softDeleteMovimiento(id)` and `restoreMovimiento(id)` which do NOT exist yet (should fail).
- [ ] T002 [US1] Implement in `src/app/core/database/database.service.ts` to make T001 pass:
  - `obtenerMovimientoPorIdInterno(id)` private helper (web mock + native), mirroring `obtenerProductoPorIdInterno`.
  - `softDeleteMovimiento(id)`: COMPRA guard first (look up movement; if `tipo === 'COMPRA'` throw Error `Las COMPRAS se corrigen con un AJUSTE`), then set `deleted_at = Date.now()` (web mock map + native `UPDATE ... WHERE id = ? AND deleted_at IS NULL`).
  - `restoreMovimiento(id)`: set `deleted_at = NULL` (web mock map + native `UPDATE ... WHERE id = ? AND deleted_at IS NOT NULL`).
  - Do NOT touch `costo_promedio` or `calcularStockDerivado`.

**Checkpoint**: Data layer complete and green before UI work.

---

## Phase 2: User Story 1 — Anular un movimiento (Priority: P1)

**Goal**: Merchant can anular a VENTA/MERMA/AJUSTE from the movement history; COMPRA is blocked with a message.

- [ ] T003 [US1] Add an "Anular" action to each movement row in `src/app/features/inventario/inventory-movement.page.html`.
- [ ] T004 [US1] Implement `anularMovimiento(movimiento)` in `src/app/features/inventario/inventory-movement.page.ts`:
  - If `movimiento.tipo === 'COMPRA'` → blocking `danger` toast (`Las COMPRAS se corrigen con un AJUSTE`); do nothing else.
  - Else → `dbService.softDeleteMovimiento(movimiento.id)` inside try/catch; on success `cargarDatos()` to refresh derived stock, cost display, and history; on error show a `danger` toast.

**Checkpoint**: Anular works for VENTA/MERMA/AJUSTE; COMPRA blocked. Stock recomputes.

---

## Phase 3: User Story 2 — Deshacer (restore) via undo toast (Priority: P2)

**Goal**: Immediately after anular, offer an "Deshacer" action that restores the movement.

- [ ] T005 [US2] Extend the success path in `anularMovimiento` (inventory-movement.page.ts) so the success toast includes a "Deshacer" button that calls `dbService.restoreMovimiento(movimiento.id)` then `cargarDatos()`.

**Checkpoint**: Anular then Deshacer returns the movement to active state and restores derived stock.

---

## Phase 4: UI Tests + Story 3 (low-stock reflection)

- [ ] T006 [P] [US1/US2] Add UI-flow tests in `src/app/features/inventario/inventory-movement.page.spec.ts`:
  - anular a VENTA calls `softDeleteMovimiento` once and reloads.
  - anular a COMPRA does NOT call `softDeleteMovimiento` and shows a danger toast.
  - the undo path calls `restoreMovimiento` once.
- [ ] T007 [P] [US3] (Optional/verification) Confirm low-stock badge reflects recomputed stock after anular/restore — covered indirectly by derived-stock recompute; add an assertion only if practical without new production code.

---

## Phase 5: Polish & Validation

- [ ] T008 Final validation: `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`. Confirm all tests pass (existing 55 + new).

---

## Dependencies & Execution Order

- **Phase 1 (T001-T002)**: BLOCKS everything. Data layer first, test-first.
- **Phase 2 (T003-T004)**: Depends on Phase 1.
- **Phase 3 (T005)**: Depends on Phase 2 (extends the anular success path).
- **Phase 4 (T006-T007)**: Depends on Phase 2/3.
- **Phase 5 (T008)**: Last.

## Notes

- Reuses proven Feature #1 pattern (`softDeleteTransaccion`/`restoreTransaccion`).
- COMPRA guard is defense-in-depth: enforced in both the service (T002) and the UI (T004).
- No schema migration, no `costo_promedio` changes, no `calcularStockDerivado` changes.
- Confirm green BEFORE each commit. Commit in small logical groups (e.g., T001+T002 together; UI tasks together).