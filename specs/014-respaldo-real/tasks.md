# Feature 014 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS on screen before every commit. wc -l before every git add.

T001. Verify @capacitor/filesystem is present in package.json. If absent, install it and run npx cap sync android. No code before this resolves.

T002. RED. Write the builder spec: six table keys present, metadata root fields present, empty tables yield empty arrays.

T003. GREEN. Implement the pure builder in core. Zero framework imports.

T004. RED. Builder spec: a row carrying deleted_at is PRESENT in the output with its value intact (AC-02).

T005. RED. Builder spec: a sale with three lines yields one ventas row and three venta_items rows (AC-03).

T006. GREEN. Extend the builder until T004 and T005 pass. Commit T002 to T006 together once green.

T007. Add the RAW readers to DatabaseService, one per table, no deleted_at filter, including the whole-table movim_inventario reader required by RF-03. Verify with grep that no existing getter was modified.

T008. Rewrite exportarRespaldoJSON: call readers, call builder, stringify, write with Filesystem, share the file URI. Delete the per-client loop and the text payload.

T009. Split cancellation from failure. Cancellation returns silently, any other error surfaces visibly (RF-06, AC-05).

T010. Gate before merge. Run: grep -c this.db.run must still return 1; grep for as any, @ts-ignore and $any must return nothing; full suite green with the new test count recorded.

T011. DEVICE. Android Pixel_8, database with clients, debts, products, movements, a soft-deleted client, a soft-deleted movement and a three-line sale. Export, send over WhatsApp, retrieve, parse. Record row counts per table and the file size in the Decision entry.

T012. Write Decision 035 and update PROJECT_CONTEXT sections 3 and 10, closing P6 and fixing the stale header that still says Features 1 through 9 and 96 tests.
