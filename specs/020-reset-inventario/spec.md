# Feature 020: Inventory reset keeping clients and debts

## Status

Draft

## Problem

A merchant may need to restart inventory without losing customers or debts.

Today the only complete reset is Android app data deletion, but that deletes everything: clients, debts, products, inventory, sales, reports and backups.

The merchant needs a safer reset: wipe inventory and sales history while preserving who owes money.

## Decision

Reset inventory deletes:

- productos
- movim_inventario
- ventas
- venta_items

Reset inventory preserves:

- clientes
- transacciones

This means customer balances and debt history remain available, but product catalog, stock movements and sales history are restarted.

## Important consequence

Sales reports are reset because ventas and venta_items are deleted.

Client debt remains because transacciones are preserved.

This is intentional: the reset is for inventory and sales history, not for customer debt.

## Safety decision

This is destructive.

Before deleting anything, the app MUST generate a full backup using the existing backup path.

If the backup fails, the reset MUST NOT continue.

The merchant MUST confirm by typing:

REINICIAR

A simple Accept button is not enough.

## Physical DELETE exception

The project normally avoids physical DELETE.

This feature requires physical DELETE for four tables because the merchant is explicitly requesting a clean restart of inventory and sales.

The exception is narrow:

- only this reset path
- only after safety backup
- only after typed confirmation
- only inside one transaction

## Scope

Read/write destructive feature.

No schema changes.
No migrations.
No new tables.
No new columns.

## Freemium

Reset inventory is a write and destructive operation.

It should be behind puedeEscribir, per Decision 033.

## Functional requirements

RF-01. Add a merchant-facing option to reset inventory.

RF-02. Before deleting data, generate a full backup.

RF-03. If backup generation fails, abort the reset.

RF-04. Require typed confirmation: REINICIAR.

RF-05. Delete venta_items, movim_inventario, ventas and productos.

RF-06. Preserve clientes and transacciones.

RF-07. Run the reset inside a single transaction.

RF-08. Report success clearly to the merchant.

RF-09. No schema migration is introduced.

RF-10. Reset is blocked when the freemium write guard blocks writes.

## Acceptance criteria

AC-01. After reset, productos is empty.

AC-02. After reset, movim_inventario is empty.

AC-03. After reset, ventas is empty.

AC-04. After reset, venta_items is empty.

AC-05. clientes remain unchanged.

AC-06. transacciones remain unchanged.

AC-07. Customer debt remains visible after the reset.

AC-08. If the merchant cancels or types anything other than REINICIAR, nothing changes.

AC-09. If backup generation fails, nothing changes.

AC-10. Reset is blocked when the trial is expired.

AC-11. No schema version change.

## Device verification

Android Pixel_8 is required.

Before reset:

- create or use at least one client with debt
- have products
- have inventory movements
- have at least one sale
- export evidence counts

Run reset.

After reset:

- products count is 0
- inventory movements count is 0
- sales count is 0
- sale items count is 0
- clients count is unchanged
- transactions count is unchanged
- client debt remains visible
- backup file exists before reset
- cancelling confirmation changes nothing

## Schema finding

transacciones.venta_id is an origin marker, not a real foreign key to ventas.

The transacciones table only has a foreign key to clientes.

Therefore reset inventory MUST preserve transacciones unchanged, including venta_id values. Do NOT set venta_id to NULL. Doing so would make sale-linked debt look like manual fiado and would break the separation established in Decision 032.
