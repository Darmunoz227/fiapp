# Feature Specification: Ventas / POS (venta de un solo ítem)

**Feature Branch**: `004-ventas-pos`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "El comerciante puede registrar una venta de un solo producto. La venta puede ser de CONTADO (efectivo) o FIADO (crédito). Una venta de FIADO requiere seleccionar un cliente existente y genera una deuda del cliente. Toda venta descuenta el stock del producto mediante un movimiento VENTA y registra una utilidad (ganancia) congelada por snapshot al momento de la venta. La venta se guarda como un registro de primera clase en una tabla ventas. Las escrituras de una venta FIADO (registro de venta + movimiento de inventario + deuda del cliente) deben ser atómicas: o todas se aplican o ninguna. El precio de venta por defecto es el del producto pero puede ser sobrescrito por el comerciante al momento de vender."

## Clarifications

### Session 2026-07-24

- Q: ¿La venta es de un solo ítem o de varios (carrito)? → A: Un solo ítem en esta versión. El carrito multi-ítem queda como feature futuro (F5).
- Q: ¿Qué tipos de pago se soportan? → A: CONTADO (efectivo) y FIADO (crédito). Una venta FIADO requiere seleccionar un cliente existente; la creación de cliente en línea queda diferida.
- Q: ¿Cómo se garantiza la consistencia de una venta FIADO que escribe en varias tablas? → A: Mediante una primitiva transaccional atómica (SQLite BEGIN/COMMIT/ROLLBACK en nativo; snapshot/restore de los arreglos mock en web). Si cualquier escritura falla, se revierte todo. Esto además salda la deuda técnica de la Decisión 025 para el camino de COMPRA.
- Q: ¿Cómo se maneja la ganancia dado que el costo promedio cambia con el tiempo? → A: Se congela por snapshot al momento de la venta (Constitución III). La venta almacena el precio cobrado, el costo unitario (= costo_promedio del producto en ese instante) y la ganancia resultante. Las ganancias históricas son inmutables.
- Q: ¿El precio de venta es fijo o editable? → A: Por defecto es el precio_venta del producto, pero el comerciante puede sobrescribirlo al vender. El valor sobrescrito es el que se congela.
- Q: ¿Cómo se manejan los productos por PESO? → A: Igual que en el resto del inventario: la cantidad se maneja en gramos enteros; la presentación en kilogramos es responsabilidad de la UI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Venta de contado (Priority: P1)

Como comerciante, quiero registrar la venta de contado de un producto para descontar el stock y registrar la ganancia de esa venta.

**Why this priority**: Es el flujo de venta más básico y frecuente; convierte a FiApp en un punto de venta real.

**Independent Test**: Vender de contado un producto con stock disponible y verificar que el stock baja, se crea un registro de venta con la ganancia congelada y no se genera deuda de cliente.

**Acceptance Scenarios**:

1. **Given** un producto con stock derivado suficiente, **When** el comerciante registra una venta de CONTADO de una cantidad válida, **Then** se crea un movimiento VENTA que descuenta el stock, se crea un registro de venta con precio, costo y ganancia congelados, y no se genera deuda de cliente.
2. **Given** un producto cuyo precio por defecto es su precio_venta, **When** el comerciante sobrescribe el precio al vender, **Then** el precio sobrescrito es el que se congela en el registro de venta y determina la ganancia.
3. **Given** un producto sin stock suficiente, **When** el comerciante intenta vender más de lo disponible, **Then** el sistema bloquea la venta y no crea ni el registro de venta ni el movimiento (reutiliza el bloqueo de stock negativo existente).

---

### User Story 2 - Venta a fiado con deuda de cliente (Priority: P1)

Como comerciante, quiero registrar una venta a fiado asociada a un cliente para descontar el stock y aumentar la deuda de ese cliente de forma consistente.

**Why this priority**: Es la funcionalidad que une el origen de FiApp (fiados) con el motor de inventario; su valor diferencial.

**Independent Test**: Vender a fiado a un cliente existente y verificar que el stock baja, se crea el registro de venta, y la deuda del cliente aumenta; y que si una de esas escrituras falla, no se aplica ninguna.

**Acceptance Scenarios**:

1. **Given** un producto con stock y un cliente existente seleccionado, **When** el comerciante registra una venta FIADO, **Then** de forma atómica se crea el registro de venta, el movimiento VENTA (descuenta stock) y una transacción de deuda del cliente.
2. **Given** una venta FIADO en proceso, **When** cualquiera de las tres escrituras falla, **Then** ninguna de las tres queda aplicada (rollback total) y el sistema informa el error.
3. **Given** que el comerciante elige FIADO, **When** no ha seleccionado un cliente, **Then** el sistema impide registrar la venta e indica que debe seleccionar un cliente.

---

### User Story 3 - Ver la ganancia de la venta (Priority: P2)

Como comerciante, quiero ver la ganancia de la venta que acabo de registrar para entender mi margen.

**Why this priority**: Da visibilidad al valor económico; depende de US1/US2.

**Independent Test**: Registrar una venta y verificar que la ganancia mostrada corresponde a (precio congelado − costo congelado) × cantidad.

**Acceptance Scenarios**:

1. **Given** una venta registrada, **When** el comerciante ve la confirmación o el detalle, **Then** se muestra la ganancia calculada a partir de los valores congelados.
2. **Given** que después de la venta se registra una COMPRA que cambia el costo promedio del producto, **When** se consulta la ganancia de la venta anterior, **Then** la ganancia histórica no cambia (permanece congelada).

### Edge Cases

- Cantidad cero o negativa: la venta se rechaza con validación.
- Precio sobrescrito cero o negativo: se rechaza con validación.
- Producto por PESO: la cantidad se maneja en gramos enteros.
- Venta que excede el stock disponible: se bloquea (sin escrituras).
- Venta FIADO sin cliente seleccionado: se bloquea.
- Fallo a mitad de una venta FIADO: rollback total, sin estados intermedios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar la venta de un solo producto con una cantidad y un tipo de pago (CONTADO o FIADO).
- **FR-002**: El sistema MUST usar el precio_venta del producto como precio por defecto y permitir que el comerciante lo sobrescriba al vender.
- **FR-003**: Toda venta MUST crear un movimiento de inventario de tipo VENTA que descuente el stock derivado del producto.
- **FR-004**: El sistema MUST bloquear cualquier venta cuya cantidad exceda el stock derivado disponible (reutiliza el bloqueo de stock negativo existente); en ese caso no MUST crear ni el registro de venta ni el movimiento.
- **FR-005**: El sistema MUST almacenar cada venta como un registro de primera clase en una tabla `ventas`, con snapshots inmutables de: precio cobrado, costo unitario (= costo_promedio del producto al momento de la venta), cantidad, ganancia calculada, tipo de pago, cliente asociado (si aplica) y fecha.
- **FR-006**: La ganancia MUST calcularse como (precio congelado − costo congelado) × cantidad y MUST permanecer inmutable ante cambios posteriores del costo promedio.
- **FR-007**: Una venta FIADO MUST requerir la selección de un cliente existente.
- **FR-008**: Una venta FIADO MUST generar una deuda del cliente mediante una transacción (tipo fiado), además del registro de venta y el movimiento VENTA.
- **FR-009**: Las escrituras de una venta MUST ser atómicas: el registro de venta, el movimiento VENTA y (si aplica) la deuda del cliente se aplican todas o ninguna.
- **FR-010**: El sistema MUST proveer una primitiva transaccional reutilizable (SQLite BEGIN/COMMIT/ROLLBACK en nativo; snapshot/restore de los mocks en web) para operaciones multi-escritura.
- **FR-011**: El sistema MUST NOT recalcular ni modificar el costo promedio del producto al vender (VENTA no afecta el costo promedio; solo COMPRA lo hace).
- **FR-012**: Las operaciones de venta MUST completarse contra SQLite local (offline-first), sin depender de la nube.
- **FR-013**: Para productos de tipo PESO la cantidad MUST manejarse en gramos enteros.
- **FR-014**: El sistema MUST bumpear la versión del esquema y crear la tabla `ventas` de forma idempotente para instalaciones nuevas y existentes.

### Key Entities *(include if feature involves data)*

- **Venta**: Registro inmutable de una venta. Incluye: id, producto_id, cantidad, precio_venta (congelado), costo_unitario (congelado), ganancia (congelada), tipo_pago (CONTADO/FIADO), cliente_id (nullable, solo FIADO), fecha, y columnas de metadatos estándar (created_at, updated_at, deleted_at, store_id, created_by).
- **MovimientoStock (VENTA)**: Movimiento existente que descuenta stock; se crea como parte de la venta.
- **Transaccion (fiado)**: Deuda del cliente existente (Feature #1); se crea solo en ventas FIADO.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una venta de contado descuenta el stock y crea un registro de venta con ganancia congelada en el 100% de los casos cubiertos por prueba.
- **SC-002**: Una venta a fiado crea atómicamente {registro de venta + movimiento VENTA + deuda del cliente} en el 100% de los casos cubiertos por prueba.
- **SC-003**: Si una escritura de una venta a fiado falla, ninguna escritura queda aplicada (rollback verificado por prueba).
- **SC-004**: La ganancia de una venta permanece inmutable tras una COMPRA posterior que cambia el costo promedio, en el 100% de los casos validados.
- **SC-005**: Una venta que excede el stock disponible se bloquea sin crear registro de venta ni movimiento, en el 100% de los casos.

## Assumptions

- El motor de inventario ya bloquea VENTA que exceda el stock derivado (Feature #2).
- `crearTransaccion` (Feature #1) se reutiliza para la deuda de la venta FIADO.
- El costo promedio ponderado solo cambia con COMPRA; VENTA no lo toca.
- La tabla `ventas` es una proyección/registro de venta, NO la fuente de verdad del stock (el stock sigue derivándose del log de movimientos).
- La primitiva transaccional cubre tanto el camino de venta como, opcionalmente, el de COMPRA (Decisión 025).

## Out of Scope

- Carrito / venta multi-ítem (candidato F5).
- Creación de cliente en línea durante la venta.
- Reportes / dashboard de ventas y ganancias (feature futuro; la tabla `ventas` lo habilitará).
- Devoluciones / anulación de ventas (candidato futuro; se decidirá su modelo).
- Métodos de pago adicionales (tarjeta, transferencia) o pagos parciales.
- Impuestos / facturación electrónica DIAN.
