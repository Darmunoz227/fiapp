# Feature 014 - Plan

## Approach

Read-only feature. No schema change, no migration, no write path touched. Schema stays at v7.

Three layers, in order:

1. DatabaseService gains backup-only RAW readers. One per table, no deleted_at filter, no ORDER BY beyond a stable one. They are separate methods from the existing getters and MUST NOT replace them: the app needs the filtered ones, the backup needs the raw ones. This is the only file that touches SQL.
2. A pure builder assembles the payload object from six arrays plus metadata. It lives in core and imports nothing from Ionic, Capacitor or SQLite, per Principle II. It is the only part the Karma suite can meaningfully test.
3. configuraciones.page.ts orchestrates: call the readers, call the builder, stringify, write with Filesystem, share the URI, and handle the outcome.

## Payload shape

Root fields: schema_version, app_version, exported_at as ISO string, and a data object holding the six arrays keyed by table name. Flat and table-oriented so Feature 015 can walk it without guessing.

## Cancellation vs failure

The current catch conflates them. The share call is isolated in its own try. A cancellation from the share sheet is identified and returns silently. Any other error, including read or write failures, rethrows to an outer handler that shows an explicit message. Decision 031: silent failures are banned.

## What the suite can and cannot prove

CAN: the builder produces six keys, includes tombstoned rows, preserves multi-line sales, embeds metadata.

CANNOT: native SQLite reads, Filesystem writes, the share sheet, WhatsApp delivery, file size behaviour. Karma stubs the platform to web. Device verification is the gate.

## Constitutional compliance

Principle I: standalone, TypeScript strict, no NgModule. No as any, no @ts-ignore, no $any.
Principle II: the builder is pure domain logic with zero framework imports.
Principle III: tombstones are preserved, not filtered. No physical delete, no write of any kind.
Principle V: roles are not implemented, so no gating applies. Recorded so it is not silently skipped.
Decision 033: reads stay free, so the freemium guard is NOT invoked here.
Decision 028 and 031: no db.run and no db.execute added. Read-only queries only. The gate grep must still return 1 for this.db.run.

## Risks

R1. Filesystem may not be installed. T001 resolves this before any code.
R2. Large payloads on a real merchant database. Out of scope to optimize per P7, but the device test must report the resulting file size.
R3. The share sheet cancellation signal differs between Android and iOS. The device test covers Android, which is what the pilot ships on.
