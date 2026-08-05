# Feature 014 - Real backup (export only)

## Problem

The Configuraciones screen offers a backup button that does NOT back up the business. exportarRespaldoJSON reads clientes and, per client, their transacciones. Four tables are missing: productos, movim_inventario, ventas and venta_items. A merchant who loses the phone recovers who owes money and loses the entire inventory and every sale, while believing they were protected.

Three further defects were found while reading the code and are IN SCOPE, because fixing the table list alone would not produce a usable backup:

1. The payload travels as TEXT inside Share.share. Long text is silently truncated by the share sheet and by WhatsApp. Adding four tables multiplies the volume and makes truncation likely. A truncated backup looks successful.
2. The structure is client-oriented, shaped as perfil plus movimientos. There is nowhere to place products or sales, and no schema version, so the file cannot be interpreted later.
3. The catch block swallows every error because a user cancelling the share sheet lands there. A real failure is therefore indistinguishable from a cancellation. Decision 031 states that silent failures are banned.

## Scope

Export only. Restoring the file into the app is Feature 015 and is explicitly OUT of scope here.

## Functional requirements

RF-01. The export MUST include all six tables: clientes, transacciones, productos, movim_inventario, ventas, venta_items.

RF-02. The export MUST read RAW rows, without the deleted_at IS NULL filter. Every existing getter filters tombstones out. Soft-deleted rows are part of the history under Principle III and drive the undo window of Decision 006. Backup-only readers are required; existing getters MUST NOT be reused.

RF-03. There is no reader for the whole movim_inventario table. The only query is filtered by producto_id. A raw whole-table reader MUST be added, and the export MUST NOT iterate product by product.

RF-04. The file MUST be table-oriented, one key per table, and MUST embed schema_version, app version and an ISO timestamp at the root. Nested client-shaped output is removed.

RF-05. The backup MUST be written to disk with Filesystem and shared as a file URI. Sharing the payload as text is forbidden.

RF-06. A cancelled share MUST be distinguished from a real failure. A failure MUST surface visibly to the merchant. A cancellation MUST stay silent.

RF-07. The export is READ ONLY. No table is created, altered or written. Schema stays at v7.

## Out of scope

Import and restore. Encryption. Cloud upload. Automatic scheduled backups. Any change to the freemium guard, since reading is always free under Decision 033.

## Acceptance criteria

AC-01. The generated file contains the six table keys, each an array, plus the metadata root fields.

AC-02. A soft-deleted client and a soft-deleted movement are both PRESENT in the file with their deleted_at value intact.

AC-03. A sale with three lines appears as one row in ventas and three rows in venta_items.

AC-04. The share sheet receives a file, and the file opens and parses as valid JSON after being sent through WhatsApp.

AC-05. Cancelling the share sheet shows nothing. A forced failure shows an explicit error message.

## Device verification, the only evidence

Karma stubs the platform to web and never runs native SQLite or Filesystem. The suite is a precondition, never proof. Before merge, on the Android Pixel_8 emulator, with a database containing clients, debts, products, movements and multi-line sales: run the export, send the file over WhatsApp, retrieve it and confirm it parses and contains every table with the expected row counts.
