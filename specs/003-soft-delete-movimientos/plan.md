plan# Implementation Plan: Soft-delete y restauración de movimientos de inventario

**Branch**: `003-soft-delete-movimientos` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-soft-delete-movimientos/spec.md`

## Summary

Allow a merchant to soft-delete (anular) and restore inventory movements of type VENTA, MERMA, and AJUSTE, so that stock and low-stock status recompute automatically while preserving auditability. COMPRA movements are explicitly not deletable in this version (they affect weighted-average cost); COMPRA errors are corrected via AJUSTE (Decision 024). No physical deletes, no changes to `costo_promedio`. The feature reuses the proven soft-delete/restore pattern from Feature #1 and the existing `deleted_at` infrastructure already present in `movim_inventario`.

## Technical Context

**Language/Version**: TypeScript 5.9 on Angular 20
**Primary Dependencies**: Ionic 8, Capacitor 8, `@capacitor-community/sqlite`
**Storage**: Local SQLite with in-memory web mock (existing pattern)
**Testing**: Jasmine/Karma via `npm test`, Angular build via `npm run build`
**Target Platform**: Ionic mobile app plus web build
**Constraints**: Offline-first, TypeScript strict, standalone components only, no physical delete, no mutable stock, no cost mutation in this feature

## Groundwork Already Verified

- `movim_inventario` already has the `deleted_at` column (created in Feature #2 foundation).
- `calcularStockDerivado` already ignores movements where `deleted_at != null`.
- `obtenerMovimientosPorProducto` already filters `deleted_at IS NULL` (anulled movements drop out of history automatically).
- The soft-delete/restore pattern is proven in Feature #1 (`softDeleteTransaccion` / `restoreTransaccion`), which these new methods mirror exactly.

Therefore no schema migration is required and the derivation engine needs no changes.

## Data Layer (database.service.ts)

Add two public methods mirroring `softDeleteTransaccion` / `restoreTransaccion`:

### softDeleteMovimiento(id: string): Promise<void>
- **COMPRA guard (first):** determine the movement's `tipo`; if it is `COMPRA`, throw an Error with a Spanish message (e.g. `Las COMPRAS se corrigen con un AJUSTE`) and do NOT modify anything.
  - Guard approach: the service looks up the movement to check its `tipo` before mutating. A small private helper `obtenerMovimientoPorIdInterno(id)` (mirroring `obtenerProductoPorIdInterno`) reads the movement on both web mock and native. This keeps the guard authoritative in the domain/data layer, not only in the UI.
- Web mock: map `mockWebMovimInventario`, setting `deleted_at: Date.now()` on the matching id.
- Native: `UPDATE movim_inventario SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL` with `[Date.now(), id]`.

### restoreMovimiento(id: string): Promise<void>
- No COMPRA guard needed (a COMPRA can never have been anulled).
- Web mock: map `mockWebMovimInventario`, setting `deleted_at: null` on the matching id.
- Native: `UPDATE movim_inventario SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL` with `[id]`.

Both operations are naturally idempotent via the `AND deleted_at IS NULL / IS NOT NULL` conditions on native, and via the conditional map on web.

## UI Layer (inventory-movement.page)

In the movement history list (added in Feature #2 T020):
- Add an "Anular" action to each movement row.
- Handler `anularMovimiento(movimiento)`:
  - If `movimiento.tipo === 'COMPRA'`: show a blocking toast (color `danger`) with the COMPRA message; do nothing else. (UI-level fast block; the service also guards defensively.)
  - Else: call `dbService.softDeleteMovimiento(movimiento.id)` inside try/catch; on success reload data (`cargarDatos`) so derived stock, cost display, and history refresh; show a success toast that includes a **"Deshacer"** action.
  - The "Deshacer" action calls `dbService.restoreMovimiento(movimiento.id)` then reloads data again.
- Reuse the existing `cargarDatos()` to recompute `stockDerivado` and refresh the history after anular/restore.

## Explicitly NOT Touched

- No schema change (columns already exist).
- No change to `calcularStockDerivado` (already ignores deleted).
- No change to `costo_promedio` or `calcularCostoPromedioPonderado` (FR-009).
- No changes to product creation, movement creation, or low-stock logic beyond what recomputes naturally.

## Constitution Check

*GATE: Must pass before implementation.*

- Stack locked to Angular standalone + Ionic + Capacitor SQLite. ✅
- Movement log remains the immutable source of truth; anulled movements are excluded from derivation but retained (tombstone). ✅
- No physical delete — soft-delete via `deleted_at`. ✅
- Offline-first: both operations complete against local SQLite / web mock. ✅
- No mutable stock, no stock cache, no cost projection introduced. ✅
- Domain-level guard: COMPRA restriction enforced in the data layer, not only the UI. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-soft-delete-movimientos/
├── spec.md
├── plan.md
├── tasks.md
└── (research/data-model not required: no new entities or unknowns)
```

### Source Code (affected)

```text
src/app/core/database/database.service.ts        # softDeleteMovimiento, restoreMovimiento, obtenerMovimientoPorIdInterno
src/app/core/database/database.service.spec.ts   # data-layer tests (soft-delete, restore, COMPRA guard)
src/app/features/inventario/inventory-movement.page.ts    # anular/undo handlers
src/app/features/inventario/inventory-movement.page.html  # anular action per history row
src/app/features/inventario/inventory-movement.page.spec.ts # UI flow tests
```

**Structure Decision**: No new feature area or files beyond the movement page and the shared database service. No `data-model.md` or `research.md` needed — there are no new entities and no open technical unknowns (the pattern is proven in Feature #1).

## Complexity Tracking

No constitution violations. The only notable design point (COMPRA soft-delete + cost recompute) is deliberately deferred out of scope per Decision 024 and this feature's clarifications, avoiding the associated cost-integrity complexity.