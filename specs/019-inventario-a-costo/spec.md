# Feature 019: Inventory value at cost

## Status

Draft

## Problem

The merchant can see stock and selling price but cannot see how much capital is tied up in inventory.

The app already stores costo_promedio and derives stock from the immutable movement log. The missing piece is displaying the inventory value at cost.

## Decision

Inventory value is calculated per product:

valor_a_costo = stock × costo_promedio

If stock is greater than zero and costo_promedio is zero, show:

"Sin costo registrado"

instead of "$0".

## Scope

Read-only feature.

No schema changes.
No database writes.
No migrations.
No freemium impact.

The value is displayed on each product row in Inventario.

## Functional requirements

RF-01. Display valor_a_costo on each inventory row.

RF-02. Calculate valor_a_costo = stock × costo_promedio.

RF-03. Format money using COP formatting already used elsewhere.

RF-04. When stock > 0 and costo_promedio = 0, show "Sin costo registrado".

RF-05. Read-only feature. No writes.

RF-06. valor_a_costo is derived data and must never be persisted.

## Acceptance criteria

AC-01. A product with stock 10 and costo_promedio 5000 shows $50.000.

AC-02. A product with stock > 0 and costo_promedio 0 shows "Sin costo registrado".

AC-03. A product with stock 0 shows $0 regardless of costo_promedio.

AC-04. No schema migration is required.

AC-05. Verified on Android Pixel_8.

AC-06. No new database columns, tables, or migrations are introduced.