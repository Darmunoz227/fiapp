# Tasks: Inventario base - productos y registro de movimientos de stock

**Input**: Design documents from `/specs/002-inventario-base/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include targeted unit tests for the data layer and feature flows to keep each user story independently verifiable.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create inventory feature folders and model/service placeholders in `src/app/features/inventario/`, `src/app/core/models/`, and `src/app/core/database/`
- [ ] T002 [P] Add inventory route entry and lazy-loaded page placeholders in `src/app/app.routes.ts` and `src/app/features/inventario/`
- [ ] T003 [P] Add initial inventory test scaffolding in `src/app/core/database/database.service.spec.ts` and new inventory feature spec files under `src/app/features/inventario/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Update SQLite schema versioning and migration gate to version 3 in `src/app/core/database/database.service.ts`
- [ ] T005 [P] Create `productos` and `movim_inventario` table definitions with constitution metadata columns in `src/app/core/database/database.service.ts`
- [ ] T006 [P] Add migration-safe web fallback structures for inventory data in `src/app/core/database/database.service.ts`
- [ ] T007 Add base product and movement models reflecting the migration schema in `src/app/core/models/producto.model.ts` and `src/app/core/models/movim-inventario.model.ts`
- [ ] T008 [P] Add shared inventory calculation helpers for derived stock and gram/killogram conversions in `src/app/features/inventario/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Registro de productos (Priority: P1) 🎯 MVP

**Goal**: Allow the merchant to create `UNIDAD` and `PESO` products and see them in the product list.

**Independent Test**: Create a product of either type and verify it appears in the inventory list with the expected display fields.

### Tests for User Story 1

- [ ] T009 [P] [US1] Add unit tests for product creation validation and persistence in `src/app/core/database/database.service.spec.ts`
- [ ] T010 [P] [US1] Add page/service tests for product creation flow in `src/app/features/inventario/inventory-list.page.spec.ts`

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement product persistence methods in `src/app/core/database/database.service.ts`
- [ ] T012 [US1] Implement product creation and product list loading UI in `src/app/features/inventario/inventory-list.page.ts` and `src/app/features/inventario/inventory-list.page.html`
- [ ] T013 [P] [US1] Add product form validation for name, sale price, and `UNIDAD`/`PESO` type in `src/app/features/inventario/inventory-list.page.ts`
- [ ] T014 [US1] Add product list styling and low-risk empty-state handling in `src/app/features/inventario/inventory-list.page.scss`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Movimientos de stock y costo promedio (Priority: P1)

**Goal**: Record inventory movements and derive stock and weighted-average cost from the immutable movement log.

**Independent Test**: Record `COMPRA`, `VENTA`, `AJUSTE`, and `MERMA` movements and verify derived stock and cost update from the history.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add unit tests for stock derivation, negative-stock blocking, and weighted-average cost in `src/app/core/database/database.service.spec.ts`
- [ ] T016 [P] [US2] Add movement flow tests for purchase, sale, adjustment, and waste in `src/app/features/inventario/inventory-movement.page.spec.ts`

### Implementation for User Story 2

- [ ] T017 [P] [US2] Implement movement persistence and derived-stock queries in `src/app/core/database/database.service.ts`
- [ ] T018 [US2] Implement movement entry UI for `COMPRA`, `VENTA`, `AJUSTE`, and `MERMA` in `src/app/features/inventario/inventory-movement.page.ts` and `src/app/features/inventario/inventory-movement.page.html`
- [ ] T019 [P] [US2] Implement AJUSTE calculation from physical count plus audit metadata in `src/app/features/inventario/inventory-movement.page.ts`
- [ ] T020 [US2] Add derived-cost and movement-history display in `src/app/features/inventario/inventory-detail.page.ts` and `src/app/features/inventario/inventory-detail.page.html`

**Checkpoint**: At this point, User Story 1 and User Story 2 should both work independently

---

## Phase 5: User Story 3 - Consulta de stock bajo (Priority: P2)

**Goal**: Highlight products whose derived stock falls below their configured minimum.

**Independent Test**: Configure a low-stock threshold, reduce derived stock below that threshold, and verify the product is flagged as low stock.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add low-stock derivation tests for threshold evaluation in `src/app/core/database/database.service.spec.ts`
- [ ] T022 [P] [US3] Add UI tests for low-stock highlighting in `src/app/features/inventario/inventory-list.page.spec.ts`

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement low-stock threshold storage and query support in `src/app/core/database/database.service.ts`
- [ ] T024 [US3] Show low-stock state and threshold controls in `src/app/features/inventario/inventory-list.page.ts` and `src/app/features/inventario/inventory-list.page.html`
- [ ] T025 [P] [US3] Add visual emphasis for low-stock products in `src/app/features/inventario/inventory-list.page.scss`

**Checkpoint**: At this point, User Story 1, User Story 2, and User Story 3 should all be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T026 [P] Update quickstart validation steps and inventory notes in `specs/002-inventario-base/quickstart.md`
- [ ] T027 Refactor shared inventory calculations and naming consistency across `src/app/core/database/database.service.ts` and `src/app/features/inventario/`
- [ ] T028 [P] Run build and test validation for the inventory feature using `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`

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
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and fail before implementation where included
- Models before services
- Services before UI wiring
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel during setup
- T005, T006, T007, and T008 can run in parallel once schema versioning is in place
- US1 tests T009 and T010 can run in parallel
- US1 implementation tasks T013 and T014 can run in parallel after T011
- US2 tests T015 and T016 can run in parallel
- US2 implementation tasks T019 and T020 can run in parallel after T017
- US3 tests T021 and T022 can run in parallel
- US3 implementation tasks T023 and T025 can run in parallel after T023

---

## Parallel Example: User Story 1

```bash
# Launch product validation and UI coverage together:
Task: "Add unit tests for product creation validation and persistence in src/app/core/database/database.service.spec.ts"
Task: "Add page/service tests for product creation flow in src/app/features/inventario/inventory-list.page.spec.ts"

# Launch product form and list styling work together:
Task: "Add product form validation for name, sale price, and UNIDAD/PESO type in src/app/features/inventario/inventory-list.page.ts"
Task: "Add product list styling and empty-state handling in src/app/features/inventario/inventory-list.page.scss"
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
