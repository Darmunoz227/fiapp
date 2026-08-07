# Feature 017 - Plan

## Approach

Small, contained feature. One new modal, one new UPDATE, no schema change, no migration.

Four pieces:

1. A modal component under shared/modals, following nuevo-cliente as the closest precedent: a form in a modal, standalone, dismissed through ModalController.
2. An actualizarProducto method in DatabaseService. Explicit column list, writes updated_at, touches nothing else.
3. The inventory list row becomes ion-item-sliding with an Edit option, copying the gesture Home already uses for clients.
4. The freemium guard on the save action, per Decision 033.

## Duplication accepted on purpose

The money input pattern from Decision 036 is copied into the modal for precio_venta, making it the fourth copy of the same wiring. Extracting it was considered and REJECTED for this feature: Decision 036 already extracted the delicate part into caret-position, and what remains duplicated is Ionic wiring, not logic. Refactoring it now would touch three screens already verified on device, in exchange for tidiness. Recorded as debt instead.

## What must NOT happen

The UPDATE must not touch costo_promedio, which derives from the movement log, nor tipo_venta, which would reinterpret quantities already recorded. It must not touch created_at, deleted_at, store_id or created_by. Naming every column explicitly is not stylistic here: crearCliente and crearProducto silently drop five columns each, the same defect Decision 032 found in crearTransaccion and fixed there. Those two remain unfixed and are recorded as debt; this feature must not add a third.

Past sales must not change. venta_items freezes precio_venta and costo_unitario by snapshot per Decision 031, so editing a price today leaves last months sale intact. That is the correct behaviour and AC-03 exists to prove it.

## What the suite can and cannot prove

CAN: that the modal validates an empty name, a zero price and a negative minimum stock, and that the service is called with the expected values.

CANNOT: the native UPDATE, the swipe gesture, the modal rendering, or that a past sale kept its original price in the database. Karma stubs the platform to web. Device verification is the gate.

## Constitutional compliance

Principle I: standalone component, TypeScript strict, no NgModule. No as any, no @ts-ignore, no $any.
Principle III: no physical delete, no schema change, tombstone columns untouched. costo_promedio stays derived from the log.
Principle V: roles are not implemented, so no gating applies. Recorded so it is not silently skipped.
UX rules: money shown in COP without decimals through formatCurrencyCOP.
Decision 033: editing is a write and is gated by the freemium.

## Risks

R1. The row already carries a routerLink to the movement screen. Wrapping it in ion-item-sliding must not break that navigation.
R2. A stale product object in the modal could overwrite a costo_promedio that changed meanwhile. Mitigated by the UPDATE never naming that column.
R3. updated_at has never been written by anything. Nothing reads it either, so nothing should break, but this is the first write and the device test must confirm created_at survives.
