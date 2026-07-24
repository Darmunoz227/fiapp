# Feature Specification: Soft-delete y restauración de movimientos de inventario

**Feature Branch**: `003-soft-delete-movimientos`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "El comerciante puede anular (soft-delete) un movimiento de inventario registrado por error y restaurarlo si fue un error. El stock derivado y el estado de stock bajo se recalculan automáticamente al anular o restaurar. Por seguridad de integridad de costos, en esta versión solo se pueden anular movimientos de tipo VENTA, MERMA y AJUSTE. Los movimientos de tipo COMPRA NO son anulables en esta versión porque afectan el costo promedio ponderado; los errores de COMPRA se corrigen mediante un AJUSTE. Los movimientos nunca se borran físicamente."

## Clarifications

### Session 2026-07-24

- Q: ¿Qué pasa con el costo promedio al anular una COMPRA? → A: Fuera de alcance. En esta versión COMPRA NO es anulable; los errores de COMPRA se corrigen con AJUSTE (ver Decisión 024). Solo VENTA, MERMA y AJUSTE son anulables. Esto evita dejar `costo_promedio` en un estado obsoleto, ya que el costo solo se recalcula al crear una COMPRA.
- Q: ¿El borrado es físico o lógico? → A: Lógico (soft-delete) mediante `deleted_at`. Nunca DELETE físico (Constitución III, Decisión 024).
- Q: ¿Se puede restaurar un movimiento anulado? → A: Sí. La anulación es reversible mediante restauración (mismo patrón que Feature #1 para clientes/transacciones).
- Q: ¿Cómo reacciona el sistema si el comerciante intenta anular una COMPRA? → A: El sistema muestra la acción de anular pero la bloquea con un mensaje claro (toast/alerta) indicando que las COMPRAS se corrigen mediante un AJUSTE. No se oculta la acción.
- Q: ¿Cómo restaura el comerciante un movimiento anulado? → A: Mediante un toast de "deshacer" (undo) inmediatamente después de anular, consistente con el patrón de Feature #1 (borrar/deshacer de clientes y transacciones). No se especifica una vista de papelera para restaurar movimientos anulados más tarde.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anular un movimiento registrado por error (Priority: P1)

Como comerciante, quiero anular un movimiento de VENTA, MERMA o AJUSTE que registré por error, para que mi inventario refleje la realidad sin perder la trazabilidad del error.

**Why this priority**: Es el valor central del feature. Los comerciantes cometen errores al registrar movimientos y necesitan corregirlos de forma segura y trazable.

**Independent Test**: Registrar una VENTA, anularla, y verificar que el stock derivado vuelve al valor previo y el movimiento ya no aparece en el historial activo.

**Acceptance Scenarios**:

1. **Given** un producto con stock derivado 10 y una VENTA de 3 (stock resultante 7), **When** el comerciante anula esa VENTA, **Then** el stock derivado vuelve a 10 y la VENTA deja de contar en el cálculo.
2. **Given** un movimiento de MERMA activo, **When** el comerciante lo anula, **Then** el movimiento queda marcado con `deleted_at` y no aparece en el historial de movimientos activos.
3. **Given** un movimiento de AJUSTE activo, **When** el comerciante lo anula, **Then** el stock derivado se recalcula ignorando ese ajuste.
4. **Given** un movimiento de tipo COMPRA, **When** el comerciante intenta anularlo, **Then** el sistema muestra un mensaje (toast/alerta) que bloquea la anulación e indica que las COMPRAS se corrigen mediante un AJUSTE, y el movimiento permanece activo.
5. **Given** que el comerciante acaba de anular una VENTA/MERMA/AJUSTE, **When** aparece el toast de confirmación, **Then** el toast ofrece una acción de "Deshacer" que restaura el movimiento si se toca.

---

### User Story 2 - Restaurar un movimiento anulado (Priority: P2)

Como comerciante, quiero deshacer la anulación de un movimiento inmediatamente después de anularlo, para corregir un error de anulación sin tener que registrar el movimiento de nuevo.

**Why this priority**: La anulación puede ser en sí misma un error; la reversibilidad inmediata protege contra pérdidas de datos y da confianza.

**Restore entry point**: La restauración se ofrece mediante un toast de "Deshacer" que aparece justo después de anular (mismo patrón que Feature #1 para clientes/transacciones). Esta versión NO incluye una vista de papelera para restaurar movimientos anulados en un momento posterior.

**Independent Test**: Anular una VENTA, tocar "Deshacer" en el toast, y verificar que vuelve a contar en el stock derivado y reaparece en el historial activo.

**Acceptance Scenarios**:

1. **Given** una VENTA recién anulada con toast visible, **When** el comerciante toca "Deshacer", **Then** `deleted_at` vuelve a NULL y el movimiento cuenta de nuevo en el stock derivado.
2. **Given** una MERMA recién anulada con toast visible, **When** el comerciante toca "Deshacer", **Then** reaparece en el historial de movimientos activos.
3. **Given** que el método de restauración existe en la capa de datos, **When** se restaura un movimiento por su id, **Then** `deleted_at` queda en NULL de forma idempotente.

---

### User Story 3 - Ver el efecto en stock bajo (Priority: P3)

Como comerciante, quiero que la alerta de stock bajo se actualice al anular o restaurar movimientos, para tomar decisiones de reposición con información correcta.

**Why this priority**: Refuerza el valor de US1/US2 conectándolo con la funcionalidad de stock bajo (US3 de Feature #2), pero depende de ellas.

**Independent Test**: Con un producto cerca del mínimo, anular una VENTA que lo había puesto en stock bajo y verificar que el badge "Stock bajo" desaparece si el stock recuperado supera el mínimo.

**Acceptance Scenarios**:

1. **Given** un producto marcado como stock bajo por una VENTA, **When** se anula esa VENTA y el stock sube por encima del mínimo, **Then** el producto deja de mostrarse como stock bajo.
2. **Given** un producto en stock normal, **When** se restaura una VENTA que lo deja en o por debajo del mínimo, **Then** el producto se muestra como stock bajo.

### Edge Cases

- Anular un movimiento que ya está anulado no debe tener efecto adicional ni error grave (idempotente o bloqueado con mensaje claro).
- Restaurar un movimiento que ya está activo no debe tener efecto adicional.
- Anular un movimiento inexistente debe manejarse sin corromper datos.
- Anular una VENTA/MERMA nunca puede dejar el stock derivado negativo (dado que solo suma de nuevo unidades salientes previamente descontadas, esto no debería ocurrir, pero debe validarse conceptualmente).
- Un AJUSTE anulado deja de aplicar su delta al stock derivado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir anular (soft-delete) un movimiento de tipo VENTA, MERMA o AJUSTE marcándolo con `deleted_at`.
- **FR-002**: El sistema MUST impedir la anulación de movimientos de tipo COMPRA, mostrando un mensaje (toast/alerta) que indica que se corrigen mediante un AJUSTE. La acción de anular es visible en las COMPRAS pero queda bloqueada al intentarla.
- **FR-003**: El sistema MUST permitir restaurar un movimiento anulado, dejando `deleted_at` en NULL, ofrecido mediante un toast de "Deshacer" inmediatamente después de la anulación (patrón de Feature #1).
- **FR-004**: El sistema MUST recalcular el stock derivado ignorando los movimientos anulados (`deleted_at IS NOT NULL`).
- **FR-005**: El sistema MUST NOT borrar físicamente ningún movimiento (no DELETE).
- **FR-006**: El sistema MUST mantener el movimiento anulado en la base de datos para trazabilidad y auditoría.
- **FR-007**: El historial de movimientos activos MUST excluir los movimientos anulados por defecto.
- **FR-008**: El estado de stock bajo MUST reflejar el stock derivado recalculado tras anular o restaurar.
- **FR-009**: El sistema MUST NOT recalcular ni modificar `costo_promedio` en esta versión, ya que COMPRA no es anulable (evita estados de costo obsoletos).
- **FR-010**: Las operaciones de anular y restaurar MUST completarse contra SQLite local (offline-first), sin depender de la nube.

### Key Entities *(include if feature involves data)*

- **MovimientoStock**: Entidad existente (`movim_inventario`). Ya incluye `deleted_at`. Esta feature usa esa columna; no crea entidades nuevas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Anular una VENTA/MERMA/AJUSTE recalcula el stock derivado correctamente en el 100% de los casos cubiertos por prueba.
- **SC-002**: Restaurar un movimiento anulado devuelve el stock derivado a su valor con el movimiento activo en el 100% de los casos cubiertos por prueba.
- **SC-003**: El sistema bloquea el 100% de los intentos de anular una COMPRA.
- **SC-004**: Ningún movimiento se borra físicamente (verificable: el registro permanece con `deleted_at` no nulo).
- **SC-005**: El estado de stock bajo se actualiza correctamente tras anular/restaurar en todos los casos validados por prueba.

## Assumptions

- La columna `deleted_at` ya existe en `movim_inventario` y `calcularStockDerivado` ya ignora los movimientos con `deleted_at != null` (verificado en Feature #2).
- El patrón de soft-delete/restore ya está probado en Feature #1 (clientes y transacciones) y se replicará para movimientos.
- COMPRA queda fuera de alcance para anulación en esta versión (Decisión 024). La anulación de COMPRA con recálculo de costo es un candidato de feature futuro.
- El costo promedio ponderado no se toca en esta feature.
- La corrección de errores de COMPRA se hace mediante AJUSTE, ya disponible.

## Out of Scope

- Anulación de movimientos de tipo COMPRA.
- Recálculo o derivación del costo promedio ponderado al anular/restaurar.
- Borrado físico de movimientos.
- Historial/vista de movimientos anulados (papelera). La restauración solo se ofrece mediante el toast de "Deshacer" inmediato tras la anulación; no hay vista para restaurar movimientos anulados en un momento posterior.
- Ocultar la acción de anular en las COMPRAS (se muestra pero se bloquea con mensaje).