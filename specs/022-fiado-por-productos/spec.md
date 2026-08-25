# Feature #22 - Fiado por productos (rediseno UX del fiado manual)

## Origen del insight
Piloto de campo 2026-08-13, comerciante ambulante de comidas frente a un
call center. Vende 10-15 productos. En pico recibe 20-25 clientes en 20 min.
70% paga de inmediato, 30% queda a fiado. Durante el pico NO usa Fiapp ni el
cuaderno: memoriza. 30-40 min despues, con calma, reconstruye los fiados en
su cuaderno fisico. Trabaja con su esposa.

## Insight fundamental
El problema no es velocidad ni complejidad del formulario. El problema es que
durante el pico el comerciante no quiere usar NINGUNA herramienta de registro.
El comportamiento natural es: pico -> atender -> recordar -> esperar a que baje
la demanda -> registrar. Fiapp debe adaptarse a ese comportamiento batch, no
forzar registro en tiempo real. La oportunidad es reemplazar el cuaderno en el
momento POSTERIOR al pico.

## Objetivo
Que reconstruir y registrar los fiados pendientes despues del pico sea mas
facil y rapido que usar el cuaderno, seleccionando productos predefinidos en
lugar de escribir el concepto a mano.

## Decisiones de arquitectura ya tomadas (Diego)
- Ruta A (Lean): el fiado por productos se guarda como una transaccion con
  venta_id NULL (fiado manual, Decision 032) mas concepto legible generado por
  la app (Decision 039) mas monto total. NO usa venta_items, NO usa
  movim_inventario, NO llama registrarVenta.
- Catalogo desacoplado de la tabla productos. tipo_venta solo admite UNIDAD y
  PESO, ambos atados a inventario/costo/stock; reusar productos acoplaria al
  ambulante a un inventario que no gestiona. Por eso el catalogo es propio.
- Persistencia del catalogo en Preferences (A2), NO en tabla nueva. El catalogo
  es configuracion editable del dispositivo, no historial auditable. Schema v7
  queda intacto, cero migracion. Se sigue el patron de PreferencesService
  existente con una KEY nueva y serializacion JSON.
- Precio congelado: el monto y el concepto quedan guardados en la transaccion al
  momento de fiar. Retirar o editar un producto del catalogo despues NO altera
  fiados historicos, por diseno.

## Alcance - dos piezas
### Pieza A: Gestion del catalogo (CRUD)
El merchant pre-crea y mantiene su catalogo en un momento de calma. Cada item:
nombre, precio, emoji opcional. Puede crear, editar precio/nombre y retirar
items. Persistido en Preferences como JSON bajo una KEY nueva
(ej. catalogo_fiado). 10-15 items tipicos.

### Pieza B: Registro de fiado por productos (flujo validado)
Tres pantallas, ya validadas en prototipo con el comerciante sin friccion:
1. Seleccionar cliente (lista de clientes existente, presentacion boton grande).
2. Grid de productos del catalogo con botones grandes y controles + / - para
   cantidad. El total se calcula solo en vivo.
3. Guardar: se ensambla el concepto (ej. 3 Empanada, 1 Jugo) y el total, y se
   persiste como transaccion tipo fiado, venta_id NULL, via crearTransaccion.
   Confirmacion con recibo y opcion de compartir por WhatsApp (Decision 035).

## Criterios de aceptacion (los 4 principios de diseno)
1. Batch, no tiempo real. Nada en el flujo empuja a registrar durante el pico.
2. Toque, no escritura. El camino feliz es cliente -> producto -> cantidad ->
   total -> guardar, sin teclado.
3. Accesibilidad para publico mayor: botones grandes, texto grande, alto
   contraste, pocas opciones. PROHIBIDO usar swipe como interaccion principal
   para seleccionar productos o cantidades.
4. Total y concepto se generan automaticamente. El merchant no escribe montos
   ni conceptos.

## Fuera de alcance (explicito)
- No toca la tabla productos, ni inventario, ni venta_items, ni registrarVenta.
- No cambia el schema. Schema v7 se mantiene.
- No modifica el fiado manual escrito a mano ya existente: lo complementa como
  una via alternativa mas rapida de crear la misma transaccion.
- No reintroduce swipe como gesto principal.
- No implementa analitica estructurada por producto (eso seria una Ruta B
  futura con tabla fiado_items y schema v8, pospuesta hasta validar adopcion).

## Reuso de precedentes
- Decision 032: transaccion con venta_id NULL = fiado registrado a mano.
- Decision 039: la app construye el texto legible del concepto nombrando
  productos; misma idea de generacion de string.
- Decision 035: compartir por WhatsApp como texto, silencio si se cancela.
- Decision 033: leer es gratis; crear un fiado es escritura, asi que el guardado
  queda sujeto al guard freemium puedeEscribir cuando el trial expira.

## Gate de pruebas
- TDD donde haya logica pura: el ensamblado del concepto y el calculo del total
  son funciones puras testeables (RED antes de GREEN). El CRUD del catalogo
  sobre Preferences y la serializacion JSON tambien se testean.
- Gate: TOTAL SUCCESS en la suite completa antes de cada commit de codigo.
- Como toca datos (crea transacciones) y es un flujo nuevo de fiado, se exige
  verificacion BY HAND en Android Pixel_8: crear catalogo, registrar un fiado de
  varios productos, confirmar que la deuda del cliente sube por el monto
  correcto, que el concepto legible quedo guardado, que venta_id es NULL, que el
  inventario NO se movio, y que con trial expirado el guardado queda bloqueado.

## Preguntas abiertas para el plan
- Punto de entrada del flujo en la UI (desde Home, desde Cliente Detalle, o
  ambos) - se decide en plan.md.
- Ubicacion de la gestion del catalogo (Configuraciones vs pantalla propia) -
  se decide en plan.md.
