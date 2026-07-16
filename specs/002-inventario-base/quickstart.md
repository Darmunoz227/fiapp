# Quickstart: Inventario base - productos y registro de movimientos de stock

## Prerequisites
- Node.js and npm installed.
- Project dependencies installed with `npm install`.
- The Angular/Ionic app available in the workspace.

## Validate the Feature

### 1. Run the automated checks
```bash
cd /Users/diegomunoz/FiApp-Comercial/fiapp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected outcome:
- The application builds successfully.
- The test suite passes, including inventory-focused unit coverage once implemented.

### 2. Verify product creation flow
- Open the inventory screen in the app.
- Create a product with `nombre`, `precio de venta`, and `tipo de venta`.
- Confirm the product appears in the list.

Expected outcome:
- The product is visible immediately after save.
- `UNIDAD` and `PESO` are both accepted.

### 3. Verify movement-driven stock updates
- Register a `COMPRA` for an existing product.
- Confirm the stock increases and the weighted-average cost updates.
- Register a `MERMA` with a reason.
- Confirm stock decreases and the reason is recorded.
- Register an `AJUSTE` from a physical count.

Expected outcome:
- The displayed stock is derived from the movement log.
- `VENTA` and `MERMA` cannot exceed available derived stock.
- `AJUSTE` stores the computed difference and audit metadata.

### 4. Verify weighable product handling
- Create a `PESO` product.
- Enter quantities using 1-gram precision in the inventory flow.
- Display values in kilograms.

Expected outcome:
- The product accepts weighable quantities without decimal storage drift.
- UI values remain understandable in kilograms.

## Notes
- The movement log remains the only source of truth.
- There is no stock cache or mutable stock field to reconcile.
- Product transformation/desposte is not part of this release.
