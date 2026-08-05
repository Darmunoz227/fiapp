# Feature 015 - Plan

## Approach

Display-only feature. No schema, no migration, no SQL, no write path. Karma can prove the pure function and nothing else.

Three stages, strictly in order:

1. EXTRACT. The caret loop is duplicated verbatim inside onMontoInput and handlePaste. It moves to a pure function in shared/utils with its own spec. Zero framework imports, per Principle II, following the precedent of reportes-calculations.
2. MIGRATE the source. nueva-transaccion starts calling the extracted function and the paste bug is fixed by applying the position it already computes. Nothing else about that component changes. The suite staying green is the safety net: this component ships working behaviour today and the extraction must not alter it.
3. REPLICATE. Only after stage 2 is green do the four money fields get the pattern.

The order matters. Extracting from a component that is already in production, and proving the extraction did not change it, is what makes the replication safe. Replicating first would spread a pattern nobody has verified.

## Why a pure function and not a directive

A directive would remove more boilerplate from the pages, but it manipulates the DOM and Karma covers almost none of it. The delicate part here is not wiring an input, it is mapping digits-before-caret onto a position inside a formatted string. That logic is pure, it is currently duplicated, and it is exactly what a test can pin down. The pages keep thin handlers that fetch the native input, call the function and apply the result.

## Money versus quantity

The four money fields are precio and abono in ventas, costo_unitario in inventory movements, and precio_venta in inventory list. Every other numeric input is a QUANTITY and is left alone. cantidad can be decimal for products sold by weight in grams under Decision 014, and formatCurrencyCOP truncates decimals. Formatting a quantity as currency would silently destroy a weight-based sale. This is the single largest risk in the feature and the reason the split is explicit in the spec.

## What the suite can and cannot prove

CAN: the caret function across start, middle, end and empty input.

CANNOT: that an ion-input renders empty, that a separator appears while typing, that the caret lands where the merchant expects, that pasting works, or that anything looks right on a phone. Karma never renders an ion-input nor fires a real input event. Device verification is the gate.

## Constitutional compliance

Principle I: standalone, TypeScript strict. No as any, no @ts-ignore, no $any.
Principle II: the extracted function is pure domain logic with zero framework imports.
Principle III: untouched. No writes, no deletes, no schema.
UX rules: money is displayed in COP with no decimals through formatCurrencyCOP. Checkout stays within three taps; this feature removes keystrokes rather than adding them.
Decision 033: reads stay free and this feature writes nothing, so the freemium guard is not involved.

## Risks

R1. Changing a bound field from number to string can break arithmetic downstream. Every consumer of the four fields must be checked, not assumed.
R2. The caret restore runs inside a setTimeout. Behaviour may differ on a real device from the desktop browser.
R3. Weight-based sales are the regression to watch. The device test must include one.
