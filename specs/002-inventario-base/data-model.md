# Data Model: Inventario base - productos y registro de movimientos de stock

## Persistence and Migration Notes
- The schema version is `3` for this feature.
- Existing merchant installs at schema version `2` must pass through a version-gated migration.
- The migration creates `productos` and `movim_inventario` with `CREATE TABLE IF NOT EXISTS` so it is safe on both fresh and existing installs.
- Both tables include the standard metadata columns: `created_at`, `updated_at`, `deleted_at`, `store_id`, and `created_by`.
- `movim_inventario.cantidad` is stored as an `INTEGER`.
- `movim_inventario.producto_id` references `productos(id)` and relies on the app-wide foreign-key enforcement already enabled in SQLite connections.

## Producto
Represents a sellable inventory item.

### Fields
- `id`: Unique product identifier.
- `nombre`: Display name of the product.
- `precio_venta`: Sale price shown to the merchant.
- `tipo_venta`: `UNIDAD` or `PESO`.
- `minimo_stock`: Configurable low-stock threshold.
- `costo_promedio`: Derived weighted-average cost.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.
- `deleted_at`: Optional logical deletion timestamp if the product ever needs soft-delete support.
- `store_id`: Optional store scope for future expansion.
- `created_by`: Optional creator reference for future expansion.

### Persistence Notes
- Stored in the `productos` table.
- Includes the standard metadata columns required for synchronized, future-proof records.

### Rules
- The product does not own mutable stock as source of truth.
- Stock is derived from the associated movement history.
- For `PESO`, display values in kilograms while storing quantities in grams elsewhere in the model.

### Relationships
- One `Producto` has many `MovimientoStock` records.

## MovimientoStock
Represents a historical inventory event that changes derived stock or cost.

### Fields
- `id`: Unique movement identifier.
- `producto_id`: Owning product reference.
- `tipo`: `COMPRA`, `VENTA`, `AJUSTE`, or `MERMA`.
- `cantidad`: Quantity affected by the movement, stored as an integer.
- `costo_unitario`: Unit cost recorded for the movement.
- `motivo`: Optional explanation, especially for corrections or waste.
- `fecha`: Movement timestamp.
- `actor_id`: Optional nullable audit identity reserved for future user management.
- `stock_calculado_anterior`: Snapshot metadata for AJUSTE only.
- `cantidad_fisica`: Snapshot metadata for AJUSTE only.
- `diferencia_calculada`: Snapshot metadata for AJUSTE only.

### Persistence Notes
- Stored in the `movim_inventario` table.
- Includes the standard metadata columns required for synchronized, future-proof records.
- Uses a foreign key to `productos(id)`.
- For products of type `PESO`, `cantidad` represents grams; for `UNIDAD`, it represents whole units.

### Rules
- Derived stock is the sum of valid movements.
- `VENTA` and `MERMA` cannot exceed available derived stock.
- `COMPRA` increases derived stock and participates in weighted-average cost recalculation.
- `AJUSTE` records the difference between physical count and derived stock.
- For weighable products, quantity is stored in grams as an integer with 1-gram precision.

### Relationships
- Each `MovimientoStock` belongs to one `Producto`.

## ResumenInventario
Derived view used for display and validation.

### Fields
- `producto_id`: Product reference.
- `stock_derivado`: Current stock computed from the movement log.
- `costo_promedio`: Current weighted-average cost.
- `stock_bajo`: Boolean state derived from `stock_derivado` and `minimo_stock`.

### Rules
- This is a derived view, not a persisted source of truth.
- It is recomputed from `MovimientoStock` and `Producto` data.
