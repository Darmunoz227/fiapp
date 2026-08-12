# Feature 020 - Plan

## Approach

Destructive but narrow reset.

The feature resets inventory and sales data while preserving customers and debt.

Delete:

1. venta_items
2. movim_inventario
3. ventas
4. productos

Preserve:

- clientes
- transacciones

The reset must run inside one transaction.

## Why this order

venta_items depends on ventas and productos.

movim_inventario depends on productos.

Therefore children must be deleted before parents:

venta_items before ventas
venta_items before productos
movim_inventario before productos
ventas before productos

## transacciones decision

transacciones are preserved unchanged.

transacciones.venta_id is an origin marker from Decision 032, not a foreign key to ventas. The schema confirms that transacciones only has a foreign key to clientes.

Do NOT set venta_id to NULL.

If sale-linked transacciones were turned into NULL venta_id rows, they would look like manual fiados and break the separation created in Decision 032.

## Safety flow

The UI must follow this order:

1. Check freemium write guard with puedeEscribir.
2. Generate a full backup using the existing backup path.
3. If backup fails, abort.
4. Ask for typed confirmation: REINICIAR.
5. Run reset inside one transaction.
6. Show success message.

No data is deleted before the backup exists.

## Physical DELETE exception

This feature requires physical DELETE on four tables.

This is a narrow constitutional exception:

- only this reset path
- only after backup
- only after typed confirmation
- only inside one transaction
- only because the merchant explicitly requested an inventory restart

## What the suite can and cannot prove

CAN:

- The reset method deletes the correct web mocks.
- clientes and transacciones remain untouched in web tests.
- The UI refuses wrong confirmation text.
- The UI calls the reset only after backup succeeds.

CANNOT:

- Native transaction rollback.
- Native foreign key behavior.
- File system backup on Android.
- Actual device reset.

Android Pixel_8 verification is the gate.

## No schema work

No schema version bump.
No migration.
No new table.
No new column.

## Risks

R1. A failed reset could leave a half-deleted database. Mitigated by one transaction and device verification.

R2. A missing backup would remove the merchant fallback. Mitigated by aborting if backup generation fails.

R3. If venta_id were nulled, sale-linked debt would become indistinguishable from manual fiado. Mitigated by preserving transacciones unchanged.

R4. Reports will reset because ventas and venta_items are deleted. This is intentional and must be explained in the confirmation copy.

R5. Physical DELETE violates the normal soft-delete rule and must be recorded in Decision 041.
