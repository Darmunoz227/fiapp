# Feature 012 - Implementation plan

## Strategy

Additive throughout. One nullable column, one new read method, one generalized filter, and rendering. No table rebuild, no manual transactions, none of the native minefield from Feature 011.

## Blast radius (measured by grep)

- database.service.ts: SCHEMA_VERSION line 26, migrarEsquemaSiNecesario, crearTransaccion line 465 (inserts only SIX columns), obtenerTransaccionesPorCliente line 706. Needs a new global obtenerTransacciones.
- transaccion.model.ts: add venta_id.
- ventas.page.ts lines 287-292: hardcoded concept, and must pass venta_id.
- reportes.page.ts: cargar() loads only ventas and productos. Needs clientes and transacciones.
- reportes-calculations.ts: filtrarVentasPorRango holds the HOY logic and must be generalized.
- reportes.page.html: renders no client and no transactions.
- cliente-detalle.page.html line 61: ALREADY renders concepto. No change needed there.

## Phases, each ending green

- Phase 1 - Schema and model. Add venta_id to Transaccion, add agregarColumnaSiFalta for transacciones.venta_id, bump SCHEMA_VERSION to 7, and fix the crearTransaccion INSERT so the column is actually written. Additive: nothing else changes behavior.
- Phase 2 - Read path. Add obtenerTransacciones with its web mock counterpart. Generalize the range filter to work on any record carrying fecha, and keep filtrarVentasPorRango working through it so existing tests still pass.
- Phase 3 - Concept generation. Build the fiado concept from the cart and pass venta_id on the linked transaccion.
- Phase 4 - Report rendering. Client name map, the separate debt-movements section, and the new summary totals kept OUT of totalVendido and gananciaTotal.
- Phase 5 - Device verification, Decision 032, PROJECT_CONTEXT sync, merge.

## Risks

- R1 - crearTransaccion inserts only six columns today and silently drops the tombstone fields. Adding venta_id to the model without updating that INSERT would leave the column always NULL, which would make every sale-linked transaccion look manual and double count the debt. Phase 1 must fix the INSERT in the same commit as the model change.
- R2 - Generalizing filtrarVentasPorRango can break the existing reportes-calculations specs. Adapt assertions, never delete cases.
- R3 - Karma covers calculations well but never renders the report nor writes natively. Concept generation and the new section must be confirmed on device.
- R4 - Web mocks must mirror the new shape, or the suite passes while the device breaks. Same trap as Features 4 through 8.

## Definition of done

All acceptance criteria met, suite green, verified by hand on Android and iOS including a v6 to v7 in-place upgrade, Decision 032 written, PROJECT_CONTEXT synced, merged to main.
