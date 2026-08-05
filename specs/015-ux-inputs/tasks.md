# Feature 015 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS on screen before every commit. wc -l before every git add.

T001. RED. Write the spec for the pure caret function: caret at start returns 0, caret in the middle maps onto the right position in the formatted string, caret at the end returns the formatted length, empty input returns 0.

T002. GREEN. Implement the pure function in shared/utils. Zero framework imports. Commit T001 and T002 together once green.

T003. Migrate nueva-transaccion: onMontoInput and handlePaste both call the extracted function and the duplicated loop is deleted. Behaviour must not change. Verify with git diff that no test was removed.

T004. Fix the paste bug: handlePaste applies the caret position it computes. Commit T003 and T004 together with the suite green.

T005. Audit every consumer of precio, abono, costo_unitario and precio_venta before changing their type. Record which ones do arithmetic on the bound value. No code until this is written down.

T006. ventas.page: precio and abono become text inputs bound to string fields that start empty, with the shared handlers.

T007. inventory-movement.page: costo_unitario receives the same treatment.

T008. inventory-list.page: precio_venta receives the same treatment, and limpiarFormulario stops resetting it to 0.

T009. Gate before merge. grep for as any, @ts-ignore and $any returns nothing. grep -c this.db.run still returns 1. Build green. Full suite green with the new count recorded.

T010. DEVICE. Android Pixel_8. For each of the four money fields: the field opens EMPTY, typing five digits shows the separator live with the caret holding position, deleting from the middle behaves, pasting lands the caret after the pasted digits. Then register a sale BY WEIGHT with a decimal quantity and confirm quantities were not broken.

T011. Write Decision 036 and update PROJECT_CONTEXT sections 3 and 10.
