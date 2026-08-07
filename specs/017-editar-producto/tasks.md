# Feature 017 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS on screen before every commit. wc -l before every git add.

T001. Add actualizarProducto to DatabaseService: explicit column list covering nombre, precio_venta and minimo_stock plus updated_at, with the web branch updating the mock. Verify with grep that this.db.run is still 1 and that costo_promedio and tipo_venta appear nowhere in the new statement.

T002. RED. Modal spec: rejects an empty name, rejects a price of 0, rejects a negative minimum stock, and calls actualizarProducto with the parsed values when everything is valid.

T003. GREEN. Build the modal under shared/modals, following nuevo-cliente. Preloads the product, shows tipo_venta read-only, applies the Decision 036 money pattern to precio_venta and leaves minimo_stock unformatted.

T004. Wrap the inventory list row in ion-item-sliding with an Edit option, copying the Home pattern. Confirm the existing routerLink to the movement screen still works.

T005. Gate the save action behind puedeEscribir, per Decision 033.

T006. Gate before merge. grep for as any, @ts-ignore and $any returns nothing. grep -c this.db.run still returns 1. Build green. Full suite green with the new count recorded.

T007. DEVICE, happy path. Android Pixel_8. Swipe a product, edit its name and price, confirm the list and the movement screen header show the new name and the price is stored formatted correctly.

T008. DEVICE, history intact. Register a sale BEFORE editing, then change the product price, then open Reportes and confirm the sale still shows the ORIGINAL price and ganancia. Export a backup and verify in the JSON that venta_items kept the old values while productos carries the new ones.

T009. DEVICE, untouched columns. After an edit, confirm costo_promedio and tipo_venta are unchanged and that updated_at now holds a timestamp while created_at did not change. Verify through an exported backup.

T010. DEVICE, freemium. With the trial expired, confirm editing is blocked.

T011. Write Decision 038 and update PROJECT_CONTEXT sections 3 and 10.
