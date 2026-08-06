# Feature 016 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS on screen before every commit. wc -l before every git add.

T001. Verify a file picker is available. Check whether @capawesome/capacitor-file-picker or an equivalent is installed; if not, install it and run npx cap sync android. No code before this resolves.

T002. RED. Validator spec: rejects a mismatched schema_version, rejects a missing data key, rejects a missing table key, rejects a non-array table, accepts a well-formed payload. Each refusal returns a NAMED reason, not a boolean.

T003. GREEN. Implement the pure validator in core. Zero framework imports.

T004. Add reemplazarTodo to DatabaseService: wrapped in ejecutarEnTransaccion, deletes the six tables in reverse dependency order and inserts in forward order, every column named explicitly, dentroDeTx true on every write. Verify with grep that this.db.run is still 1.

T005. Wire the safety export: reuse the Feature 014 path unchanged and ABORT the import if it fails.

T006. Configuraciones: file picker, validation, safety export, typed confirmation, replace, and a per-table row count on success.

T007. Gate before merge. grep for as any, @ts-ignore and $any returns nothing. grep -c this.db.run still returns 1. Build green. Full suite green with the new count recorded.

T008. DEVICE, happy path. Android Pixel_8. Export from a populated database including a soft-deleted client, a soft-deleted movement and a three-line sale. Wipe app data. Import the file. Confirm all six tables match the original counts, tombstones intact, sale lines linked.

T009. DEVICE, refusal path. Tamper with schema_version in the file, import it, confirm the refusal names the reason and NOTHING was written.

T010. DEVICE, ROLLBACK. Required, not optional. Corrupt a venta_items row so it references a nonexistent venta_id, import the file, and confirm the database is exactly as it was before: same row counts in all six tables, same clients, same debts. A half-imported database here means a merchant lost their business.

T011. DEVICE, freemium. With the trial expired, confirm the import still works per RF-10.

T012. Write Decision 037, recording the physical DELETE as an acknowledged constitutional exception, and update PROJECT_CONTEXT sections 3 and 10.
