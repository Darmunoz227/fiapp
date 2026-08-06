# Feature 016 - Import a backup file (full replace)

## Problem

Feature 014 gave the merchant a complete backup file and no way to load it back. Today a merchant who loses their phone must send the .json to the developer and wait. The data is safe but unreachable without intervention.

## Decisions taken before writing this spec

FULL REPLACE, not merge. The imported file becomes the entire content of the database. Merging was rejected: it forces a policy for colliding ids on every table and makes the result impossible for a merchant to predict.

REJECT on schema mismatch. The file carries schema_version. If it does not match the app SCHEMA_VERSION the import is refused with a clear message. Migrating data out of a file is a separate problem, and a silently wrong import is worse than no import.

PROTECT before replacing. A full replace destroys clients, debts, inventory and sales. The app MUST export the current database automatically before touching anything, and MUST require an explicit typed confirmation, not a single Accept tap.

## Functional requirements

RF-01. The merchant picks a .json file from the device. The content is parsed and validated before any write.

RF-02. Validation MUST reject: unparseable JSON, a missing data key, a missing table key, and any schema_version different from the current SCHEMA_VERSION. Each rejection surfaces a message naming the reason.

RF-03. Before any destructive operation the app MUST generate a full export of the CURRENT database, reusing the Feature 014 path, and MUST NOT proceed if that export fails.

RF-04. The merchant MUST confirm by typing a word. A single tap is not enough for an irreversible operation.

RF-05. The replace MUST run inside ejecutarEnTransaccion. Either the whole import lands or nothing does. A half-imported database is the worst possible outcome.

RF-06. Insert order MUST respect foreign keys: clientes, productos, ventas, then transacciones, movim_inventario and venta_items. PRAGMA foreign_keys is ON per the constitution, so the reverse order fails.

RF-07. Rows MUST be inserted with every column named explicitly, tombstones included. deleted_at values from the file are preserved, per Principle III. Decision 032 recorded that crearTransaccion silently dropped five columns for months; the importer must not repeat it.

RF-08. Existing rows MUST be removed as part of the same transaction. This is the only place in the project where a physical DELETE is allowed, because the merchant is deliberately replacing the whole database; soft-delete would leave the old rows visible in the report.

RF-09. On success the app MUST report how many rows landed per table.

RF-10. Import is NOT blocked by the freemium guard, by explicit decision. It is a write, and Decision 033 blocks writes on expiry, but importing recovers data the merchant already owned. A merchant who lost their phone, reinstalled and finds the trial expired would otherwise hold their own backup and an unusable app. This follows the same reasoning Decision 033 used for abonos: blocking punishes the user instead of protecting the product. It opens no bypass, because a fresh install has nothing to import and the client limit still applies afterwards.

## Out of scope

Merging. Partial or per-table import. Migrating a file from an older schema. Cloud restore. Encryption.

## Acceptance criteria

AC-01. A file with a wrong schema_version is refused and nothing is written.

AC-02. Malformed JSON is refused with a message and nothing is written.

AC-03. A safety export exists on disk before the replace begins.

AC-04. Cancelling the typed confirmation leaves the database untouched.

AC-05. After a successful import the six tables contain exactly the rows from the file, no more and no fewer.

AC-06. A soft-deleted row in the file is still soft-deleted after the import, with its deleted_at intact.

AC-07. A three-line sale survives with one ventas row and three venta_items rows linked by venta_id.

AC-08. If the import fails midway the database is unchanged.

AC-09. With the trial expired the import still WORKS, and the client limit still applies to new clients created afterwards.

## Device verification, the only evidence

Karma stubs the platform to web and never executes a native transaction, a physical DELETE or a file picker. The suite can only prove the pure validator. On the Android Pixel_8: export from a populated database, wipe the app data, reinstall, import the file, and confirm every table matches the original counts including tombstones and the multi-line sale. Then attempt an import with a tampered schema_version and confirm the refusal writes nothing.
