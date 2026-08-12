# Feature 020 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS before every commit. wc -l before every git add.

T001. RED. DatabaseService reset spec: given web mock data in clientes, transacciones, productos, movim_inventario, ventas and venta_items, calling resetInventario must empty only productos, movim_inventario, ventas and venta_items, while preserving clientes and transacciones unchanged.

T002. GREEN. Implement resetInventario in DatabaseService. Web path clears only the four reset tables. Native path runs inside ejecutarEnTransaccion and performs physical DELETE in dependency order: venta_items, movim_inventario, ventas, productos. Do not touch clientes. Do not touch transacciones. Do NOT set venta_id to NULL.

T003. RED. Configuraciones UI spec: wrong confirmation text does not call resetInventario. Backup failure aborts and does not call resetInventario. Correct confirmation after successful backup calls resetInventario.

T004. GREEN. Add the reset option under Configuraciones -> Gestion de datos, below Exportar respaldo completo and Importar respaldo. Copy must clearly say that products, inventory movements and sales will be deleted, while clients, fiados and abonos stay.

T005. Safety flow. The button must: check puedeEscribir, generate full backup using generarArchivoRespaldo with a distinct prefix, abort if backup fails, require typed REINICIAR, call resetInventario, and show success message.

T006. Gate before device. grep for as any, @ts-ignore and $any returns nothing. grep -c this.db.run still returns 1. Build green. Full suite green with the new count recorded. Confirm no schema version change.

T007. DEVICE, cancel path. Android Pixel_8. With existing clients, debts, products, movements and sales, choose reset but type anything other than REINICIAR. Confirm nothing changes.

T008. DEVICE, happy path. Android Pixel_8. Before reset, export evidence counts. Run reset with REINICIAR. Confirm productos, movim_inventario, ventas and venta_items are 0. Confirm clientes and transacciones counts are unchanged. Confirm client debt remains visible.

T009. DEVICE, backup safety. Confirm a backup file exists before reset. If practical, simulate backup failure and confirm reset aborts without deleting anything.

T010. DEVICE, freemium. With trial expired, confirm reset is blocked by puedeEscribir.

T011. Write Decision 041 and update PROJECT_CONTEXT sections 3 and 10.
