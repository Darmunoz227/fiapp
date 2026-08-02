# Plan - Feature 009

## Files touched

(a) src/app/features/reportes/reportes.page.html
(b) src/app/home/home.page.html and home.page.scss
(c) src/theme/variables.scss, src/app/home/home.page.html inline styles, and 5 feature scss files: configuraciones, inventory-movement, inventory-list, ventas, reportes.

NOT touched: reportes-calculations.ts, any service, any model, any test logic.

## Change (a) - render mixtoCount

Add one line to the resumen-grid, next to Contado and Fiado, showing mixtoCount. It is already computed by calcularResumenVentas. With that line present the merchant can see the three counters add up to numeroVentas, which is the invariant approved in Feature 007.

## Change (b) - Home header layout

Today custom-header-layout is one row with three children. Move business-name out of that row so it gets its own line under the branding, or give the row a two-line flex layout. The name must stay hidden when businessName is empty, so the ngIf stays.

## Change (c) - color variables

Mapping to apply everywhere:
  background white               becomes var(--ion-card-background)
  color #374151 and similar      becomes var(--ion-text-color)
  color #8a8f98 or #888 or #666  becomes var(--ion-color-medium)
  light gradients on ion-content becomes var(--ion-background-color)
  rgba shadows                   stay as they are, they read fine on both themes

variables.scss stays empty unless a brand color is actually needed. Ionic already provides sane defaults for both palettes. The bug was never a missing variable, it was code ignoring the variables that already exist.

Order matters: do (a) first because it is trivial and isolated, then (b), then (c) file by file. Doing (c) first would mix a large mechanical diff with two behavioral changes.

## Risk

- (a) and (b): low, template only.
- (c): medium. Touches 6 files and is easy to half-apply. One missed hardcoded background is one invisible screen. The hex grep is the control, not the tests.
- No test can see any of this. The device is the gate.

## Verification gate

    npm test -- --watch=false --browsers=ChromeHeadless
    npm run build
    grep -rn "background: white" src/app --include="*.scss" | wc -l

The grep count must drop to zero. Then the device, in BOTH appearances.
