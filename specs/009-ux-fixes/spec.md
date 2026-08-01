# Feature 009 - UX fixes found on device

Three unrelated UI problems, grouped because they share templates and styles and can be verified in a single device pass.

## (a) mixtoCount is computed but never rendered

reportes.page.html shows only two summary lines: Contado and Fiado. A real device report showed 6 sales with contado 3 plus fiado 1. The two MIXTO sales were counted in numeroVentas but appeared in no category, so the numbers do not add up on screen. Worse, the sales LIST does show Pago MIXTO per row, so the merchant can see sales the summary ignores.

Leftover from Feature 007: mixtoCount reached the model and calcularResumenVentas but never the template.

Fix: one line. Also surface the peso split for MIXTO so the invariant is visible.

## (b) Business name squeezed out of the Home header

home.page.html puts three blocks in ONE toolbar row: app-branding, business-name, and header-actions with four ion-buttons. The name is present but crushed to an unreadable size. A regression: the merchant configured it during onboarding and can no longer see it.

Fix: restructure the header so branding and actions share the first row and the business name gets its own line.

## (c) Dark mode is unreadable - a pilot merchant cannot use the app

ROOT CAUSE (verified): global.scss imports the Ionic dark.system palette, so dark mode IS ACTIVE and follows the system setting. But src/theme/variables.scss is EMPTY (two comment lines, 113 bytes), and the feature scss files hardcode light colors: background white, color #374151, and a light linear-gradient on ion-content.

When the phone is in dark mode Ionic sets --ion-text-color to white, but the cards keep their hardcoded white background. White text on white background: literally invisible. This is the worst possible combination - with dark mode disabled the app would look plain but remain readable.

Approved approach (option 1): fix the colors, keep dark mode support. Rejected (option 2): commenting out the dark palette import - a one-line fix that gives up dark mode entirely.

Scope measured: about 40 hardcoded hex values across 5 scss files (configuraciones 10, inventory-movement 12, inventory-list 7, ventas 6, reportes 5) plus inline styles in home.page.html.

## In scope

- Render mixtoCount and its peso split in the reportes summary.
- Restructure the Home header so the business name is readable.
- Replace hardcoded colors with Ionic CSS variables in the 5 feature scss files and the Home inline styles.
- Populate variables.scss only if a custom brand color is actually needed.

## Out of scope (note as future, do NOT implement)

- Any change to reportes-calculations.ts (mixtoCount is already computed).
- Adding manual fiado to the report (that is the P3 backlog item).
- Redesigning any screen beyond what these three fixes require.
- A dark-mode toggle inside the app (the system setting is enough for now).
- Touching cliente-detalle or the modals (their scss files are empty).

## Acceptance criteria

- AC1: The report summary shows a MIXTO line, and contadoCount + fiadoCount + mixtoCount equals numeroVentas on screen.
- AC2: The business name is legible in the Home header.
- AC3: Every screen is readable with the device in DARK mode.
- AC4: Every screen is still readable with the device in LIGHT mode.
- AC5: The existing 96 tests remain green.

## Verification reality check

Karma does not evaluate prefers-color-scheme. AC3 and AC4 CANNOT be verified by the suite - only by running the simulator and toggling Dark Appearance in Settings Developer. Same lesson as Decision 028: a green suite is a precondition, never the evidence.
