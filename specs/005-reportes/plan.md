# Implementation Plan: Reportes / Ganancias (resumen de ventas)

**Branch**: `005-reportes` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

## Summary

Add a read-only sales report. The merchant toggles between "Hoy" and "Todo"; the page shows a summary (total vendido, ganancia total, numero de ventas, contado vs fiado) and a list of individual sales (newest first, with product name). All numbers come from the existing `ventas` table via `obtenerVentas()`; the summary math lives in a new pure, testable helper. No new writes, no schema change.

## Groundwork Already Verified

- `obtenerVentas()` exists (Feature #4) and filters `deleted_at IS NULL`.
- `obtenerProductos()` exists - used to map `producto_id` -> nombre.
- `Venta` model has: precio_venta, cantidad, ganancia, tipo_pago, fecha, producto_id.
- No schema migration, no new tables, no data-layer changes required.

## The Pure Helper (centerpiece, test-first)

New file `src/app/features/reportes/reportes-calculations.ts`:

- `type RangoReporte = "HOY" | "TODO"`
- `interface ResumenVentas { totalVendido; gananciaTotal; numeroVentas; contadoCount; fiadoCount; contadoTotal; fiadoTotal }`
- `filtrarVentasPorRango(ventas, rango, ahora)`: TODO returns all; HOY returns ventas whose fecha is within the local day of `ahora` (start-of-day <= fecha < start-of-next-day). `ahora` injected for testability.
- `calcularResumenVentas(ventas)`: reduce computing totals; total per venta = precio_venta * cantidad.
- Pure functions, no framework imports. Crown-jewel aggregation tests live here.

## Data Layer

- NO changes. Reuse `obtenerVentas()` and `obtenerProductos()`.

## UI Layer (new feature: features/reportes)

- New standalone page `reportes.page` (+ lazy route `reportes`).
- Fields: rango (default TODO), ventas, resumen, id->producto map, ventasFiltradas.
- ionViewWillEnter -> load ventas + productos, then recomputar().
- recomputar(): filtrarVentasPorRango(ventas, rango, Date.now()); sort by fecha DESC; calcularResumenVentas.
- Toggle (IonSegment) sets rango and recomputes.
- Template: segment Hoy/Todo; summary card (total vendido, ganancia, N ventas, contado vs fiado, COP); sales list (product name w/ fallback, cantidad, total, ganancia, tipo, fecha); empty state.
- Home: add a "Reportes" nav button (like inventario/ventas).

## Explicitly NOT Touched

- database.service.ts (no new methods) - pure reads via existing methods.
- No schema change, no writes. No charts, no extra ranges, no export.

## Constitution Check

- Stack locked. Read-only (no writes/mutation). Report math in pure framework-free helper. Offline-first. Ganancia is the frozen snapshot from Feature #4; report only aggregates it.

## Project Structure

- specs/005-reportes/: spec.md, plan.md, tasks.md
- src/app/features/reportes/reportes-calculations.ts (+ .spec.ts)
- src/app/features/reportes/reportes.page.ts/.html/.scss (+ .spec.ts)
- src/app/app.routes.ts (add reportes route)
- src/app/home/home.page.ts/.html (add Reportes nav)

## Complexity Tracking

Lowest-risk feature so far (read-only, pure aggregation). The only care point is the "Hoy" local-day boundary, covered by injecting `ahora` into the pure filter and testing the boundary explicitly.
