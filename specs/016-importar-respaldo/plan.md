# Feature 016 - Plan

## Approach

This is the most dangerous feature in the project so far. It deletes the entire database and rebuilds it from a file. Everything about the design assumes it will go wrong at least once.

Four layers:

1. A PURE validator in core. It receives parsed JSON and returns either a typed payload or a named reason for refusal. Zero framework imports. This is the only part Karma can meaningfully test, and it is where the schema_version check lives.
2. A safety export. Reuses the Feature 014 path unchanged. If it fails, the import stops before touching anything.
3. A replace method in DatabaseService, wrapped in ejecutarEnTransaccion. It deletes all six tables and inserts the file contents in foreign-key order inside ONE transaction.
4. The Configuraciones page orchestrates: pick file, validate, safety export, typed confirmation, replace, report counts.

## Why ejecutarEnTransaccion and not a hand-rolled transaction

Decisions 028 and 031 recorded that the plugin defaults transaction to true on both run and execute, which broke every sale on device for four features and later killed initializePlugin entirely. ejecutarEnTransaccion is the primitive that survived that. The importer uses it and passes dentroDeTx true to every write, per the convention in Decision 031: dentroDeTx true means the plugin must receive transaction false.

## Order of operations

Delete in reverse dependency order, insert in forward order. Deleting clientes before transacciones would fail the foreign key check, and inserting venta_items before ventas would too.

## The physical DELETE exception

Principle III bans physical DELETE and this feature requires it. Soft-deleting the old rows would leave them in the database and visible in reports, which defeats the purpose of a replace. The exception is narrow: it applies ONLY to the replace path, only inside its transaction, and only because the merchant explicitly asked to overwrite everything. This must be recorded in the Decision entry as an acknowledged constitutional exception, not slipped through.

## What the suite can and cannot prove

CAN: the validator. Wrong schema_version, missing keys, malformed structure, and the shape of a valid payload.

CANNOT: the file picker, the native transaction, the physical DELETE, foreign key enforcement, rollback on failure, or that the merchant sees the right dialog. Karma stubs the platform to web. Device verification is the gate and it is not optional here.

## Constitutional compliance

Principle I: standalone, TypeScript strict. No as any, no @ts-ignore, no $any.
Principle II: the validator is pure domain logic with zero framework imports.
Principle III: tombstones from the file are preserved. The physical DELETE is an acknowledged exception, scoped to the replace transaction.
Decision 028 and 031: no raw db.run or db.execute. Every write declares its transaction context.
Decision 033: import is deliberately NOT gated, per RF-10.

## Risks

R1. A failure midway leaves a half-imported database: old data already deleted, new data only partly inserted. Mitigated by the single transaction, but "should roll back" is not evidence. APPROVED AS A HARD REQUIREMENT: before merge, the rollback MUST be proven on device by deliberately corrupting a file so it fails partway, importing it, and confirming the database is byte-for-byte what it was before. Decisions 028 and 031 recorded that this plugin behaves differently from the documentation on exactly this surface.
R2. The file picker behaves differently across Android versions. The pilot ships on Android and that is what gets tested.
R3. A large file could exhaust memory when parsed. Out of scope to optimise, but the device test should note the file size that worked.
R4. The safety export writes to Directory.Cache, which Android may purge. It is a last resort, not a guarantee, and the merchant must be told to keep their own copy.
