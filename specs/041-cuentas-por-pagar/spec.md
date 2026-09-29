# Feature 041 - Cuentas por Pagar a Proveedores

## Problema
Los comerciantes gestionan las deudas con sus proveedores mediante cuadernos físicos (ej. el cuaderno "sagrado" de Doña Yudith). Esto genera riesgo de pérdida de información, errores de cálculo y dificulta la planeación del flujo de caja del negocio.

## Evidencia
Durante visitas a campo, se observó que la relación financiera con el proveedor se maneja como un "saldo continuo" (Running Balance). Cuando llega mercancía se suma a la deuda, y los pagos se hacen en efectivo al conductor (abonos totales o parciales), sin un seguimiento estricto por número de factura.

## Decision
Se implementará un modelo de "Saldo Continuo" (Running Balance) idéntico al utilizado para los fiados de clientes. 
El saldo total vivirá en la tabla `proveedores` (`saldo_deuda`), y cada movimiento (Cargo por nueva mercancía o Abono por pago) se registrará en una nueva tabla `movimientos_deuda`. Esto reduce la carga cognitiva del usuario al reutilizar un patrón mental que ya domina.

## Criterios de Aceptacion
* AC-01: La tabla de SQLite `proveedores` incluye el campo `saldo_deuda` (numérico, default 0).
* AC-02: Existe una tabla `movimientos_deuda` para registrar fecha, tipo (CARGO/ABONO), monto, y notas.
* AC-03: La lista de proveedores muestra visualmente el saldo pendiente si es mayor a cero.
* AC-04: El comerciante puede registrar un "Abono" (pago parcial o total).
* AC-05: Tras registrar un abono, se habilita la opción de enviar un comprobante automático por WhatsApp al proveedor.

## Fuera de Alcance
* Conciliación por número de factura individual.
* Alertas automáticas de fechas de vencimiento de pago.
