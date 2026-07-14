# Tasks: Borrado seguro y recuperable (soft-delete) para clientes y transacciones

**Input**: Design documents from `/specs/001-soft-delete/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because this feature changes persistence, balance calculations, and user-visible deletion flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Update `src/app/core/database/database.service.ts` with schema version tracking and a one-time migration entry point
- [ ] T002 [P] Update `src/app/core/models/cliente.model.ts` and `src/app/core/models/transaccion.model.ts` to include optional tombstone/audit metadata fields used by the migrated schema
- [ ] T003 [P] Add or update shared test fixtures for migrated records in `src/app/core/database/database.service.spec.ts` and relevant page specs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement SQLite migration logic in `src/app/core/database/database.service.ts` using `ALTER TABLE` for existing `clientes` and `transacciones` tables
- [ ] T005 Ensure `PRAGMA foreign_keys = ON` runs on every SQLite connection inside `initializePlugin()` in `src/app/core/database/database.service.ts`
- [ ] T006 Add nullable tombstone and audit columns with safe defaults in the migration path for `clientes` and `transacciones` (`created_at`, `updated_at`, `deleted_at`, `store_id`, `created_by`)
- [ ] T007 Add version-gated migration tests in `src/app/core/database/database.service.spec.ts` to verify the schema upgrade runs once and preserves legacy rows
- [ ] T008 Refactor read helpers in `src/app/core/database/database.service.ts` so active queries exclude soft-deleted rows by default

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Soft-delete Cliente with Undo and Freemium Safety (Priority: P1) 🎯 MVP

**Goal**: Allow a cliente to be soft-deleted and restored immediately, while preserving debt validation and freemium counts.

**Independent Test**: Delete a cliente without active debt, verify it disappears, confirm undo restores it immediately in the current UI context, and verify deleted clientes do not count toward the freemium limit.

### Tests for User Story 1

- [ ] T009 [P] [US1] Add soft-delete cliente service tests in `src/app/core/database/database.service.spec.ts` for logical delete, restore, and active-list filtering
- [ ] T010 [P] [US1] Add freemium gating tests in `src/app/core/freemium/freemium.service.spec.ts` to ensure deleted clientes are excluded from `contarClientes()`-based limits
- [ ] T011 [P] [US1] Add UI flow tests in `src/app/home/home.page.spec.ts` for delete confirmation, hidden row behavior, and immediate undo handling

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement soft-delete and restore methods for clientes in `src/app/core/database/database.service.ts` using `deleted_at` instead of physical delete
- [ ] T013 [P] [US1] Update `src/app/core/database/database.service.ts` cliente queries and counts to exclude rows where `deleted_at` is not null
- [ ] T014 [P] [US1] Update `src/app/core/freemium/freemium.service.ts` to use active cliente counts only
- [ ] T015 [P] [US1] Update `src/app/home/home.page.ts` and `src/app/home/home.page.html` to hide soft-deleted clientes, trigger logical delete, and expose immediate undo UI in-context
- [ ] T016 [US1] Enforce the active-debt restriction in the delete flow in `src/app/home/home.page.ts` using the current derived deuda calculation
- [ ] T017 [US1] Keep the cliente detail and refresh flows consistent after a delete or undo in `src/app/features/cliente-detalle/cliente-detalle.page.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Soft-delete Transaccion with Undo and Balance Recalculation (Priority: P2)

**Goal**: Allow a transaccion to be soft-deleted and restored immediately, while keeping balances correct.

**Independent Test**: Delete a transaccion, verify it disappears from views and changes the cliente balance, then undo it immediately and confirm the balance returns to the previous value.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add soft-delete transaccion service tests in `src/app/core/database/database.service.spec.ts` for logical delete, restore, and filtered balance calculations
- [ ] T019 [P] [US2] Add cliente balance tests in `src/app/features/cliente-detalle/cliente-detalle.page.spec.ts` to verify deleted transacciones do not contribute to debt
- [ ] T020 [P] [US2] Add UI flow tests in `src/app/features/cliente-detalle/cliente-detalle.page.spec.ts` for delete, undo, and recalculated totals

### Implementation for User Story 2

- [ ] T021 [P] [US2] Implement soft-delete and restore methods for transacciones in `src/app/core/database/database.service.ts` using `deleted_at` instead of physical delete
- [ ] T022 [P] [US2] Update `src/app/core/database/database.service.ts` transaccion queries to exclude soft-deleted rows by default
- [ ] T023 [US2] Update `src/app/features/cliente-detalle/cliente-detalle.page.ts` and template to hide deleted transacciones and expose immediate undo UI in-context
- [ ] T024 [US2] Recompute cliente balances in `src/app/features/cliente-detalle/cliente-detalle.page.ts` from active transacciones only
- [ ] T025 [US2] Ensure home and configuration summary views refresh correctly after transaccion delete or undo in `src/app/home/home.page.ts` and `src/app/features/configuraciones/configuraciones.page.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Immediate Undo for Recent Deletes (Priority: P3)

**Goal**: Allow the user to undo the most recent delete action for a cliente or transaccion while staying in the current context.

**Independent Test**: Delete a cliente or transaccion, tap undo immediately, and confirm the record returns and the derived counts or balances restore without leaving the screen.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add undo interaction tests in `src/app/home/home.page.spec.ts` to verify the immediate restore action is available after cliente delete
- [ ] T027 [P] [US3] Add undo interaction tests in `src/app/features/cliente-detalle/cliente-detalle.page.spec.ts` to verify the immediate restore action is available after transaccion delete

### Implementation for User Story 3

- [ ] T028 [P] [US3] Add a short-lived undo state holder in a UI/feature-layer service under `src/app/home/` or `src/app/features/cliente-detalle/` to track the last deleted record within the current screen context only
- [ ] T029 [US3] Wire the cliente delete flow in `src/app/home/home.page.ts` so the immediate undo action restores the last soft-deleted cliente
- [ ] T030 [US3] Wire the transaccion delete flow in `src/app/features/cliente-detalle/cliente-detalle.page.ts` so the immediate undo action restores the last soft-deleted transaccion
- [ ] T031 [US3] Update visible totals in `src/app/home/home.page.ts`, `src/app/features/cliente-detalle/cliente-detalle.page.ts`, and `src/app/features/configuraciones/configuraciones.page.ts` after undo restores a record

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Update `specs/001-soft-delete/quickstart.md` if any verification steps changed during implementation
- [ ] T033 [P] Add or refine documentation in `specs/001-soft-delete/research.md` and `specs/001-soft-delete/data-model.md` if implementation reveals schema details worth recording
- [ ] T034 Run `npm run build` and `npm run test` to validate the soft-delete slice end to end
- [ ] T035 Review `src/app/core/database/database.service.ts` for query consistency so all active-list reads filter deleted rows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Verifies persistence and migration behavior but should not block the core delete flows

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Add soft-delete cliente service tests in src/app/core/database/database.service.spec.ts for logical delete, restore, and active-list filtering"
Task: "Add freemium gating tests in src/app/core/freemium/freemium.service.spec.ts to ensure deleted clientes are excluded from contarClientes()-based limits"
Task: "Add UI flow tests in src/app/home/home.page.spec.ts for delete confirmation, hidden row behavior, and immediate undo handling"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
