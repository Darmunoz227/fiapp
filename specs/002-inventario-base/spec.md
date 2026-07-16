# Feature Specification: Inventario base - productos y registro de movimientos de stock

**Feature Branch**: `002-inventario-base`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "Feature: Inventario base - productos y registro de movimientos de stock. El comerciante puede registrar productos con nombre, precio de venta y tipo de venta por UNIDAD o PESO. El stock se calcula a partir de movimientos historicos (compras, ventas, ajustes, mermas). Cada movimiento registra tipo, cantidad, costo unitario, motivo opcional y fecha. El costo promedio se recalcula con promedio ponderado cada vez que hay una COMPRA. El comerciante puede ver la lista de productos con su stock actual y costo promedio. Alerta de stock bajo cuando el stock cae por debajo de un minimo configurable. Fuera de alcance: flujo de ventas/POS, calculo de ganancia por venta, multi-tienda, importacion de Excel y dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro de productos (Priority: P1)

Como comerciante, quiero crear productos con nombre, precio de venta y tipo de venta para llevar un catalogo de inventario usable en tienda.

**Why this priority**: Sin productos no existe inventario utilizable ni base para registrar stock o costos.

**Independent Test**: Se puede crear un producto de tipo UNIDAD o PESO y verificar que aparece en la lista con sus datos principales.

**Acceptance Scenarios**:

1. **Given** que el comerciante esta en el modulo de inventario, **When** registra un producto con nombre, precio de venta y tipo UNIDAD, **Then** el producto queda disponible en la lista de productos.
2. **Given** que el comerciante registra un producto con tipo PESO, **When** guarda el formulario, **Then** el producto queda disponible en la lista y conserva su tipo de venta.
3. **Given** que el comerciante intenta crear un producto sin un nombre valido, **When** confirma el registro, **Then** el sistema rechaza el guardado y muestra un error de validacion.

---

### User Story 2 - Movimientos de stock y costo promedio (Priority: P1)

Como comerciante, quiero registrar movimientos de stock para que el inventario y el costo promedio se calculen automaticamente desde el historial.

**Why this priority**: Esta es la base del valor de negocio del feature; sin movimientos no hay stock confiable ni costo util para control interno.

**Independent Test**: Se puede registrar una COMPRA, una VENTA, un AJUSTE o una MERMA y verificar que el stock mostrado y el costo promedio resultan del historial de movimientos.

**Acceptance Scenarios**:

1. **Given** que existe un producto con stock inicial derivado de movimientos previos, **When** se registra una COMPRA, **Then** el stock calculado aumenta y el costo promedio ponderado se actualiza.
2. **Given** que existe un producto con stock disponible, **When** se registra una MERMA con motivo, **Then** el stock calculado disminuye y el motivo queda asociado al movimiento.
3. **Given** que existe un producto con movimientos historicos, **When** se consulta su detalle, **Then** el stock actual coincide con la suma de sus movimientos activos y no con un valor manual editable.

---

### User Story 3 - Consulta de stock bajo (Priority: P2)

Como comerciante, quiero identificar productos con stock bajo para reponer a tiempo y evitar quedarme sin mercancia.

**Why this priority**: Ayuda a la operacion diaria y reduce quiebres de stock, pero depende del catalogo y del historial de movimientos.

**Independent Test**: Se puede configurar un minimo por producto, provocar una bajada de stock y verificar que el sistema marca el producto como bajo en stock.

**Acceptance Scenarios**:

1. **Given** que un producto tiene un minimo configurado, **When** su stock calculado cae por debajo de ese minimo, **Then** el producto se muestra como stock bajo.
2. **Given** que un producto recupera stock por encima del minimo, **When** se consulta nuevamente, **Then** deja de mostrarse como stock bajo.
3. **Given** que el comerciante visualiza la lista de productos, **When** algunos estan por debajo del minimo, **Then** puede identificar rapidamente cuales requieren reposicion.

### Edge Cases

- Un producto por PESO acepta cantidades decimales como 0.25 o 0.75.
- Un producto por UNIDAD no debe depender de cantidades fraccionarias para su operacion normal.
- La cantidad mostrada siempre debe salir de la suma de movimientos historicos y no de un stock editable manualmente.
- Si existe un movimiento con tipo AJUSTE, el sistema debe reflejar la correccion en el stock calculado.
- Si no hay movimientos para un producto, su stock calculado debe ser cero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear productos con nombre, precio de venta y tipo de venta.
- **FR-002**: El sistema MUST soportar dos tipos de venta para productos: UNIDAD y PESO.
- **FR-003**: El sistema MUST impedir que el stock de un producto se edite manualmente como fuente de verdad.
- **FR-004**: El sistema MUST calcular el stock de cada producto a partir del historial de movimientos registrados.
- **FR-005**: El sistema MUST permitir registrar movimientos de stock con tipo COMPRA, VENTA, AJUSTE o MERMA.
- **FR-006**: Cada movimiento de stock MUST guardar cantidad, costo unitario, fecha y un motivo opcional.
- **FR-007**: El sistema MUST recalcular el costo promedio del producto usando promedio ponderado cada vez que se registre una COMPRA.
- **FR-008**: El sistema MUST mostrar la lista de productos con su stock actual y costo promedio calculados.
- **FR-009**: El sistema MUST permitir cantidades decimales para productos de tipo PESO.
- **FR-010**: El sistema MUST mostrar una alerta de stock bajo cuando el stock calculado sea inferior al minimo configurable del producto.
- **FR-011**: El sistema MUST mantener el historial de movimientos como referencia para auditoria y consulta.

### Key Entities *(include if feature involves data)*

- **Producto**: Articulo del catalogo de inventario. Incluye nombre, precio de venta, tipo de venta, minimo configurable y costo promedio calculado.
- **MovimientoStock**: Registro historico que representa una COMPRA, VENTA, AJUSTE o MERMA. Incluye cantidad, costo unitario, motivo opcional y fecha.
- **ResumenInventario**: Vista derivada por producto que expone stock actual, costo promedio y estado de stock bajo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comerciante puede crear un producto y verlo reflejado en la lista en menos de 2 minutos desde iniciar el flujo.
- **SC-002**: Despues de registrar una COMPRA, el stock y el costo promedio del producto se actualizan correctamente para el 100% de los casos cubiertos por prueba.
- **SC-003**: El sistema muestra correctamente stock bajo en todos los productos cuyo stock calculado cae por debajo del minimo configurado.
- **SC-004**: Un producto por PESO acepta cantidades decimales sin errores en al menos el 100% de los casos validados por prueba.
- **SC-005**: Los usuarios pueden consultar la lista de productos con stock actual y costo promedio sin necesitar calcularlos manualmente.

## Assumptions

- El flujo de ventas/POS no forma parte de esta feature y no genera movimientos desde esta especificacion.
- El calculo de ganancia por venta queda fuera de alcance.
- Multi-tienda, importacion de Excel y dashboard quedan fuera de alcance.
- El costo promedio se calcula solo a partir de compras registradas; ventas, ajustes y mermas afectan el stock, no el promedio ponderado de costo.
- Los motivos de movimiento son opcionales excepto cuando el equipo defina reglas adicionales para mermas o ajustes.
- El precio de venta del producto es independiente del costo promedio y puede cambiar sin reescribir el historial de movimientos.
