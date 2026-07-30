# Plan — Feature 006

## Files touched

- src/app/core/database/database.service.ts       (refactor + wrapper)
- src/app/core/database/database.service.spec.ts  (new failure-path test)

NOT touched: inventory-movement.page.ts, any UI, any report code.

## Change 1 — rename + wrapper

Rename `async crearMovimiento(...)` to `private async crearMovimientoInterno(...)`.
Body stays byte-identical. Then add:

    async crearMovimiento(movimiento: MovimInventario): Promise<void> {
      return this.ejecutarEnTransaccion(() => this.crearMovimientoInterno(movimiento));
    }

## Change 2 — registrarVenta

Line 398: `await this.crearMovimiento(movimiento);`
becomes:  `await this.crearMovimientoInterno(movimiento);`

## Change 3 — failure-path test (RED first)

Karma runs on web, so `ejecutarEnTransaccion` takes the SNAPSHOT path.
The test must force a failure AFTER the cost update and verify the snapshot
restored producto.costo_promedio.

Primary approach: spy on the movement array push to throw.

    spyOn(service['mockWebMovimInventario'], 'push')
      .and.throwError('simulated insert failure');

Then: expect crearMovimiento(COMPRA) to reject, and assert
obtenerProductoPorId('p1').costo_promedio still equals the ORIGINAL value.

If that spy proves fragile, fallback: temporarily stub the platform check or
inject a failing write. Decide during T001 — do not invent new production code
just to make the test convenient.

## Note on the existing ROLLBACK test (spec.ts:349)

That test forces failure via the stock-insufficient guard, which throws BEFORE
any write occurs. It proves "nothing persists" trivially. It does NOT cover a
mid-transaction failure. Our new test is genuinely additive, not a duplicate.
Do not delete or weaken the existing test.

## Risk

- Low. No schema change, no migration, no UI change.
- Main risk is a missed call site; grep verified there are exactly 3.

## Verification gate

    npm test -- --watch=false --browsers=ChromeHeadless
    ng build

Expect TOTAL: 81 SUCCESS before any commit.
