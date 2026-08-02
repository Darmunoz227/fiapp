# Feature 011 - Implementation plan

## Blast radius (measured by grep)

- database.service.ts: 33 matches. Schema, migration, registrarVenta, backfill, obtenerVentas.
- ventas.page.ts: 10 matches. Cart state and sale assembly.
- venta.model.ts: split into Venta and VentaItem.
- reportes-calculations.ts: ONE line, resumen.gananciaTotal += venta.ganancia.
- reportes.page.html: three lines, gananciaTotal, venta.ganancia, nombreProducto(venta.producto_id).
- movim-inventario, inventory pages, resumen-inventario: NOT affected, they carry their own producto_id.

## CRITICAL conflict found before coding

backfillMontosVentas at lines 627 and 631 reads precio_venta and cantidad FROM ventas. Feature 011 removes those columns. migrarEsquemaSiNecesario is a flat list that always runs, so after the rebuild the backfill would fail with no such column.

Mandatory ordering inside migrarEsquemaSiNecesario:
1. agregarColumnaSiFalta for monto_contado and monto_fiado (v5 steps, unchanged)
2. backfillMontosVentas (must run while the old columns still exist)
3. crearVentaItemsSiFalta
4. reconstruirVentasParaMultiItem

backfillMontosVentas must additionally guard itself: if ventas no longer has precio_venta, it returns immediately. Without that guard it breaks on any fresh v6 install.

## Phases, each ending green

- Phase 1 - Model. Split Venta and add VentaItem. No behavior change.
- Phase 2 - Schema. Create venta_items and its indexes in crearTablasSiFaltan. Additive only, nothing breaks yet.
- Phase 3 - Migration. Guard the backfill, then rebuild ventas inside a transaction. Idempotent and a no-op when already reduced.
- Phase 4 - Write path. registrarVenta accepts lines and movements. Every write declares dentroDeTx per Decision 028.
- Phase 5 - Read path. obtenerVentas joins its lines. Fix reportes-calculations and reportes.page.html.
- Phase 6 - UI. Cart with add, remove, edit quantity, per-line stock block.
- Phase 7 - Device verification and docs.

## Risks

- R1 - Table rebuild is the most invasive migration so far. Mitigation: single transaction, idempotent, verified in place on both platforms over a database that ALREADY contains sales.
- R2 - The backfill conflict above. Mitigation: explicit ordering plus a column guard.
- R3 - N lines multiply writes inside one transaction. Every db.run declares dentroDeTx.
- R4 - Web mocks (mockWebVentas) must mirror the new shape or the suite passes while the device breaks. This is exactly how the app stayed broken from Feature 4 to 8.

## Definition of done

All acceptance criteria met, 96+ tests green, in-place v5 to v6 upgrade verified on iOS and Android with real pre-existing sales, Decision 031 written, PROJECT_CONTEXT synced, merged to main.
