# Tasks: Reportes / Ganancias

**Prerequisites**: spec.md, plan.md
**Tests**: Test-first for the pure helper. Confirm green BEFORE each commit.

## Phase 1: Pure helper (Blocking, test-first) - CROWN JEWEL

- [ ] T001 Tests (test-first) in src/app/features/reportes/reportes-calculations.spec.ts for two NOT-YET-EXISTING pure fns: filtrarVentasPorRango(ventas,rango,ahora) (TODO=all; HOY=only ventas within local day of ahora; test boundary: 00:00 today included, just-before-midnight yesterday excluded); calcularResumenVentas(ventas) (totalVendido=sum(precio*cantidad); gananciaTotal=sum(ganancia); numeroVentas; contado/fiado counts+totals; empty array = all zeros).
- [ ] T002 Implement reportes-calculations.ts (RangoReporte, ResumenVentas, filtrarVentasPorRango, calcularResumenVentas), pure, ahora injected, to make T001 pass.

## Phase 2: Reportes page

- [ ] T003 Create reportes.page.ts/.html/.scss (standalone) + lazy route reportes in app.routes.ts. Load ventas+productos in ionViewWillEnter, build id->producto map, recomputar() default TODO.
- [ ] T004 Summary card (total vendido, ganancia, N ventas, contado vs fiado, COP) + sales list fecha DESC (product name w/ fallback, cantidad, total, ganancia, tipo, fecha) + empty state.
- [ ] T005 Hoy/Todo IonSegment toggle -> recomputar().

## Phase 3: Nav + tests

- [ ] T006 Add Reportes nav button on home (addIcons + Router), like inventario/ventas.
- [ ] T007 UI tests reportes.page.spec.ts (mocked DatabaseService; resumen reflects mocked ventas; HOY recomputes; empty state).
- [ ] T008 Final: npm run build + npm test (existing 71 + new).

## Notes
- Read-only: NO database.service.ts changes, NO writes, NO schema change.
- Commit green groups: T001+T002, T003-T005, T006, T007.
