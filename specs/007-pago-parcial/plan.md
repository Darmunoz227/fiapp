# Plan — Feature 007

## Read before editing
Only grep fragments of reportes-calculations.ts were seen (lines 6, 38-55). Read the FULL file before editing; take ResumenVentas field names from the file, not from memory. Same for ventas.page.ts.

## Files touched
venta.model.ts (TipoPago + MIXTO, monto_contado, monto_fiado)
database.service.ts (schema v5 BOTH routes, backfill, guards)
database.service.spec.ts (guard tests)
ventas-calculations.ts + .spec.ts (NEW pure helpers)
ventas.page.ts (abono input, derived monto_fiado)
reportes-calculations.ts + .spec.ts (sum real amounts)
reportes.page.ts (use canonical total helper)

## Change 1 - canonical total helper
calcularTotalVenta(precioVenta, cantidad) as a pure helper. Point BOTH existing call sites at it (reportes-calculations.ts:38, reportes.page.ts:88). The data-layer guard is the third consumer. Behavior must stay byte-identical: precio * cantidad, no rounding added or removed. Three copies of one formula is three places for rounding to diverge.

## Change 2 - derivarTipoPago
monto_fiado === 0 -> CONTADO. monto_contado === 0 -> FIADO. both > 0 -> MIXTO.
Operational rule: NO insert or update writes tipo_pago literally. Always via this helper. Same structural discipline as crearMovimientoInterno (Decision 026).

## Change 3 - schema v5
Bump SCHEMA_VERSION 4 -> 5.
Route A crearTablasSiFaltan: add monto_contado REAL DEFAULT NULL, monto_fiado REAL DEFAULT NULL to CREATE TABLE ventas.
Route B migrarEsquemaSiNecesario: agregarColumnaSiFalta for both columns.
Nullable because SQLite cannot ADD COLUMN NOT NULL without default on a populated table. Nullable is a MIGRATION constraint only: no NEW sale may persist null amounts.
SQLite also cannot add a CHECK constraint after creation without a full table rebuild, so the invariant CANNOT live in the schema. It lives in code. That is why Change 5 is mandatory.

## Change 4 - backfill (idempotent)
agregarColumnaSiFalta is DDL only. Separate data step:
UPDATE ventas SET monto_contado = precio_venta * cantidad, monto_fiado = 0 WHERE monto_contado IS NULL AND tipo_pago = CONTADO
UPDATE ventas SET monto_contado = 0, monto_fiado = precio_venta * cantidad WHERE monto_contado IS NULL AND tipo_pago = FIADO
Idempotent via the IS NULL filter.

## Change 5 - guards in registrarVenta
Before the platform branch, so they apply to web mocks and native alike. Reject when: amounts null/undefined/NaN; either amount negative; Math.abs((contado + fiado) - calcularTotalVenta(venta)) >= 0.01; monto_fiado > 0 with no cliente_id.
The guard RECOMPUTES the total itself. It must not trust any caller-supplied total.
Decision 026 compliance: registrarVenta keeps calling crearMovimientoInterno. No new nesting.

## Change 6 - report without branches
Replace the if / else-if on tipo_pago with direct summation:
totalVendido += calcularTotalVenta(venta)
contadoTotal += venta.monto_contado ?? 0
fiadoTotal += venta.monto_fiado ?? 0
No conditional means no uncovered case. Test that contadoTotal + fiadoTotal === totalVendido. Label the cash figure "Recibido al momento de la venta"; later abonos are transacciones and are out of scope.

## Risk
Medium. Schema + migration + write path + UI + report.
Highest risk: the migration needs BOTH routes plus data backfill. This is failure pattern #1 on our own list.
Second risk: Karma stubs the platform to web, so the native migration path is NEVER executed by tests (same limit recorded in Decision 026). On-device verification is the only real proof.

## Verification gate
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
Confirm the TOTAL on screen before each commit. Never commit red.
