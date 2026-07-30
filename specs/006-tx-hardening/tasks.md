# Tasks — Feature 006

## T001 [RED] Failure-path test for COMPRA
Write a failing test in database.service.spec.ts:
- create producto p1 with costo_promedio = 1000
- register COMPRA 5 @ 1000 (baseline)
- spy the movement insert to throw
- attempt COMPRA 5 @ 2000 -> must reject
- assert producto.costo_promedio is STILL the pre-attempt value
- assert no new movement persisted
Run tests. Confirm RED for the right reason (cost was mutated), not a typo.
COMMIT: test only, red state NOT committed — see T004 gate.

## T002 [GREEN] Extract crearMovimientoInterno
Rename crearMovimiento -> private crearMovimientoInterno (body unchanged).
Add public crearMovimiento wrapping it in ejecutarEnTransaccion.

## T003 [GREEN] Repoint registrarVenta
database.service.ts line 398 -> crearMovimientoInterno.
Verify no other call site inside a transaction (grep again).

## T004 [GATE] Full suite
npm test -- --watch=false --browsers=ChromeHeadless
Confirm "TOTAL: 81 SUCCESS" on screen. Then ng build (green).
ONLY NOW commit T001-T003 together as one atomic change.

## T005 [DOCS] Decision 026
Append to docs/DECISIONS.md:
Decision 026 — crearMovimiento is transactional; internal variant for composition.
Record: the problem, the nesting constraint, why method separation over a tx
parameter or reentrant detection, and that the primitive remains private.

## T006 [DOCS] Update PROJECT_CONTEXT
Section 10: remove the "Pending (no numbered decision yet): transaction-atomicity
hardening" bullet — it is now done. Note Feature 006 complete, next = 007 pago parcial.
Section 3: update test count.

## T007 [MERGE] Merge to main
git checkout main && git merge --no-ff 006-tx-hardening
Re-run tests on main before push.
