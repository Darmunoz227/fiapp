# Feature 015 - T005 audit: consumers of the four money fields

Read-only audit performed before any type change.

## Result

NONE of the four fields is used in arithmetic directly from its binding. Every one of them is converted into a LOCAL variable through Number(...) first, and the arithmetic happens on that local. Changing the bound field from number to string is therefore safe as long as the conversion switches from Number(...) to parseCurrencyInput(...).

## Per field

ventas.page.ts precio: declared at 77 as 0. Converted at 95 and at 160 via Number(this.precio). Arithmetic at 101 uses the LOCAL precio, not the binding. Reset at 147 and 342.

ventas.page.ts abono: declared at 79 as 0. Converted at 127 via Number(this.abono) || 0. Note Number("") is 0 and parseCurrencyInput("") is 0, so the empty case behaves identically. Reset at 344.

inventory-movement.page.ts costo_unitario: declared at 59 as 0. Converted at 155 via Number(this.costo_unitario). Used at 172 through the LOCAL costoUnitario. Reset at 200. The literal costo_unitario: 0 at 127 is a different object and is NOT the form binding, so it stays untouched.

inventory-list.page.ts precio_venta: declared at 30 as 0. Converted at 65 via Number(this.precio_venta). Used at 91 through the LOCAL precioVenta. Reset at 110.

## Migration shape, identical for all four

Declaration goes from = 0 to = "". Number(this.X) becomes parseCurrencyInput(this.X). Reset goes from = 0 to = "". Validation that rejects values <= 0 keeps working because parseCurrencyInput returns 0 for empty or invalid input.
