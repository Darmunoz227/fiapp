# Feature 011 - Tasks

## Phase 0 - Documents

- [ ] T001 - Commit spec.md, plan.md and tasks.md. NO code before this commit.

## Phase 1 - Model

- [ ] T002 - RED. Write a failing spec asserting VentaItem exists with venta_id, producto_id, cantidad, precio_venta, costo_unitario, ganancia and the tombstone fields.
- [ ] T003 - GREEN. Create VentaItem in src/app/core/models. Do NOT touch the Venta interface in this phase. This phase is purely ADDITIVE (expand step).
- [ ] T004 - Run npm run build and the suite. Both must be green with ZERO changes to existing consumers, proving the phase is additive.

## Phase 2 - Schema (additive, nothing breaks)

- [ ] T005 - Add venta_items creation to crearTablasSiFaltan, with FKs to ventas and productos and indexes on venta_id and producto_id.
- [ ] T006 - Bump SCHEMA_VERSION from 5 to 6 at line 26.
- [ ] T007 - Verify with grep that crearTablasSiFaltan still runs BEFORE the version check. Suite green. Commit.

## Phase 3 - Migration (highest risk)

- [ ] T008 - Guard backfillMontosVentas: return immediately if ventas no longer has precio_venta. Without this it breaks on every fresh v6 install.
- [ ] T009 - RED. Failing spec: migrating a v5 database with N sales produces N venta_items rows with identical amounts and ganancia.
- [ ] T010 - RED. Failing spec: running the migration twice changes nothing (idempotent).
- [ ] T011 - GREEN. Implement reconstruirVentasParaMultiItem: create ventas_nueva with the reduced shape, copy sale-level columns, insert one venta_items row per old sale with a deterministic id derived from the sale id, drop ventas, rename, recreate indexes. All inside one transaction, every db.run declaring dentroDeTx.
- [ ] T012 - Wire the ordering in migrarEsquemaSiNecesario exactly as the plan states: monto columns, then backfill, then crearVentaItems, then rebuild.
- [ ] T013 - Make the rebuild a no-op when ventas already has the reduced shape. Suite green. Commit.

## Phase 4 - Write path

- [ ] T014 - RED. Failing spec: registrarVenta with three lines writes one sale, three items and three VENTA movements.
- [ ] T015 - RED. Failing spec: if any write fails mid-sale, nothing is persisted.
- [ ] T016 - GREEN. Change registrarVenta to accept the sale, an array of lines and an array of movements, plus the optional fiado transaction. Everything inside ejecutarEnTransaccion, every db.run with dentroDeTx true.
- [ ] T017 - Update mockWebVentas and add a mock store for venta_items so the web path mirrors the native shape. R4 in the plan: a green suite over a stale mock is exactly how the app stayed broken from Feature 4 to 8.
- [ ] T018 - Suite green. Commit.

## Phase 5 - Read path

- [ ] T019 - RED. Failing spec: obtenerVentas returns each sale with its lines attached, excluding soft-deleted lines.
- [ ] T020 - GREEN. Implement the read with its join.
- [ ] T021 - Fix reportes-calculations.ts line 43: gananciaTotal must sum line ganancias, not venta.ganancia.
- [ ] T022 - Fix reportes.page.html lines 42 and 45: render the lines of each sale instead of a single product and a single ganancia.
- [ ] T023 - Soft-deleting a sale must soft-delete its lines. Suite green. Commit.
- [ ] T023b - CONTRACT step. Phase 5 introduced VentaBase in venta-con-items.model.ts, which duplicates what Venta becomes after this step. Collapse them: reduce Venta, delete VentaBase, and point VentaConItems at Venta. Also replace the `as Venta[]` cast in reconstruirVentasParaMultiItem with a local LegacyVentaRow type, since that cast stops compiling once the legacy fields are gone. Only now remove producto_id, cantidad, precio_venta, costo_unitario and ganancia from the Venta interface. By this point no consumer references them, so the build must pass with ZERO casts. Any need for a cast (as any), a template escape hatch, or a compiler suppression directive means an earlier phase is incomplete: STOP and fix that phase instead.

## Phase 6 - UI

- [ ] T024 - Cart state in ventas.page.ts: add line, remove line, edit quantity, live totals.
- [ ] T025 - Per-line stock validation. A line exceeding derived stock is visibly blocked showing the available quantity; the remaining lines stay sellable (D2).
- [ ] T026 - Allow the same product in several lines without merging, visually distinguishable (D3).
- [ ] T027 - Assemble the sale from the cart and call the new registrarVenta. Suite green. Commit.

## Phase 7 - Verification and docs

- [ ] T028 - Build a REAL v5 database on device: check out main, install, register two or three single-product sales, confirm they exist.
- [ ] T029 - Upgrade IN PLACE to this branch on Android Pixel_8. Verify AC9: every old sale survived as exactly one line with identical amounts and ganancia.
- [ ] T030 - Same in-place upgrade on the iOS simulator.
- [ ] T031 - On device, both platforms: register a three-product sale, verify stock decreased per product, verify a mixed payment yields MIXTO, verify the per-line stock block, verify remove and edit quantity.
- [ ] T032 - Write Decision 031 in docs/DECISIONS.md covering the table rebuild, the backfill ordering conflict and the single-source-of-truth rule for sale lines. Verify with grep -n "^## Decision" and tail -3.
- [ ] T033 - Sync docs/PROJECT_CONTEXT.md: close P2 in section 10, update section 3 and the schema version to v6.
- [ ] T034 - Merge to main with --no-ff, suite green on main, push to origin-privado.
