# FiApp — Project Context Handoff

> Purpose: give a new AI supervisor or developer enough verified project context to continue FiApp without relying on chat memory.
>
> Last updated: 2026-08-05

---

## 1. Project identity

**Project:** FiApp / FiApp-Comercial  
**Type:** Ionic + Angular standalone mobile/web app  
**Platform:** Capacitor + SQLite via `@capacitor-community/sqlite`  
**Primary use case:** Help Colombian and LATAM micro-merchants manage customers, fiado/debt, products, inventory, and eventually mPOS sales/profit.  
**Current repository:** `FiApp-Comercial`  
**Development approach:** Spec-Driven Development (SDD) with Spec Kit, supervised AI coding, Git checkpoints, and build/test gates.

---

## 2. Diego's working model

Diego is leading the product and implementation with AI support. The AI is not the decision-maker. Diego reviews, accepts, rejects, or redirects generated work.

Preferred technical style:

- English for prompts and coding work because local Qwen models perform better in English.
- Step-by-step supervision.
- Small implementation batches.
- Review actual files/diffs before accepting or committing.
- Use Copilot for high-risk multi-file implementation.
- Use Qwen 14B local for specs, reasoning, drafts, and isolated snippets.

Core operating rule:

```text
The AI generates ideas and code.
Diego accepts responsibility for what is merged.
```

---

## 3. Current repository state

As of this handoff:

- Feature #1 is complete, tested, committed, and pushed.
- Features #2 through #13 are all COMPLETE, tested, and merged to main.
- Current schema version: v7 (Feature #2 inventory tables, #4 ventas table, #7 monto_contado + monto_fiado, #11 venta_items with ventas rebuilt to sale-level only, #12 transacciones.venta_id origin marker).
- 162 tests passing. Build green. Native write path VERIFIED ON DEVICE (Feature #8). Dark mode verified on iOS and Android (Feature #9 and P0). Features #11, #12 and #13 verified BY HAND on device. Working branch: main (everything merged).
- Next up: Diego chooses. Feature #20 is DONE (Decision 041): Configuraciones now has a destructive but safe reset that physically deletes productos, movim_inventario, ventas and venta_items while preserving clientes and transacciones. A safety backup is generated first, typed confirmation REINICIAR is required, and the reset is blocked by the freemium write guard. transacciones.venta_id is preserved unchanged because it is an origin marker from Decision 032, not a foreign key to ventas. Verified on Android Pixel_8: reset tables went to 0, clients and transactions counts stayed unchanged, venta_id values were preserved, and trial-expired reset was blocked. Final smoke pass and merchant handoff are DONE: docs/pilot/SMOKE_PASS_FINAL.md, docs/pilot/DELIVERY_ANDROID_IOS.md and docs/pilot/GUIA_MERCHANT.md exist with real content (645, 125 and 216 lines respectively). Pilot was delivered 2026-08-13 to 3 Android merchants. Feature #21 is DONE (Decision 042): the Home FAB was partially covered by the Android 3-button navigation bar; fixed with margin-bottom: env(safe-area-inset-bottom) on the FAB, no business logic, no schema change. Verified BY HAND on Android emulator forced into threebutton nav mode and on iPhone simulator (no regression). Feature #22 is DONE (Decision 044): fiado por productos, a faster way to reconstruct manual fiados AFTER the demand peak for the ambulant merchant. It is a MANUAL fiado (transaccion with venta_id NULL, Decision 032) with an app-generated readable concept (spirit of Decision 039) and frozen total; it does NOT touch productos, inventory, venta_items or registrarVenta. The 10-15 product catalog lives in Preferences as JSON (KEY catalogo_fiado), NOT a table, so schema v7 stays intact; it is decoupled from the productos table because tipo_venta only allows UNIDAD/PESO. Pure functions (calcularTotalFiado, construirConceptoFiado, serializar/parsearCatalogo) are tested; CRUD and the 3-step flow are UI verified on device. The catalog is NOT freemium-gated (it is configuration) but saving a fiado IS gated by puedeEscribir (Decision 033). Entry point is a highlighted button on Home; catalog management lives in Configuraciones with an empty-state shortcut; swipe is banned as a primary interaction for the older audience. Also Decision 043 fixed a preexisting bug exposed by this feature: Configuraciones credits-block now respects env(safe-area-inset-bottom). Verified on Android emulator via exported JSON backup: each fiado had venta_id NULL, correct readable concept and amount, and productos/movim_inventario/ventas/venta_items were all empty; trial-expired save was blocked until license activation. Feature #23 is DONE (Decision 045): valor total del inventario, a derived sum (never persisted) shown above the product list in Inventario. calcularValorTotalInventario is a pure function summing stock_derivado times costo_promedio per line, with zero DatabaseService changes and zero schema changes (confirmed by empty git diff on database.service.ts). A product with costo_promedio 0 contributes 0, never NaN, by arithmetic construction; a product with stock 0 also contributes 0. Same *ngIf gate as the product list, so it does not render on an empty inventory. Styled only with existing Ionic variables (Decision 029/030). Verified on Android emulator: total matched manual sum, the Sin costo registrado case did not break the total, a product reduced to stock 0 correctly lowered the total, empty inventory hid the block cleanly, and both light and dark mode were legible. Process note: the initial spec for this feature was drafted by an external agentic model under evaluation (GLM-5.3 Flash via OpenRouter); the spec was solid and kept, but its code execution was discarded because it narrated a RED step and a failing test that never actually happened (the suite never failed). Real TDD was carried out with strict supervision, verifying every step against git status, git diff and real npm test output rather than the assistant narrative. Feature #24 is DONE (Decision 046): freemium no longer limits by client count, only by time. LIMITE_CLIENTES was removed from FreemiumService.obtenerEstado(); contarClientes() is untouched in DatabaseService (still used elsewhere) but no longer decides blocking. LIMITE_DIAS rose from 20 to 25 days. Two non-blocking commitment reminders (Alert, not a guard) fire on exact day 8 and day 17 of the trial, once per calendar day, persisted via a new Preferences KEY (ultimo_dia_recordatorio_mostrado); the message avoids the word feedback and highlights the development effort for the merchants business, reusing the existing WHATSAPP_FEEDBACK_URL and contactarADiego(). Verified on Android emulator: created more than 7 clients with zero blocking, simulated day 8 via adb-edited Preferences and saw the exact reminder Alert, and confirmed it does not repeat the same day. A stale www/main.js build from a previous day was caught and fixed with evidence (ls -la plus grep) before assuming a code bug. Feature #25 is DONE (Decision 047): duplicar producto in Inventario, Phase 1 of 2 for the clothing merchants who manage many size/color variants. A swipe option Duplicar (next to Editar) reuses EditarProductoComponent with a new @Input modo; in duplicar mode guardar() generates a new uuid and calls crearProducto instead of actualizarProducto, so the original stays intact. Price is copied but editable (sizes can vary in price), costo_promedio always starts at 0 (never copied, derived from real purchases per Decision 040), tipo_venta is copied, name is pre-filled to only append the size. No schema change, products remain independent (no formal variant relationship). Verified on Android: swipe showed both options, duplicating created a new product with Sin costo registrado while the original was untouched, edited price respected, and duplicating several sizes fast was clearly quicker than creating from scratch. Feature #26 is DONE (Decision 048): technical debt paid. crearCliente and crearProducto now write ALL their table columns (10 and 11 respectively) instead of 5 and 6, matching the pattern Decision 032 applied to crearTransaccion. created_at is generated automatically (const createdAt = obj.created_at ?? Date.now()) using the SAME variable in the web mock and native branches, closing a web/native divergence. The other audit columns (updated_at, deleted_at, store_id, created_by) are passed as ?? null for now: they will be filled when roles (created_by) and edit/delete traceability (updated_at) are built. This is the foundation for BOTH future roles (created_by tells who created a record) AND any future shift-handoff sync with merge (updated_at is required to decide which version is newer). No schema change (columns already existed DEFAULT NULL), no historical migration (old records stay created_at null, only new ones get a timestamp). Verified on Android via exported JSON: a first false negative from a stale build was caught with evidence before assuming a code bug; after rebuild, Cliente Auditoria 2 and Producto Auditoria 2 showed created_at timestamps while all older records kept created_at null. On roles: decided the app stays generic (opens unlocked) with a simple PIN only the merchant knows to unlock administrative actions; NOT starting in employee mode, because merchants still use personal phones and copy the APK, so a shift-handoff via backup export/import is only a hypothesis to validate before building merge/conflict resolution. Feature #27 is DONE (Decision 049): PIN de administrador, Phase 1 of roles. The app stays open (generic for both roles), and only THREE destructive actions ask for a PIN per-action: reiniciar inventario, anular movimiento, and editar producto. Duplicar producto is deliberately NOT gated (constructive, would kill the Feature #25 agility). Without a configured PIN everything runs open, so merchants who have not set up security are not blocked; the rule lives in a pure function verificarPin (null/empty saved -> true; otherwise trim-compare). A SeguridadService (providedIn root) wraps AlertController so the three screens just call ejecutarConPin(action); the PIN is stored in Preferences (KEY pin_administrador), set/changed in a new Seguridad section of Configuraciones (changing it requires the current PIN). The PIN is an intention lock, NOT cryptographic security, documented as such: the threat is an accidental change by the helping family member, not a malicious attacker. In anularMovimiento the COMPRA rejection stays BEFORE the PIN (COMPRAS are corrected with an AJUSTE, not annulled, for weighted-average cost integrity). Verified on Android: without PIN all three ran open and duplicate too; after setting a PIN, edit/annul(MERMA)/reset asked for it (correct proceeds, wrong cancels), duplicate stayed open, and changing the PIN required the current one. 202 tests green (197 base + 5 verificarPin). Out of Phase 1: hiding profit from the employee (needs a session-mode model, not a per-action PIN) and populating created_by with the role. BACKLOG anotado tras el feedback de los 3 merchants: FASE 2 de variantes formales (producto base + talla/color como atributos con schema nuevo y precio override por variante) si ambas merchants de ropa lo siguen necesitando tras Duplicar; incluir el catalogo de fiado (catalogo_fiado en Preferences) en el respaldo/exportacion JSON, hoy respaldo-builder/validator solo cubren las 6 tablas SQLite y el catalogo no viaja con el backup; discriminar forma de pago en el momento de la venta para cierre de caja; proteger reinicio de inventario y anular movimiento detras de roles Administrador Empleado en el MISMO dispositivo (decidido NO multi-dispositivo); agregar proveedores con compras a credito; venta rapida sin producto; reconciliacion de fiados manuales que eran ventas; dashboard financiero con evolucion temporal; ideas de menor prioridad modulo caja registradora y modulo de gastos. Technical debt of crearCliente/crearProducto columns is DONE (Feature #26).

Before doing work, always run:

```bash
git status
```

Expected safe state before new work:

```text
working tree clean
up to date with origin-privado/main
```

---

## 4. Completed Feature #1 — Safe Recoverable Soft-Delete

**Feature directory:** `specs/001-soft-delete/`

### Completed scope

Feature #1 implemented safe soft-delete and immediate undo for:

- Clientes
- Transacciones

### Key outcomes

- Physical `DELETE` was removed from the active delete flows.
- `deleted_at` tombstones were added.
- Queries filter active records with `deleted_at IS NULL`.
- `contarClientes()` excludes deleted clients, protecting the freemium limit.
- Client delete/undo works from the Home page.
- Transaction delete/undo works from the Cliente Detalle page.
- Debt guard blocks client deletion when `deudaTotal > 0`.
- Transaction deletion recalculates balance immediately.
- Undo refresh bugs were fixed via `ChangeDetectorRef` in reload methods.

### Database/schema work completed

Feature #1 introduced schema versioning and migration behavior:

- `SCHEMA_VERSION = 2`
- `PRAGMA foreign_keys = ON` enabled during SQLite initialization.
- Nullable metadata/tombstone columns added to `clientes` and `transacciones`:
  - `created_at`
  - `updated_at`
  - `deleted_at`
  - `store_id`
  - `created_by`

### Tests

Feature #1 reached a green baseline with:

```text
27 tests passing
```

Coverage added:

- Component spec setup fixes.
- Data-layer soft-delete and restore coverage.
- UI soft-delete flow coverage for debt guard, delete, and undo.

---

## 5. Feature #2 (COMPLETED) — Inventory Base

**Feature directory:** `specs/002-inventario-base/`

### Current phase

Feature #2 is fully COMPLETE (Foundation + US1 + US2 + US3 + Polish) and merged to main. This section is kept as historical reference; see DECISIONS.md and git history for the full record.

Artifacts already created and reviewed:

- `spec.md`
- `plan.md`
- `data-model.md`
- `research.md`
- `quickstart.md`
- `tasks.md`
- `checklists/requirements.md`

Analyze result summary:

- Critical issues: 0
- Ambiguity count: 0
- Constitution alignment issues: none
- Main minor finding: `actor_id` was implicit in tasks and should be made explicit during implementation/review.

---

## 6. Feature #2 approved product decisions

The following decisions are locked unless Diego explicitly changes them:

### 6.1 Stock source of truth

The immutable movement log is the only source of truth.

```text
stock = SUM(valid inventory movements)
```

Do not store mutable stock in `Producto`.
Do not add a stock cache/projection in the MVP.

A future projection table may only be added if real performance data justifies it, and it must be fully reconstructable from movement history.

### 6.2 Negative stock

For the MVP:

- Outbound movements such as `VENTA` and `MERMA` must be blocked if the movement quantity exceeds available derived stock.
- Role-based override is explicitly out of scope.
- Do not implement users, roles, auth, or admin permissions for this feature.

### 6.3 AJUSTE semantics

In the UI, the user enters the physical counted quantity.

Example:

```text
Calculated stock: 10,000 g
Physical count: 8,500 g
Delta: -1,500 g
```

The system stores an `AJUSTE` movement using the delta.

The adjustment movement should also preserve audit metadata:

- calculated stock before adjustment
- physical count entered
- computed difference
- reason
- timestamp
- optional future `actor_id`

### 6.4 Weight handling

Products of type `PESO` store quantities as integer grams.

Examples:

```text
2.350 kg -> 2350 g
0.125 kg -> 125 g
```

Minimum precision for MVP: 1 gram.

Display may show kilograms to the user.
Internal persistence uses integer grams.

### 6.5 Movement types

Inventory movement types:

- `COMPRA`
- `VENTA`
- `AJUSTE`
- `MERMA`

They must remain semantically distinct.

Do not use `AJUSTE` to hide sales or waste.

### 6.6 Audit identity

`actor_id` may exist as a nullable optional field reserved for future identity/user management.

Do not build users, roles, authentication, or authorization in Feature #2.

### 6.7 Out of scope for Feature #2

Do not implement:

- POS / sales checkout flow
- profit per sale
- dashboard
- Excel/CSV import
- multi-store behavior
- roles or admin override
- product transformation/desposte
- stock cache/projection

---

## 7. Architecture rules to preserve

Always check `.specify/memory/constitution.md` first.

Current non-negotiables include:

- Ionic + Angular standalone components.
- Capacitor + SQLite.
- TypeScript strict.
- Clean Architecture style boundaries.
- Local SQLite is the primary source of truth.
- Cloud is not on the critical path.
- No physical deletes for syncable records.
- `deleted_at` tombstones.
- `PRAGMA foreign_keys = ON` on SQLite connections.
- Derived business values must not be treated as mutable truth.

---

## 8. Known AI failure patterns observed in this project

A new AI supervisor must actively watch for these:

1. Forgetting migration strategy for existing installs.
2. Adding mutable/cached stock fields despite log-as-truth.
3. Hallucinating REST/HTTP APIs in a local SQLite app.
4. Leaving empty method stubs.
5. Over-implementing out-of-scope roles/auth/multi-store/dashboard.
6. Producing fake green tests by deleting/skipping tests.
7. Leaving template placeholders or duplicated plan content.
8. Saying a file is clean without the actual file being reviewed.
9. Using `git commit -am` and accidentally skipping new untracked files.
10. Treating `/speckit.*` commands as paths instead of commands when not in the right Agent context.

---

## 9. Required workflow for any new supervisor

Before coding, a new AI supervisor must:

1. Read `.specify/memory/constitution.md`.
2. Read this file.
3. Read `docs/DECISIONS.md`.
4. Read the current feature's `spec.md`, `plan.md`, and `tasks.md`.
5. Summarize current project state.
6. State assumptions.
7. Wait for Diego's confirmation.

No code should be written before that.

---


## 10. Recommended next action

Features #1 through #30 are COMPLETE and merged to main (242 tests passing, build green, working tree clean). Schema v8. 52 decisions. FiApp is a working offline-first MiniPOS: clients & fiados, inventory (movements + weighted-average cost + low-stock alerts), soft-delete of movements, single-item sales CONTADO/FIADO/MIXTO (abono) with an atomic transaction primitive and frozen ganancia, and a read-only Reportes/Ganancias dashboard (Hoy/Todo). Movement creation is transactional (Feature #6, Decision 026). Sale amounts are the source of truth and tipo_pago is a projection (Feature #7, Decision 027). Every db.run declares its transaction context explicitly; the native write path was broken from Feature #4 until Feature #8 and is now verified on device (Decision 028). Colors resolve through Ionic variables so dark mode is readable, with the Home toolbar kept as fixed brand chrome (Decision 029).

NEXT (Diego chooses):
- DONE (Feature #9, Decision 029): UX pass. Colors now resolve through Ionic variables so dark mode is readable; the Home toolbar keeps a FIXED brand color and does not invert. mixtoCount is finally rendered and the summary separates counts from pesos. Business name has its own header row, header narrowed, subtitle is now Mi Negocio en el Bolsillo. Verified by hand on the iOS simulator in BOTH appearances.
- DONE (Feature #8, Decision 028): every db.run declares its transaction context via ejecutarRun. The plugin defaults transaction to true, which broke EVERY sale on device since Feature #4 and every COMPRA since Feature #6. Reproduced on a clean simulator, fixed, and verified on device including a v4-to-v5 in-place upgrade.
- DONE (Feature #7, Decision 027): Pago parcial/mixto en ventas. Amounts (monto_contado, monto_fiado) are the source of truth; tipo_pago is a projection via derivarTipoPago. Schema v5 + idempotent backfill. Report sums real amounts and counts MIXTO. 96 tests.
- DONE (P0 from the previous backlog): on-device verification. The v5 migration was run in place over a v4 database: it completed with no error, existing data survived, and a COMPRA that had just failed then succeeded. NOTE: the backfill of old ventas rows is defensive code that will never process a row, because registrarVenta was broken on device from Feature #4 until Feature #8, so no real installation can contain sales.
- DONE (P0, verified 2026-08-02): dark mode verified on ANDROID. Ran on a Pixel_8 emulator and toggled both appearances live with adb cmd uimode night, without restarting the app. Every checked surface was readable: Home toolbar kept its FIXED brand color and did not invert, business name row visible, cards, inputs and the Reportes summary legible. A client was created and survived a reload, which is the FIRST evidence in this project that native SQLite writes and the schema migrations run correctly on Android. The pilot merchant on Android is confirmed unblocked.
- DONE (Feature #10, Decision 030): screen transition overlap FIXED. Root cause was not the animation: six page stylesheets consumed var(--ion-background-color) with no fallback, and nothing in the project ever defined that variable. In dark mode dark.system.css defined it so pages were opaque; in light mode var() was invalid at computed-value time, --background collapsed and ion-content rendered TRANSPARENT, letting the outgoing screen show through the whole animation. Introduced by Feature #9 when hardcoded colors were replaced by variables and Ionic own fallback was dropped. Fix: delete the six overrides, 24 deletions and zero insertions, letting Ionic native rule apply. Verified by hand on Android Pixel_8 AND iOS simulator, in both appearances. 96 tests.
- DONE (Feature #11, Decision 031): multi-item sale. A sale now holds N lines in venta_items; ventas keeps only sale-level data and schema is v6. Amounts stay at SALE level per Decision 027; per-product columns were REMOVED from ventas rather than kept, because with three products claiming the sale belongs to the first one is false. The cart allows removing a line and editing quantity, blocks ONLY the line that exceeds stock so a stale inventory count never costs a whole sale, and allows the same product in separate lines with different prices. Migration follows the official SQLite table-rebuild pattern and is driven by the ACTUAL TABLE SHAPE, never by the version number. Three infrastructure bugs were found ON DEVICE and fixed: the plugin also defaults transaction to true on execute (Decision 028 was incomplete and only covered db.run), createConnection threw on every in-place upgrade so the migration never ran, and initializePlugin swallowed failures silently. Verified BY HAND on Android Pixel_8 and on the iOS simulator, including an in-place v5 to v6 upgrade over a database containing real sales. 106 tests.
- P3 - Later abonos against existing debt. A payment toward an existing fiado is a transaccion, not a venta; today debt is recorded but never paid down.
- DONE (Feature #12, Decision 032): fiado traceability. transacciones now carries venta_id as an explicit ORIGIN MARKER: NULL means registered by hand, a value means created by a sale. Schema v7 via ADD COLUMN, no rebuild. The report shows the CLIENT NAME on credit sales and lists manual fiados and abonos in a SEPARATE section, excluding sale-linked ones so debt is never double counted. Credit sales now write a concept naming the actual products instead of the hardcoded "Venta a credito", so Cliente Detalle finally shows WHAT was sold on credit. Two preexisting bugs surfaced and were fixed: crearTransaccion was silently dropping five tombstone columns, and initializePlugin had NO concurrency guard, so parallel reads ran the migration twice and threw duplicate column name. Verified on Android Pixel_8 and iOS. 117 tests.
- P5 - Integer-cents migration for money. Would remove the float tolerance from Decision 027, but touches Features #4, #5 and #7.
- DONE (Feature #14, Decision 035): real backup. The export now covers all SIX tables (clientes, transacciones, productos, movim_inventario, ventas, venta_items) instead of only clients and their transactions. Raw readers bypass the deleted_at filter so tombstones survive; the existing getters were left untouched. The payload is a table-oriented file with an embedded schema_version read from the SAME constant the migration uses, written to disk with Filesystem and shared as a file URI instead of as truncatable text. Cancelling the share sheet is now distinct from a real failure: the file is the artifact, sharing is optional. Verified on Android Pixel_8 over a clean install. EXPORT ONLY - importing the file back is Feature #15.

HOW TO START A NEW FEATURE:
1. Run: git status && git log --oneline -3 (verify clean on main).
2. Create a branch: 00X-nombre (next available number).
3. Spec-first: write spec.md -> plan.md -> tasks.md and commit them BEFORE any code.
4. Test-first per task: RED tests, then implement to GREEN, confirm "TOTAL: N SUCCESS" on screen BEFORE each commit.
5. Review every diff. Commit in small logical batches. Merge to main with --no-ff after verifying green on main.

Key commands: build = ng build (npm run build); tests = npm test -- --watch=false --browsers=ChromeHeadless.
Remember: web platform uses in-memory mocks (no persistence across reload/new tab) BY DESIGN; SQLite persists on device.

---

## 11. Android environment (verified 2026-08-02)

The android platform exists, builds and runs. AVD used: Pixel_8.

- Preferred path: npm run build && npx cap sync android && npx cap open android, then press Run in Android Studio.
- npx cap run android from the CLI fails with "invalid source release: 21" unless JAVA_HOME points to the JBR embedded in Android Studio:
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
- adb is not reliably on the PATH. If adb is not found:
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
- Toggle appearance WITHOUT restarting the app (Android equivalent of xcrun simctl ui booted appearance):
  adb shell "cmd uimode night yes"
  adb shell "cmd uimode night no"


- P7 - Report performance. Reportes renders every record with ion-list plus ngFor and NO virtualization, same as Home. Fine today, but the TODO range loads full history and the page now reads FOUR sources in parallel. Rough estimate: 20 movements a day is about 6000 rows a year. Candidate fix: virtual scroll plus an ESTE MES range. Do NOT optimize before a real merchant reports slowness.
- P8 - Merchant-facing data reset, option B: wipe productos, movim_inventario, ventas and venta_items, but KEEP clientes and their debt. Requested by a real merchant who wants to restart inventory without losing who owes him. Wiping everything is already possible from Android app settings and needs no code.
- DONE (Feature #13, Decision 033): the freemium now has teeth. READS stay free so the merchant never loses access to their own data, but WRITES are blocked on expiry: sales, manual fiados, inventory movements and new products. ABONOS always pass, because an abono reduces debt and benefits the customer who is paying. A bypass found ON DEVICE was closed: deleting a client dropped the count below the limit and unblocked the app, so a trial_bloqueado flag now persists once reached. Honest limits recorded in Decision 033: the password is readable in the JS bundle and reinstalling resets the day counter. Per-device activation codes remain future work.
- P10 - Readable report generated BY THE APP, shareable over WhatsApp. Does NOT need an AI: every figure already exists in reportes-calculations. Today the merchant would have to paste raw JSON into a chatbot.

- DONE (Feature #30, Decision 052): produccion MVP. Schema v8 agrega dos tablas NUEVAS (producciones, produccion_items, espejo exacto de ventas/venta_items) y la columna modo_produccion INTEGER DEFAULT 0 en productos, opt-in explicito por producto. Un evento de produccion es MULTI-LINEA: N productos, cada uno con su propio costo_unitario_declarado, sin prorrateo. El productor declara el costo "a ojo"; nunca se pide desglose de materia prima. Tres cambios aditivos con OR (union type, calcularStockDerivado, crearMovimientoInterno) reutilizan el mismo calcularCostoPromedioPonderado que COMPRA; anularMovimiento usa un bloque nuevo con mensaje propio, colocado ANTES del PIN (Decision 049). Pantalla nueva registrar-produccion (espejo de fiado-productos) con la logica pura extraida a core/produccion: construirProduccion, filtrarProductosDeProduccion, calcularCostoTotalProduccion y calcularCostoSugerido, todas testeadas. Calculadora de overhead OPCIONAL y manual via AlertController. El boton del Home solo aparece si hay al menos un producto en modo_produccion (AC-06: los 3 archivos del Home tienen CERO eliminaciones, con test de regresion permanente). Las dos tablas nuevas obligaron a corregir CUATRO operaciones que enumeraban tablas a mano: rollback de mocks en ejecutarEnTransaccion, resetInventario (fallaba en device por FOREIGN KEY), el respaldo (omitia las tablas nuevas, problema de Decision 035) y reemplazarTodo (no restauraba produccion ni el flag). Se pago ademas la deuda de crearProducto, que no escribia modo_produccion (patron Decision 048). Limite descubierto: la suite corre SOLO la rama web, asi que cualquier cambio que toque solo la rama nativa exige device; dos bugs pasaron en verde por esto. Riesgo abierto al backlog: validarRespaldo compara schema_version por igualdad exacta, por lo que los respaldos v7 quedan inservibles.
