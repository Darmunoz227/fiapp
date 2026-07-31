# Feature 007 — Pago parcial / mixto en ventas (abono)

## Problem

A sale is currently binary: CONTADO or FIADO. Real LATAM corner-shop behavior is
in between: "te pago 10.000 de los 30.000 y el resto te lo abono el viernes".
Today the merchant must lie to the app (record it as fully fiado or fully cash),
which corrupts the cash-vs-credit picture in the report.

## Approved product decisions (Carol)

1. ONE frozen ganancia for the whole sale. Profit does not depend on how the
   customer paid. Payment split is a collections matter, not a margin matter.
2. ONE VENTA inventory movement for all goods handed over. Stock leaves the shop
   regardless of payment.
3. ONE fiado transaction for the UNPAID balance only. If monto_fiado is 0, no
   transaction is created.
4. Amounts are the source of truth: monto_contado + monto_fiado.
   tipo_pago becomes a PROJECTION derived from those amounts.
5. Report updated in THIS feature to sum real amounts.
6. cliente_id is mandatory when monto_fiado > 0.
7. Migration v4 -> v5 with idempotent backfill of existing sales.

## Verified ground truth (do not re-assume)

- SCHEMA_VERSION = 4 (database.service.ts:25).
- ventas: precio_venta REAL, cantidad INTEGER, tipo_pago TEXT NOT NULL,
  cliente_id TEXT DEFAULT NULL. There is NO total column. Total is always derived.
- TWO schema routes exist and BOTH must be updated:
    crearTablasSiFaltan()      -> CREATE TABLE IF NOT EXISTS  (new installs)
    migrarEsquemaSiNecesario() -> agregarColumnaSiFalta       (existing installs)
  agregarColumnaSiFalta is DDL only; it does NOT backfill data.
- registrarVenta does NOT compute anything. It receives a fully built Venta from
  the UI. Therefore the data-layer guard MUST recompute the total itself; trusting
  a caller-supplied number would validate nothing.
- Total is currently duplicated in TWO places with no canonical helper:
    reportes-calculations.ts:38   precio_venta * cantidad
    reportes.page.ts:88           precio_venta * cantidad
- reportes-calculations.ts:44-49 uses if / else if on tipo_pago. A MIXTO sale
  would fall through BOTH branches: it would add to totalVendido but to neither
  category, silently breaking contado + fiado = totalVendido.

## Float tolerance (approved)

precio_venta is REAL, so the total is floating-point arithmetic. Strict equality
would reject valid sales because of IEEE-754 representation error
(0.1 + 0.2 !== 0.3). The invariant compares with a one-cent tolerance:

    Math.abs((monto_contado + monto_fiado) - total) < 0.01

Rationale: Colombian pesos are used as whole units in practice, so any REAL
business error is measured in pesos, while representation noise is around 1e-10.
One cent is orders of magnitude above the noise and far below any real mistake.

## Two-layer defense (approved)

Layer 1 - UI makes the error structurally impossible:
    total        = calcularTotalVenta(precio, cantidad)
    monto_contado = what the merchant types
    monto_fiado   = total - monto_contado          <- DERIVED, never typed

The UI never captures both amounts, so they cannot fail to add up. UI validates
only 0 <= monto_contado <= total. Better UX too: the merchant types "he paid me
10.000" and the app shows "still owes 20.000".

Layer 2 - Data layer is the safety net against future callers and bugs:
recompute the total independently and enforce the invariant, non-null amounts,
and non-negative amounts. Same philosophy as Feature 006: make it structurally
impossible first, guard it anyway second.

## In scope

- Pure helper calcularTotalVenta() replacing BOTH duplicated call sites.
- Pure helper derivarTipoPago(montoContado, montoFiado) -> CONTADO | FIADO | MIXTO.
- TipoPago union extended with 'MIXTO'.
- Venta model: monto_contado, monto_fiado.
- Schema v5 in BOTH routes + idempotent data backfill.
- Data-layer guards: invariant (±0.01), null amounts, negative amounts,
  cliente_id required when monto_fiado > 0.
- Ventas UI: abono input, derived monto_fiado, live remaining balance.
- Report rewritten to sum real amounts with NO conditional branches on tipo_pago.

## Out of scope (note as future, do NOT implement)

- Migrating money to integer cents (would touch Features #4 and #5; separate work).
- Later abonos against existing debt (that is a transaccion, not a venta).
- Reconciling manual fiado vs venta fiado (already a pending product decision).
- Multi-method payments (card, Nequi, transfer).
- Editing or voiding existing sales.
- Reviewing whether precio_venta for PESO products is per gram or per kilo.
  Observation: total = precio * cantidad and cantidad is grams, which implies
  price-per-gram. calcularTotalVenta MUST preserve today's exact behavior; this
  is a separate investigation.

## Acceptance criteria

- AC1: A sale with monto_contado 10000 + monto_fiado 20000 on a 30000 total is
  persisted, creates ONE VENTA movement, ONE frozen ganancia, and ONE fiado
  transaction for 20000 only.
- AC2: Amounts that do not add up to the total (beyond ±0.01) are REJECTED.
- AC3: Negative or null amounts are REJECTED.
- AC4: monto_fiado > 0 without cliente_id is REJECTED.
- AC5: tipo_pago is never written literally; always via derivarTipoPago.
- AC6: Report satisfies contadoTotal + fiadoTotal === totalVendido, including
  MIXTO sales.
- AC7: Existing v4 sales are backfilled: CONTADO -> all to monto_contado,
  FIADO -> all to monto_fiado. Backfill is idempotent.
- AC8: All 81 existing tests remain green.

## Amendment (T001 finding) — counts with MIXTO

ResumenVentas has SEVEN fields, not four: totalVendido, gananciaTotal, numeroVentas, contadoCount, fiadoCount, contadoTotal, fiadoTotal.

Totals are unambiguous: a MIXTO sale contributes pesos to BOTH contadoTotal and fiadoTotal. Counts are not: a mixed sale is ONE sale that is both things.

Decision (Carol, option B): add a third counter mixtoCount. A sale increments exactly one counter, preserving the invariant contadoCount + fiadoCount + mixtoCount === numeroVentas, testable the same way as the peso invariant.

Other T001 findings:
- reportes.page.ts:47 initializes the resumen object inline with all zeroed fields, duplicating the default inside calcularResumenVentas. Adding mixtoCount requires touching BOTH.
- ventas.page.ts:60 declares tipo_pago with a literal union, not the TipoPago type. Adding MIXTO to the type will NOT produce a compiler error there; it must be changed by hand.
- The ganancia formula is also duplicated (ventas.page.ts gananciaEstimada getter and inside registrarVenta). NOT touched in Feature 007; noted as future cleanup.
- reportes.page.html and ventas.page.html have not been read yet; they must be read before T008 and T009.
