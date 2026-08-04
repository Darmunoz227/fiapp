# Feature 012 - Fiado traceability in reports

## Problem

The merchant cannot tell WHO owes and WHAT was sold on credit. Three gaps, all found by inspection:

1. Reportes never renders the client. A FIADO sale shows an amount with no name, so the merchant has to go to Home and reconstruct it from memory. The data exists: Venta.cliente_id is already stored.
2. Every credit sale writes the SAME literal concept. ventas.page.ts line 292 hardcodes concepto: "Venta a credito", so Cliente Detalle shows three identical rows for three different debts. The UI is already prepared: cliente-detalle.page.html line 61 renders t.concepto with a "Sin detalle" fallback. Only the sender is mute.
3. Manual fiados and abonos live in transacciones and never reach the ventas-based report. Observed on device: a client owed 11.000 while the report showed 9.000. The 2.000 gap was a manual fiado.

## Schema change (minimal)

Transaccion already has tipo (fiado or abono) and concepto. Venta already has cliente_id. ONE column is added: venta_id TEXT DEFAULT NULL on transacciones, bumping schema to v7. NULL means the transaction was registered manually; a value means it was created by a credit sale. This is an additive ADD COLUMN handled by the existing idempotent agregarColumnaSiFalta, NOT a table rebuild. Existing rows stay NULL, which is the correct default, so no backfill is needed. Chosen over filtering by concepto (FR3 changes that string, so the filter would break immediately) and over inferring the link from cliente_id plus timestamp (fragile, breaks with two sales to the same client in the same minute).

## Approved decisions

- D1 - Concept format: the first two products plus a remainder. Example: "2 Carne molida, 1 Panela y 3 mas". A full list would be unreadable in the small paragraph Cliente Detalle uses.
- D2 - The report shows the client NAME, resolved through a Map exactly like nombrePorProductoId already does for products. Deleted clients render as "Cliente eliminado".
- D3 - Manual fiados AND abonos both appear, in a section SEPARATE from the sales summary. They are not sales: they have no product, no cost and no ganancia. Adding them to totalVendido would inflate it with money that is not merchandise, which is the exact confusion this feature removes.

## Current state (verified in code)

- reportes.page.ts: cargar() loads obtenerVentas() and obtenerProductos() only. recomputar() filters by range and computes the summary.
- reportes-calculations.ts: filtrarVentasPorRango holds the HOY logic (start of day to start of next day). ResumenVentas has totalVendido, gananciaTotal, numeroVentas, the three counts and contadoTotal/fiadoTotal.
- database.service.ts line 706: only obtenerTransaccionesPorCliente exists. There is no global read.
- ventas.page.ts line 287-292: builds transaccionFiado with the hardcoded concept.

## Functional requirements

- FR1 - Add obtenerTransacciones() to DatabaseService, returning all non-deleted transacciones ordered by fecha DESC, mirroring the existing per-client query and the web mock path.
- FR2 - Generalize the range filter so it can filter any record carrying a fecha, and reuse it for transacciones. Do not duplicate the HOY logic.
- FR3 - ventas.page.ts must build the fiado concept from the CART: first two lines as "cantidad nombre", joined by comma, plus " y N mas" when more lines exist. Never the old literal.
- FR4 - Reportes must render the client name on every sale that has a cliente_id.
- FR5 - Reportes must show a separate section listing manual fiados and abonos in the selected range, each with client name, concept, amount and date.
- FR6 - The summary must add fiadoManualTotal and abonoTotal, kept OUT of totalVendido and gananciaTotal.
- FR7 - Transactions created by a credit sale must NOT be double counted. A sale already contributes its monto_fiado; its linked transaccion must not be summed again as a manual fiado.

## Acceptance criteria

- AC1 - A credit sale of three products writes a concepto naming the first two plus the remainder, and Cliente Detalle displays it.
- AC2 - Two different credit sales to the same client produce two DISTINCT concepts.
- AC3 - Reportes shows the client name on FIADO and MIXTO sales, and "Cliente eliminado" when the client was soft-deleted.
- AC4 - A manual fiado registered from Cliente Detalle appears in the report separate section, and the 11.000 versus 9.000 gap is gone.
- AC5 - An abono appears in the same separate section, identified as abono.
- AC6 - totalVendido and gananciaTotal are UNCHANGED by manual fiados and abonos.
- AC7 - No double counting: a credit sale contributes its monto_fiado once and its linked transaccion is not added again.
- AC8 - The HOY range filters transacciones with the same day boundaries as ventas.
- AC9 - Verified BY HAND on Android emulator Pixel_8 and on the iOS simulator.

## Out of scope

- Paying down debt with later abonos. That is P3, a separate feature.
- Editing the concept by hand.
- Any schema change beyond the single venta_id column.
- Reworking the Cliente Detalle layout.

## Risks

- R1 - Double counting was the main correctness risk and is now RESOLVED by design: transacciones.venta_id distinguishes origin explicitly. A credit sale contributes its monto_fiado once, and its linked transaccion is excluded from the manual section because venta_id is not null. FR7 and AC7 guard this. Note that crearTransaccion currently inserts only six columns and does not even persist the tombstone fields, so its INSERT must be updated or venta_id will never be written.
- R2 - Karma covers the calculation layer well, but the concept generation and the report rendering must still be confirmed on device.

## Additional requirements from the schema decision

- FR8 - Add venta_id TEXT DEFAULT NULL to transacciones via agregarColumnaSiFalta, and bump SCHEMA_VERSION from 6 to 7.
- FR9 - Add venta_id to the Transaccion model as an optional nullable field.
- FR10 - Update the crearTransaccion INSERT to persist venta_id. It currently lists only six columns.
- FR11 - ventas.page.ts must set venta_id on the transaccionFiado it builds, linking it to the sale being registered.
- FR12 - The report separate section must include ONLY transacciones whose venta_id IS NULL. Those are the manual ones.
