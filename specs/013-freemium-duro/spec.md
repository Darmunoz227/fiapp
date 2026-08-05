# Feature 013 - Hard freemium block

## Problem

The freemium limit is toothless. puedeAgregarCliente is the ONLY guard in the app, so once the trial expires the merchant can still sell, fiar, collect, manage inventory and read reports forever with the clients they already have. A corner shop with 7 regulars never hits a wall and never contacts me. Worse, the APK can be forwarded over WhatsApp to other merchants, each getting a fully working POS.

## Approved decisions

- D1 - READS stay free. The merchant must always be able to see what they already recorded. Taking away access to their own data would punish the user, not protect the product.
- D2 - WRITES are blocked when the trial expires: new sale, manual fiado, inventory movement, new product, new client.
- D3 - ABONOS remain allowed even when blocked. An abono REDUCES debt and benefits the end customer, not the merchant. Blocking it would leave wrong balances for people who already paid.
- D4 - The install date stays in Preferences as it is today, accepting that reinstalling or clearing app data resets the 20 day counter. The 7 client limit is the one that actually bites, and with writes blocked the app stops being useful anyway. A per-device activation code is the real answer and is recorded as future work, not built here.

## Current state (verified in code)

- FreemiumService exposes obtenerEstado, puedeAgregarCliente and mostrarAlertaBloqueo. LIMITE_CLIENTES is 7, LIMITE_DIAS is 20.
- The block alert already offers a "Contactar a Diego" button opening WhatsApp.
- Premium is unlocked by five taps on the version label in Ajustes plus a password, and persists in Preferences.
- Write points found by grep:
  - ventas.page.ts line 210 registrarVenta
  - cliente-detalle.page.ts line 133 crearTransaccion, used for BOTH fiado and abono
  - inventory-movement.page.ts lines 135 and 180 crearMovimiento
  - inventory-list.page.ts line 56 crearProducto
  - nuevo-cliente.component.ts line 56 crearCliente, ALREADY guarded

## Functional requirements

- FR1 - Add a generic guard to FreemiumService, for example puedeEscribir, returning false and showing the existing block alert when the trial is expired.
- FR2 - Guard the sale flow in ventas.page.ts before any write.
- FR3 - Guard the manual fiado in cliente-detalle.page.ts, but ONLY when tipo is fiado. An abono must go through even when blocked, per D3.
- FR4 - Guard both crearMovimiento call sites in inventory-movement.page.ts.
- FR5 - Guard crearProducto in inventory-list.page.ts.
- FR6 - Leave every read path untouched: Home, Cliente Detalle, Inventario list, Reportes and the JSON export all keep working.
- FR7 - Reuse the existing alert and its WhatsApp button. Do not write a new message.
- FR8 - A premium licence lifts every guard, exactly as it does today.

## Acceptance criteria

- AC1 - With the trial expired, attempting a sale shows the block alert and writes NOTHING.
- AC2 - With the trial expired, a manual fiado is blocked but an ABONO succeeds.
- AC3 - With the trial expired, inventory movements and new products are blocked.
- AC4 - With the trial expired, Home, Cliente Detalle, Inventario and Reportes still load and display all existing data.
- AC5 - Unlocking premium restores every blocked action immediately.
- AC6 - Below the limits nothing changes: every flow behaves as before.
- AC7 - Verified BY HAND on Android, forcing the block by reaching 7 clients.

## Out of scope

- Per device activation codes.
- Server side validation.
- Moving the install date out of Preferences.
- Any schema change.

## Risks

- R1 - fiado and abono share the same crearTransaccion call. Discriminating by tipo is the whole of FR3; getting it wrong either blocks payments or lets debt through.
- R2 - Over guarding a read path would lock the merchant out of their own data, violating D1.
- R3 - The activation password is hardcoded in the JS bundle and readable by anyone who unzips the APK. This feature raises friction, it does not make the app tamper proof.
