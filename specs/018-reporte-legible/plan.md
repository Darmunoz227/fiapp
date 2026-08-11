# Feature 018 - Plan

## Approach

Presentation-only feature. No new data, no schema, no write, no freemium gate. One pure function plus a button that hands its output to the share sheet.

Three pieces: a pure builder construirTextoReporte beside reportes-calculations taking ResumenReporte plus business name and range; the three Group A derivations computed inside it guarded against division by zero; and a share button on Reportes that reads the business name from Preferences, builds the text for the currently selected range from the resumen the page already holds, and shares through the Feature 014 path.

## The two fiado headers

The heart of the feature. monto_fiado is sale-level debt and goes under the ventas header next to contado. Manual fiado has venta_id null and goes under the aparte header next to abonos. Never added together. Decision 032 recorded that summing them double counts debt. AC-02 proves they stay apart.

## What the suite can and cannot prove

CAN: every figure and derivation, the division-by-zero guards, and that the two fiado groups render under their own headers. CANNOT: the share sheet, WhatsApp delivery, or that the numbers match the screen. Karma stubs the platform to web. Device is the gate.

## Constitutional compliance

Principle I: standalone, strict, no as any. Principle II: the builder is pure, zero framework imports. Principle III: untouched. UX: money in COP without decimals. Decision 033: reading is free, no gate. Principle V: profit would be hidden from an EMPLOYEE, but roles are not implemented; recorded, not gated.

## Risks

R1. The business name in Preferences could be empty; the text degrades to a generic header.
R2. The share cancellation must stay silent per Decision 035; reuse that handling.
R3. The on-screen figures and the text must come from the SAME resumen or they disagree. The handler builds from the resumen the page already computed.
