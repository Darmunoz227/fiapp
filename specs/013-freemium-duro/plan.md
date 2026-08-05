# Feature 013 - Implementation plan

## Strategy

Pure guarding. No schema, no migration, no new UI. One new method in FreemiumService and five call sites protected. This is the smallest possible change that makes the trial actually bite.

## Blast radius (measured by grep)

- freemium.service.ts: add the generic write guard next to puedeAgregarCliente.
- ventas.page.ts line 210: guard registrarVenta.
- cliente-detalle.page.ts line 133: guard ONLY when tipo is fiado.
- inventory-movement.page.ts lines 135 and 180: two call sites, both guarded.
- inventory-list.page.ts line 56: guard crearProducto.
- nuevo-cliente.component.ts: already guarded, no change.
- Every read path: untouched.

## Phases, each ending green

- Phase 1 - Guard method. Add puedeEscribir to FreemiumService reusing obtenerEstado and mostrarAlertaBloqueo. Additive: nothing calls it yet.
- Phase 2 - Wire the four unguarded write points. The abono exception in cliente-detalle is the delicate one.
- Phase 3 - Device verification, Decision 033, PROJECT_CONTEXT sync, merge, and a fresh APK for the pilot.

## Risks

- R1 - fiado and abono share crearTransaccion. The guard must discriminate by tipo, not by call site. A mistake here either blocks customers who are paying or lets new debt through while blocked.
- R2 - Guarding too broadly would break a read and lock the merchant out of their own data. Only the five write calls listed above are touched.
- R3 - obtenerEstado hits the database via contarClientes on every call. Calling the guard inside a loop would be wasteful. Guard once per user action, before the write, never per item.
- R4 - Karma stubs the platform to web, so the guard logic is unit testable but the real blocked experience is not. Device verification is mandatory.

## Definition of done

All acceptance criteria met, suite green, verified by hand on Android with the block forced by reaching 7 clients, Decision 033 written, PROJECT_CONTEXT synced, merged to main, and a new APK built for the three pilot merchants.
