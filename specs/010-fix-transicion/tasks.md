# Feature 010 - Tasks

- [ ] T001 - GATE. Confirm root cause on device. In LIGHT mode navigate Home to Cliente Detalle. Expected: NO overlap, because that page never overrides --background. If it DOES overlap, STOP: the diagnosis is wrong and the spec must be rewritten before any edit.
- [ ] T002 - Commit spec.md, plan.md and tasks.md. No code before this commit.
- [ ] T003 - Capture the baseline: grep -rn "ion-background-color" src/ and save the six matches as the before state.
- [ ] T004 - Remove the --background line from home.page.scss. Anchor by content, not by line number. Do NOT touch the brand toolbar color.
- [ ] T005 - Remove the same line from ventas.page.scss.
- [ ] T006 - Remove the same line from reportes.page.scss.
- [ ] T007 - Remove the same line from configuraciones.page.scss.
- [ ] T008 - Remove the same line from inventory-list.page.scss.
- [ ] T009 - Remove the same line from inventory-movement.page.scss.
- [ ] T010 - Verify: grep -rn "ion-background-color" src/ must return ZERO matches. Verify the brand color at home.page.scss is still present. Review the full diff.
- [ ] T011 - Run the suite. Confirm TOTAL 96 SUCCESS on screen before committing.
- [ ] T012 - Commit the six removals as one atomic change.
- [ ] T013 - Verify on Android emulator Pixel_8: AC1 and AC2 on all four navigations, plus AC3 and AC4, in both appearances.
- [ ] T014 - Verify on iOS simulator: same checks, both appearances.
- [ ] T015 - Write Decision 030 in docs/DECISIONS.md: a CSS variable must never be consumed without a fallback unless the project itself defines it. Verify with grep -n "^## Decision" docs/DECISIONS.md and tail -3.
- [ ] T016 - Sync docs/PROJECT_CONTEXT.md: close P1 in section 10, update section 3 and the Last updated date.
- [ ] T017 - Merge to main with --no-ff and push to origin-privado.
