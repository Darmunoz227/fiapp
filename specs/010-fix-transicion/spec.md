# Feature 010 - Fix screen transition overlap (Home to inner pages)

## Problem

Navigating from Home to an inner page shows BOTH screens superimposed during the entry animation. Reported in the backlog as P1: visible in light mode, masked in dark mode.

## Root cause (proven by inspection, pending device confirmation)

Six page stylesheets declare, on line 2:

    ion-content { --background: var(--ion-background-color); }

without a fallback value. Nothing in the project ever DEFINES --ion-background-color: src/theme/variables.scss is empty and src/global.scss only imports Ionic CSS plus the dark.system palette. A grep for ion-background-color returns exactly six matches, all consumers, zero definitions.

- In DARK mode the variable IS defined by dark.system.css inside a prefers-color-scheme media query, so --background resolves and the page is opaque.
- In LIGHT mode the variable is undefined. Because the declaration has no fallback, var() is invalid at computed-value time, --background collapses and ion-content renders TRANSPARENT. The entering page lets the outgoing page show through for the whole animation.

Ionic own internal rule uses var(--ion-background-color, #fff) WITH a fallback. Feature 009 replaced hardcoded light colors with variables and dropped that fallback.

Home does not disappear because home.page.html line 32 sets color="light" on ion-content, which paints a background by a different route.

This is a THEMING defect, not an animation defect. No animation code is at fault.

## Affected files

- src/app/home/home.page.scss line 2
- src/app/features/ventas/ventas.page.scss line 2
- src/app/features/reportes/reportes.page.scss line 2
- src/app/features/configuraciones/configuraciones.page.scss line 2
- src/app/features/inventario/inventory-list.page.scss line 2
- src/app/features/inventario/inventory-movement.page.scss line 2

NOT affected: cliente-detalle, which never overrides --background and therefore keeps the native fallback. It is the control case.

## Chosen solution - Option A

Delete the six overriding declarations. Ionic already provides the correct value with a fallback for both appearances. Rejected alternatives:

- Option B, declare a light palette in variables.scss. Viable but larger, and dangerous: angular.json loads variables.scss AFTER global.scss, and media queries add no specificity, so a bare :root rule would override dark mode and regress Feature 009.
- Option C, add a fallback in each file. Repeats a magic color in six places and creates maintenance debt.

## Requirements

- FR1 - Remove the --background override from the six stylesheets listed above.
- FR2 - Do NOT touch home.page.scss line 7, the fixed brand toolbar color protected by Decision 029.
- FR3 - Do NOT touch any --ion-card-background or --ion-item-background declaration.
- FR4 - Do not add new color literals anywhere.
- FR5 - Leave navigation code untouched. router.navigate stays as is.

## Acceptance criteria

- AC1 - In LIGHT mode, navigating Home to Ventas, Reportes, Inventario and Configuraciones shows no pixel of the previous screen through the entering page at any point of the animation.
- AC2 - In DARK mode the same four navigations remain correct. No regression.
- AC3 - The Home toolbar keeps its fixed brand color and does not invert, in both appearances.
- AC4 - Cards, items, inputs and text stay readable in both appearances on every touched page.
- AC5 - Verified BY HAND on iOS simulator AND on Android emulator Pixel_8, in both appearances. The Karma suite does not execute prefers-color-scheme, so a green suite is a precondition and never evidence.

## Out of scope

- Custom navigation animations.
- Migrating router.navigate to navigateForward.
- Any new theming palette or brand customization.
- Touching cliente-detalle.

## Test note

Karma stubs the platform to web and does not render or evaluate CSS custom properties, so this defect is NOT unit-testable in the current setup. The regression guard is a grep assertion plus manual device verification. This is recorded honestly rather than faking coverage.
