# Implementation Plan: Borrado seguro y recuperable (soft-delete) para clientes y transacciones

**Branch**: `001-soft-delete` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-soft-delete/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Implementar borrado lógico con `deleted_at` para clientes y transacciones, con deshacer inmediato en contexto actual, filtrado consistente en vistas y consultas, migración segura del esquema existente con `ALTER TABLE`, y actualización automática de saldos y conteos freemium sin usar `DELETE` físico.

## Technical Context

**Language/Version**: TypeScript strict, Angular 20

**Primary Dependencies**: Ionic 8, Capacitor 8, `@capacitor-community/sqlite`

**Storage**: SQLite local en `clientes` y `transacciones` con soft-delete por `deleted_at`, migrado in place con `ALTER TABLE` y versionado de esquema

**Testing**: Jasmine/Karma para unit/component tests

**Target Platform**: App móvil Ionic/Capacitor en Android, iOS y web de desarrollo

**Project Type**: mobile-app

**Performance Goals**: Operaciones locales de borrado/restauración y recalculo deben completar en menos de 100 ms en el camino crítico

**Constraints**: No `DELETE` físico; toda consulta funcional filtra `deleted_at IS NULL`; deshacer es inmediato y temporal; `PRAGMA foreign_keys = ON` se ejecuta en cada conexión SQLite dentro de `initializePlugin()`; el flujo debe conservar el conteo freemium y el saldo visibles correctos; la migración debe ser compatible con instalaciones existentes

**Scale/Scope**: Alcance acotado a clientes y transacciones existentes, con impacto en home, detalle de cliente, configuraciones y servicios core

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Cumple con la constitución vigente:
- Stack bloqueado: Angular standalone + Ionic + Capacitor + SQLite
- Clean Architecture en 3 capas con dominio sin imports de framework
- Integridad de datos inmutable con soft-delete y sin borrado físico
- Offline-first con persistencia local como camino crítico
- La conexión SQLite activa `PRAGMA foreign_keys = ON` en cada inicialización
- Seguridad por dominio asumida como restricción externa para este feature

La estrategia de migración debe detectar versión de base de datos y ejecutar una
sola vez un flujo de `ALTER TABLE` para agregar `deleted_at`, `created_at`,
`updated_at`, `store_id` y `created_by` a `clientes` y `transacciones` existentes.
Los nuevos campos deben ser nullable y usar defaults seguros para no romper filas
ya instaladas.

## Project Structure

### Documentation (this feature)

```text
specs/001-soft-delete/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── spec.md
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── database/
│   ├── freemium/
│   ├── models/
│   └── preferences/
├── features/
│   ├── cliente-detalle/
│   └── configuraciones/
├── home/
└── shared/
    └── modals/
```

**Structure Decision**: Mantener la app como un solo frontend móvil Ionic/Angular con lógica centralizada en `src/app/core`, pantallas en `src/app/features` y elementos reutilizables en `src/app/shared`. El feature modifica sobre todo `src/app/core/database`, `src/app/core/freemium`, `src/app/features/cliente-detalle`, `src/app/home` y `src/app/features/configuraciones`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations are expected for this feature.
