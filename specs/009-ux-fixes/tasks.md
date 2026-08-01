# Tasks - Feature 009

Green tests prove almost nothing here. The device, in BOTH appearances, is the gate.

## T001 [GREEN] Render mixtoCount
Add the Mixto line to the resumen-grid in reportes.page.html, next to Contado and Fiado.
Gate: build green. COMMIT.

## T002 [GREEN] Home header layout
Restructure custom-header-layout so business-name is readable. Keep the ngIf so it stays hidden when empty. Adjust home.page.scss as needed.
Gate: build green. COMMIT.

## T003 [READ] Map the hardcoded colors
cat each of the 5 feature scss files in full before editing. Take the actual values from the files, not from the spec summary. No edits in this task.

## T004 [GREEN] reportes.page.scss
Replace hardcoded colors with Ionic variables per the plan mapping.

## T005 [GREEN] ventas.page.scss
Same mapping.

## T006 [GREEN] inventory-list.page.scss and inventory-movement.page.scss
Same mapping. These two are the largest, 19 hex values between them.

## T007 [GREEN] configuraciones.page.scss
Same mapping. 10 hex values.

## T008 [GREEN] home.page.html inline styles
Replace the inline color values with Ionic text classes or variables.

## T009 [GATE] Grep control
grep -rn "background: white" src/app --include="*.scss" must return nothing.
Then the full suite and the build. COMMIT T004-T008 together.

## T010 [DEVICE] The verification that matters
npm run build && npx cap sync ios && npx cap open ios
Run the simulator in LIGHT appearance first, walk every screen: Home, Ventas, Inventario (list and movement), Reportes, Configuraciones, Cliente detalle, and both modals.
Then switch the simulator to DARK (Settings, Developer, Dark Appearance) and walk the SAME screens again.
Every screen must be readable in both. Note any screen that is not.

## T011 [DEVICE] Confirm (a) and (b) on device
With at least one MIXTO sale registered, the report summary must show the Mixto line and the three counters must add up to the number of sales.
The business name must be legible in the Home header.

## T012 [DOCS] Decision 029
Record: dark mode was active all along via the dark.system palette, while the feature styles hardcoded light colors. The failure was not a missing theme, it was code ignoring the variables Ionic already provides. Also record that mixtoCount shipped computed but unrendered in Feature 007, and that neither problem is visible to the test suite.

## T013 [DOCS] PROJECT_CONTEXT
Section 3 and 10: Feature 009 done, backlog re-prioritized with the three P0 items removed.

## T014 [MERGE] To main
git checkout main && git merge --no-ff 009-ux-fixes
Re-run tests on main before push. Do NOT merge before T010 passes in both appearances.
