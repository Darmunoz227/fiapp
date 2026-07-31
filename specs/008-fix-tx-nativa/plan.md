# Plan - Feature 008

## Files touched

- src/app/core/database/database.service.ts  (wrapper + 13 call sites + crearTransaccion signature)

NOT touched: any UI file, any model, any schema, any spec except the new native-path note.

## Change 1 - the wrapper

    private async ejecutarRun(sql: string, values: any[], dentroDeTx = false) {
      return this.db.run(sql, values, !dentroDeTx);
    }

The flag is inverted on purpose: our callers think in terms of "am I inside a
transaction", while the plugin asks "should you open one". Keeping the inversion
in ONE place avoids repeating a confusing boolean at 13 call sites.

## Change 2 - route every db.run through it

Thirteen call sites. Three pass dentroDeTx = true:
  crearMovimientoInterno (341), insertVenta (406), actualizarCostoPromedioProducto (600)

Ten keep the default false:
  crearCliente (228), crearProducto (279), soft-delete/restore for movimiento
  (500/513), cliente (526/539) and transaccion (563/576), backfill (626/630)

## Change 3 - crearTransaccion gains an explicit context parameter

    async crearTransaccion(transaccion: Transaccion, dentroDeTx = false)

registrarVenta (415) calls it with true. cliente-detalle.page.ts:133 is unchanged
because the default preserves the standalone behavior.

## Not touched: db.execute

Table creation, migrations and PRAGMA statements run during initializePlugin,
before any of our transactions exist. They are out of scope.

## Risk

- Low in code terms: mechanical, no logic change, no schema change.
- HIGH in verification terms: the suite cannot prove any of it. A green run only
  proves we did not break the web mock path.
- Main risk is a missed call site. grep is the control, not the tests.

## Verification gate

    npm test -- --watch=false --browsers=ChromeHeadless
    npm run build
    grep -c "this.db.run" src/app/core/database/database.service.ts   -> must be 1

Then, and only then, the device run. The grep is the real gate here: if any
db.run remains outside the wrapper, the bug survives somewhere.
