# FiApp — Decision Log

> Purpose: preserve the important product and architecture decisions so future chats, agents, and developers do not re-litigate or accidentally reverse them.
>
> Last updated: 2026-09-06

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

---

## Decision 040 - Inventory value at cost is derived, never stored

**Context:** the merchant could see product stock and selling price, but could not see how much capital was tied up in each product. The app already stores costo_promedio and derives stock from the immutable movement log, so the missing piece was presentation.

**Decision - value at cost is per product.** The inventory value is calculated as:

valor_a_costo = stock_derivado × costo_promedio

This is shown on each product row in Inventario.

**Decision - derived, never persisted.** valor_a_costo is a second-order derived value: stock is already derived from the movement log per Decision 009, and costo_promedio is stored on Producto. Persisting valor_a_costo would create another cache/projection and violate the same rule that rejected mutable stock and stock caches in Decisions 009 and 010. No table, column, migration, write path or schema version change was introduced.

**Decision - unknown cost is not zero value.** If stock is greater than zero and costo_promedio is zero, the row shows "Sin costo registrado" instead of "$0". This case is legitimate when stock was introduced through AJUSTE or initial physical count without a purchase movement. Showing "$0" would imply the inventory has no value; the truth is that the cost is unknown.

**Decision - stock zero stays zero.** If stock is zero, the displayed value is "$0" regardless of costo_promedio. There is no capital currently tied up in stock for that product.

**Decision - UI-level presentation only.** The implementation reuses the stock already available in the inventory list through resumenPorProducto and stockActual(producto.id). It does not query SQLite again, and it does not touch DatabaseService, freemium logic, migrations or the native write path.

**Evidence:** 158 tests green. Three unit tests cover: stock 10 with costo_promedio 5000 returning $50.000, stock greater than zero with costo_promedio 0 returning "Sin costo registrado", and stock 0 returning $0. Verified BY HAND on Android Pixel_8: a product with stock and cost displayed the calculated value, and a product with stock but zero cost displayed "Sin costo registrado". The manual stock-zero case was not forced on device because the normal UI requires positive movement quantities; it is covered by the automated test. The inventory screen remained readable.

---

## Decision 041 - Inventory reset is a narrow physical DELETE exception that preserves debt

**Context:** a merchant may need to restart inventory without losing customers or debts. Android app data deletion already wipes everything, but that is too destructive: it removes clients, debt, products, movements, sales and reports. The needed reset is narrower: wipe inventory and sales history while preserving who owes money.

**Decision - reset scope.** Reset inventory physically deletes exactly four tables: venta_items, movim_inventario, ventas and productos. It preserves clientes and transacciones. This means the product catalog, stock movement log and sales history restart, while client debt and abonos remain available.

**Decision - delete order.** The reset deletes child tables before parent tables: venta_items first, then movim_inventario, then ventas, then productos. venta_items depends on ventas and productos, and movim_inventario depends on productos, so the order avoids foreign key failures on device.

**Decision - transacciones are preserved unchanged.** transacciones.venta_id is an origin marker from Decision 032, not a foreign key to ventas. The schema confirms that transacciones only has a foreign key to clientes. Therefore the reset MUST NOT set venta_id to NULL. If sale-linked transacciones were nulled, they would look like manual fiados and break the separation created in Decision 032.

**Decision - physical DELETE exception.** Principle III normally avoids physical DELETE. This feature requires physical DELETE because the merchant explicitly asks for a clean restart of inventory and sales. The exception is narrow: only this reset path, only after a safety backup, only after typed confirmation, and only inside one transaction.

**Decision - protection before destruction.** Before deleting anything, the app generates a full backup using the existing backup path with the prefix fiapp-antes-de-reiniciar-inventario. If backup generation fails, the reset aborts. The merchant must type REINICIAR. Any other text cancels the reset and changes nothing.

**Decision - freemium gated.** Reset inventory is destructive and is a write, so it is blocked by puedeEscribir when the trial is expired, per Decision 033.

**Known consequence:** reports based on ventas and venta_items reset to empty because sales are intentionally deleted. Client debt remains because transacciones are intentionally preserved.

**Evidence, on Android Pixel_8, BY HAND:** the reset created a safety backup named fiapp-antes-de-reiniciar-inventario-2026-08-12.json. After reset, productos, movim_inventario, ventas and venta_items were all 0. clientes stayed 4 before and after. transacciones stayed 2 before and after. venta_id values in transacciones were preserved as [None, '6c6b450b-f917-4c59-aa58-a617f9a2345c'], proving sale-linked debt was not converted into manual fiado. With the trial expired, the reset was blocked. 162 tests green, but the suite proves NOTHING about the native transaction, the Android filesystem backup, or device foreign key behavior; those were verified on Pixel_8.

## Decision 042 - FAB de Home respeta el area segura inferior en Android

**Contexto:** durante el piloto del 2026-08-13, los 3 merchants Android
reportaron que el boton flotante + (agregar cliente) en Home quedaba
tapado en 2/3 por la barra de navegacion del sistema (modo 3 botones),
con la zona tapada no respondiendo al toque. En iPhone no ocurria porque
iOS no superpone una barra de sistema de la misma manera.

**Causa raiz:** ion-fab[vertical="bottom"] en home.page.html no
compensaba env(safe-area-inset-bottom). El toolbar superior si lo hacia
(Decision existente en el header), pero el FAB inferior no tenia
equivalente.

**Decision - fix CSS puntual.** Se agrego una unica regla en
home.page.scss:

ion-fab[vertical="bottom"] {
  margin-bottom: env(safe-area-inset-bottom);
}

Sin cambios en home.page.ts, sin logica de negocio, sin schema.

**Decision - sin test automatizado nuevo.** Al ser un defecto puramente
de presentacion, el gate fue la suite completa en verde
(TOTAL: 162 SUCCESS) mas verificacion BY HAND en dispositivo, siguiendo
el mismo patron que Decision 030.

**Evidencia:** reproducido en Android emulator con navbar forzado a modo
threebutton (com.android.internal.systemui.navbar.threebutton), que
replica el modo de navegacion real reportado por los merchants (el modo
gestural por defecto del emulador NO reproducia el bug). Antes del fix:
boton tapado 2/3, zona tapada sin respuesta al toque. Despues del fix:
boton completamente visible por encima de la barra, funcional en toda
su area. [Verificacion iPhone/simulador pendiente de confirmar]

**Nota tecnica:** el build requirio JAVA_HOME apuntando al JDK 21
embebido de Android Studio (Gradle toolchain), ya que el JDK 17 de
Homebrew del entorno no satisfacia el requisito del plugin
capacitor-filesystem.

## Decision 043 - Configuraciones respeta el area segura inferior en Android

**Contexto:** al construir Feature 022 (fiado por productos) se agrego una
lista de longitud variable (catalogo de productos) a Configuraciones. Esto
expuso un bug preexistente: el bloque final de creditos ("Desarrollado por
Diego Munoz") quedaba parcialmente tapado por la barra de navegacion de
Android en modo threebutton, y el scroll se detenia siempre en el mismo
punto sin importar cuantos productos hubiera en el catalogo. El mismo
sintoma se percibia como un lag de transicion al entrar a la pagina.

**Causa raiz:** .credits-block en configuraciones.page.scss no compensaba
env(safe-area-inset-bottom). El bug ya existia antes de Feature 022 pero
pasaba desapercibido porque con poco contenido el bloque de creditos
quedaba lejos del borde inferior.

**Decision - fix CSS puntual.** Se agrego una unica linea en
configuraciones.page.scss, dentro de .credits-block:

padding-bottom: env(safe-area-inset-bottom);

Sin cambios en configuraciones.page.ts, sin logica de negocio, sin schema.

**Decision - sin test automatizado nuevo.** Mismo criterio que Decision 042:
defecto puramente de presentacion, gate = suite completa en verde mas
verificacion BY HAND en dispositivo.

**Evidencia:** verificado en Android emulator (modo threebutton) con el
catalogo de fiado poblado con varios productos: antes del fix, "Desarrollado
por Diego Munoz" quedaba tapado y el scroll se sentia con un reajuste visual
brusco al llegar al final. Despues del fix, el texto es completamente
visible y la transicion se percibe fluida.

**Nota:** encontrado durante las pruebas manuales de Feature 022 (T004,
catalogo de fiado), pero es un fix independiente que aplica a Configuraciones
en general, no exclusivo del catalogo.

## Decision 044 - Fiado por productos es un fiado manual enriquecido, no una venta

**Contexto:** Feature 022, derivada del insight de piloto del comerciante
ambulante (2026-08-13). En el pico de demanda el comerciante NO usa ninguna
herramienta: memoriza los fiados y los reconstruye despues, con calma, en su
cuaderno. La oportunidad es reemplazar ese cuaderno post-pico con un flujo de
seleccion de productos por toque, mas rapido que escribir. Un prototipo fue
validado con el comerciante sin friccion.

**Decision - es un fiado MANUAL, no una venta.** El fiado por productos se
guarda como una transaccion con venta_id NULL (fiado registrado a mano,
Decision 032) mas concepto legible generado por la app (espiritu de
Decision 039) mas monto total. NO usa venta_items, NO usa movim_inventario,
NO llama registrarVenta. Meterlo por venta_items acoplaria al ambulante al
inventario (tipo_venta, costo_promedio, stock) que no gestiona y romperia
Principle III. Verificado en device: los fiados creados tienen venta_id NULL
y las tablas productos, movim_inventario, ventas y venta_items quedaron vacias.

**Decision - el catalogo vive en Preferences, no en una tabla.** El catalogo
de 10-15 productos (nombre, precio, emoji opcional) es configuracion editable
del dispositivo, no historial auditable. Se persiste en Preferences como JSON
bajo la KEY catalogo_fiado, siguiendo el patron de PreferencesService. Schema
v7 queda intacto, cero migracion. Se descarto reusar la tabla productos porque
tipo_venta solo admite UNIDAD y PESO, ambos atados a inventario.

**Decision - el precio queda congelado en la transaccion.** El monto y el
concepto se guardan al momento de fiar. Retirar o editar un producto del
catalogo despues NO altera fiados historicos, por diseno.

**Decision - el catalogo NO se gatea con freemium; el guardado del fiado SI.**
Configurar el catalogo es preparacion (como el nombre del negocio, no gateado).
Guardar un fiado es una escritura de negocio, sujeta al guard puedeEscribir
(Decision 033). Verificado en device: con trial expirado, el guardado del fiado
fue bloqueado hasta activar la licencia; el catalogo se pudo editar sin bloqueo.

**Decision - logica pura testeada, UI verificada a mano.** calcularTotalFiado,
construirConceptoFiado, serializarCatalogo y parsearCatalogo son funciones puras
con tests (RED antes de GREEN, parseo defensivo contra JSON corrupto). El CRUD
del catalogo y el flujo de 3 pasos son UI, verificados por device test siguiendo
la convencion del proyecto (PreferencesService y los handlers de AlertController
no se testean unitariamente).

**Decision - navegacion.** El flujo se inicia desde un boton destacado en Home
(no un icono mas en el header), por ser el flujo estrella post-pico. La gestion
del catalogo vive en Configuraciones, con un atajo contextual (empty-state con
boton a Configuraciones) si el catalogo esta vacio al entrar al flujo. Se
prohibio swipe como interaccion principal por el publico mayor.

**Evidencia, on Android emulator, BY HAND:** con el catalogo poblado, se
registraron varios fiados multi-producto (ej. "1 Carimanola, 1 Jugo Borojo,
2 Tinto" por $11.000, "3 Carimanola, 1 Jugo Borojo" por $17.000). El respaldo
JSON exportado confirmo: cada fiado con venta_id NULL, concepto legible correcto,
monto correcto, y las cuatro tablas de inventario/ventas vacias. El flujo viejo
de fiado a mano con texto libre sigue conviviendo sin romperse. 178 tests green,
pero la suite prueba SOLO la logica pura; el guardado nativo, el guard freemium
en device y la persistencia en Preferences se verificaron en el emulador.

## Decision 045 - Valor total del inventario es una suma derivada, nunca persistida

**Contexto:** Feature 023. El merchant ya veia el valor a costo POR PRODUCTO
(Feature 019, Decision 040), pero para saber cuanto capital tiene amarrado en
TODO el inventario tenia que sumar fila por fila a mano.

**Decision - suma derivada de segundo orden.** calcularValorTotalInventario
es una funcion PURA en inventory-calculations.ts que recibe un arreglo de
LineaValorInventario ({ stock_derivado, costo_promedio }) y devuelve la suma
de stock * costo por linea, empezando en 0. No accede a base de datos, no
tiene efectos, no conoce tipos de UI (Producto, ResumenInventario): la pagina
traduce su estado ya cargado (this.productos + stockActual + costo_promedio)
a lineas y le delega el calculo. Mismo corte que Decision 036.

**Decision - nunca persistido.** El total es segundo orden: el stock ya se
deriva del log inmutable de movimientos (Decision 009) y el valor por
producto ya se nego a persistirse (Decision 040). Persistir el total
recrearia el error de los caches de stock que esas decisiones ya rechazaron.
Se recalcula en cada render; el costo es un reduce O(n) sobre productos ya
en memoria, sin queries nuevas.

**Decision - un producto sin costo aporta 0, nunca NaN.** Si stock > 0 y
costo_promedio es 0 (la fila individual ya muestra "Sin costo registrado"
desde Decision 040), esa linea aporta stock * 0 = 0 exacto al total por
construccion aritmetica, sin condicionales especiales ni riesgo de NaN.
Un producto con stock 0 aporta 0 aunque tenga costo_promedio > 0.

**Decision - presentacion, no logica de negocio.** El bloque "Valor total
del inventario" se muestra en inventory-list.page.html con el MISMO gate
*ngIf que ya usa la lista de productos (productos.length > 0), asi que con
inventario vacio el bloque no aparece, igual que la lista. Estilos SOLO con
variables Ionic (--ion-color-medium, --ion-text-color, --ion-border-color),
sin colores literales nuevos, por Decision 029/030.

**Decision - sin schema, sin escritura, sin freemium.** No se toco
DatabaseService, ni el native write path, ni SCHEMA_VERSION. Confirmado por
git diff: cero cambios en core/database/database.service.ts. Leer es gratis
(Decision 033), asi que no hay guard freemium sobre este bloque.

**Evidencia, on Android emulator, BY HAND:** (1) con productos con costo
registrado, el total coincidio con la suma manual stock x costo_promedio;
(2) un producto con stock > 0 y costo_promedio 0 no rompio el total, que
siguio siendo un numero valido igual a la suma de las lineas con costo
conocido; (3) un producto llevado a stock 0 dejo de aportar al total y este
bajo exactamente en esa proporcion; (4) con inventario vacio (via reset)
el bloque de total no aparecio, igual que la lista, sin errores visuales;
(5) el bloque se leyo correctamente en modo claro y modo oscuro alternando
en caliente con adb shell cmd uimode night. 182 tests green (178 base + 4
nuevos de calcularValorTotalInventario), pero la suite prueba SOLO la
funcion pura; el cableado en la pagina y el render se verificaron en device.

**Nota de proceso:** el spec y plan iniciales de este feature fueron
redactados por un modelo agentico externo en evaluacion (GLM-5.3 Flash via
OpenRouter, presentado como "Ox Alpha"). El documento resulto solido y se
conservo, pero la ejecucion de codigo del mismo modelo fue descartada: narro
haber escrito tests RED y evidenciado el fallo sin haber tocado ningun
archivo de codigo, y la suite nunca fallo. El TDD real (RED verificado,
GREEN, cableado, device test) se realizo con supervision estricta
verificando cada paso contra git status, git diff y salida real de npm test,
nunca contra la narrativa del asistente.

## Decision 046 - Freemium: limite solo por tiempo, con recordatorios de compromiso

**Contexto:** durante el piloto activo, el limite de 7 clientes bloqueaba
la app antes de que el merchant pudiera evaluarla con su clientela real.
Diego decide que el UNICO limite del trial debe ser el tiempo. Ademas,
quiere fomentar mas compromiso del piloto durante el trial mediante
recordatorios suaves y no bloqueantes que le pidan compartir su experiencia.

**Decision - se elimina el limite por clientes.** LIMITE_CLIENTES (7) y
toda la logica de bloqueadoPorClientes se eliminan de
FreemiumService.obtenerEstado(). contarClientes() ya no se invoca dentro
de obtenerEstado(); el metodo en si permanece intacto en DatabaseService
porque se usa en otras partes del proyecto. El tipo EstadoFreemium.motivo
se simplifica de 'clientes' | 'tiempo' | 'ninguno' a 'tiempo' | 'ninguno'.

**Decision - el limite por tiempo sube de 20 a 25 dias.** LIMITE_DIAS pasa
de 20 a 25, dando mas margen al piloto para evaluar la app con calma.

**Decision - dos recordatorios de compromiso no bloqueantes.** En el dia 8
y en el dia 17 del trial (DIAS_RECORDATORIO = [8, 17]), si la licencia no
es premium y el trial no esta bloqueado, se muestra un Alert (a diferencia
de mostrarAlertaBloqueo, este NO bloquea nada) con un mensaje que agradece
la confianza y resalta el esfuerzo de desarrollo en pro del negocio del
merchant, sin usar la palabra "feedback". Botones: Cerrar / Escribirle a
Diego (reusa el mismo WHATSAPP_FEEDBACK_URL y contactarADiego() ya
existentes de mostrarAlertaBloqueo).

**Decision - maximo una vez por dia calendario.** Se persiste en
Preferences (KEY ultimo_dia_recordatorio_mostrado, mismo patron que
trial_bloqueado) la fecha calendario (YYYY-MM-DD) en que se mostro el
ultimo recordatorio. Si ya se mostro hoy, no se repite aunque la app se
abra varias veces. Se dispara solo en el DIA EXACTO (8 o 17), no en un
rango, para no repetir el mensaje todos los dias entre esos dos puntos.

**Decision - no gatea nada, es una notificacion.** verificarRecordatorioCompromiso()
no bloquea el arranque de la app (se llama con void, fire-and-forget, desde
app.component.ts) ni impide ninguna escritura. Es independiente del guard
puedeEscribir.

**Evidencia, on Android emulator, BY HAND:** se crearon mas de 7 clientes
sin ningun bloqueo (antes el 8vo cliente bloqueaba la app). Simulando la
fecha de instalacion 8 dias atras (editando Preferences via adb), el Alert
de compromiso aparecio con el mensaje exacto acordado, sin la palabra
feedback. Al cerrar y reabrir la app el mismo dia, el Alert NO volvio a
aparecer, confirmando la persistencia de ultimo_dia_recordatorio_mostrado.
El boton Escribirle a Diego reusa el mismo mecanismo de WhatsApp ya
verificado en produccion por mostrarAlertaBloqueo; no se pudo abrir
WhatsApp en este emulador especifico porque no tiene la app instalada,
limitacion del entorno de prueba, no del codigo. 189 tests green (183 base
+ 6 nuevos de verificarRecordatorioCompromiso), cubriendo dia 8, dia 17,
dia fuera de la ventana, licencia premium activa, trial bloqueado, y no
repeticion el mismo dia.

**Nota de proceso:** durante el device test se detecto que el emulador
tenia instalado un build de main.js del 26 de agosto, previo a todos los
cambios de este feature (incluida la Parte A). El sintoma fue que ni el
Alert ni el cambio de limite de clientes se manifestaban, sin ningun error
en logcat. Se confirmo la causa con evidencia (ls -la de www/main.js y
grep del codigo nuevo ausente en el bundle) antes de reconstruir con
ng build + cap sync + cap run, en vez de asumir un bug en el codigo fuente.

## Decision 047 - Duplicar producto: variantes por copia editable, sin schema

**Contexto:** Feature 025, insight de una merchant de ropa deportiva (audio
WhatsApp). Maneja articulos con muchas variantes de talla y color (ej. Buzo
Hombre en 12 referencias). Crear cada variante obligaba a reescribir TODOS
los campos del formulario cambiando solo una palabra del nombre, tanta
friccion que llevaba el inventario en cuaderno y transcribia despues. La
segunda merchant de ropa (no deportiva) tiene el MISMO problema y por eso
aun no completo su inventario en la app: 2 de 3 pilotos bloqueados.

**Decision - Fase 1 de 2: duplicar, no variantes formales.** Se descarto
por ahora modelar talla/color como atributos relacionados con schema nuevo
(producto base + variantes). Esa es una inversion de arquitectura mayor
(Fase 2, backlog) que requiere validar mas a fondo. Fase 1: cada variante
SIGUE siendo un producto independiente en la base de datos, pero su
CREACION parte de una copia editable de un producto existente, no de un
formulario vacio.

**Decision - reusar EditarProductoComponent con un modo.** Se añadio
@Input() modo: 'editar' | 'duplicar' (default 'editar'). En modo editar,
guardar() llama actualizarProducto sobre el mismo id, sin cambios. En modo
duplicar, guardar() genera un id nuevo (uuidv4) y llama crearProducto con
un Producto nuevo; el original queda intacto. Se evito crear un componente
nuevo para no duplicar la UI, la validacion de precio/nombre/stock ni el
manejo de cursor ya existentes.

**Decision - precio copiado pero editable, costo SIEMPRE 0.** El precio de
venta se copia del original pero queda editable antes de guardar, porque
Diego confirmo que puede variar (tallas extremas con descuento). El
costo_promedio del duplicado inicia SIEMPRE en 0, nunca se copia: el costo
se deriva de movimientos reales de compra (Decision 040), copiarlo sin
compra real detras rompería la trazabilidad. La merchant registra la
primera compra de la nueva variante como con cualquier producto nuevo.
tipo_venta se copia del original sin exponerse para editar (el modal ya no
lo expone). minimo_stock se copia editable.

**Decision - swipe como disparador, a diferencia del catalogo de fiado.**
Duplicar se agrego como una segunda ion-item-option (color tertiary) junto
a Editar (color primary) en el swipe ya existente de Inventario (Feature
17). Aqui SI se usa swipe, al reves que en el catalogo de fiado del
ambulante donde se prohibio: el publico de tiendas de ropa ya esta
entrenado en el gesto de editar, y cambiar de patron dentro del mismo
modulo confundiria mas. El titulo del modal cambia a DUPLICAR PRODUCTO
segun el modo para que la merchant sepa que esta creando, no editando.

**Fuera de alcance / conocido:** el foco automatico al final del campo
nombre se dejo fuera por ser cosmetico y de riesgo desproporcionado (manejo
de cursor en Ionic); el nombre igual queda pre-llenado y la merchant toca
al final para añadir la talla. No se creo relacion entre original y
duplicado; siguen 100% independientes. Schema v7 intacto, sin migracion.

**Evidencia, on Android emulator, BY HAND:** swipe mostro Editar y Duplicar;
Duplicar abrio el modal titulado DUPLICAR PRODUCTO con nombre, precio y
stock precargados; editar solo el nombre y guardar creo un producto nuevo
que aparecio con Sin costo registrado mientras el original quedo intacto;
un precio editado en el duplicado se respeto; duplicar el mismo producto
varias veces cambiando solo la talla fue notablemente mas rapido que crear
desde cero. 193 tests green (189 base + 4 nuevos de modo duplicar:
crearProducto en vez de actualizarProducto, costo 0 e id distinto,
tipo_venta copiado, y bloqueo freemium), sin regresiones en los tests
existentes de modo editar.

## Decision 048 - crearCliente y crearProducto escriben todas sus columnas con created_at automatico

**Contexto:** crearCliente escribia solo 5 de 10 columnas de la tabla
clientes y crearProducto solo 6 de 11 de productos. Las 5 columnas de
auditoria omitidas en ambos (created_at, updated_at, deleted_at, store_id,
created_by) quedaban en NULL. Es el MISMO defecto que Decision 032 corrigio
en crearTransaccion. Ademas web y nativo divergian: el mock web hacia spread
del objeto completo pero el INSERT nativo descartaba esas columnas.

**Por que ahora:** created_by es el cimiento para registrar quien creo un
registro (Administrador vs Empleado) de la futura feature de roles.
updated_at es requisito tecnico de cualquier futura sincronizacion entre
turnos con merge (decidir cual version es mas reciente es imposible sin el).
Pagar esta deuda ahora habilita ambos futuros sin comprometerse a construir
ninguno prematuramente.

**Decision - INSERT completo, patron de Decision 032.** Ambos metodos se
reescribieron para que su INSERT nativo liste TODAS las columnas de su tabla
y su array de values pase cada campo con fallback (?? null), igual que
crearTransaccion tras Decision 032.

**Decision - created_at se genera automaticamente.** Se calcula una sola vez
al inicio del metodo: const createdAt = objeto.created_at ?? Date.now(). Esa
MISMA variable se usa en la rama web y en la nativa, cerrando la divergencia
web/nativo. Si el objeto trae un created_at explicito se respeta; si no, se
genera. Los otros cuatro campos (updated_at, deleted_at, store_id,
created_by) se pasan con ?? null: se llenaran cuando se construyan roles y
la trazabilidad de edicion/borrado.

**Fuera de alcance:** no se cambio schema ni SCHEMA_VERSION (las columnas ya
existian DEFAULT NULL). No se migraron registros historicos: los
clientes/productos creados antes de este feature siguen con created_at null;
solo los nuevos traen timestamp. No se poblo updated_at en actualizarProducto
(edicion) todavia. No se toco crearTransaccion (ya correcto desde Dec 032).

**Evidencia, on Android emulator, BY HAND:** se detecto primero un falso
negativo por build viejo (Cliente/Producto Auditoria salieron con created_at
null porque el emulador tenia el APK previo al fix), confirmado y corregido
reconstruyendo antes de asumir un bug de codigo. Tras rebuild + cap sync +
cap run, se crearon Cliente Auditoria 2 y Producto Auditoria 2: el respaldo
JSON exportado mostro created_at con timestamp (1788225280776 y 1788225307673
respectivamente, el del cliente coincidiendo con su fecha_creacion por
generarse en el mismo instante), mientras todos los registros previos
(clientes y productos viejos) conservaron created_at null, confirmando que no
se migran historicos. 197 tests green (193 base + 4 nuevos: created_at
generado y created_at explicito respetado, para cliente y producto), sin
regresiones incluidos los tests de reemplazarTodo/respaldo.

## Decision 049 - PIN de administrador para acciones destructivas (Fase 1 de roles)

**Contexto:** dos merchants pidieron que el inventario no se altere sin
autorizacion del propietario. Trabajan por turnos con un familiar; el
"empleado" no es un extrano a vigilar sino familia que ayuda. El objetivo es
un candado de intencion: evitar que el familiar altere por error o impulso el
inventario, los precios o borre cosas.

**Alcance honesto de lo que protege:** un PIN guardado localmente NO es
seguridad criptografica; alguien tecnico con acceso al dispositivo podria
eludirlo. Pero esa no es la amenaza real. La amenaza es "que el familiar no me
desordene el inventario sin querer". Para ese problema (familia, confianza,
prevenir errores) el PIN simple es la herramienta correcta y suficiente. Se
documenta explicitamente para no vender una falsa sensacion de seguridad.

**Decision - app abierta, PIN por accion.** La app arranca generica para ambos
roles, NO en modo empleado. Solo las acciones DESTRUCTIVAS piden PIN en el
momento (por accion, no por sesion, por ser las mas peligrosas). Fase 1 gatea
exactamente TRES: reiniciar inventario, anular movimiento y editar producto.

**Decision - duplicar NO se gatea.** Duplicar producto es constructivo (crea
uno nuevo), no destructivo, y es justo el flujo que Feature #25 acelero para
las tiendas de ropa. Pedir PIN por cada talla mataria esa agilidad. Queda
fuera del gate a proposito.

**Decision - sin PIN configurado, todo abierto.** Si no hay PIN (null o
vacio), las tres acciones se ejecutan sin pedir nada. Esto evita bloquear a
merchants que aun no configuraron seguridad. La regla "sin pin permite" se
centraliza en la funcion pura verificarPin(ingresado, guardado): guardado
null/vacio devuelve true; con valor, true solo si ingresado.trim() coincide.

**Decision - SeguridadService con ejecutarConPin.** Un servicio inyectable
(providedIn root) encapsula "sin PIN ejecuta directo; con PIN pide el PIN via
AlertController y solo ejecuta si es correcto". Las tres pantallas solo llaman
seguridad.ejecutarConPin(() => accion), sin duplicar el AlertController. El
PIN se guarda en Preferences (KEY pin_administrador), mismo patron que el
resto. El merchant lo establece y cambia en una nueva seccion Seguridad de
Configuraciones; para cambiarlo se exige el PIN actual.

**Decision - PIN va antes del chequeo de negocio donde corresponde.** En
reiniciarInventario el PIN es la primera barrera (antes del respaldo). En
anularMovimiento el chequeo de COMPRA va ANTES del PIN: no tiene sentido pedir
PIN para una accion que se rechazara igual (las COMPRAS no se anulan, se
corrigen con AJUSTE por integridad del costo promedio ponderado).

**Fuera de alcance (Fase 1):** ocultar ganancias al empleado (requiere un
modelo de estado de sesion, no un PIN puntual); login, tabla de usuarios,
multi-dispositivo; poblar created_by con el rol (Feature #26 dejo el campo
listo pero no se usa aun).

**Evidencia, on Android emulator, BY HAND:** sin PIN, editar/anular/reiniciar
corrieron sin pedir nada y duplicar tampoco. Se configuro un PIN en la seccion
Seguridad. Con PIN: editar producto, anular movimiento (probado con MERMA, ya
que COMPRA se rechaza antes por diseno) y reiniciar inventario pidieron el PIN;
correcto procede, incorrecto cancela con aviso. Duplicar siguio sin pedir PIN.
Cambiar el PIN exigio el PIN actual. 202 tests green (197 base + 5 de
verificarPin). Fix de spec: el mock de PreferencesService en
configuraciones.page.spec.ts necesito getPinAdministrador resolviendo null
para que los 3 tests de reset siguieran verdes (sin PIN = ejecuta directo),
proveyendo la dependencia sin debilitar aserciones.

## Decision 050 - Editar cliente (nombre + telefono) sin reescribir historia; telefono pasa a opcional

**Contexto:** el merchant ambulante fia a clientes cuyo telefono no
siempre tiene al momento de crearlos; los completa de a poco. No existia
forma de editar un cliente: la unica via era eliminarlo (bloqueado si
deudaTotal > 0, Decision 007) o saldar la deuda. Friccion severa sobre
el flujo estrella de fiados.

**Decision - actualizarCliente nombra solo sus columnas editables.**
UPDATE clientes SET nombre, telefono, updated_at WHERE id AND deleted_at
IS NULL. created_at, fecha_creacion, habeas_data_flag, store_id NO se
tocan. Primer codigo del proyecto que escribe updated_at en clientes
(la columna existia sin uso desde Feature #1). Mismo corte que editar
producto (Decision 038) y patron de INSERT completo de Decision 048.

**Decision - reuso de NuevoClienteComponent con @Input modo.**
modo: 'crear' | 'editar' (default crear) + @Input cliente. En editar,
ngOnInit precarga nombre/telefono/habeas y guardarCliente bifurca a
actualizarCliente sobre el MISMO id. Se evito un componente nuevo para
no duplicar formulario ni validacion (espejo de Feature #25).

**Decision - editar usa puedeEscribir, NO puedeAgregarCliente.**
Editar es una escritura de negocio, no un alta. El flujo de crear queda
intacto con puedeAgregarCliente; editar se gatea con puedeEscribir
(Decision 033). SIN PIN: editar nombre/telefono no es destructivo, a
diferencia de las tres acciones de Decision 049.

**Decision - telefono pasa a OPCIONAL en ambos modos.** El boton Guardar
solo exige nombre y habeas data ([disabled]="!nombre || !habeasData").
Antes obligaba telefono, lo que contradecia el uso real: el merchant fia
sin tener el numero y lo agrega despues. habeas_data_flag se mantiene
obligatorio por ser la autorizacion legal de registro.

**Bug encontrado en device y corregido:** la proyeccion de Home
(cargarClientesYDeudas) construia objetos con solo id, nombre y
deudaTotal, descartando telefono. Al pasar ese objeto al modal, el
telefono precargaba vacio mientras el nombre si aparecia. Se agrego
telefono a la proyeccion. El titulo del modal era estatico "NUEVO
CLIENTE"; ahora es dinamico segun modo. La opcion de swipe usaba
icon-only sin texto; se agrego el label "Editar".

**Sin schema, sin migracion:** las columnas ya existian. Schema v7
intacto, SCHEMA_VERSION sin cambios.

**Evidencia, on Android Pixel_8, BY HAND y via respaldo JSON:** un
cliente creado a las 1788387300430 y editado a las 1788387480248 mostro
updated_at con timestamp y created_at/fecha_creacion intactos. Un
"Cliente sin telefono" se creo sin numero y luego se le agrego
"3145987875", con updated_at fresco y created_at sin cambios. El bloqueo
por trial expirado se verifico retrocediendo fecha_instalacion mas de 25
dias: la edicion quedo bloqueada por puedeEscribir. 207 tests green
(202 base + 2 datos + 3 UI). La suite prueba SOLO la rama web mock; el
UPDATE nativo y el guard freemium se verificaron en device.

## Decision 051 - Comprobante de fiado por WhatsApp, atajo directo con saldo actualizado

**Contexto:** tras registrar un fiado por productos (Feature #22), la
pantalla "Fiado registrado" solo ofrecia Ver deuda y Registrar otro.
Enviar el comprobante por WhatsApp obligaba a navegar al detalle del
cliente. El ambulante, en su flujo post-pico, necesitaba mandarlo de
una vez.

**Decision - extraer antes de replicar (Decision 036).** Se
encontraron 2 piezas de logica DUPLICADAS en el proyecto: el armado de
URL wa.me + limpieza de telefono (2 copias en cliente-detalle) y el
calculo de saldo fiado-menos-abono (repetido en Home y cliente-detalle).
Se extrajeron construirUrlWhatsApp (core/whatsapp) y calcularSaldoCliente
(core/fiado/saldo), ambas puras y testeadas, ANTES de escribir el boton
nuevo. cliente-detalle se migro a construirUrlWhatsApp sin cambiar el
TEXTO de sus mensajes existentes.

**Decision - wa.me directo, NO Share.share.** Se considero usar
Share.share (patron de Decision 039) por robustez ante numeros mal
formateados, pero se descarto: el proyecto YA tiene un patron establecido
(wa.me directo al chat del cliente) en cliente-detalle. Usar Share.share
en la pantalla nueva habria creado DOS experiencias distintas para el
mismo tipo de mensaje. Consistencia sobre preferencia personal.

**Decision - saldo se calcula DESPUES de guardar el fiado.**
enviarComprobante consulta obtenerTransaccionesPorCliente tras el guardado
ya ocurrido, por lo que el saldo mostrado INCLUYE el fiado recien
registrado (deuda vieja + este fiado), no el saldo previo.

**Decision - sin telefono, toast guia, NO wa.me roto.** Si el cliente no
tiene telefono se muestra un toast sugiriendo usar Editar (Feature #28)
en vez de intentar abrir una URL invalida. El boton SIEMPRE es visible
(no se oculta), decision tomada para maximizar descubribilidad ahora que
el telefono es editable.

**Decision - NO gatear con freemium.** Enviar un recibo es comunicacion,
no una escritura de negocio; el guard puedeEscribir ya corrio al guardar
el fiado. Gatear el envio habria sido redundante.

**Sin schema, sin cambios en BD:** cero migracion, git diff vacio en
database.service.ts.

**Evidencia, en Android (bundle verificado fresco via grep) y en
simulador iOS, BY HAND:** un fiado registrado a un cliente con telefono
abrio WhatsApp con recibo, nombre, total, concepto y saldo actualizado
correctamente. Un cliente sin telefono mostro el toast guia y no abrio
WhatsApp. Los botones preexistentes de cobro y recibo en cliente-detalle
siguieron enviando el MISMO texto de siempre tras la migracion al
helper compartido. 213 tests green (207 base + 3 construirUrlWhatsApp +
3 calcularSaldoCliente). La suite prueba SOLO la logica pura; el
window.open y el toast se verificaron en device/simulador.

---

## Decision 052 - Produccion: costo declarado multi-linea, y las tablas nuevas obligan a revisar TODA operacion que enumera tablas

**Contexto:** FiApp nacio para comerciantes de compra-venta. Dos prospectos
son PRODUCTORES (la hija del ambulante que produce por pedido, y una
panaderia referida por Bancamia). El costo de un producto fabricado no
puede derivarse de COMPRA (Decision 009/040): una empanada nunca se
compra, se produce. El diseno se apoya en evidencia de MERCADO (cientos
de productores evaluados en microfinanzas), no en un piloto puntual,
porque FiApp debe servir a miles de merchants.

**Decision - schema v8, dos tablas nuevas, espejo de ventas.** producciones
y produccion_items replican exactamente el patron ventas/venta_items
(Decision 031): cabecera + N lineas, CREATE TABLE IF NOT EXISTS sin
rebuild. Columna modo_produccion INTEGER DEFAULT 0 en productos, opt-in
explicito por producto.

**Decision - una produccion es MULTI-LINEA.** Cada linea lleva su propio
costo_unitario_declarado independiente, sin prorrateo entre lineas. Esto
invalida el supuesto inicial de "1 produccion = 1 producto": los
subproductos y ganchos de venta son comunes en panaderias de barrio, no
un caso nicho. El productor declara el costo "a ojo"; nunca se le pide
desglose de materia prima.

**Correccion al spec - fueron 3 OR y 1 bloque nuevo, no 4 OR.** El spec y
el plan dicen "4 cambios quirurgicos aditivos (||)". En el codigo real
solo 3 son un OR sobre la condicion de COMPRA (union type,
calcularStockDerivado, crearMovimientoInterno). El cuarto,
anularMovimiento, es un BLOQUE NUEVO separado y esa fue la decision
correcta: un OR habria mostrado el mensaje de COMPRA, y la PRODUCCION
necesita el suyo ("Las PRODUCCIONES se corrigen con un AJUSTE"). El
bloque quedo ANTES de ejecutarConPin, respetando la Decision 049: no se
pide PIN para una accion que se rechazara igual.

**Decision - AC-07 se interpreta HACIA ADELANTE.** "Editar el costo en
cualquier momento" significa declarar un costo fresco en la proxima
produccion, NO reescribir una produccion pasada. El
costo_unitario_declarado de un evento ya registrado es un hecho
ocurrido que ya alimento el promedio ponderado. Editarlo obligaria a
recalcular costo_promedio, destruyendo por la puerta de atras lo que
AC-04 protege por la puerta de adelante al bloquear la anulacion.
Mismo criterio que Decision 024 (movimientos inmutables) y Decision 038
(editar un precio no reescribe historia). CONSECUENCIA: T034 del
tasks.md quedo mal redactado ("editar el costo de un producto ya
producido") y debe reformularse a "registrar una segunda produccion con
costo distinto y confirmar que el promedio se mueve sin alterar la
produccion anterior".

**Decision - duplicar NO copia modo_produccion.** Deliberado, no efecto
colateral. Se documenta igual que la Decision 047 documento que
costo_promedio nunca se copia. Blindado con un test de caracterizacion
para que nadie lo revierta por accidente.

**Hallazgo central - una tabla nueva rompe TODA operacion que enumera
tablas a mano.** Schema v8 agrego 2 tablas y apararecieron CUATRO puntos
rotos, todos del mismo patron, ninguno previsto en el tasks.md:

1. ejecutarEnTransaccion snapshoteaba 6 mocks web para rollback y no los
   2 nuevos (mismo patron que Decision 037 documento para mockWebClientes).
2. resetInventario borraba 4 tablas sin las de produccion. En device
   fallaba con FOREIGN KEY constraint failed, porque produccion_items
   referencia productos y el PRAGMA foreign_keys esta ON. REGRESION real
   sobre una funcion que los merchants ya usan.
3. El respaldo omitia las 2 tablas nuevas: exactamente el problema que
   la Decision 035 titulo "un backup que omite cuatro tablas no es un
   backup". La produccion del merchant no viajaba en su respaldo.
4. reemplazarTodo no restauraba producciones ni items, y su INSERT de
   productos no escribia modo_produccion: al importar, todos los
   productos volvian en modo comerciante.

**Deuda del patron Decision 048 que seguia abierta:** crearProducto
tampoco escribia modo_produccion. Se corrigio en el mismo commit. El
orden de borrado e insercion es obligatorio: hijos (produccion_items)
antes que padres (productos) al borrar, y al reves al insertar.

**Limite estructural descubierto - la suite es CIEGA a la rama nativa.**
Dos bugs pasaron con la suite en verde porque los tests corren solo la
rama web: (a) el toggle de modo_produccion nunca se agrego al template
y modoProduccion era un round-trip cerrado; (b) el INSERT de
reemplazarTodo omitia el flag, pero el test pasaba porque la rama web
usa spread y conserva el objeto entero. REGLA: cualquier cambio que
toque SOLO la rama nativa (SQL, INSERT, DELETE) exige verificacion en
dispositivo. La suite no puede verlo.

**Divergencia web/nativo en modo_produccion:** el mock web guarda boolean
true, SQLite guarda INTEGER 1. Ambas conviven. Se contuvo en
filtrarProductosDeProduccion usando truthiness (!!valor), nunca === true.
Un === true habria pasado la suite y dejado el boton invisible en Android.

**Fix de spec sin debilitar aserciones:** editar-producto.component.spec.ts
nunca llamaba fixture.detectChanges(); su template jamas estuvo cubierto
en toda la vida del proyecto. Por eso el toggle ausente paso desapercibido.
Los tests nuevos lo llaman explicitamente (criterio Decision 022).

**Riesgo abierto, al backlog:** validarRespaldo compara schema_version por
igualdad exacta, asi que TODO respaldo exportado con v7 queda inservible
tras esta feature. No lo causo esta feature (se dispara con cualquier
cambio de schema) pero es la primera vez que ocurre con merchants en
piloto. Se asumio conscientemente: solo un merchant usa la app con
disciplina y Duplicar producto (Feature #25) hace barato recrear
inventario.

**Bug de UI encontrado en device:** el campo de costo no se veia como
campo (un 0 suelto sin caja). Causa: la pantalla reutiliza el .scss de
fiado-productos y el template usaba clases que ese archivo NO define.
Se reconstruyo con ion-item/ion-label. El styleUrls cruzado fue una
decision equivocada: dio falsa sensacion de tener estilos. Darle su
propio .scss queda al backlog.

**Evidencia, en Android emulator, BY HAND y via respaldo JSON exportado:**
un producto sin modo_produccion mostro CERO UI nueva y su flujo
COMPRA/VENTA/AJUSTE/MERMA quedo identico (AC-06, verificado ademas con
git diff: los 3 archivos del Home tienen CERO eliminaciones). Activado
el flag en Empanada y Arepa, el boton aparecio en Home. Una produccion
multi-linea de 10 Empanadas a 800 y 5 Arepas a 1200 dejo, en el JSON
crudo, modo_produccion=1 y costo_promedio 800 y 1200 respectivamente:
cada linea con SU costo, sin prorrateo (AC-01, AC-02). El ciclo
exportar -> reiniciar -> importar restauro producciones, items y el
flag, y el boton de Home reaparecio solo. 242 tests green (213 base +
29 nuevos).

---

## Decision 053 - Un respaldo debe sobrevivir al cambio de version y llevar la configuracion del negocio

**Contexto:** la Decision 052 dejo dos huecos anotados y esta feature los
cierra. (1) `validarRespaldo` comparaba `schema_version` por igualdad
EXACTA, asi que al pasar a v8 TODO respaldo anterior quedo inservible; el
unico merchant con uso disciplinado tenia un backup v7 que la app
rechazaba. (2) El catalogo de fiado vive en Preferences, no en SQLite, y
el respaldo solo cubria las 8 tablas: si el ambulante perdia el telefono,
perdia el catalogo que usa a diario.

**Decision - piso explicito de version, no compatibilidad universal.** El
validador acepta `schema_version` entre 7 y la actual. Se puede
garantizar que una TABLA ausente se rellene vacia, pero NO que las
COLUMNAS de una version vieja calcen: un respaldo v4 no tendria
monto_contado/monto_fiado (Decision 027). Prometer compatibilidad que no
podemos probar contradice la Decision 003. Subir el piso despues es
trivial; retirar una promesa rota no lo es.

**Costo asumido conscientemente.** Al rellenar tablas ausentes en vez de
rechazar, se pierde la capacidad de detectar un archivo v8 truncado al
que le falte una tabla. Se acepta: un JSON realmente truncado falla en
JSON.parse mucho antes de llegar al validador, y distinguir "falta por
vieja" de "falta por corrupta" exigiria un mapa de tablas por version.
Complejidad real a cambio de un caso improbable.

**Decision - viaja la configuracion del NEGOCIO; nunca el estado del
dispositivo, la licencia ni la seguridad.** De las 7 claves de
PreferencesService entran SOLO dos: `catalogo_fiado` (lo construyo el
merchant a mano) y `nombreNegocio` (aparece en los comprobantes de
WhatsApp). Quedan fuera con razon explicita:

- `pin_administrador`: iria en texto plano en un JSON que se comparte por
  WhatsApp. La Decision 049 ya admite que el PIN no es seguridad
  criptografica; ponerlo en un archivo compartible seria empeorarlo gratis.
- `licencia_premium`: convertiria el respaldo en una llave de activacion
  transferible.
- `fecha_instalacion` y `trial_bloqueado`: estado del dispositivo;
  restaurarlos moveria el trial de un telefono a otro.
- `ultimo_dia_recordatorio_mostrado`: efimero.

Esta regla debe citarse cada vez que se agregue una clave a Preferences.

**Decision - `config` va FUERA de `data` y es OPCIONAL.** `data` es el
espejo de las tablas SQLite y el validador lo recorre tabla por tabla;
mezclar una clave que no es tabla romperia ese contrato. Es opcional
porque un respaldo v7 no la trae y debe seguir siendo valido. Una
`config` presente pero invalida (primitivo, null o arreglo) se IGNORA sin
rechazar el respaldo: la configuracion es un extra, nunca un motivo de
rechazo.

**Decision - restaurar NUNCA borra con vacio.** Si el archivo trae el
catalogo vacio o no trae `config`, no se toca el catalogo actual. Un
respaldo viejo no debe destruir lo que el merchant construyo despues
(mismo espiritu que Decision 041: no borrar lo que nadie pidio borrar).

**Bug de UX encontrado en device:** tras importar, la pantalla de
Configuraciones seguia mostrando el catalogo viejo; el nuevo solo
aparecia al entrar a Registrar fiado, que recarga en ionViewWillEnter. El
dato estaba bien guardado, pero el merchant veia vacio y podia concluir
que la importacion fallo y repetir una operacion destructiva. Se corrigio
releyendo el catalogo desde Preferences (no asignando el objeto
importado) para que la pantalla muestre lo que QUEDO guardado, no lo que
creemos que se guardo.

**Aprendizajes de metodo, sin los cuales esta feature habria "fallado"
tres veces sin tener un solo bug:**

1. `npx cap sync` NO instala nada en el dispositivo; solo copia al
   proyecto Android. Instalar exige `npx cap run android`.
2. `npx cap run android` pide el dispositivo de forma INTERACTIVA. Con
   una tuberia (`| tail`) el prompt se pierde y el comando muere sin
   instalar. Usar `--target <emulador>` y nunca redirigir su salida.
3. Verificar el bundle con una cadena que YA existia en el codigo viejo
   (`catalogo_fiado`) da un falso positivo. Hay que elegir un string que
   solo exista en el codigo nuevo (`nombre_negocio`).
4. La marca de tiempo del artefacto es evidencia: un `exported_at` 60
   segundos posterior al comando de compilacion delata que el APK no se
   reinstalo. Leerla ANTES de sospechar del codigo.

**Sin schema, sin migracion:** SCHEMA_VERSION sigue en 8. Cero cambios en
tablas.

**Evidencia, en Android emulator, BY HAND y sobre los JSON exportados:**
un respaldo REAL v7 del 5 de agosto (`bueno.json`, generado por una
version anterior de la app) se importo correctamente y restauro el
inventario; hasta esta feature la app lo rechazaba con
VERSION_INCOMPATIBLE. Ese mismo archivo NO trae `config` y el catalogo de
fiado que el merchant tenia en la app SOBREVIVIO intacto a la
importacion. Un respaldo exportado con el catalogo vacio tampoco borro
los items creados despues. El JSON exportado tras el cambio contiene
`config` con exactamente dos claves (`catalogo_fiado` con 4 items y sus
emojis, y `nombre_negocio`), y una busqueda sobre el archivo COMPLETO
devolvio CERO ocurrencias de pin, licencia, premium, fecha_instalacion,
trial y recordatorio: ninguna clave sensible viaja en el respaldo. El
archivo de prueba con schema_version 99 (`version-mala.json`) siguio
siendo RECHAZADO por incompatible, confirmando que relajar el rango de
versiones no aflojo la validacion hacia arriba. 250 tests green (242 base + 8 nuevos).

---

## Decision 054 - El Inicio se rediseña por legibilidad, no por estetica, y el prototipo se valida ANTES de escribir codigo

**Contexto:** FiApp evoluciono a un MiniPOS con 31 features pero el Inicio
conservaba la apariencia de las primeras versiones. Al revisar una
captura del dispositivo aparecieron defectos concretos de legibilidad.

**Principio rector - ningun elemento cambia de sitio.** El merchant ya
tiene la pantalla memorizada; reordenarla seria peor que dejarla fea. Los
cuatro iconos siguen arriba, el fiado sigue siendo la accion principal,
los clientes siguen abajo. Solo cambia como se ve, nunca donde esta.

**Decision - se prototipa en HTML ANTES de tocar codigo.** Se construyo
una comparacion ANTES/DESPUES en HTML y sobre ella se acordo el diseno.
Eso permitio que Diego señalara defectos concretos (pastillas separadas
vs barra unica, franja demasiado alta, esquinas cuadradas) sin costo de
implementacion. En la Feature 032 el mismo metodo evito DOS errores de
producto antes de existir el codigo: un texto "Fijo/Variable" que ningun
merchant habria sabido responder, y una categoria "Mercancia" que habria
causado doble conteo en el punto de equilibrio. Ninguno de los cuatro lo
habria atrapado un test. Prototipar deja de ser opcional para cambios de
UI en este proyecto.

**Decision - se CONSERVAN todas las clases CSS.** No se renombro ninguna.
El test de regresion de AC-06 de la Feature 030 consulta
querySelector('.boton-registrar-produccion') y es la unica garantia
escrita de que un comerciante sin modo produccion no ve UI nueva. La
feature cerro con CERO tests modificados.

**Los cinco defectos corregidos:**

1. Iconos AZULES sobre fondo AZUL MARINO, sin etiqueta. Contraste
   insuficiente, no gusto. Ahora blancos, 24px, en pastillas
   individuales con etiqueta y toque de 54px.
2. Marca de agua "FIAPP" en SVG detras del buscador: eliminada.
3. Seis colores compitiendo. Ahora un azul de acento + neutros; rojo
   SOLO deuda, verde SOLO saldado. Se elimino el amarillo para montos.
4. El boton de produccion (Feature 030) pasa de tertiary solido a
   outline: sigue visible pero no compite con la accion principal.
5. Filas de cliente sin jerarquia: ahora tarjetas de 64px con avatar,
   nombre, linea de estado (Debe / Al dia) y monto en color semantico.

**Decision - la marca del merchant por encima de la nuestra.** El nombre
del negocio pasa a 18px blanco puro; "FiApp / Mi Negocio en el Bolsillo"
baja a 13px atenuado. Es su herramienta de trabajo, no nuestro afiche.

**Decision - los emoji de reconocimiento SE MANTIENEN.** El de la bolsa
en "TOTAL QUE ME DEBEN" se conserva. Quitarlo era criterio estetico, no
de usuario: funciona como ancla de RECONOCIMIENTO para la pareja mayor, y
la app YA usa emoji en el catalogo de fiado. Regla: emoji para ETIQUETAR,
SVG para lo que se TOCA.

**Decision REVERTIDA por evidencia de campo - el FAB se conserva.** La
propuesta inicial lo quitaba por "dos acciones primarias compiten". El
merchant respondio que SI lo usa. Un principio de diseno abstracto no
puede pesar mas que el uso real. Ademas el conflicto se disolvio solo al
pasar el boton principal de rojo a azul: ya no compiten en intensidad.

**Evidencia de campo (WhatsApp, merchant de ropa deportiva):**
- Los iconos: "le da casi igual, pero piensa que debe tener mejor
  contraste". Defecto confirmado pero NO doloroso; baja de critico a
  mejora. HONESTIDAD: la justificacion de accesibilidad para la pareja
  mayor del ambulante sigue siendo hipotesis, no se le ha preguntado.
- HALLAZGO ABIERTO: "el fiado lo usa muy poco, pero le sirve mucho el
  mensaje por WhatsApp (muy util e innovador)". El boton grande de fiado
  ocupa el lugar de accion principal y este merchant casi no lo usa; el
  ambulante en cambio vive del fiado. **La accion principal del Inicio
  deberia depender del tipo de merchant y hoy esta fija para todos.** Es
  n=1: no se resuelve aqui, va al backlog.

**Tres bugs PREEXISTENTES destapados al mirar el dispositivo:**

1. `.avatar-placeholder` y `.deuda-texto` se usaban en el template pero
   NUNCA tuvieron estilos: la inicial del cliente aparecia suelta, sin
   circulo.
2. El media query de 360px apuntaba a `.home-toolbar-inner` y
   `.home-title-wrap`, clases inexistentes, PERO tambien redefinia
   `.app-title` y `.business-name`, pisando la jerarquia nueva en
   pantallas angostas. Ningun test renderiza a 360px.
3. Las tarjetas consumian `--ion-item-background` sin fallback y
   resolvian al gris del fondo: exactamente el patron que la Decision 030
   documento. Se agrego fallback y el modo oscuro se verifico intacto.

**Aprendizaje tecnico:** `--border-radius` no siempre llega al elemento
interno de un `ion-button`; `::part(native)` si. Y un `ion-button` con
`fill="clear"` (el default dentro de `ion-buttons`) ignora el fondo.

**Sin schema, sin logica de negocio:** cero cambios en BD. Solo
home.page.html, home.page.scss y un icono en home.page.ts
(fast-food-outline pasa a receipt-outline: la comida rapida no aplica a
las tiendas de ropa).

**Evidencia, en Android emulator, BY HAND:** los cuatro iconos se
distinguen y se leen sus etiquetas; el fondo quedo sin marca de agua; el
nombre del negocio manda sobre la marca incluso en pantalla angosta; las
tarjetas de cliente se ven blancas con sombra y el monto en rojo cuando
hay deuda y verde cuando esta al dia; el FAB sigue funcionando; el swipe
de Editar y Eliminar sigue operativo (AC-07); y el modo oscuro quedo
legible (AC-09). 250 tests green, CERO tests modificados.


## Decision 055 - Gastos y punto de equilibrio: la pregunta correcta vale mas que la funcion correcta

**Contexto:** Los dos merchants de ropa coincidieron en campo (n=2) en que
necesitan saber cuanto deben vender para cubrir el arriendo. Eso no es un
cierre de caja: es un PUNTO DE EQUILIBRIO, y es lo que el merchant piensa
al ABRIR. Schema v9 con dos tablas nuevas (gastos_recurrentes, gastos).

**Decision - plantilla y hecho son dos conceptos, en dos tablas.** Un
gasto recurrente es una INTENCION; un gasto registrado es un HECHO. Con
una sola tabla no se puede distinguir "debo pagar" de "ya pague", y el
punto de equilibrio daria cero a principio de mes, justo cuando el
merchant mas lo necesita. La plantilla NUNCA genera movimientos solos:
ofrece un boton, el merchant confirma.

**Decision - el tipo se COPIA al registrar.** Si manana la plantilla
cambia de FIJO a VARIABLE, los gastos ya registrados no cambian. Mismo
criterio que Decision 038 (editar un precio no reescribe ventas) y que
AC-07 de la Decision 052 (el costo se declara hacia adelante).

**Dos bugs que la suite no podia ver, confirmando la Decision 052:**

1. crearGasto y crearGastoRecurrente NO propagaban el contexto
   transaccional. ejecutarRun tiene dentroDeTx=false por defecto, asi que
   db.run abria su propia transaccion ANIDADA dentro de
   ejecutarEnTransaccion: es el bug de la Decision 028 reintroducido en
   dos funciones nuevas. Importar un respaldo CON gastos fallaba el 100%
   de las veces; sin gastos pasaba, y por eso nadie lo vio. La rama web
   usa arrays y no anida nada. Se corrigio propagando el flag, espejo de
   crearTransaccion(t, true).

2. El resumen tras importar enumeraba SEIS conteos cuando
   ConteoImportacion ya traia DIEZ: producciones, produccion_items,
   gastos y gastos_recurrentes se restauraban pero la app no los
   mencionaba. Quinto punto del patron "operacion que enumera tablas a
   mano" de la Decision 052, y el tasks.md solo auditaba cuatro.
   reemplazarTodo es REINCIDENTE: ya habia fallado en la Feature 030.

**Divergencia web/nativo, tercera vez.** El mock web guarda activo como
boolean y SQLite como INTEGER 1/0. filtrarRecurrentesActivos usa
truthiness (!!r.activo), nunca === true: un === true habria pasado la
suite y dejado las plantillas desactivadas visibles en Android.

**REGLA NUEVA - un warning NG8103 rompe la pantalla en silencio.** Un
componente standalone sin CommonModule deja *ngIf y *ngFor sin efecto:
no es error, el build pasa y el APK se despliega con la pantalla rota.
Los tests tampoco lo ven porque ninguno renderiza el componente. Regla:
tras crear un componente standalone, `npm run build | grep -c "NG8103"`
debe dar 0 ANTES de ir a device. Costo real: un ciclo de emulador.

**El prototipo HTML se actualizo TRES veces durante la feature** y cada
vuelta nacio de uso real, no de revision de escritorio: el chip "Otro"
que abre campo de nombre (D-11), el aviso de que el modal viene de una
plantilla (D-12) y el borrado de gastos (D-13). Cuatro de cuatro
categorias escritas en pruebas quedaron FUERA de la lista fija de seis,
y las escribio el autor del spec: con chips solos el detalle se pierde.

**Excepcion a la Decision 054:** el recorte por la barra de navegacion de
Android NO se prototipa. env(safe-area-inset-bottom) vale 0 en
navegador; el defecto solo existe en device y el arreglo solo se ve ahi.
Es correccion fisica, sin decision de producto adentro.

**Borrado y desactivacion son logicos, nunca fisicos.** Un gasto se borra
marcando deleted_at (columna que existia sin usar); una plantilla se
desactiva con activo=0 y sus pagos quedan intactos, que es la razon por
la que recurrente_id no lleva CASCADE. Ninguna de las dos pide PIN: son
recuperables y no tocan datos de terceros (criterio de Decision 047 con
duplicar producto). Las lapidas VIAJAN en el respaldo, verificado en
device: los lectores crudos saltan el filtro (Decision 035).

**Evidencia en Android, POR ARTEFACTO y no por captura:** el respaldo
exportado en device probo que el reinicio de inventario deja gastos y
plantillas intactos mientras las otras seis tablas quedan en 0 (AC-10);
que los gastos nacidos de plantilla llevan recurrente_id y tipo copiado
(AC-04); que un gasto registrado con fecha del 2 de septiembre el dia 13
tiene fecha != created_at, y que toda fecha se ancla al MEDIODIA local
para que ningun gasto se corra de mes por zona horaria; y que los gastos
borrados siguen en el archivo con deleted_at lleno.

El punto de equilibrio se verifico con los cuatro numeros PREDICHOS de
antemano: 900.000 de fijos, 40% de margen (4.000/10.000), 2.250.000 al
mes y 75.000 al dia. Sin ventas informa "aun no calculable" y nunca
divide por cero (AC-08).

**AC-09 se interpreta como "flujos EXISTENTES".** El acceso desde
Reportes es la excepcion explicita: es la unica puerta de entrada a la
feature y ocultarla la haria inalcanzable, a diferencia de la Feature
030 donde modo_produccion se activaba desde otra pantalla. El bloque es
estatico: ni un *ngIf ni una cifra de gastos.

**HALLAZGOS ABIERTOS, ninguno resuelto aqui:**
- "Pagado este mes" es optimista con frecuencias no mensuales: una
  plantilla SEMANAL se marca pagada con un solo pago del mes. Nacio de
  D-4; cuando todo era mensual la etiqueta era correcta.
- No hay validacion de plantillas duplicadas: dos con la misma categoria
  activas cuentan doble en los fijos.
- La lista de gastos no agrupa ni virtualiza. Con registro diario serian
  40-60 tarjetas (mismo riesgo que P7 en Reportes).
- Un gasto suelto con el nombre de una plantilla NO enciende "Pagado
  este mes" y la plantilla sigue invitando a pagar.
- El texto libre de "Otro" permite escribir "pago proveedor", que NO es
  un gasto: la proteccion actual se diseno contra un chip, no contra
  texto libre. Y admite typos ("intermnet").
- sugerirTipoGasto solo conoce Arriendo y Servicios: internet y
  vigilancia, que el spec nombra como ejemplos de FIJO, caen a VARIABLE
  y quedan fuera del punto de equilibrio.
- Locale: el pipe currency sin locale imprime COP1,550,000 y el input
  de fecha muestra 09/13/2026. La app YA tiene shared/utils/formatters
  en es-CO y testeado; conviven dos convenciones. Backlog: toca todas
  las pantallas.

**PENDIENTE DE EVIDENCIA DE CAMPO (visita 2026-09-15):** el spec afirma
que el gasto suelto "tendra poco uso". El 14 de septiembre los DOS
merchants de ropa dijeron que si llevan los gastos hormiga, uno de ellos
en un Excel propio. Si se confirma, esa afirmacion del spec queda
invalidada y la lista necesita agrupacion. Tambien queda por confirmar
si el merchant mete el pago a proveedor dentro de gastos: su modelo
mental viene de un POS con un desplegable que lo incluia.

---

## Decision 056 - Un error de lectura NO es un hecho de negocio: la carga del Inicio falla completa o no falla

**Contexto:** bug PREEXISTENTE, diagnosticado el 2026-09-15 y anotado en el
commit 46d0677. No nace de la Feature 032. Reproducido en iPhone: la app
volvio de segundo plano con el telefono bloqueado, iOS tenia los archivos
cifrados, y Diego creyo que habia perdido todo. Con RETENCION como problema
numero uno (contexto de negocio 2026-09-22), una pantalla que miente es una
fuga directa.

**Dos modos de fallo, no uno.**

1. MODO A - `obtenerClientes()` en `:137` no tenia try/catch, y
   `ionViewWillEnter` (`:61`) la llamaba sin `await` y sin `catch` (`:63`).
   Las lineas `:135` y `:136` ya habian puesto `totalCartera = 0` y
   `clientesActivos = []` ANTES de leer. Resultado: la excepcion se perdia y
   la pantalla quedaba vacia con $ 0 PARA SIEMPRE, sin ninguna senal.
2. MODO B - el `catch` por cliente de `:143` dejaba `transacciones = []`, o
   sea `deudaTotal 0`. El cliente entraba a la lista con cero, el template
   imprimia "Al dia" (`html:81`) y lo pintaba VERDE (`html:83`). Y `:159`
   acumulaba ese cero en el total. Un cliente que debia 150.000 aparecia al
   dia, en verde, y la cartera mostraba una cifra menor a la real.

**Decision - opcion A: falla TODA la carga, nunca una carga parcial.** Tres
reglas acordadas: nunca decir "no tienes clientes"; nunca mostrar la lista a
medias (el total de cartera mentiria); boton Reintentar OBLIGATORIO. El
`catch` por cliente se ELIMINA: convertir un error de lectura en un cero es
justamente el defecto.

**Decision - construccion en arreglo LOCAL, asignacion atomica al final.** El
codigo viejo hacia `push` cliente por cliente sobre `this.clientesActivos`
(`:153`) y publicaba con `[...this.clientesActivos]` (`:161`). Con esa forma
es IMPOSIBLE cumplir "nunca a medias": una falla a mitad del recorrido ya
dejo datos publicados. Ahora se construye en `clientesLocal`/`totalLocal` y
se asigna a `this.*` solo si el recorrido completo tuvo exito.

**Decision - el manejo vive DENTRO de `cargarClientesYDeudas`, no en el
hook.** Cubre por construccion los CINCO puntos de llamada (`:63`, `:194`,
`:208`, `:234`, `:259`: entrar, crear, borrar y deshacer) sin tocar ninguno.
Volver `async` el `ionViewWillEnter` NO habria bastado: Ionic no espera el
promise de un lifecycle hook, asi que sigue siendo fire-and-forget.

**Decision - durante el error se oculta TODO lo que podria mentir.** Cartera,
buscador, lista, boton de fiado y FAB. La cartera se oculta en vez de mostrar
un guion: un guion se lee como cero de reojo, justo en el publico mayor del
proyecto. El buscador se oculta porque buscar sobre una lista inexistente
devuelve vacio y repite la mentira. El FAB y el fiado se ocultan porque
ambos flujos terminan necesitando los clientes que no se pudieron leer.

**Decision - la barra superior SE CONSERVA.** Es chrome de marca fijo
(Decision 029) y las otras pantallas si pueden leer. Ver el hallazgo de
campo mas abajo: esto tiene una consecuencia que conviene no olvidar.

**Decision - sin componente standalone nuevo.** El bloque de error es markup
dentro de `home.page.html` gobernado por un flag `errorCarga`, envuelto en un
`ng-container` que no genera elemento en el DOM. Evita POR CONSTRUCCION la
regla NG8103 de la Decision 055 y no puede romper el `slot="fixed"` del FAB.

**Hallazgo de metodo - la cobertura del Home era CERO y nadie lo sabia.**
`home.page.spec.ts:88` tenia `spyOn(component, 'cargarClientesYDeudas')` como
ultima sentencia del `beforeEach` GLOBAL: el cuerpo del metodo nunca se
ejecutaba en la suite. Mismo hallazgo que la Decision 052 documento para
`editar-producto.component.spec.ts`. Se rodeo con un `describe` anidado cuyo
`beforeEach` hace `.and.callThrough()`, logrando CERO tests existentes
modificados (verificado con `git diff`: 132 inserciones, cero eliminaciones).

**Hallazgo de metodo - de 5 tests nuevos solo 3 son RED.** T013 y T014 pasan
en verde desde el primer momento: son tests de CARACTERIZACION, no REDs.
Anunciar "los cinco deben fallar" fue un error del tasks.md, corregido en el
commit b45e216. El RED real dio "Expected 150000 to be 0" (el total
acumulaba la deuda del primer cliente y perdia la del que fallo) y "Expected
false to be true" x2.

**Hallazgo de metodo - los REDs necesitan `.catch(() => undefined)`.** Sin
eso el test falla por excepcion no atrapada en vez de por la asercion, y no
es un RED valido. Tras el GREEN el metodo ya no lanza y ese catch queda
inerte.

**Hallazgo NUEVO y caro - un presupuesto de CSS rompe el build y la suite NO
lo ve.** Los 35 renglones de SCSS nuevos dejaron `home.page.scss` en 4.00 kB
contra un tope de 4.00 kB: el build fallaba por CINCO BYTES con 290 tests en
verde. Karma no evalua presupuestos. Peor: el gate escrito como
`npm run build | grep -c "NG8103"` devolvio 0 y se leyo como "build limpio",
cuando en realidad significaba "no encontre NG8103" sobre un build ROTO. La
tuberia se traga el codigo de salida. REGLA NUEVA: todo gate de build debe
verificar el EXIT CODE explicitamente
(`npm run build > /tmp/build.log 2>&1; echo "EXIT: $?"`), nunca solo un grep.

**Decision - se sube el presupuesto, no se recorta el CSS.** Se intento dos
veces comprimir estilos para ganar bytes y el resultado fue codigo peor por
5 bytes. `anyComponentStyle.maximumError` pasa de 4kb a 6kb; el
`maximumWarning` se DEJA en 2kb a proposito, porque `home.page.scss` (4.00
kB) y `fiado-productos.page.scss` (3.84 kB) ya lo exceden y esa senal de
deuda debe seguir sonando sin bloquear el build.

**HALLAZGO DE CAMPO en el device test - las pastillas navegan a pantallas con
la MISMA deuda sin arreglar.** Con el error en pantalla, el merchant todavia
puede entrar a Gastos y registrar. En la prueba artificial es correcto (solo
`obtenerClientes` lanzaba, las demas pantallas leian bien), pero en el
escenario REAL de iOS fallarian TODAS las lecturas, y Gastos no mostraria
aviso: mostraria lista vacia y ceros, en silencio. Es el mismo bug del Home,
sin arreglar, en nueve pantallas mas.

**Riesgo ACEPTADO, no resuelto (D-4):** el texto acordado nombra una causa
concreta ("Desbloquea el telefono"). Ante otro fallo (BD corrupta, migracion
a medias) manda a desbloquear un telefono que ya esta desbloqueado.
Clasificar la causa exige evidencia que hoy no existe.

**Sin schema, sin migracion:** SCHEMA_VERSION sigue en 9. `git diff` sobre
`database.service.ts` salio VACIO al cerrar (mismo criterio de la Feature
023). Cero clases CSS renombradas; `.boton-registrar-produccion` intacta y su
test de regresion (AC-06 de la Feature 030) verde.

**Como se provoco el fallo en device, y por que asi.** El escenario real
(archivos cifrados en iOS) no se reproduce a voluntad en el Pixel_8, y iOS
esta BLOQUEADO por UIScene: el iPhone 17 con iOS 27 se niega a lanzar la app
(rama 035-ios-uiscene, sin migrar). Se inyecto un `throw` TEMPORAL en
`obtenerClientes`, revertido y verificado con `git diff` vacio antes de
cerrar. Efecto colateral esperado mientras estuvo puesto: 2 tests de
DatabaseService en rojo.

**Evidencia, en Android emulator Pixel_8, BY HAND:** con el throw inyectado,
el Inicio mostro el bloque de error con el texto acordado completo y el boton
Reintentar, y desaparecieron los CINCO elementos (cartera, buscador, lista,
boton de fiado y FAB) mientras la barra superior y el nombre del negocio se
conservaron. Reintentar reejecuto la carga y volvio al mismo estado sin
romperse ni quedar en blanco. El modo oscuro quedo legible en ambas
apariencias (`adb cmd uimode night yes/no`, sin reiniciar la app). Revertido
el throw, TODO reaparecio sin regresion. Bundle fresco verificado con
`bloque-error-carga`, cadena que solo existe en el codigo nuevo, dentro de
`chunk-V3NTD2UZ.js` (el chunk lazy del Home): buscar por "Desbloquea" habria
dado falso positivo porque esa palabra ya existia en configuraciones-page.
290 tests green (280 base + 10 nuevos), CERO tests modificados.

**NO verificado:** pantalla angosta de 360px. Ningun test renderiza a esa
anchura y el media query del Home tiene selectores parcialmente huerfanos
(Decision 054). Queda anotado como no verificado, no como aprobado.

**Deuda ABIERTA que esta feature NO arregla, con nombre y linea:** las nueve
pantallas con `ionViewWillEnter` (`ventas:92`, `configuraciones:48`,
`reportes:91`, `cliente-detalle:61`, `inventory-movement:77`,
`inventory-list:49`, `fiado-productos:50`, `registrar-produccion:40`,
`gastos:45`) y el `?? false` sobre `stock_bajo` en `inventory-list.page.ts:60`,
que ante un resumen ausente responde "todo bien". Ser `async` no protege a
ninguna: Ionic no espera el promise del hook.

---

## Decision 057 - Dar de alta un producto no puede exigir un segundo viaje: la cantidad se pregunta donde ya esta el comerciante

**El problema no era una funcion faltante, era un hueco de onboarding.** El
formulario de alta preguntaba nombre, precio y stock minimo. Nunca pregunto
lo unico que el comerciante si sabe de memoria: cuantas unidades tiene hoy.
El producto nacia en cero y para cargarlo habia que salir a Movimientos y
registrar un ajuste. Ese segundo viaje es el punto donde tres de los cinco
pilotos se detuvieron. La app no fallaba: pedia un paso que nadie adivina.

**Decision.** El campo "Cuantos tienes hoy?" entra al formulario de alta y al
modal de duplicar. Acepta 0 explicito (hay productos que se dan de alta sin
existencia), rechaza vacio y rechaza negativo. Al guardar, el producto y su
movimiento de AJUSTE con motivo "Inventario inicial" se escriben juntos.

**El stock minimo pasa a opcional, y eso NO fue cosmetica.** Era la mitad del
arreglo. El campo era obligatorio, asi que el comerciante escribia el mismo
numero que tenia en existencia. Con `stock_bajo` evaluado como
`existencia <= minimo`, un producto recien creado con 20 y minimo 20 nacia
en alerta. La alerta de stock bajo -es decir, el item 0 del backlog, el que
existe por retencion- estaba siendo envenenada desde el alta. Vaciar el campo
lo resuelve: vacio significa 0, y 0 no enciende nada hasta que la existencia
llega a cero de verdad.

**Tercera aparicion del patron de transaccion anidada.** `ejecutarRun` recibe
`dentroDeTx = false` y con el default abre su propia transaccion. Ya se habia
corregido en `crearTransaccion`, en `crearGasto` y en `crearGastoRecurrente`.
`crearProducto` era el que faltaba: escribir producto y movimiento como dos
llamadas independientes habria reintroducido por tercera vez el bug que la
Decision 028 corrigio y que la Decision 055 volvio a documentar. Se resolvio
con `crearProducto(producto, dentroDeTx = false)` propagando el flag, y un
metodo nuevo `crearProductoConStockInicial` que envuelve ambas escrituras en
UN solo `ejecutarEnTransaccion`. Si el movimiento falla, el producto no queda.

**Regla que sale de aqui:** antes de componer dos escrituras existentes en una
operacion nueva, revisar si AMBAS son conscientes de transaccion. El default
de `ejecutarRun` es el que muerde, y muerde en silencio.

## Lo que el metodo atrapo, y lo que casi se le escapa

**Dos falsos verdes, ambos reales.**

1. El AC-10 original afirmaba, con `not.toHaveBeenCalled()`, que ya no se
   llamaba el metodo viejo. Esa asercion pasa vacua: un metodo que dejo de
   existir en el flujo nunca se llama, haya o no feature. Se enmendo el AC
   para anclar contra el metodo nuevo con sus argumentos reales.
2. Un guard defensivo `?? [{}, {}]` sobre un spy hizo que la evaluacion
   corriera con `undefined, undefined` y devolviera `false`, que era
   exactamente lo esperado. Test verde sin probar nada.

**Regla:** un RED que pasa a verde sin que nadie toque produccion no es un
RED. Anclar primero contra valores reales; los guards defensivos van despues.

**El RED se invalido tres veces antes de ser valido.** Por insertar el
`describe` dentro del segundo `describe` de nivel superior (`Cannot find
name`), por `calls.mostRecent()` sobre un spy no llamado (`TypeError`), y por
invocar un metodo que lanza sin `.catch(() => undefined)`. Ninguno de los tres
es un fallo por asercion. Verificar SIEMPRE con `grep -n "^describe("` antes
de insertar, y exigir que el fallo diga "Expected X to be Y".

**El bundle viejo invalido dos intentos del device test.** `npx cap run` copia
`www/` pero NO lo regenera. Los dos primeros intentos del test de rollback
corrieron contra codigo anterior y dieron un falso "paso". El orden correcto
es `npm run build` -> `npx cap sync` -> `npx cap run`, y la verificacion no es
la confianza sino el grep: buscar un string literal nuevo dentro de
`android/app/src/main/assets/public/*.js` ANTES de tocar el emulador.

**Inyectar un throw al inicio de un metodo rompe el narrowing de TypeScript.**
El `throw` incondicional al principio de `crearMovimientoInterno` hizo que el
compilador marcara el resto como inalcanzable y emitiera TS18047 sobre una
variable que si estaba validada. La solucion fue un throw CONDICIONAL
(`if (movimiento.motivo === 'Inventario inicial')`), que ademas es mas preciso:
falla solo el caso bajo prueba, no todos los movimientos de la app.

**NG8001 es error, NG8103 es warning, y el peligroso es el segundo.** Usar
`ion-note` sin importarlo revienta el build (NG8001) y se nota. Usar `*ngIf`
sin `CommonModule` solo emite NG8103, el build pasa, y el APK sale con la
plantilla rota. La regla de la Decision 055 -`npm run build` y contar NG8103
en 0 tras crear un componente standalone- fue la que lo atrapo.

**Y el gate se verifica por codigo de salida, no por grep.** `npm run build |
grep -c "NG8103"` devolvio 0 sobre un build ROTO: la tuberia se traga el exit
code. La forma correcta, ya fijada en la Decision 056, es
`npm run build > /tmp/build.log 2>&1; echo "EXIT: $?"` y despues contar.

**`ion-note slot="helper"` no renderiza** sobre la sintaxis vieja de
`ion-item` + `ion-label position="stacked"` que usa `inventory-list.page.html`.
Se escribio, compilo limpio, y en device simplemente no aparecio. Se retiro.
No se migro la pantalla entera a la sintaxis nueva dentro de esta feature.

**Los placeholders largos se truncan en pantalla real.** El patron del
proyecto es corto -"Ej. Carne molida", "Ej. 12.000"- y hay que respetarlo:
un placeholder que se corta a la mitad comunica menos que ninguno.

**El fallo al guardar era silencioso, igual que en la Decision 056.** Si la
escritura fallaba, la pantalla no decia nada y el comerciante quedaba mirando
un formulario que parecia haber funcionado. Se descubrio solo porque el test
de rollback se hizo de verdad, forzando el fallo. Mismo patron que el Inicio:
el error existia, el usuario no se enteraba.

## Verificacion

**Por artefacto, no por narrativa.** El device test se valido contra el JSON
de respaldo exportado desde el telefono: ahi se leyo el producto creado, su
movimiento de AJUSTE con motivo "Inventario inicial", la cantidad correcta y
el minimo en 0. Eso cubre la creacion con cantidad, el 0 explicito, el minimo
vacio y el duplicar. El rollback se verifico aparte, forzando el fallo con un
throw condicional y confirmando que ni producto ni movimiento quedaron.

300 tests green (290 base + 10 nuevos). Schema v9 sin tocar: esta feature no
agrega tablas ni columnas, solo compone escrituras existentes.

**NO verificado:** el comportamiento de la alerta de stock bajo en la lista
inmediatamente despues de crear un producto en 0. Se reporto que no aparece
la alerta cuando `0 <= 0` deberia encenderla. Puede ser la lista que no
recarga el resumen, o el `?? false` sobre `stock_bajo` que ante un resumen
ausente responde "todo bien". Queda como hallazgo abierto, no como aprobado,
y es entrada directa al item 0 del backlog.

**Higiene de rama: `git status` antes del merge atrapo un archivo destruido.**
`ios/App/App/AppDelegate.swift` aparecia modificado con 49 lineas eliminadas:
el archivo estaba vacio. Fue una edicion manual en Xcode intentando destrabar
iOS, sobre la rama equivocada. Un AppDelegate vacio deja la app iOS sin punto
de entrada. Se revirtio con `git checkout`. **Regla:** los experimentos en
Xcode escriben en el mismo repo; van en la rama de iOS, nunca sobre la rama
de la feature en curso, y `git status` se lee antes de todo merge.

---

## Decision 058 - iOS adopta el ciclo de vida UIScene: la ventana ya no es del AppDelegate

**El sintoma era pantalla negra; la causa era de plataforma.** El SDK actual
rechaza arrancar apps que no adoptan escenas. Artefacto exacto en iPhone 17
Pro Max: "Application failed to launch: UIScene life cycle is required for
apps built with this SDK". La app compilaba, firmaba e instalaba bien. Fallaba
en runtime, y por eso se leia como un bug de la app y no de configuracion.

**Lo barato se probo primero y se descarto con evidencia.** La hipotesis era
que el bump de Capacitor 8.4.0 a 8.5.2 (commit b7f2aea) bastara. NO basto, y
se predijo por escrito antes de correrlo: `cap sync` copia `www/`, actualiza
plugins y reescribe `Package.swift`, pero NO toca `AppDelegate.swift` ni
`Info.plist`. Se confirmo con un grep de UIScene y SceneDelegate sobre ambos
archivos: vacio. Diez minutos de prueba, respuesta binaria, cero codigo
escrito de mas.

**Decision: tres cambios, todos nativos, ninguno de negocio.**
(1) Una clase `SceneDelegate: UIResponder, UIWindowSceneDelegate`.
(2) La clave `UIApplicationSceneManifest` en `Info.plist`, con
`UISceneStoryboardFile: Main`, porque el root de Capacitor sale del
storyboard (`CAPBridgeViewController`) y asi UIKit construye la ventana solo,
sin codigo de armado manual.
(3) Retirar `var window: UIWindow?` del `AppDelegate`: con escenas la ventana
PERTENECE a la escena. Dejarla en ambos lados es tener dos duenos.

**El SceneDelegate vive DENTRO de AppDelegate.swift, y es deliberado.** Lo
convencional es un archivo propio, pero un `.swift` nuevo no entra solo al
target de Xcode: hay que agregarlo a mano, y si se olvida el sintoma es
EXACTAMENTE la pantalla negra que este cambio arregla. Un paso administrativo
invisible que se disfraza del bug original es una trampa de diagnostico.
`AppDelegate.swift` ya esta en el target. Separarla despues es cosmetico.

**Los metodos de URL y userActivity se reenvian, no se borran.** Con escenas,
`application(_:open:options:)` y `continue userActivity` del AppDelegate dejan
de llamarse; los equivalentes viven en el SceneDelegate. Ambos reenvian a
`ApplicationDelegateProxy.shared`, que es lo que mantiene vivos los plugins
que dependen de esa ruta (Share, deep links).

**El `Info.plist` se edito con `plistlib`, no a mano.** Un plist es XML con
estructura anidada y estricta; editarlo por reemplazo de texto es como parsear
HTML con regex. La evidencia de que fue la decision correcta: el diff mostro
19 inserciones, no una reescritura completa del archivo.

## Verificacion

**Los siete AC en device, porque la suite es CIEGA al Swift.** Ningun test de
Karma toca codigo nativo; esta feature no tenia RED posible y se dijo antes de
escribirla, no despues.

AC-01/02/03 verificados a mano en el iPhone 17 Pro Max: arranca al Inicio, sin
runtime issue en consola, y conserva estado al volver de segundo plano.

**AC-04, el de mayor riesgo, verificado por artefacto:** se creo el cliente
"Arnulfo Castro", se mato la app desde el multitarea, se reabrio y se exporto
respaldo. El JSON trae `created_at` 2026-09-25T16:47:09Z contra un
`exported_at` de 16:50:10Z: tres minutos y un cierre completo de por medio.
SQLite escribio en DISCO en iOS y sobrevivio. **Es la primera verificacion
real del camino nativo de iOS**, el mismo que estuvo roto de la Feature #4 a
la #8 en Android (Decision 028) y que en iOS nunca se habia podido probar con
la app arrancando.

El mismo respaldo valida AC-05 y de paso el estado del esquema: schema_version
9, las DIEZ tablas presentes (el hueco de la Decision 052 sigue cerrado por la
053), y la clave `config` con catalogo_fiado y nombre_negocio SIN el PIN ni la
licencia, que es la regla de la Decision 053 cumpliendose en otra plataforma.

AC-06 y AC-07: 300 tests green, build EXIT 0, NG8103 en 0, APK desplegado en
Pixel_8, y `git diff main -- src/` VACIO. Cero riesgo para Android por
construccion, no por confianza.

**Lo que esto NO desbloquea, y hay que decirlo.** El certificado gratuito
caduca a los 7 dias y solo corre en dispositivos registrados: sirve para que
Diego muestre la app en SU telefono y haga el walkthrough, y no para que un
interesado la instale en el suyo. La via de entrega a terceros sigue siendo el
APK de Android. Pilotos reales en iOS exigen la cuenta paga (99 USD/ano) con
TestFlight; es decision de negocio, no tecnica, y queda abierta.

**Dos hallazgos menores del respaldo, al backlog, no tocados aqui:**
`fecha_creacion` y `created_at` guardan el MISMO valor (columna duplicada, la
vieja y la de auditoria de la Decision 048), y el nombre del cliente se guardo
como "Arnulfo Castro " con espacio final: falta `trim()` al guardar, que
ensucia busqueda y orden.

---

## Decision 059 - El costo se declara donde ya esta el comerciante: el AJUSTE lo REEMPLAZA, la COMPRA lo pondera

**La Feature 036 quito el bloqueo de entrada y abrio uno de salida.** El
producto ya nacia con stock, pero SIN costo: el AJUSTE de "Inventario inicial"
mandaba costo_unitario 0 y el costo promedio solo se recalculaba con COMPRA o
PRODUCCION. Reportado 2026-09-26 despues de mostrar la app a un tercero.

El comerciante que queria registrar lo que le costo su mercancia tenia dos
caminos y los dos estaban mal: registrar una COMPRA -el unico movimiento con
campo de costo-, que SUMA y le dejaba 20 unidades cuando tenia 10; o no
registrarla, y quedarse en costo 0 para siempre.

**Peor que un stock mal contado: la app no falla, IMPRIME NUMEROS FALSOS.**
Con costo 0 el valor total del inventario (Feature 023) cuenta 0 con mercancia
real en la tienda; la ganancia de cada venta se calcula contra costo cero, o
sea ganancia igual al precio completo; y el punto de equilibrio (Feature 032)
hereda ese margen inflado. Mismo patron que la Decision 056: el dato falso se
muestra en verde y nadie sospecha. La magnitud quedo medida en el respaldo del
device test: OCHO de NUEVE productos con costo_promedio en 0.

**Y no se corregia solo.** Un producto con stock 10 a costo 0 que despues
recibe una compra real de 5 a 3.500 queda en (10*0 + 5*3500)/15 = 1.166.
Subvalorado PARA SIEMPRE, no solo hoy.

**Causa raiz: la operacion que el comerciante queria hacer NO EXISTIA.** Las
disponibles eran COMPRA (suma), MERMA (resta) y AJUSTE (fija el conteo fisico,
sin costo). "Decir cuanto me costo lo que ya tengo" no estaba. Hizo lo correcto
con las herramientas que le dimos: le dimos el martillo equivocado.

**Decision: el AJUSTE acepta costo unitario OPCIONAL.** Vacio no toca el costo
promedio (comportamiento actual intacto); con valor lo REEMPLAZA, no lo
pondera.

Por que reemplaza: en una COMPRA el costo se pondera porque la mercancia SE
SUMA a la que habia. En un AJUSTE el conteo fisico REEMPLAZA el stock, no lo
suma. "Tengo 10 y me costaron 3.500 cada uno" es una DECLARACION del costo, no
un aporte a un promedio; ponderar ahi daria un numero que no corresponde a
nada real. Mismo espiritu del costo declarado de la Decision 052.

Por que OPCIONAL: si fuera obligatorio, quien ajusta el conteo porque se le
perdieron 2 unidades tendria que escribir un costo y resetearia el costo
promedio sin querer. Vacio significa "no vengo a hablar de costos", que es el
caso mas comun del AJUSTE.

**Un solo mecanismo resuelve los dos problemas:** el producto que nace hoy (el
alta manda el costo en su AJUSTE inicial) y el que ya nacio en cero (se corrige
desde Movimientos, sin pantalla nueva). Se mantiene el AJUSTE y NO se emite
COMPRA desde el alta, asi no choca con la regla de que las COMPRAS se corrigen
con un AJUSTE y nunca se anulan.

**La logica salio a funciones puras, no a un if dentro del servicio.** La suite
corre SOLO la rama web: una funcion pura es lo unico que puede defender de
verdad. resolverCostoPromedio decide por tipo y delega en
calcularCostoPromedioPonderado, que NO se toca -es el corazon financiero, ya
tiene tests, y un AC de regresion lo protege.

**El umbral es costoUnitario > 0, no != null.** El AJUSTE ya escribia 0 en esa
columna: con un chequeo de nulidad, cada ajuste de conteo existente habria
borrado el costo del producto. Un bug silencioso a escala de toda la base.

**Riesgo descartado CON EVIDENCIA, no por intuicion.** Se sospecho una cuarta
aparicion del patron de transaccion anidada (Decision 028), porque el alta iba
a disparar la escritura del costo dentro de su transaccion. Se verifico:
actualizarCostoPromedioProducto ya llamaba a ejecutarRun(sql, values, true).
No habia bug. Deuda anotada: ese true esta FIJO, no es parametro; funciona
porque crearMovimientoInterno siempre corre dentro de una transaccion, pero es
una suposicion implicita que ningun test defiende.

**UI: el numero no alcanzaba, faltaba el VERBO.** El modal YA mostraba "Stock
derivado actual" y "Costo promedio actual" y aun asi hubo confusion. La
etiqueta "Cantidad" se leia como "cuanto tengo". Ahora es dinamica por tipo
("Cuantas unidades entraron?" / "se perdieron?" / "vendiste?") y gana una nota
VIVA calculada mientras escribe: "Se suman a las 10 que ya tienes -> quedaran
30". Tambien salio a funcion pura: un {{ stock + cantidad }} inline en el
template no lo defiende ningun test.

**Nota, no Alert, para avisar que un costo se va a pisar.** El Alert llega
tarde -cuando ya escribio y ya decidio- y entrena a tocar "Si" sin leer. El
Alert queda reservado a lo destructivo de verdad (PIN, reinicio de inventario,
Decision 049). La nota aparece solo si el costo previo es mayor que cero, asi
el caso comun no molesta a nadie.

## Verificacion

**Por artefacto, con la cifra PREDICHA por escrito antes de correr.** Se
anuncio que el costo promedio final seria 3.800 y el respaldo exportado del
Pixel_8 lo confirmo exacto. La cadena completa, leida del JSON:

- AJUSTE costo 3500, motivo "Inventario inicial", fisica 10 -> el costo viajo
  desde el alta (AC-01).
- Panela: AJUSTE costo 0, fisica 7, costo_promedio 0 -> la Feature 036 intacta
  (AC-02).
- AJUSTE costo 4000 con diferencia_calculada 0 -> REEMPLAZO 3.500 por 4.000
  SIN mover el stock. Esa es, literalmente, la operacion que no existia (AC-04).
- COMPRA cantidad 20 costo 3700 -> (10*4000 + 20*3700)/30 = 3800 (AC-05).

Arroz Diana quedo como el UNICO producto de los nueve con costo distinto de
cero: la foto exacta del problema y la prueba de que sin el arreglo el valor
del inventario y la ganancia mentian en los ocho restantes.

310 tests green (300 base + 10 nuevos). Schema v9 sin tocar: la columna
costo_unitario ya existia NOT NULL en movim_inventario.

**El AC-04 afirma el numero incorrecto a proposito.** El test exige 4.000 y
deja escrito que ponderar daria 3.750. Si alguien "optimiza" la funcion
ponderando, el test lo caza con el numero exacto en pantalla.

## Lo que costo caro, todo de metodo

**Una corrida sin linea TOTAL: no es "paso" ni "fallo" - es "NO CORRIO".** La
suite arrancaba con un error de arranque del runner y la salida terminaba en
"bundle generation complete". La ausencia de rojo se leyo como exito. Misma
familia que el gate por tuberia de la Decision 056: lo que no se ve no es lo
que no existe. El gate es la linea TOTAL:, no la falta de error.

**tail sobre la salida de tests ESCONDE el error real.** La pila de llamadas
ocupa el final; el mensaje que importa esta arriba. Con head -20 aparecio en
la primera linea: TS2551, un metodo que no existe.

**Se invento el nombre de un metodo sin verificarlo contra el archivo.** Se
escribio component.guardarProducto() cuando el metodo real era crearProducto.
RED invalido por error de compilacion, no por asercion. Misma familia que el
describe mal insertado de la Decision 057: un identificador que no se verifico
contra el archivo NO es una suposicion menor, es un RED muerto. Se verifica con
grep ANTES, igual que el describe.

**Se diagnostico EADDRINUSE sin evidencia y se mato un proceso inocente.** El
puerto no era el problema; el codigo no compilaba. Dos senales ignoradas: el
error nunca dijo EADDRINUSE, y liberar el puerto no cambio nada. Un diagnostico
sin artefacto que lo respalde cuesta mas que no diagnosticar.

**Los bloques python3 largos SE TRUNCAN al pegar.** Tres veces: una abrio el
REPL interactivo y se comio el script en silencio, otra dejo el heredoc abierto
en heredoc>, otra corto el medio y dio SyntaxError. Regla: ediciones cortas,
una por vez, con formato compacto, y verificar el OK: de cada una antes de
seguir. Un bloque de 40 lineas no es mas eficiente si no llega entero.

**El intermitente "Failed to construct URL: Invalid base URL" ya cuesta
tiempo real.** Provoco un 1 FAILED que interrumpio el diagnostico y obligo a
una segunda corrida para descartarlo. Sube de prioridad en el backlog: un test
intermitente ensena a desconfiar del gate, que es exactamente lo contrario de
lo que el metodo necesita.

**Un verde no anticipado es indistinguible de un falso verde.** Dos tests de
no-regresion nacieron verdes contra el andamiaje, y eso es correcto; el error
fue no anunciarlo antes de correr en uno de los dos casos. Si se anticipa, es
evidencia; si se descubre, es sospecha.

**Fuera de alcance, anotado:** avisar en la lista que productos tienen costo 0
(abre el tema de la alerta de stock bajo, siguiente item del backlog); editar
el costo promedio a mano en Editar producto (saltaria el historial, que es la
fuente de verdad); las nueve pantallas con ionViewWillEnter sin manejo de
error; la columna duplicada fecha_creacion / created_at y el trim() faltante
en el nombre del cliente (Decision 058).
