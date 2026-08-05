# Feature 013 - Tasks

## Phase 0 - Documents

- [ ] T001 - Commit spec.md, plan.md and tasks.md. NO code before this commit.

## Phase 1 - Guard method (additive)

- [ ] T002 - RED. Failing spec: puedeEscribir returns false when the trial is expired and true otherwise, and returns true whenever a premium licence is active.
- [ ] T003 - GREEN. Add puedeEscribir to FreemiumService, reusing obtenerEstado and mostrarAlertaBloqueo exactly as puedeAgregarCliente does. Do NOT write a new alert message.
- [ ] T004 - Suite green. Nothing calls the new method yet, so behavior is unchanged. Commit.

## Phase 2 - Wire the write points

- [ ] T005 - ventas.page.ts around line 210: call the guard at the START of registrarVenta, before any validation or write. Guard ONCE per action, never inside the cart loop (plan risk R3).
- [ ] T006 - cliente-detalle.page.ts around line 133: guard ONLY when tipo is fiado. An ABONO must go through even when blocked, per decision D3. This is the delicate one.
- [ ] T007 - inventory-movement.page.ts lines 135 and 180: guard BOTH call sites.
- [ ] T008 - inventory-list.page.ts around line 56: guard crearProducto.
- [ ] T009 - Verify by grep that NO read path was touched: Home, Cliente Detalle listing, Inventario list, Reportes and exportarRespaldoJSON must be untouched.
- [ ] T010 - Suite green. Review the full diff. Commit.

## Phase 3 - Verification and delivery

- [ ] T011 - On Android, force the block by creating clients until reaching the limit of 7.
- [ ] T012 - Verify AC1: a sale shows the block alert and writes NOTHING.
- [ ] T013 - Verify AC2: a manual fiado is blocked but an ABONO succeeds. This is the acceptance criterion that matters most.
- [ ] T014 - Verify AC3: inventory movements and new products are blocked.
- [ ] T015 - Verify AC4: Home, Cliente Detalle, Inventario and Reportes still load and show all existing data.
- [ ] T016 - Verify AC5: unlocking premium with five taps plus the password restores every action.
- [ ] T017 - Write Decision 033 in docs/DECISIONS.md: reads free, writes blocked, abonos always allowed, and the honest note that a hardcoded password in the JS bundle raises friction but does not make the app tamper proof. Verify with grep -n "^## Decision" and tail -3.
- [ ] T018 - Sync docs/PROJECT_CONTEXT.md: close P9 in section 10, update section 3.
- [ ] T019 - Merge to main with --no-ff, suite green on main, push to origin-privado.
- [ ] T020 - Build a fresh APK from main and deliver it to the three pilot merchants.
