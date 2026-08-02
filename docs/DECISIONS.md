# FiApp — Decision Log

> Purpose: preserve the important product and architecture decisions so future chats, agents, and developers do not re-litigate or accidentally reverse them.
>
> Last updated: 2026-07-16

---

## Decision 001 — Use Spec-Driven Development

**Decision:** FiApp uses Spec-Driven Development with Spec Kit.

**Reason:** The project is increasingly complex and AI-assisted. Specs, plans, tasks, and analysis gates reduce hallucination risk and preserve context across chats.

**Implication:** Do not jump directly from idea to code. Use the SDD pipeline:

```text
constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement
```

---

## Decision 002 — Repository files are the source of truth, not chat memory

**Decision:** The project state must be recoverable from files in the repo.

**Reason:** Chat context can be lost. Agents can hallucinate if context is missing.

**Implication:** Keep specs, plans, tasks, project context, decisions, and supervisor rules in the repository.

---

## Decision 003 — Use supervisor-style AI workflow

**Decision:** AI assistants must be treated as interns/agents whose output requires review.

**Reason:** Multiple agents have made plausible but incorrect changes.

**Implication:** Always review actual files/diffs before clicking Keep, committing, or pushing.

---

## Decision 004 — Local AI vs cloud AI division of labor

**Decision:** Use Qwen 14B local primarily for specs, reasoning, planning drafts, and isolated snippets. Use Copilot for multi-file implementation.

**Reason:** Experiments showed local Qwen can reason and draft, but struggles with full integration and may hallucinate architecture. Copilot better respects the codebase for multi-file coding.

**Implication:** Save paid Copilot usage for high-risk implementation. Use local AI for thinking and drafts when appropriate.

---

## Decision 005 — Feature #1 soft-delete approach

**Decision:** Use logical delete via `deleted_at`, not physical delete.

**Reason:** Deletions must be recoverable and sync-compatible.

**Implication:** Active queries filter `deleted_at IS NULL`. Delete flows set `deleted_at`. Undo clears it.

---

## Decision 006 — Undo window behavior

**Decision:** Undo is immediate and temporary.

**Rule:** A delete undo action expires after about 5 seconds or when leaving the current screen/context. It does not survive navigation, backgrounding, or app restart.

**Reason:** This matches lightweight WhatsApp/Gmail-style undo without introducing a trash-bin feature.

**Implication:** Undo state lives in UI/feature-layer services, not in the database service.

---

## Decision 007 — Debt guard for deleting clients

**Decision:** A client can be deleted only when derived debt is not positive.

**Rule:** Block delete when `deudaTotal > 0`. Allow delete when balance is zero or negative.

**Reason:** Protects merchant money and prevents deleting clients with active debt.

---

## Decision 008 — Feature #1 migration strategy

**Decision:** Existing installs must be migrated safely.

**Implemented:** Schema version changed to 2, with version-gated migration adding nullable metadata/tombstone columns to existing `clientes` and `transacciones` tables.

**Reason:** `CREATE TABLE IF NOT EXISTS` alone does not update existing tables.

**Implication:** Every future schema feature must explicitly include migration strategy.

---

## Decision 009 — Inventory stock source of truth

**Decision:** Inventory stock is derived from the movement log.

**Rule:**

```text
stock = SUM(valid inventory movement deltas)
```

**Reason:** Avoids drift, supports offline-first, and preserves audit history.

**Implication:** Do not add a mutable stock field to `Producto` in the MVP.

---

## Decision 010 — No stock cache/projection in Inventory MVP

**Decision:** Do not implement a stock cache/projection in Feature #2 MVP.

**Reason:** There is no proven performance need yet. A cache adds complexity and risk of diverging from the movement log.

**Implication:** Use derived queries over `movim_inventario`. A future projection table may be considered only if performance data justifies it and it can be fully rebuilt from the log.

---

## Decision 011 — Negative stock behavior

**Decision:** Block negative stock by default.

**Rule:** Outbound movements such as `VENTA` and `MERMA` must be rejected if the quantity exceeds available derived stock.

**Reason:** Prevents unrealistic inventory, hidden registration errors, and incorrect profitability/reporting.

**Out of scope:** Role-based administrative override for negative stock is not implemented in this version.

---

## Decision 012 — Inventory adjustment semantics

**Decision:** In the UI, an adjustment receives the physical counted stock. Internally, the system stores the computed delta as the movement.

**Example:**

```text
Calculated stock: 10,000 g
Physical count: 8,500 g
Delta movement: -1,500 g
```

**Reason:** Merchants think in physical counts, but the architecture requires append-only log movements.

**Implication:** Store the delta as the movement effect, plus metadata for audit.

---

## Decision 013 — Adjustment audit metadata

**Decision:** Adjustment movements preserve audit metadata.

**Metadata:**

- calculated stock before adjustment
- physical count entered
- computed difference
- reason
- timestamp
- optional future actor_id

**Reason:** This proves what the user entered and how the system calculated the adjustment.

---

## Decision 014 — Weighable products stored in grams

**Decision:** Products of type `PESO` store quantities as integer grams.

**Rule:** Minimum precision for MVP is 1 gram.

**Examples:**

```text
2.350 kg -> 2350 g
0.125 kg -> 125 g
```

**Reason:** Integer storage avoids floating-point precision issues and simplifies validation, comparison, and testing.

**Implication:** UI may display kilograms, but persistence uses grams.

---

## Decision 015 — Movement types remain distinct

**Decision:** Inventory movements have distinct meanings.

Movement types:

- `COMPRA`
- `VENTA`
- `AJUSTE`
- `MERMA`

**Reason:** Sales, waste, and corrections affect inventory differently and must remain auditable.

**Implication:** Do not use `AJUSTE` as a generic bucket for sales or waste.

---

## Decision 016 — `actor_id` is future-ready but not active user management

**Decision:** Inventory movements may include nullable optional `actor_id` for future identity tracking.

**Reason:** Audit identity and roles are different concepts. The schema may prepare for future identity without building roles now.

**Implication:** Do not build users, roles, authentication, or authorization in Feature #2.

---

## Decision 017 — Product transformation/desposte out of scope

**Decision:** Product transformation, including butcher desposte/sub-products, is out of scope for Feature #2.

**Reason:** It is a complex future workflow and should not block the inventory MVP.

**Implication:** Do not build transformation movements now. Keep movement design flexible enough to add it later.

---

## Decision 018 — CSV/Excel import is deferred

**Decision:** Do not build CSV/Excel import in the inventory MVP.

**Reason:** It helps spreadsheet users but not all micro-merchants. Quick Add is more universal.

**Implication:** Use white-glove onboarding for the one merchant who already has Excel. Reconsider import only if multiple merchants request it.

---

## Decision 019 — Quick Add is preferred over CSV import for MVP onboarding

**Decision:** The inventory MVP should prioritize fast manual product entry / Quick Add over file import.

**Reason:** Quick Add serves Excel users, paper users, and merchants with no system.

**Implication:** Future inventory UX should favor rapid-fire product entry before building import tooling.

---

## Decision 020 — Implement inventory in small batches

**Decision:** Start Feature #2 implementation with the Foundational phase only.

**Reason:** Schema migrations touch existing merchant data and must be reviewed carefully.

**Implication:** Do not implement all 28 tasks at once. Start with T004-T008, review build/tests, commit, then continue by user story.

---

## Decision 021 — Always check migrations in plan and tasks

**Decision:** Every feature that changes schema must explicitly define migration behavior for existing installs.

**Reason:** AI agents repeatedly forgot migration strategy until prompted.

**Implication:** The supervisor must always check for schema version bump, idempotent migrations, and compatibility with existing devices.

---

## Decision 022 — Tests must be meaningful

**Decision:** Passing tests are only valuable if they assert real behavior.

**Reason:** Agents may accidentally or intentionally make tests pass by weakening them.

**Implication:** Review tests for real assertions such as `not.toHaveBeenCalled`, `toHaveBeenCalledWith`, expected counts, and state changes.

---

## Decision 023 — Current next step

**Decision:** Feature #2 is ready to implement after Analyze.

**Next recommended work:** Foundational implementation only:

```text
T004-T008
```
**STATUS (2026-07-24): SUPERSEDED.** Feature #2 and its foundational phase (T004-T008) are complete and merged to main, along with Features #3-#5. This decision is retained as historical record only.

**Do not start with UI.** Database/schema/model foundation first.


---

## Decision 024 — Inventory movements are immutable; corrections via AJUSTE/MERMA

**Decision:** Movement log entries are not directly deletable or editable. Merchant errors are corrected with a new AJUSTE (physical count) or a compensating MERMA/COMPRA, always with a motivo.

**Reason:** The movement log is the single immutable source of truth (Constitution III). Deleting entries would corrupt derived stock, weighted-average cost history, and auditability.

**Implication:** Do NOT add direct movement deletion in US1-US3. Future improvement (out of scope, candidate Feature #3): soft-delete of movements using the existing deleted_at column (calcularStockDerivado already ignores movements where deleted_at != null). Must be traceable, never a physical delete.


---

## Decision 025 — T027 review: inventory naming already consistent, no refactor

**Decision:** T027 (refactor / naming consistency) was performed as a review. No code changes were made; naming across inventory-calculations.ts and database.service.ts is already consistent (crear*/obtener*/actualizar* verbs, matching model nouns, pure calculations delegated to helpers).

**Reason:** Refactoring working, fully-tested code (55 tests) with no genuine inconsistency would add risk (regression) for no functional benefit, and risks the over-implementation failure pattern.

**Implication:** T027 closed with zero code diff. The transaction-atomicity hardening (wrapping COMPRA cost-update + movement INSERT in a native SQL transaction) is deferred to a dedicated future task with a proper failure-path test; it is not part of Polish.

---

## Decision 026 — crearMovimiento is transactional; internal variant for composition

**Decision:** `crearMovimiento` is now atomic. Its body was extracted into a private
`crearMovimientoInterno` (which assumes the caller owns the transaction), and the public
`crearMovimiento` wraps that variant in `ejecutarEnTransaccion`. `registrarVenta` calls
the internal variant, since it already opens its own transaction.

**Problem it fixes:** For COMPRA, `crearMovimiento` performed two sequential writes with no
transaction boundary: (1) update `producto.costo_promedio`, then (2) INSERT the movement.
If step 2 failed, the cost was already persisted for a purchase that never entered the log.
Since every sale freezes `costo_unitario` from `costo_promedio`, a poisoned cost would
silently corrupt ganancia on all subsequent sales, with no UI path to repair it (AJUSTE
corrects stock, never cost).

**Why method separation over alternatives:** A naive `beginTransaction()` inside
`crearMovimiento` would break `registrarVenta` with "cannot start a transaction within a
transaction". Considered: (i) optional `tx?` parameter, (ii) reentrant transaction detection,
(iii) SAVEPOINT. Chose separation because nesting becomes structurally impossible rather than
runtime-guarded, the public API stays unchanged (UI call sites untouched), and it adds no
machinery we do not need.

**Side benefit:** The stock-guard reads now run inside the transaction, giving read-write
consistency for the negative-stock check.

**⚠️ Coverage limit — read this before trusting green:** The Karma suite stubs
`Capacitor.getPlatform()` to `'web'`, so `ejecutarEnTransaccion` always takes the in-memory
snapshot path and never calls `beginTransaction()`. **No test in this suite can detect a
nested SQL transaction.** During this feature, a mid-implementation state where
`registrarVenta` still called the public `crearMovimiento` produced a full green run (81
SUCCESS) while being broken on device. Defenses are code review (grep every call site) and
on-device testing — never the green alone.

**Implication:** Any future caller that already holds a transaction MUST call
`crearMovimientoInterno`. Any caller outside a transaction MUST call `crearMovimiento`.
Keep `ejecutarEnTransaccion` private. Feature 007 (pago parcial/mixto) builds on this
primitive and must follow the same rule.

---

## Decision 027 - Amounts are the source of truth; tipo_pago is a projection

**Decision:** A sale stores monto_contado and monto_fiado. tipo_pago becomes a PROJECTION derived from those amounts via derivarTipoPago, never written literally. This enables partial payment (abono): part cash, part credit in a single sale.

**Product rules (Carol):** ONE frozen ganancia for the whole sale - profit does not depend on how the customer paid. ONE VENTA inventory movement for all goods handed over. ONE fiado transaction for the UNPAID balance only. cliente_id required when monto_fiado > 0.

**Why amounts over a MIXTO label:** a label tells you a sale was mixed but not how many pesos entered the register. The merchant needs the cash figure. Amounts also let the report sum real money instead of counting sales by category.

**Bug this exposed and fixed:** registrarVenta gated debt creation on tipo_pago === FIADO. A MIXTO sale would hand over goods, record the sale, and never create the client debt - the unpaid balance simply vanished. The same shape of bug existed in the report: an if/else-if on tipo_pago left MIXTO adding to totalVendido but to neither category, so the columns silently stopped adding up. Both are now gated on the amounts, not the label.

**Float tolerance:** precio_venta is REAL, so the total is floating-point arithmetic and strict equality would reject valid sales over IEEE-754 noise (0.1 + 0.2 !== 0.3). The invariant uses Math.abs(sum - total) < 0.01. Colombian pesos are whole units in practice, so real business errors are measured in pesos while representation noise is around 1e-10. A guard test pins this: remove the tolerance and it goes red.

**Two-layer defense:** the UI captures only the abono and derives monto_fiado = total - abono, so the invariant holds by construction. The data layer recomputes the total itself and enforces the invariant anyway - it must never trust a caller-supplied total. Same philosophy as Decision 026: make it structurally impossible first, guard it regardless.

**Migration v4 to v5:** columns added through BOTH schema routes - crearTablasSiFaltan for new installs and migrarEsquemaSiNecesario for existing ones. Missing either leaves one population broken. Columns are nullable because SQLite cannot ADD COLUMN NOT NULL on a populated table; SQLite also cannot add a CHECK constraint after creation without a full table rebuild, which is why the invariant lives in code and not in the schema. backfillMontosVentas is a separate data step (agregarColumnaSiFalta is DDL only), idempotent via the IS NULL filter.

**Coverage limit - read before trusting green:** Karma stubs the platform to web, so NEITHER schema route, NOR the backfill, NOR the native INSERT is ever executed by the suite. The 96 passing tests say nothing about whether the migration works on a device. On-device verification over an existing v4 database is the only proof.

**Canonical helper:** calcularTotalVenta replaced two duplicated inline formulas. Any new consumer must use it - three copies of one formula is three places for rounding to diverge.

**Deliberately out of scope:** integer cents migration, later abonos against existing debt (those are transacciones), reconciling manual fiado vs venta fiado, multi-method payments, and whether precio_venta for PESO products is per gram or per kilo.

---

## Decision 028 - Every db.run must declare whether it runs inside a transaction

**Decision:** All db.run calls in DatabaseService go through a single private wrapper, ejecutarRun(sql, values, dentroDeTx = false), which inverts the flag once and passes it to the plugin. No call site touches this.db.run directly.

**Root cause:** @capacitor-community/sqlite has run(statement, values?, transaction?, ...) and that third parameter DEFAULTS TO TRUE. Every db.run opens its own transaction. Inside ejecutarEnTransaccion this produced, on device: "Error beginTransaction: failed rc: 1 message: cannot start a transaction within a transaction".

**Scope of the damage:** this predates Feature 006. registrarVenta has wrapped its writes in ejecutarEnTransaccion since Feature 004, so EVERY sale was broken on device from Feature 004 onward. Feature 006 only extended the breakage to COMPRA/MERMA/AJUSTE from the inventory UI. For four features the app could create clients and products and nothing else, and no one knew.

**Why an explicit parameter over hidden state:** crearTransaccion is called from registrarVenta (inside a transaction) and from cliente-detalle.page.ts (standalone). A fixed flag would break one of them. Tracking an internal txActiva boolean was rejected for the same reason as in Decision 026: declare the context, do not guess it. The caller knows; the service should not have to infer.

**The grep is the gate, not the tests:** after the change, grep -c "this.db.run" must return 1 and grep -c "this.ejecutarRun" must return 14. Any other number means a call site was missed and the bug survives on that path. No test can tell you this.

**Hypothesis that was WRONG, recorded so nobody repeats it:** the failure was initially assumed to depend on the schema migration leaving an implicit transaction open, because it first appeared right after a v3-to-v4 upgrade. It was then reproduced on a freshly created v4 database with no migration at all. The bug is structural, not state-dependent.

**What could NOT be verified, and why:** the v5 backfill of existing sales is untestable in practice. Because registrarVenta was broken on device since Feature 004, no real installation can contain rows in the ventas table. The backfill is kept as defensive code but has never processed a single row and never will.

**On-device verification performed (the only real proof):** the bug was reproduced on a clean simulator running ed0ba04, then a v4 database was built (client and product), the app was upgraded IN PLACE to this branch, and afterwards: the migration ran with no error, existing data survived, and the COMPRA that had just failed succeeded. Feature 006 flows (CONTADO, FIADO, MIXTO, manual fiado, stock-guard rollback) were verified separately on device.

**The uncomfortable lesson:** Decision 026 described this exact failure mode in the abstract - "no test in this suite can detect a nested SQL transaction" - and it still shipped, twice, across two features. Writing the warning down was not enough. Any feature touching the native write path MUST be run on a device before merge. A green suite is a precondition, never the evidence.

---

## Decision 029 - Colors must resolve through Ionic variables; brand chrome is fixed

**Decision:** No component may hardcode a color. Backgrounds, text and borders resolve through Ionic CSS variables so they follow the system appearance. The Home toolbar is the single exception: it carries a FIXED brand color and does not invert, the same way a logo does not.

**Root cause of the pilot bug:** global.scss already imported the dark.system palette, so dark mode was active and following the system all along. But six scss files and five HTML templates hardcoded light colors. In dark mode Ionic set the text to white while the cards kept a hardcoded white background: white on white, literally invisible. A pilot merchant could not use the app. Note the irony: dark mode being ACTIVE is what made it unusable. With it disabled the app would have looked plain but stayed readable.

**Scope was measured wrong, twice.** The spec estimated 40 hex values across 5 scss files. Reality: 6 scss files (home.page.scss lives outside features/ and was missed) plus 5 HTML files carrying inline styles. cliente-detalle was explicitly listed as OUT of scope because its scss file is empty - its colors were in the template all along.

**The control had holes.** The verification grep was grep -c "#" over *.scss only. It missed the word "white" (no hash) and every inline style in *.html. Two screens shipped broken past a control that looked sufficient. The correct control also covers *.html and the literal word white.

**Semantic vs decorative colors:** the low-stock badge maps to --ion-color-danger, not to a neutral text color, because red there MEANS something. Money owed moved from danger to warning: a normal debt is the business working, not an alert. Red is reserved for real problems and destructive actions.

**Also shipped here, beyond the original spec:** mixtoCount was finally rendered (computed since Feature 007 but never displayed, so the summary showed 6 sales with contado 3 + fiado 1); the business name got its own header row; the header was narrowed; the subtitle became "Mi Negocio en el Bolsillo" since the app is no longer only about fiados; and the summary now separates counts from pesos, because showing "Contado: 0 (COP7,000)" on one line was arithmetically right and humanly wrong.

**What the suite cannot see:** Karma does not evaluate prefers-color-scheme. Every readability criterion was verified by hand on the simulator in both appearances, toggled with xcrun simctl ui booted appearance dark.

**Still owed:** the pilot who reported this uses ANDROID. All verification here was iOS. Theming can differ; this must be checked on Android before considering the merchant unblocked.

**Found but NOT fixed here:** navigating from Home to a POS module shows both screens overlapping mid-transition. Visible in light mode, hidden in dark because both backgrounds are dark. Deliberately deferred to Feature 010 rather than stretching this feature further.
