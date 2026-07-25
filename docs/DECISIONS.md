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
