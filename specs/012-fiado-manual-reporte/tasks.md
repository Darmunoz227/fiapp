# Feature 012 - Tasks

## Phase 0 - Documents

- [ ] T001 - Commit spec.md, plan.md and tasks.md. NO code before this commit.

## Phase 1 - Schema and model (additive)

- [ ] T002 - Add venta_id as an optional nullable field to the Transaccion model.
- [ ] T003 - CRITICAL. Fix the crearTransaccion INSERT at database.service.ts line 465. It currently lists only six columns and silently drops the tombstone fields. It must persist venta_id, and while there, created_at, updated_at, deleted_at, store_id and created_by. Without this the column is always NULL, every sale-linked transaccion looks manual, and the report double counts every credit sale. That is worse than the bug this feature fixes.
- [ ] T004 - Add agregarColumnaSiFalta for transacciones venta_id TEXT DEFAULT NULL inside migrarEsquemaSiNecesario, next to the existing transacciones columns.
- [ ] T005 - Bump SCHEMA_VERSION from 6 to 7 at line 26.
- [ ] T006 - Update the web mock path so mockWebTransacciones mirrors the new shape. Suite green. Commit.

## Phase 2 - Read path

- [ ] T007 - RED. Failing spec: obtenerTransacciones returns all non-deleted transacciones ordered by fecha DESC.
- [ ] T008 - GREEN. Implement obtenerTransacciones mirroring obtenerTransaccionesPorCliente, including the web mock branch using filtrarActivos.
- [ ] T009 - RED. Failing spec: the range filter selects records by fecha for any record type, using the same day boundaries.
- [ ] T010 - GREEN. Generalize the range filter to a single function operating on anything carrying fecha. Keep filtrarVentasPorRango working through it so existing specs still pass. Adapt assertions if needed, NEVER delete a case. Suite green. Commit.

## Phase 3 - Concept generation

- [ ] T011 - RED. Failing spec: a cart with three lines produces a concept naming the first two plus the remainder, for example "2 Carne molida, 1 Panela y 1 mas".
- [ ] T012 - RED. Failing spec: a cart with one line produces a concept with no remainder suffix.
- [ ] T013 - GREEN. Implement concept generation as a PURE function so it is unit testable, and use it in ventas.page.ts instead of the hardcoded literal at line 292.
- [ ] T014 - Set venta_id on the transaccionFiado built in ventas.page.ts, linking it to the sale being registered. Suite green. Commit.

## Phase 4 - Report rendering

- [ ] T015 - RED. Failing spec: the summary exposes fiadoManualTotal and abonoTotal, and neither affects totalVendido nor gananciaTotal.
- [ ] T016 - RED. Failing spec: transacciones whose venta_id is NOT NULL are EXCLUDED from the manual totals. This is the double counting guard.
- [ ] T017 - GREEN. Extend the summary with the two new totals, computed only from transacciones with venta_id null.
- [ ] T018 - reportes.page.ts: load clientes and transacciones in cargar(), and build a nombrePorClienteId map mirroring nombrePorProductoId.
- [ ] T019 - reportes.page.html: render the client name on sales that have a cliente_id, showing "Cliente eliminado" when the client is gone.
- [ ] T020 - reportes.page.html: add the separate debt-movements section listing manual fiados and abonos with client name, concepto, amount and date, visually distinct from sales. Suite green. Commit.

## Phase 5 - Verification and docs

- [ ] T021 - Build a REAL v6 database on device: check out main, install, register a credit sale and a manual fiado, confirm both exist.
- [ ] T022 - Upgrade IN PLACE to this branch on Android Pixel_8. Verify the app starts, old transacciones survive with venta_id NULL, and nothing is double counted.
- [ ] T023 - On device: register a credit sale of three products, open Cliente Detalle and confirm the concept names the products. Verify the report shows the client name and the separate section.
- [ ] T024 - Same in-place upgrade and checks on the iOS simulator.
- [ ] T025 - Write Decision 032 in docs/DECISIONS.md covering the venta_id origin marker, why concepto filtering was rejected, and the crearTransaccion INSERT that was silently dropping columns. Verify with grep -n "^## Decision" and tail -3.
- [ ] T026 - Sync docs/PROJECT_CONTEXT.md: close P4 in section 10, update section 3 and the schema version to v7.
- [ ] T027 - Merge to main with --no-ff, suite green on main, push to origin-privado.
