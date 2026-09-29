# Plan de Implementacion - Feature 041

**Fase 1: Capa de Datos y Modelos (TDD)**
1. Escribir tests (RED) para los modelos de datos de cuentas por pagar.
2. Actualizar el modelo `Proveedor` con `saldo_deuda`.
3. Crear el modelo `MovimientoDeuda`.
4. Crear la migración en `DatabaseService`.

**Fase 2: Repositorio y Casos de Uso (TDD)**
1. Escribir tests (RED) para el registro de cargos y abonos.
2. Implementar `MovimientoDeudaRepository` (GREEN).
3. Asegurar transaccionalidad: al insertar un movimiento, se debe actualizar el saldo del proveedor en la misma transacción.

**Fase 3: Interfaz de Usuario (UI)**
1. UI: Mostrar el saldo rojo en la tarjeta de `proveedores-list`.
2. UI: Crear el modal/página de "Detalle de Deuda" con el historial de movimientos.
3. UI: Crear el modal de "Registrar Abono".

**Fase 4: Integración y UX**
1. Conectar la vista con los repositorios.
2. Implementar el botón de envío de comprobante de pago por WhatsApp.
