# Feature 017 - Edit a product

## Problem

A product name typed wrong is permanent. There is no UPDATE productos anywhere in the app except the internal one that maintains costo_promedio. A merchant who misspells a product lives with it, or deletes and recreates it, losing the movement history attached to that id.

## Scope

Editable: nombre, precio_venta, minimo_stock.

Reached by SWIPING a row in the inventory list, following the gesture already used for clients on Home, and edited in a MODAL. The creation form sits above the list, so reusing it would force the merchant to scroll up and lose sight of which product they were editing. nueva-transaccion is the precedent for a modal in this project.

## Out of scope, and why

tipo_venta is NOT editable. Switching UNIDAD to PESO reinterprets quantities already recorded in movim_inventario: a product holding 5 units would start reading as 5 grams. Stock derives from the append-only log per Decision 009, so calcularStockDerivado would keep summing the same numbers with a different meaning and no row would change. The merchant would see a wrong number with no way to explain it. Excluded by explicit decision.

costo_promedio is NOT editable. It derives from the movement log and editing it by hand violates Principle III.

HISTORY IS NOT REWRITTEN. venta_items freezes precio_venta and costo_unitario by snapshot per Decision 031. Editing the price today does NOT change a sale from last month, and that is correct: the sale happened at the old price. This is stated explicitly so nobody later "fixes" it believing it is a bug.

## Functional requirements

RF-01. Swiping a product row reveals an Edit action that opens a modal preloaded with the current values.

RF-02. Only nombre, precio_venta and minimo_stock may be changed. tipo_venta is displayed as read-only so the merchant can see it, with no control to change it.

RF-03. Validation matches product creation: a non-empty name, a price greater than 0, and a minimum stock that is not negative.

RF-04. Money fields MUST use the pattern from Feature 015 and Decision 036: text input with inputmode numeric, live thousands separator, preloaded already formatted. minimo_stock is a QUANTITY and gets no separator.

RF-05. The UPDATE MUST write updated_at. The column has existed since the table was created and nothing has ever written it. This is the first feature to use it.

RF-06. The UPDATE MUST name its columns explicitly and MUST NOT touch costo_promedio, tipo_venta, created_at, deleted_at, store_id or created_by.

RF-07. Editing is a WRITE and MUST be behind the freemium guard, per Decision 033.

RF-08. No schema change. Schema stays at v7.

## Acceptance criteria

AC-01. Swiping a row reveals Edit, and the modal opens with the current values already loaded.

AC-02. Changing the name updates the list immediately and the movement screen shows the new name.

AC-03. Changing the price does NOT change any past sale. A sale registered before the edit keeps its original precio_venta and ganancia in venta_items.

AC-04. costo_promedio is unchanged after an edit.

AC-05. tipo_venta is unchanged after an edit and cannot be modified from the modal.

AC-06. updated_at holds a timestamp after an edit and created_at is untouched.

AC-07. Validation rejects an empty name, a price of 0 and a negative minimum stock.

AC-08. With the trial expired, editing is blocked.

## Device verification, the only evidence

Karma stubs the platform to web and never executes a native UPDATE. On the Android Pixel_8: register a sale of a product, then edit that product name and price, and confirm the sale in Reportes still shows the ORIGINAL price and ganancia while the inventory list shows the new name. Confirm costo_promedio and tipo_venta survive untouched, and that the movement screen header reflects the new name.
