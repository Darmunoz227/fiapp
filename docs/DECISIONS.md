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

---

## Decision 030 - Never consume a CSS custom property without a fallback unless the project defines it

**Context:** six page stylesheets declared --background: var(--ion-background-color) with no fallback. Nothing in the project defined that variable. src/theme/variables.scss is empty; src/global.scss only imports Ionic CSS plus dark.system.css.

**Consequence:** in dark mode the variable is defined by dark.system.css, so it resolved and pages were opaque. In light mode it was undefined, var() became invalid at computed-value time, --background collapsed, and ion-content rendered transparent. The outgoing screen showed through the entering screen for the whole navigation animation.

**Root cause origin:** Feature 009 replaced hardcoded light colors with variables and dropped the fallback that Ionic's own rule carries: var(--ion-background-color, #fff).

**Decision:** delete the overrides and let Ionic's native rule apply. Do not redefine the variable in variables.scss, because angular.json loads it AFTER global.scss and media queries add no specificity, so a bare :root rule would override dark mode and regress Feature 009.

**Rule going forward:** if the project does not define a CSS custom property, do not consume it without a fallback.

**Evidence:** confirmed on a Pixel_8 Android emulator in light mode: pages carrying the override overlapped, while cliente-detalle, the only page without it, did not. After the removal, verified BY HAND on Android Pixel_8 AND on the iOS simulator, in BOTH appearances, across Home to Ventas, Reportes, Inventario and Configuraciones. No dark mode regression; the Home toolbar kept its fixed brand color per Decision 029.

---

## Decision 031 - Sale lines are the source of truth; the plugin defaults transaction to true on execute too

**Context:** a sale held exactly one product. Feature 011 introduced venta_items, one row per line, and reduced ventas to sale-level data only: id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha and metadata. Schema v6.

**Decision - single source of truth:** producto_id, cantidad, precio_venta, costo_unitario and ganancia were REMOVED from ventas. Keeping them would have recreated the ambiguity that motivated Decision 027: with three products, claiming the sale belongs to the first one is false. The cart code that filled the sale from lineaPrincipal was deleted, not adapted.

**Decision - amounts stay at sale level:** monto_contado and monto_fiado are NOT split per line. A customer paying part of a three-product sale is paying a total, not paying product A in full and product C not at all. Decision 027 stands unchanged.

**Migration:** SQLite cannot drop a NOT NULL constraint with ALTER TABLE, so ventas was rebuilt following the official SQLite table-rebuild pattern: foreign_keys OFF outside the transaction, DROP stale ventas_nueva, rebuild inside one transaction, COMMIT, foreign_key_check, foreign_keys ON in a finally. The rebuild is driven by the ACTUAL SHAPE of the table, checked with obtenerColumnas, NEVER by the version number, because SCHEMA_VERSION was already bumped before the rebuild existed and a version-driven guard would have skipped it forever.

**HARDEST LESSON - Decision 028 was incomplete.** It established that every db.run must declare its transaction context. This feature proved the SAME defect exists in db.execute: the plugin defaults transaction to true there as well. DDL statements running inside a manual transaction threw "Failed in beginTransaction Already in transaction", which killed initializePlugin and left the WHOLE APP unusable. Clients could not be created, and the failure had nothing to do with sales.

**Convention:** dentroDeTx and the plugin transaction flag mean OPPOSITE things. dentroDeTx true means a transaction is already open, so the plugin must receive transaction false. Always negate: execute(sql, !dentroDeTx), run(sql, values, !dentroDeTx). A helper called from both inside and outside a transaction MUST take the parameter; hardcoding either literal breaks one caller. This was gotten wrong twice before landing.

**Connection reuse:** initializePlugin called createConnection unconditionally and threw "Connection fiapp_db already exists" on every in-place upgrade, so asegurarEsquema never ran and the migration never executed. The app worked on clean installs and broke on upgrades, which is the worst possible shape for a bug because development never sees it. Correct order: isConnection, then retrieveConnection when present, then createConnection, and open only when isDBOpen says it is closed.

**Silent failures are banned:** the catch in initializePlugin logged and returned false, so isInitialized stayed false and every later call retried and failed in a silent loop, surfacing much later as a confusing constraint violation. It now rethrows. An initialization failure must be loud and immediate.

**Nullable amounts:** monto_contado and monto_fiado are typed number or null. This is deliberate, not an accident of the contract step: the columns are REAL DEFAULT NULL since v5 and the Feature 007 backfill exists precisely because rows with null amounts were possible.

**Downgrades are not supported:** running older code against a migrated database breaks the write path. Expected in SQLite, recorded here because validating a migration requires switching branches back and forth.

**Evidence:** verified BY HAND on Android emulator Pixel_8 AND on the iOS simulator. An in-place v5 to v6 upgrade preserved existing sales, each converted into exactly one line with identical amounts and ganancia. A three-product sale registered as ONE sale with three lines, stock decreased per product, MIXTO derived correctly, and per-line stock blocking left the remaining lines sellable. 106 tests green, but the suite proves NOTHING about any of this: Karma stubs the platform to web and never executes the native write path.

---

## Decision 032 - A transaction must record its ORIGIN; concept text is never an identity

**Context:** the merchant could not tell WHO owed money nor WHAT was sold on credit. Reportes never rendered the client although Venta.cliente_id was already stored, every credit sale wrote the same hardcoded concept "Venta a credito", and manual fiados lived in transacciones and never reached the ventas-based report. Observed on device: a client owed 11.000 while the report showed 9.000.

**The blocker:** a transaccion created by a credit sale looked IDENTICAL to a manual one. Same tipo, same cliente_id, same shape. Summing both would have counted every credit sale TWICE, which is worse than the original bug.

**Decision:** transacciones carries venta_id TEXT DEFAULT NULL as an explicit ORIGIN MARKER. NULL means registered by hand, a value means created by a sale. Schema v7 via the existing idempotent agregarColumnaSiFalta, no rebuild, no backfill, because NULL is the correct default for existing rows.

**Rejected - filtering by concepto:** the same feature replaces that literal with the real product names, so a text filter would have broken on the very commit that introduced it. Identity must never be inferred from display text.

**Rejected - inferring the link from cliente_id plus timestamp:** fragile, and wrong the moment two sales hit the same client in the same minute.

**Bug found while implementing:** crearTransaccion inserted only SIX columns and silently dropped created_at, updated_at, deleted_at, store_id and created_by. It had been discarding them since the table was created. Adding venta_id to the model without fixing that INSERT would have left the column always NULL, making every sale-linked transaccion look manual and double counting all debt. The INSERT now writes all twelve columns.

**HARDEST LESSON - initializePlugin had no concurrency guard.** isInitialized was only set at the END, so concurrent callers all entered and ran the migration in parallel. Feature 012 introduced Promise.all with FOUR parallel reads in the report page, and logcat showed every schema statement executed twice within the same millisecond: CREATE TABLE twice, CREATE INDEX twice, PRAGMA table_info twelve times, and ALTER TABLE ADD COLUMN venta_id twice. The second one threw duplicate column name, initializePlugin rethrew, the page load died halfway, and the manual fiados section rendered its empty state even though the rows existed in the database. Note that agregarColumnaSiFalta is idempotent in SEQUENCE but NOT under concurrency: it reads the columns and then writes, so two parallel callers both read before either writes. Fixed with a shared in-flight promise returned to concurrent callers and cleared in finally so a failure can retry.

**Rule going forward:** any method that mutates schema or global state must be safe under concurrent callers, not merely idempotent when called one after another.

**Evidence:** verified BY HAND on Android emulator Pixel_8 and on the iOS simulator, over an in-place v6 to v7 upgrade with real data. A manual fiado registered from Cliente Detalle appears in its own report section, sale-linked transacciones are excluded from it, the client name renders on credit sales, and a credit sale writes a concept naming its products. 117 tests green, but the suite proves NOTHING about the race: Karma stubs the platform to web and never runs a migration.

---

## Decision 033 - Reads stay free, writes get blocked, abonos always pass

**Context:** the freemium trial was toothless. puedeAgregarCliente was the ONLY guard in the app, so once expired the merchant could still sell, fiar, collect, manage inventory and read reports forever with the clients they already had. A corner shop with 7 regulars never hit a wall and never had a reason to make contact. Worse, the APK can be forwarded over WhatsApp and every copy was a fully working POS.

**Decision - reads stay free.** Home, Cliente Detalle, Inventario and Reportes keep working when blocked. Taking away access to data the merchant already recorded would punish the user, not protect the product.

**Decision - writes are blocked.** A new puedeEscribir guard reuses obtenerEstado and the existing alert with its WhatsApp button. It guards the sale flow, manual fiado, both inventory movement call sites and product creation. The guard runs ONCE per user action, never inside a loop, because obtenerEstado hits the database through contarClientes.

**Decision - ABONOS always pass.** crearTransaccion serves both fiado and abono, so the guard discriminates by tipo. An abono REDUCES debt and benefits the customer who is paying. Blocking it would leave wrong balances for people who already settled, which is worse than having no limit at all.

**Bypass found ON DEVICE and closed:** contarClientes excludes soft-deleted clients, so a merchant at the 7 client limit could delete one, drop to 6 and unblock. Deleting and recreating clients bypassed the limit indefinitely. Fixed by persisting a trial_bloqueado flag: once blocked, it stays blocked until premium is activated. The alternative of counting soft-deleted clients was rejected because a merchant who deletes someone BY MISTAKE would silently lose a slot forever.

**Consequence accepted:** the block is now permanent on that device. A merchant who reaches 7 clients on day one stays blocked from then on. That is the intent, and it must be explained when handing the app over.

**Honest limits:** the activation password is hardcoded in the JS bundle and readable by anyone who unzips the APK. The install date lives in Preferences, so reinstalling resets the 20 day counter. This feature raises FRICTION so the easy path is to contact me. It does not make the app tamper proof. A per-device activation code is the real answer and remains future work.

**Evidence:** verified BY HAND on Android. With the trial expired a sale, a manual fiado, an inventory movement and a new product are all blocked, an ABONO still succeeds, every read screen still loads, and unlocking premium restores everything. The bypass was reproduced and confirmed closed: blocked at 7 clients, deleted one, still blocked.

---

## Decision 034 - Constitutional amendment 1.1.0: temporary exception for the hardcoded activation password

**Decision:** the constitution is amended from 1.0.0 to 1.1.0. Restricciones de Alcance now carries an EXCEPCION TEMPORAL authorizing the hardcoded activation password shipped in Feature 013.

**Why an amendment and not a rollback:** the constitution listed "cualquier mecanismo con contrasenas de activacion hardcodeadas" as out of scope until a constitutional amendment. Feature 013 shipped exactly that and was merged without the explicit constitutional validation that Governance requires. The mechanism is sound for its purpose and reverting it days before the pilot would leave the freemium toothless, so the honest fix is to amend the text rather than pretend the rule was never broken.

**Why MINOR and not MAJOR:** the change modifies Restricciones de Alcance, a substantive section. No Core Principle was redefined or removed.

**Expiry condition:** the exception dies when per-device activation codes exist. At that moment the original restriction applies again with no further amendment.

**Process lesson:** Governance requires explicit constitutional validation in every code review. Feature 013 passed review without it. Constitutional compliance must be an explicit checklist item in every plan, not an assumed background condition.

---

## Decision 035 - A backup that omits four tables is not a backup; the file is the artifact, sharing is optional

**Context:** exportarRespaldoJSON read clientes and, per client, their transacciones. Four tables were missing: productos, movim_inventario, ventas and venta_items. A merchant losing the phone recovered who owed money and lost the entire inventory and every sale, while a button labelled "Exportar respaldo" said they were protected.

**Decision - raw readers, separate from the app getters.** Every existing getter filters deleted_at IS NULL. Reusing them would have dropped every tombstone, breaking the undo window of Decision 006 and the audit history of Principle III. Six leerCrudo methods were added that read the whole table with no filter. The existing getters were NOT modified: the app needs the filtered view, the backup needs the raw one.

**Decision - table-oriented payload with an embedded schema version.** The old shape nested transactions inside each client and had nowhere to put products or sales. The new file carries one key per table plus schema_version and exported_at, so Feature 015 can walk it without guessing. SCHEMA_VERSION was extracted from a private field in DatabaseService into its own module so the backup reads the SAME constant the migration uses. Hardcoding 7 would have made the file lie on the next migration.

**Decision - a file on disk, never text in the share sheet.** The old code passed the whole JSON as the text field of Share.share, which the share sheet and WhatsApp truncate silently. A truncated backup looks successful, which is worse than no backup. The payload is now written with Filesystem and shared as a file URI. Measured on device: 10138 bytes with 4 clients, 3 products and one three-line sale. A real merchant with months of history is orders of magnitude larger.

**Decision - the file is the artifact; sharing is a separate, optional step.** The old catch swallowed every error because cancelling the share sheet lands there, so a real failure looked exactly like a cancellation. Inspecting the plugin error message to detect cancellation was REJECTED for the same reason as in Decision 032: identity must never be inferred from display text, and the signal differs across platforms. Instead the write path and the share call have separate try blocks. A failure to read or write surfaces a visible toast. A failed share is silent, because the file already exists on disk. This was confirmed on device: an export whose share sheet was cancelled still produced a complete, valid file.

**Known limit:** the file is written to Directory.Cache, which Android may purge. Acceptable because it is shared immediately and can be regenerated at any time, but nothing should ever assume that file persists.

**Out of scope:** importing and restoring the file is Feature 015. Until it ships, a merchant holds a complete backup with no in-app way to load it back.

**Evidence, on Android Pixel_8 over a clean install:** 4 clientes including one soft-deleted, 2 transacciones, 3 productos, 8 movim_inventario including one soft-deleted MERMA, 1 venta with 3 venta_items. The exported file parsed as valid JSON and contained all six tables with those exact counts, tombstones preserved with their deleted_at values, and the multi-line sale intact as one sale row and three item rows. 130 tests green, but the suite proves NOTHING here: Karma stubs the platform to web and never executes Filesystem, the share sheet or a native SQLite read.

---

## Decision 036 - Money and quantity are different problems; extract the pattern before replicating it

**Context:** the merchant could not tell whether they had typed 2000 or 20000, and every numeric field started at 0 so the first keystroke was always a delete. On a POS used dozens of times a day this is friction on the critical path.

**Decision - extract, prove, then replicate.** The correct pattern already existed in nueva-transaccion: a text input with inputmode numeric, a string field starting empty, and handlers that reformat while preserving the caret. The caret loop was duplicated verbatim inside onMontoInput and handlePaste. It was extracted into two pure functions in shared/utils, nueva-transaccion was migrated to them FIRST with the suite green as the safety net, and only then was the pattern applied to the four money fields. Replicating first would have spread a pattern nobody had verified.

**Decision - two functions, not one.** onMontoInput derives the digit count from raw text plus caret position; handlePaste already knows the count and has no caret to derive it from. calcularPosicionCursor serves the first, posicionTrasNDigitos the second, and the first calls the second. A single signature would have fit only one caller.

**Decision - a pure function, not a directive.** A directive would have removed more boilerplate but manipulates the DOM, which Karma barely covers. The delicate part is mapping digits-before-caret onto a position inside a formatted string, and that is pure logic a test can pin down. Pages keep thin handlers.

**Decision - MONEY gets formatting, QUANTITY does not.** precio, abono, costo_unitario and precio_venta became strings formatted through formatCurrencyCOP. cantidad, conteo_fisico and minimo_stock did NOT: cantidad may be decimal for products sold by weight under Decision 014, and formatCurrencyCOP truncates decimals. Formatting a quantity as currency would have silently destroyed a weight-based sale.

**Decision - decimals were REJECTED for money.** Allowing a decimal point was considered and rejected: in Colombia the dot IS the thousands separator, and parseCurrencyInput strips every non-digit, so typing 1500.50 would have been stored as 150050 - a hundredfold error, not a rounding one. The same character cannot mean two things. inputmode moved from decimal to numeric so the keyboard no longer offers a separator the system would misread. Decimal money would require rewriting the formatters and amending the constitution, which mandates COP without decimals.

**Decision - quantities start empty via number-or-null.** Approved as a mid-feature scope amendment and recorded in the spec rather than slipped in. A type number input bound to null renders EMPTY while keeping decimals and the numeric keypad. cantidad in ventas stays at 1: a sensible default is not friction.

**Claim retracted:** this feature was specced with a paste bug in scope. That bug did not exist. handlePaste already applied setSelectionRange; the claim came from reading a truncated range of the file and concluding before verifying. RF-03 was retired in place rather than deleted, so the error stays visible.

**Test adaptation, not test deletion:** changing four fields from number to string and three from number to number-or-null broke 27 spec lines that assigned or asserted the old type. Every one was adapted to the new contract with values that survive the round trip. No assertion was removed or weakened, verified with git diff piped through grep for removed it blocks.

**Evidence:** verified BY HAND on the Android Pixel_8. All seven fields open empty. Typing five digits into a money field shows the separator live with the caret holding position. Selecting a product autofills the price already formatted. Quantity fields show no separator. A weight-based sale with a decimal quantity still works. Logcat clean. 138 tests green, but the suite proves NOTHING about any of this: Karma never renders an ion-input, never fires a real input event and never moves a caret.

---

## Decision 037 - A full replace needs a physical DELETE, a safety net and proof that rollback works

**Context:** Feature 014 gave the merchant a complete backup file and no way to load it back. A merchant who lost their phone held their own data and could not reach it without the developer.

**Decision - FULL REPLACE, not merge.** The imported file becomes the entire content of the database. Merging was rejected because it forces a collision policy per table and makes the outcome impossible for a merchant to predict.

**Decision - REJECT on schema mismatch.** The file carries schema_version and a mismatch is refused with a named reason. Migrating data out of a file is a separate problem, and a silently wrong import is worse than no import. The validator returns a NAMED reason rather than a boolean, so the UI can explain WHY without inferring anything from free text, per Decision 032.

**Decision - PHYSICAL DELETE, an acknowledged constitutional exception.** Principle III bans physical DELETE. This feature requires it: soft-deleting the old rows would leave them in the database and visible in reports, defeating the purpose of a replace. The exception is narrow - only the replace path, only inside its transaction, only because the merchant explicitly asked to overwrite everything. Recorded here rather than slipped through.

**Decision - the importer writes its OWN INSERTs.** crearCliente writes 5 of 10 columns and crearProducto 6 of 11; neither writes created_at, updated_at, deleted_at, store_id or created_by. This is the same defect Decision 032 found in crearTransaccion. Reusing them would have restored every soft-deleted client as ACTIVE and broken AC-06 silently. crearMovimientoInterno was also rejected, for a different reason: it RECALCULATES the weighted-average cost on every COMPRA, and the file already carries the correct value. An import must land the file as-is, with no business logic on top.

**Decision - import is NOT gated by the freemium.** Decision 033 blocks writes on expiry and this is the largest write in the app, but importing recovers data the merchant already owned. Blocking it would leave a merchant who lost their phone holding their own backup and an unusable app. Same reasoning the 033 used for abonos: blocking punishes the user instead of protecting the product.

**Decision - protection before destruction.** A safety export runs automatically before anything is touched, under a distinct name so it cannot be confused with a manual export, and the import ABORTS if that export fails. Confirmation requires TYPING the word REEMPLAZAR. A single Accept tap was rejected as too easy to hit without reading.

**Bug fixed while implementing:** ejecutarEnTransaccion snapshots five web mocks and omitted mockWebClientes. No earlier feature deleted clients inside a transaction so the hole never showed. Left unfixed, any future rollback test would have lied about clients.

**Known limit:** validation is STRUCTURAL. It checks that the six table keys exist and are arrays, not that every row is well formed. A hand-edited file with malformed rows passes validation and fails at insert time - inside the transaction, so nothing is lost, but the message is technical rather than helpful. Per-row validation was weighed and deferred: the app generates these files itself, so malformed rows imply manual tampering, and the rollback is the correct net for that.

**Evidence, on Android Pixel_8, all verified BY HAND:** a file with schema_version 99 was refused and wrote nothing. A file that is not JSON was refused. Typing anything other than REEMPLAZAR changed nothing. A valid import replaced the database exactly: the six tables went from 4/2/5/11/1/3 to the files 4/2/4/9/1/3, with 3 tombstones preserved and the three-line sale intact. THE ROLLBACK WAS PROVEN, not assumed: a file whose first venta_item pointed at a nonexistent venta_id failed with FOREIGN KEY constraint failed code 787 after inserting 9 rows, and the six table counts were IDENTICAL before and after. With the trial expired, a normal write was blocked and the import still succeeded. 144 tests green, but the suite proves NOTHING here: Karma stubs the platform to web and never opens a file picker, never runs a native transaction, never enforces a foreign key and never rolls anything back.

---

## Decision 038 - A product can be edited, but editing a price must never rewrite history

**Context:** a product name typed wrong was permanent. The only UPDATE productos in the app was the internal one maintaining costo_promedio. A merchant either lived with the typo or deleted and recreated the product, losing the movement history tied to its id.

**Decision - editable fields:** nombre, precio_venta and minimo_stock. Reached by SWIPING a row in the inventory list, the gesture already used for clients on Home, opening a MODAL preloaded with the current values. The creation form sits above the list and reusing it would force a scroll that loses sight of which product is being edited. nuevo-cliente was the modal precedent.

**Decision - tipo_venta is NOT editable.** Switching UNIDAD to PESO would reinterpret quantities already recorded in movim_inventario: a product holding 5 units would start reading as 5 grams, because stock derives from the append-only log per Decision 009 and no row would change. It is shown read-only so the merchant can see it. costo_promedio is not editable either: it derives from the log and editing it by hand violates Principle III.

**Decision - the UPDATE names its columns explicitly.** crearCliente writes 5 of 10 columns and crearProducto 6 of 11, the same defect Decision 032 found and fixed in crearTransaccion. The edit UPDATE touches only nombre, precio_venta, minimo_stock and updated_at, and this is the FIRST code in the project to write updated_at, a column that has existed unused since the table was created.

**HISTORY IS NOT REWRITTEN, and this is the point of the feature.** venta_items freezes precio_venta and costo_unitario by snapshot per Decision 031. Editing a price today does not touch a sale from before. Proven on device: Camista Espana was edited from 56000 to 60000, and its existing sale kept precio_venta 56000 and ganancia 26000 in venta_items while productos showed 60000. If that sale had changed to 60000, the merchants historical profit would be a lie.

**Decision - editing is gated by the freemium.** It is a write, so puedeEscribir guards the save, per Decision 033. Opening the modal is a read and stays free.

**Evidence, on Android Pixel_8, all BY HAND:** two products edited, both showing updated_at with a fresh timestamp and created_at untouched. The renamed product appears correctly in the list and the movement header. costo_promedio and tipo_venta survived unchanged. The pre-existing sale kept its original price and ganancia. With the trial expired, a save of 99000 was blocked and no product carried that price afterwards. Swiping did not break the routerLink to the movement screen. 150 tests green, but the suite proves NOTHING about the native UPDATE, the swipe, the modal or the frozen history: Karma stubs the platform to web.

---

## Decision 039 - The app writes the readable report itself; the two fiado concepts stay apart

**Context:** to understand their numbers the merchant exported the raw JSON backup and pasted it into an AI chatbot for a summary. Every figure already existed in reportes-calculations. The app should produce the readable report itself.

**Decision - presentation only.** construirTextoReporte is a PURE function beside reportes-calculations. It computes nothing from the database: it takes the ResumenReporte the Reportes page already holds, plus the business name and a range label, and returns Spanish text. Zero framework imports, per Principle II. Three Group A derivations are added inside it - venta promedio, margen and utilidad - all from figures already present, each guarded against division by zero.

**Decision - the text is built from the SAME resumen the screen shows.** The handler does not recompute. If it did, the shared text and the on-screen figures could disagree. Proven on device: HOY and TODO texts matched the screen for each range.

**Decision - the two fiado concepts are separated by MEANING, not by the word.** Sale-level fiado (monto_fiado) is money owed from a sale and sits under "Como te pagaron las ventas" next to contado. Manual fiado (transaccion with venta_id null, Decision 032) is a hand-written credit with no sale behind it and sits under "Movimientos de fiado aparte" next to abonos. They are NEVER summed. Decision 032 recorded that summing them double counts debt. The manual one is labelled "Fiados a mano": prestamo was rejected because it evokes a money lender, which is not the app focus, and the two headers keep the concepts apart without changing the word.

**Decision - tienda language.** "Venta promedio", not "ticket promedio", which is retail jargon a shopkeeper does not use. Emojis mark only the headline figures for quick scanning; the two fiado blocks are deliberately left without emoji so nothing competes with the header separation. Money through formatCurrencyCOP, no decimals per the constitution.

**Decision - shared as text, not a file.** Unlike the Feature 014 backup, which had to be a file because it was large and truncated, the report is ten short lines. Share.share text is exactly what arrives whole in WhatsApp. A cancelled share sheet stays silent, per Decision 035.

**Decision - not gated.** Reading is free per Decision 033, so no freemium guard. Profit and margin would be hidden from an EMPLOYEE per Principle V, but roles are not implemented; recorded, not gated.

**Deferred to backlog:** clientes nuevos, dias con mas ventas, and weekly or monthly evolution all need new queries the resumen does not carry; evolution over time is a chart and belongs to the postponed financial dashboard.

**Evidence, on Android Pixel_8, BY HAND:** with real sales, a manual fiado and an abono, the HOY and TODO reports were shared to WhatsApp. Every figure matched the Reportes screen for its range, the two fiado groups appeared under separate headers and were never summed, the five headline emojis rendered correctly, the text arrived whole, and cancelling the share sheet was silent. 155 tests green, but the suite proves NOTHING about the share sheet or WhatsApp delivery: Karma stubs the platform to web.
