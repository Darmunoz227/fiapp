# Tasks — Feature 007

Confirm "TOTAL: N SUCCESS" on screen before each COMMIT. Never commit red.

## T001 [READ] Ground truth
cat the FULL reportes-calculations.ts, reportes.page.ts and ventas.page.ts. Confirm ResumenVentas field names and existing helper signatures from the files, not from memory. No edits in this task.

## T002 [RED] Pure helper tests
Create ventas-calculations.spec.ts with failing tests for calcularTotalVenta (UNIDAD case, PESO case, preserves current arithmetic) and derivarTipoPago (CONTADO / FIADO / MIXTO boundaries including 0 edges). Confirm RED for the right reason: helpers do not exist yet.

## T003 [GREEN] Implement helpers
Create ventas-calculations.ts with calcularTotalVenta and derivarTipoPago. Point reportes-calculations.ts:38 and reportes.page.ts:88 at calcularTotalVenta. Gate: full suite green. COMMIT.

## T004 [GREEN] Model
TipoPago union += MIXTO. Venta += monto_contado, monto_fiado (number). Fix type errors surfaced by the compiler. Gate: build green. COMMIT.

## T005 [RED] Guard tests
In database.service.spec.ts, failing tests for: amounts that do not add up beyond 0.01 tolerance are REJECTED and nothing persists; negative amount REJECTED; null or undefined amount REJECTED; monto_fiado > 0 with no cliente_id REJECTED; a valid MIXTO sale produces one venta, one VENTA movement, one fiado transaction for the unpaid balance only, with frozen ganancia unchanged; a float-noise difference around 1e-10 is ACCEPTED. Confirm RED for the right reasons.

## T006 [GREEN] Schema v5 + backfill + guards
Bump SCHEMA_VERSION to 5. Add both columns in BOTH routes (crearTablasSiFaltan AND migrarEsquemaSiNecesario). Add the idempotent backfill UPDATEs. Add the guards in registrarVenta before the platform branch. Gate: full suite green. COMMIT.

## T007 [RED] Report tests
Failing tests: a MIXTO sale is counted correctly, and contadoTotal + fiadoTotal === totalVendido over a mixed dataset.

## T008 [GREEN] Report rewrite
Remove the if / else-if on tipo_pago; sum monto_contado and monto_fiado directly. Relabel the cash figure "Recibido al momento de la venta". Gate: full suite green. COMMIT.

## T009 [GREEN] Ventas UI
Add the abono input. Derive monto_fiado = total - monto_contado; never capture both. Validate 0 <= monto_contado <= total. Show the remaining balance live. Require a client when the derived monto_fiado > 0. Build tipo_pago via derivarTipoPago, never literally. Gate: full suite green + build green. COMMIT.

## T010 [GATE] Full verification
npm test -- --watch=false --browsers=ChromeHeadless then npm run build. Confirm the TOTAL on screen. Review every diff before accepting.

## T011 [DOCS] Decision 027
Record: amounts as source of truth with tipo_pago as projection; the 0.01 tolerance and why strict equality fails on REAL columns; the two-layer defense (UI derives, data layer guards); the dual-route migration requirement; and that Karma never exercises the native migration path, so on-device testing is the only proof.

## T012 [DOCS] PROJECT_CONTEXT
Section 3: schema v5, new test count, Features #1-#7 complete. Section 10: Feature #7 done, list next candidates.

## T013 [MERGE] To main
git checkout main then git merge --no-ff 007-pago-parcial. Re-run tests ON main before push. Never trust a green from the branch alone.

## T014 [MANUAL] On-device check (recommended, not blocking)
Install over an existing v4 database and verify migration and backfill on real SQLite. No test in this suite can prove this.
