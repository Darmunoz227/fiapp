# Tasks - Feature 008

Confirm "TOTAL: N SUCCESS" on screen before each COMMIT. Never commit red.
Remember: green here proves almost nothing. The device is the real gate.

## T001 [GREEN] Add the ejecutarRun wrapper
Add the private wrapper to database.service.ts. Do not route anything yet.
Gate: build green.

## T002 [GREEN] Route the three inside-transaction call sites
crearMovimientoInterno (341), insertVenta (406), actualizarCostoPromedioProducto (600)
replace this.db.run(sql, values) with this.ejecutarRun(sql, values, true).
Gate: full suite green.

## T003 [GREEN] Route the ten standalone call sites
crearCliente, crearProducto, the six soft-delete/restore methods, and the two
backfill statements use this.ejecutarRun(sql, values) with the default flag.
Gate: full suite green.

## T004 [GREEN] crearTransaccion context parameter
Signature becomes crearTransaccion(transaccion, dentroDeTx = false). Its own
db.run passes the flag through. registrarVenta (415) calls it with true.
cliente-detalle.page.ts is NOT touched: the default preserves its behavior.
Gate: full suite green + build green.

## T005 [GATE] Grep control - this is the real check
grep -c "this.db.run" src/app/core/database/database.service.ts
MUST return 1 (only the one inside ejecutarRun). Any other number means a call
site was missed and the bug survives there.
Also: grep -c "this.ejecutarRun" must return 14 (13 call sites + the definition).
COMMIT T001-T005 together once both counts are correct.

## T006 [DEVICE] The verification that actually matters
npm run build && npx cap sync ios && npx cap open ios
On the simulator, in order:
  1. Register a COMPRA. It must succeed (this is the reported bug).
  2. Register a CONTADO sale. Stock drops, venta appears in Reportes.
  3. Register a FIADO sale. Client debt is created.
  4. Register a MIXTO sale with a partial abono. Both amounts persist and the
     debt equals the unpaid balance only.
  5. Create a manual fiado from cliente-detalle. Still works (standalone path).
  6. Attempt a sale exceeding stock. It must fail AND leave nothing behind.
Watch the Xcode console for any beginTransaction error at every step.

## T007 [DEVICE] Migration check - the original P0
This feature was found WHILE trying to run P0. That verification is still owed:
install over an existing v4 database, confirm the v5 migration runs, the backfill
fills monto_contado/monto_fiado on old sales, and nothing is lost.
Do NOT uninstall the app between builds or the v4 scenario is destroyed.

## T008 [DOCS] Decision 028
Record: the plugin run() defaults transaction to true; the bug predates Feature
006 and broke every sale since Feature 004; why an explicit parameter over hidden
state; and the hard lesson - Decision 026 predicted this exact failure in the
abstract and it still shipped, because no test could see it.

## T009 [DOCS] PROJECT_CONTEXT
Section 3 and 10: Feature 008, test count, and mark the device gate as satisfied
only after T006 and T007 actually pass.

## T010 [MERGE] To main
git checkout main && git merge --no-ff 008-fix-tx-nativa
Re-run tests on main before push. Do NOT merge before T006 passes on device.
