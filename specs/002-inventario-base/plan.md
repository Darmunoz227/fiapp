# Implementation Plan: Inventario base - productos y registro de movimientos de stock

**Branch**: `002-inventario-base` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-inventario-base/spec.md`

## Summary

Implement a base inventory feature for FiApp that lets merchants create products, record stock movements, and derive stock and weighted-average cost exclusively from the immutable movement log. The design keeps the current Angular 20 + Ionic 8 standalone app structure, persists data with the existing SQLite approach, blocks outbound movements that would go negative, and represents weighable quantities in grams while displaying them in kilograms.

## Technical Context

**Language/Version**: TypeScript 5.9 on Angular 20

**Primary Dependencies**: Ionic 8, Capacitor 8, `@capacitor-community/sqlite`, RxJS

**Storage**: Local SQLite with web fallback in-memory paths for browser execution

**Testing**: Jasmine/Karma via `npm test`, Angular build via `npm run build`

**Target Platform**: Ionic mobile app plus web build

**Project Type**: Mobile/web application

**Performance Goals**: Inventory reads and writes should stay fast enough for local-first interaction, with derived stock computed deterministically from the movement log

**Constraints**: Offline-first behavior, TypeScript strict, standalone components only, no mutable stock field, no stock cache/projection, no outbound negative stock

**Scale/Scope**: Single-store inventory MVP within the existing FiApp app, focused on product catalog and stock movement history

## Schema Migration Strategy

- Bump the SQLite schema version from 2 to 3 for this feature.
- Add a version-gated migration step in `database.service.ts` so existing merchant installs upgrade safely instead of relying on fresh-install table creation only.
- The migration must create the new `productos` and `movim_inventario` tables with `CREATE TABLE IF NOT EXISTS`, making the step idempotent on already-installed devices.
- The new tables must include the standard metadata columns required by the constitution: `created_at`, `updated_at`, `deleted_at`, `store_id`, and `created_by`.
- The inventory movement table must keep `cantidad` as an `INTEGER` and rely on the existing foreign-key enforcement (`PRAGMA foreign_keys = ON`) already used by the app.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stack locked to Angular standalone + Ionic + Capacitor SQLite.
- Inventory state must remain derived from the immutable movement log.
- All new work must remain offline-first and compatible with the existing local persistence model.
- No auth/roles implementation is introduced in this feature.
- No stock cache, projection, or mutable stock source of truth is allowed.

## Project Structure

### Documentation (this feature)

```text
specs/002-inventario-base/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── database/
│   ├── freemium/
│   ├── models/
│   └── preferences/
├── features/
│   ├── cliente-detalle/
│   └── configuraciones/
├── home/
└── shared/
    ├── modals/
    └── utils/

src/app/features/inventario/
├── inventory-list.page.ts
├── inventory-detail.page.ts
├── inventory-movement.page.ts
└── inventory.models.ts
```

**Structure Decision**: Use the existing Angular/Ionic application under `src/app/` and add the inventory feature as a new standalone feature area under `src/app/features/inventario/`. No separate backend or contract surface is required for this release because the feature is internal to the app and persists locally through SQLite.

## Complexity Tracking

No constitution violations require justification for this feature.
