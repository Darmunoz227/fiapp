# FiApp — Project Context Handoff

> Purpose: give a new AI supervisor or developer enough verified project context to continue FiApp without relying on chat memory.
>
> Last updated: 2026-07-24

---

## 1. Project identity

**Project:** FiApp / FiApp-Comercial  
**Type:** Ionic + Angular standalone mobile/web app  
**Platform:** Capacitor + SQLite via `@capacitor-community/sqlite`  
**Primary use case:** Help Colombian and LATAM micro-merchants manage customers, fiado/debt, products, inventory, and eventually mPOS sales/profit.  
**Current repository:** `FiApp-Comercial`  
**Development approach:** Spec-Driven Development (SDD) with Spec Kit, supervised AI coding, Git checkpoints, and build/test gates.

---

## 2. Carol's working model

Carol is leading the product and implementation with AI support. The AI is not the decision-maker. Carol reviews, accepts, rejects, or redirects generated work.

Preferred technical style:

- English for prompts and coding work because local Qwen models perform better in English.
- Step-by-step supervision.
- Small implementation batches.
- Review actual files/diffs before accepting or committing.
- Use Copilot for high-risk multi-file implementation.
- Use Qwen 14B local for specs, reasoning, drafts, and isolated snippets.

Core operating rule:

```text
The AI generates ideas and code.
Carol accepts responsibility for what is merged.
```

---

## 3. Current repository state

As of this handoff:

- Feature #1 is complete, tested, committed, and pushed.
- Features #2 through #5 are all COMPLETE, tested, and merged to main.
- Current schema version: v4 (bumped across Feature #2 inventory tables and Feature #4 ventas table).
- 80 tests passing. Build green. Working branch: main (everything merged).
- Next up: Feature #6 = Pago parcial/mixto en ventas (abono: parte contado + parte fiado).

Before doing work, always run:

```bash
git status
```

Expected safe state before new work:

```text
working tree clean
up to date with origin-privado/main
```

---

## 4. Completed Feature #1 — Safe Recoverable Soft-Delete

**Feature directory:** `specs/001-soft-delete/`

### Completed scope

Feature #1 implemented safe soft-delete and immediate undo for:

- Clientes
- Transacciones

### Key outcomes

- Physical `DELETE` was removed from the active delete flows.
- `deleted_at` tombstones were added.
- Queries filter active records with `deleted_at IS NULL`.
- `contarClientes()` excludes deleted clients, protecting the freemium limit.
- Client delete/undo works from the Home page.
- Transaction delete/undo works from the Cliente Detalle page.
- Debt guard blocks client deletion when `deudaTotal > 0`.
- Transaction deletion recalculates balance immediately.
- Undo refresh bugs were fixed via `ChangeDetectorRef` in reload methods.

### Database/schema work completed

Feature #1 introduced schema versioning and migration behavior:

- `SCHEMA_VERSION = 2`
- `PRAGMA foreign_keys = ON` enabled during SQLite initialization.
- Nullable metadata/tombstone columns added to `clientes` and `transacciones`:
  - `created_at`
  - `updated_at`
  - `deleted_at`
  - `store_id`
  - `created_by`

### Tests

Feature #1 reached a green baseline with:

```text
27 tests passing
```

Coverage added:

- Component spec setup fixes.
- Data-layer soft-delete and restore coverage.
- UI soft-delete flow coverage for debt guard, delete, and undo.

---

## 5. Feature #2 (COMPLETED) — Inventory Base

**Feature directory:** `specs/002-inventario-base/`

### Current phase

Feature #2 is fully COMPLETE (Foundation + US1 + US2 + US3 + Polish) and merged to main. This section is kept as historical reference; see DECISIONS.md and git history for the full record.

Artifacts already created and reviewed:

- `spec.md`
- `plan.md`
- `data-model.md`
- `research.md`
- `quickstart.md`
- `tasks.md`
- `checklists/requirements.md`

Analyze result summary:

- Critical issues: 0
- Ambiguity count: 0
- Constitution alignment issues: none
- Main minor finding: `actor_id` was implicit in tasks and should be made explicit during implementation/review.

---

## 6. Feature #2 approved product decisions

The following decisions are locked unless Carol explicitly changes them:

### 6.1 Stock source of truth

The immutable movement log is the only source of truth.

```text
stock = SUM(valid inventory movements)
```

Do not store mutable stock in `Producto`.
Do not add a stock cache/projection in the MVP.

A future projection table may only be added if real performance data justifies it, and it must be fully reconstructable from movement history.

### 6.2 Negative stock

For the MVP:

- Outbound movements such as `VENTA` and `MERMA` must be blocked if the movement quantity exceeds available derived stock.
- Role-based override is explicitly out of scope.
- Do not implement users, roles, auth, or admin permissions for this feature.

### 6.3 AJUSTE semantics

In the UI, the user enters the physical counted quantity.

Example:

```text
Calculated stock: 10,000 g
Physical count: 8,500 g
Delta: -1,500 g
```

The system stores an `AJUSTE` movement using the delta.

The adjustment movement should also preserve audit metadata:

- calculated stock before adjustment
- physical count entered
- computed difference
- reason
- timestamp
- optional future `actor_id`

### 6.4 Weight handling

Products of type `PESO` store quantities as integer grams.

Examples:

```text
2.350 kg -> 2350 g
0.125 kg -> 125 g
```

Minimum precision for MVP: 1 gram.

Display may show kilograms to the user.
Internal persistence uses integer grams.

### 6.5 Movement types

Inventory movement types:

- `COMPRA`
- `VENTA`
- `AJUSTE`
- `MERMA`

They must remain semantically distinct.

Do not use `AJUSTE` to hide sales or waste.

### 6.6 Audit identity

`actor_id` may exist as a nullable optional field reserved for future identity/user management.

Do not build users, roles, authentication, or authorization in Feature #2.

### 6.7 Out of scope for Feature #2

Do not implement:

- POS / sales checkout flow
- profit per sale
- dashboard
- Excel/CSV import
- multi-store behavior
- roles or admin override
- product transformation/desposte
- stock cache/projection

---

## 7. Architecture rules to preserve

Always check `.specify/memory/constitution.md` first.

Current non-negotiables include:

- Ionic + Angular standalone components.
- Capacitor + SQLite.
- TypeScript strict.
- Clean Architecture style boundaries.
- Local SQLite is the primary source of truth.
- Cloud is not on the critical path.
- No physical deletes for syncable records.
- `deleted_at` tombstones.
- `PRAGMA foreign_keys = ON` on SQLite connections.
- Derived business values must not be treated as mutable truth.

---

## 8. Known AI failure patterns observed in this project

A new AI supervisor must actively watch for these:

1. Forgetting migration strategy for existing installs.
2. Adding mutable/cached stock fields despite log-as-truth.
3. Hallucinating REST/HTTP APIs in a local SQLite app.
4. Leaving empty method stubs.
5. Over-implementing out-of-scope roles/auth/multi-store/dashboard.
6. Producing fake green tests by deleting/skipping tests.
7. Leaving template placeholders or duplicated plan content.
8. Saying a file is clean without the actual file being reviewed.
9. Using `git commit -am` and accidentally skipping new untracked files.
10. Treating `/speckit.*` commands as paths instead of commands when not in the right Agent context.

---

## 9. Required workflow for any new supervisor

Before coding, a new AI supervisor must:

1. Read `.specify/memory/constitution.md`.
2. Read this file.
3. Read `docs/DECISIONS.md`.
4. Read the current feature's `spec.md`, `plan.md`, and `tasks.md`.
5. Summarize current project state.
6. State assumptions.
7. Wait for Carol's confirmation.

No code should be written before that.

---


## 10. Recommended next action

Features #1 through #5 are COMPLETE and merged to main (80 tests passing, build green, working tree clean). FiApp is a working offline-first MiniPOS: clients & fiados, inventory (movements + weighted-average cost + low-stock alerts), soft-delete of movements, single-item sales CONTADO/FIADO with an atomic transaction primitive and frozen ganancia, and a read-only Reportes/Ganancias dashboard (Hoy/Todo).

NEXT (Carol chooses):
- Feature #6 (most likely): Pago parcial/mixto en ventas (abono: part cash + part credit in one sale). Realistic merchant need. Will touch writes + the atomic primitive, so go spec-first.
- Pending (no numbered decision yet): transaction-atomicity hardening of crearMovimiento (wrap COMPRA cost-update + movement INSERT in a native SQL transaction, with a failure-path test). Deferred per Decision 025's implication — NOT Decision 025 itself (025 = T027 naming review, closed zero-diff). The ejecutarEnTransaccion primitive from Feature #4 is reusable for this.
- Pending (product decision): reconcile manual fiado (Home -> cliente) vs venta fiado. A manual fiado creates client debt but does NOT touch inventory or ganancia; a venta fiado does both.
- Optional: on-device testing (real SQLite persistence).

HOW TO START A NEW FEATURE:
1. Run: git status && git log --oneline -3 (verify clean on main).
2. Create a branch: 006-nombre.
3. Spec-first: write spec.md -> plan.md -> tasks.md and commit them BEFORE any code.
4. Test-first per task: RED tests, then implement to GREEN, confirm "TOTAL: N SUCCESS" on screen BEFORE each commit.
5. Review every diff. Commit in small logical batches. Merge to main with --no-ff after verifying green on main.

Key commands: build = ng build (npm run build); tests = npm test -- --watch=false --browsers=ChromeHeadless.
Remember: web platform uses in-memory mocks (no persistence across reload/new tab) BY DESIGN; SQLite persists on device.
