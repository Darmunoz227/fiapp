# Spike - Proveedores con compras a credito (evidencia antes del spec)

Mismo patron que spike-produccion y spike-ciclo-caja: se acumula
evidencia ANTES de escribir el spec.

## Evidencia de CAMPO (tienda de ropa, 2026-09-17)

**P1 - Entre 4 y 10 proveedores le venden a credito a la duena.**
Estimado por la empleada. No es un caso aislado ni un proveedor unico.

**P2 - Los abonos van por transferencia y el SOPORTE por WhatsApp.**
Pagan por Nequi o Bre-B y envian la captura al proveedor Y a la duena.

**P3 - La friccion es REAL y recurrente, y es el dolor central.**
Algunos proveedores son desorganizados, no llevan registro de que
recibieron el pago y "antes era a palabra". Ya tuvieron discrepancias.
A raiz de eso decidieron GUARDAR SIEMPRE el soporte un tiempo
prudente. Aun asi siguen apareciendo discrepancias, porque hay
proveedores que no manejan ninguna tecnologia.

**P4 - La duena lleva un cuaderno APARTE, de uso exclusivo,** con sus
compras, las deudas y los saldos pagados y por pagar. Es un dominio
propio, no un apendice de gastos.

**P5 - Los pagos a proveedor tambien se anotan en el cuaderno
principal**, mezclados con ventas y gastos. Confirma el riesgo ya
anotado en la Decision 055: el merchant PUEDE escribir "pago
proveedor" en el texto libre del chip "Otro" de gastos, y eso seria
doble conteo.

## Implicaciones de diseno (aun no son decisiones)

- Una compra a proveedor NO es un gasto: es una COMPRA de inventario
  con una deuda asociada (ya decidido en el spec de la Feature 032).
- Es el ESPEJO del fiado de cliente, que ya existe: aqui el merchant
  es quien debe.
- La mitad del trabajo YA ESTA HECHA: la Decision 051 construyo el
  comprobante de fiado por WhatsApp con saldo actualizado. Mandarle al
  proveedor un comprobante de abono con el saldo que queda es el mismo
  mecanismo en espejo, y ataca P3 directamente.
- El valor no es "registrar deudas": es TENER LA PRUEBA cuando el
  proveedor desorganizado reclama un pago ya hecho.

## Preguntas abiertas (formular SIN pedir montos)

- Cuando un proveedor reclama un pago que ya hizo, como lo resuelve
  hoy? Busca la captura en WhatsApp?
- Le sirve un comprobante que diga el saldo que QUEDA, o solo el
  monto abonado?
- La duena querria que la empleada pueda registrar un abono, o eso es
  solo de ella?
