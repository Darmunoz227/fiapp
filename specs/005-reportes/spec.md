# Feature Specification: Reportes / Ganancias (resumen de ventas)

**Feature Branch**: `005-reportes`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "El comerciante puede ver un reporte de sus ventas y ganancias. Puede alternar entre 'Hoy' y 'Todo'. El reporte muestra un resumen (total vendido, ganancia total, número de ventas, y el desglose contado vs fiado) y una lista de las ventas individuales (producto, cantidad, total, ganancia, tipo de pago, fecha), de la más reciente a la más antigua. Es una funcionalidad de solo lectura sobre la tabla ventas ya existente; no crea ni modifica ventas."

## Clarifications

### Session 2026-07-24

- Q: ¿Qué rangos de tiempo se soportan? → A: Dos presets: "Hoy" (ventas cuya fecha cae en el día actual) y "Todo" (todas las ventas activas). Rangos personalizados (semana/mes/rango) quedan fuera de alcance como iteración futura.
- Q: ¿Qué métricas muestra el resumen? → A: Total vendido (Σ precio_venta × cantidad), ganancia total (Σ ganancia congelada), número de ventas, y desglose contado vs fiado.
- Q: ¿Muestra ventas individuales? → A: Sí, una lista de las ventas del rango seleccionado, de la más reciente a la más antigua, mostrando producto, cantidad, total, ganancia, tipo de pago y fecha.
- Q: ¿La lista muestra el nombre del producto? → A: Sí. Como `Venta` solo guarda `producto_id`, el reporte carga los productos y mapea id→nombre para mostrar. Si un producto ya no existe, se muestra un texto de respaldo.
- Q: ¿Esta feature crea o modifica ventas? → A: No. Es de solo lectura sobre la tabla `ventas`. No escribe nada.
- Q: ¿Dónde vive el cálculo del resumen? → A: En un helper puro y testeable (patrón de inventory-calculations), no en la UI ni en el servicio de datos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el resumen de ganancias (Priority: P1)

Como comerciante, quiero ver un resumen de mis ventas y ganancias para entender cómo va mi negocio.

**Why this priority**: Es el valor central; hace visible la información económica que la venta congela pero que hoy no se puede consultar.

**Independent Test**: Con varias ventas registradas, abrir el reporte y verificar que el total vendido, la ganancia total y el número de ventas corresponden a las ventas del rango seleccionado.

**Acceptance Scenarios**:

1. **Given** varias ventas registradas, **When** el comerciante abre el reporte en "Todo", **Then** ve el total vendido, la ganancia total y el número de ventas de todas las ventas activas.
2. **Given** ventas registradas hoy y en días anteriores, **When** el comerciante selecciona "Hoy", **Then** el resumen solo considera las ventas cuya fecha cae en el día actual.
3. **Given** ventas de contado y de fiado, **When** el comerciante ve el resumen, **Then** ve el desglose de cuántas/ cuánto fue contado y cuánto fiado.

---

### User Story 2 - Ver la lista de ventas (Priority: P2)

Como comerciante, quiero ver la lista de mis ventas individuales para revisar el detalle de cada una.

**Why this priority**: Complementa el resumen con trazabilidad; depende del mismo filtrado por rango.

**Independent Test**: Registrar ventas y verificar que aparecen en la lista, de la más reciente a la más antigua, con producto, cantidad, total, ganancia, tipo y fecha.

**Acceptance Scenarios**:

1. **Given** ventas registradas, **When** el comerciante ve el reporte, **Then** aparece una lista ordenada de la más reciente a la más antigua.
2. **Given** una venta de un producto, **When** aparece en la lista, **Then** muestra el nombre del producto (no el id), su cantidad, total, ganancia y tipo de pago.
3. **Given** que no hay ventas en el rango, **When** el comerciante abre el reporte, **Then** ve un estado vacío claro.

---

### User Story 3 - Alternar entre Hoy y Todo (Priority: P2)

Como comerciante, quiero alternar entre "Hoy" y "Todo" para enfocar el reporte en el día o en el histórico.

**Why this priority**: Habilita la pregunta diaria más común ("¿cómo me fue hoy?") sin complejidad de rangos personalizados.

**Acceptance Scenarios**:

1. **Given** el reporte abierto, **When** el comerciante cambia el rango de "Todo" a "Hoy", **Then** el resumen y la lista se recalculan para el día actual.
2. **Given** el rango "Hoy", **When** el comerciante vuelve a "Todo", **Then** el resumen y la lista consideran todas las ventas activas.

### Edge Cases

- Sin ventas: el resumen muestra ceros y la lista muestra estado vacío.
- Producto de una venta ya no existe (o fue borrado): la lista muestra un texto de respaldo en lugar del nombre.
- "Hoy" se calcula por el inicio del día local del dispositivo.
- Ventas anuladas (deleted_at != null) NO se cuentan (obtenerVentas ya las filtra).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar un reporte de ventas de solo lectura basado en la tabla `ventas` existente.
- **FR-002**: El sistema MUST permitir alternar entre dos rangos: "Hoy" (ventas del día actual) y "Todo" (todas las ventas activas).
- **FR-003**: El resumen MUST mostrar: total vendido (Σ precio_venta × cantidad), ganancia total (Σ ganancia), y número de ventas, para el rango seleccionado.
- **FR-004**: El resumen MUST mostrar el desglose contado vs fiado (por número de ventas y/o monto).
- **FR-005**: El sistema MUST mostrar una lista de las ventas del rango, ordenada de la más reciente a la más antigua.
- **FR-006**: La lista MUST mostrar, por venta: nombre del producto, cantidad, total (precio × cantidad), ganancia, tipo de pago y fecha.
- **FR-007**: El sistema MUST resolver el nombre del producto a partir de `producto_id` cargando los productos; si no se encuentra, MUST mostrar un texto de respaldo.
- **FR-008**: El cálculo del resumen MUST vivir en un helper puro y testeable (sin dependencias de framework).
- **FR-009**: El filtro "Hoy" MUST basarse en el inicio del día local.
- **FR-010**: El sistema MUST excluir ventas anuladas (deleted_at != null); se apoya en que `obtenerVentas` ya las filtra.
- **FR-011**: Esta feature MUST NOT crear, modificar ni borrar ventas ni ninguna otra entidad (solo lectura).
- **FR-012**: El reporte MUST mostrar un estado vacío claro cuando no hay ventas en el rango.

### Key Entities *(include if feature involves data)*

- **Venta**: Entidad existente (tabla `ventas`). Fuente de datos del reporte. No se modifica.
- **Producto**: Existente. Se usa solo para mapear `producto_id` → nombre en la lista.
- **ResumenVentas** (nuevo, en memoria/DTO, NO tabla): objeto derivado con { totalVendido, gananciaTotal, numeroVentas, contadoCount, fiadoCount, contadoTotal, fiadoTotal }. Calculado por el helper puro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El total vendido, la ganancia total y el número de ventas del resumen coinciden con las ventas del rango en el 100% de los casos cubiertos por prueba.
- **SC-002**: El filtro "Hoy" incluye exactamente las ventas del día actual y excluye las de otros días, en el 100% de los casos validados.
- **SC-003**: El desglose contado vs fiado suma correctamente al total en el 100% de los casos.
- **SC-004**: La lista se ordena de la más reciente a la más antigua en el 100% de los casos.
- **SC-005**: Con cero ventas, el resumen muestra ceros y la lista un estado vacío.

## Assumptions

- `obtenerVentas()` ya existe (Feature #4) y filtra ventas anuladas (deleted_at IS NULL).
- La ganancia y el costo ya están congelados por venta (Feature #4), así que el reporte solo agrega valores existentes; no recalcula costos.
- El total por venta se calcula como precio_venta × cantidad (no se almacena un campo total; se deriva).
- "Hoy" usa la fecha local del dispositivo.

## Out of Scope

- Rangos de tiempo adicionales (semana, mes, rango personalizado) — iteración futura.
- Gráficas / charts — iteración futura.
- Reporte por producto (más vendido / más rentable) — iteración futura.
- Exportar el reporte (PDF/Excel/compartir) — iteración futura.
- Cualquier escritura o modificación de datos.
- Reconciliación de fiado manual vs venta fiado (decisión de producto pendiente, separada).
