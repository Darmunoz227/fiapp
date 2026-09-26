# Feature 037 - El costo se declara donde ya esta el comerciante

## Problema

La Feature 036 quito el bloqueo de entrada (el producto ya nace con stock)
pero dejo un hueco nuevo: nace SIN COSTO. El AJUSTE de "Inventario inicial"
no lleva costo unitario, y el costo promedio solo se recalcula con COMPRA o
PRODUCCION (database.service.ts, crearMovimientoInterno).

Reportado 2026-09-26 tras mostrar la app a un tercero. El comerciante que
quiere registrar lo que le costo su mercancia tiene dos caminos y los dos
estan mal:

(A) Registra una COMPRA, que es el unico movimiento con campo de costo. La
    COMPRA SUMA: creo el producto con 10, registra compra de 10, queda en 20.
(B) No la registra, y el producto queda en costo_promedio 0 para siempre.

## Por que es peor que un stock mal contado

Con costo 0 la app no falla: IMPRIME NUMEROS FALSOS. El valor total del
inventario (Feature 023) cuenta 0 con mercancia real en la tienda; la ganancia
de cada venta se calcula contra costo 0, o sea ganancia igual al precio
completo; y el punto de equilibrio (Feature 032) hereda ese margen inflado.
Mismo patron que la Decision 056: el dato falso se muestra en verde.

Y no se corrige solo. Un producto con stock 10 a costo 0 que despues recibe
una compra real de 5 a 3.500 queda en (10*0 + 5*3500)/15 = 1.166. Subvalorado
PARA SIEMPRE, no solo hoy.

## Causa raiz

La operacion que el comerciante quiere hacer NO EXISTE. Las disponibles son:
COMPRA (suma), MERMA (resta) y AJUSTE (fija el conteo fisico, SIN costo).
"Decir cuanto me costo lo que ya tengo" no esta. Hizo lo correcto con las
herramientas que le dimos.

Nota de evidencia: el modal YA muestra "Stock derivado actual" y "Costo
promedio actual" y aun asi hubo confusion. Mostrar el numero NO alcanza;
faltaba el verbo y faltaba la operacion.

## Decision central

El AJUSTE acepta costo unitario OPCIONAL.

- Costo VACIO -> no toca el costo promedio. Comportamiento actual intacto.
- Costo CON VALOR -> REEMPLAZA el costo promedio. NO pondera.

Por que reemplaza y no pondera: en una COMPRA el costo se pondera porque la
mercancia SE SUMA a la que habia. En un AJUSTE el conteo fisico REEMPLAZA el
stock, no lo suma. "Tengo 10 y me costaron 3.500 cada uno" es una DECLARACION
del costo, no un aporte a un promedio. Ponderar ahi daria un numero que no
corresponde a nada real. Mismo espiritu del costo declarado de la Decision 052.

Por que OPCIONAL: si fuera obligatorio, quien ajusta el conteo porque se le
perdieron 2 unidades tendria que escribir un costo y reseteraria el costo
promedio sin querer. Vacio significa "no vengo a hablar de costos".

Un solo mecanismo resuelve los dos casos: el producto que nace hoy (el alta
manda el costo en su AJUSTE inicial) y el que ya nacio en cero (se corrige
desde Movimientos, sin pantalla nueva).

Se mantiene el AJUSTE y NO se emite COMPRA desde el alta: asi no choca con la
regla de que las COMPRAS se corrigen con un AJUSTE y nunca se anulan
(database.service.ts:1398).

## Decisiones de UI acordadas sobre prototipo HTML (Decision 054)

- D-1: etiqueta "A cuanto te costo cada uno? (opcional)", misma voz que
  "Cuantos tienes hoy?" de la Feature 036. No "costo unitario", que es
  lenguaje contable y no de tienda.
- D-2: el costo en el ALTA es OPCIONAL. Un campo obligatorio fue exactamente
  lo que expulso a la merchant de ropa (evidencia 2026-09-17).
- D-3: cuando el AJUSTE va a pisar un costo previo mayor que cero, NOTA bajo
  el campo, no Alert. El Alert llega tarde (cuando ya decidio) y entrena a
  tocar "Si" sin leer; el Alert queda reservado a lo destructivo de verdad
  (PIN, reinicio de inventario, Decision 049). Con costo previo 0 no aparece.
- D-4: el modal de movimiento normal cambia DOS cosas, no una. La etiqueta
  "Cantidad" es ambigua (se lee como "cuanto tengo") y pasa a ser dinamica
  por tipo: COMPRA "Cuantas unidades entraron?", MERMA "Cuantas unidades se
  perdieron?". Y gana una nota VIVA debajo, calculada mientras escribe:
  "Se suman a las 10 que ya tienes -> quedaran 30" / "Se restan de las 10 que
  ya tienes -> quedaran 7". La etiqueta previene el error, la nota lo hace
  visible antes de guardar.
- D-5: avisar en la LISTA que productos tienen costo 0 queda FUERA. Tocar la
  lista abre el tema de la alerta de stock bajo, siguiente item del backlog,
  que merece su propio spec.
- D-6: el historial muestra el costo en un AJUSTE que lo lleve. Hoy solo lo
  muestra si tipo es COMPRA. Un cambio invisible sobre un dato financiero
  contradice que el historial sea la fuente de verdad.

## Criterios de aceptacion

- AC-01: crear un producto con cantidad 10 y costo 3.500 deja
  costo_promedio en 3.500 y stock derivado en 10, en UNA sola transaccion.
- AC-02: crear un producto con cantidad y SIN costo deja costo_promedio en 0
  y stock correcto. La Feature 036 no se rompe.
- AC-03: un AJUSTE desde Movimientos con costo VACIO no modifica el costo
  promedio existente.
- AC-04: un AJUSTE con costo REEMPLAZA el costo promedio; no lo pondera.
  Producto con stock 10 y costo 3.500, AJUSTE conteo 10 costo 4.000 -> 4.000
  (ponderar daria 3.750, que es el resultado INCORRECTO y el test lo afirma).
- AC-05: REGRESION - la COMPRA sigue ponderando exactamente igual que hoy.
  Stock 10 a 3.500 mas COMPRA de 20 a 3.700 -> 3.633,33.
- AC-06: la etiqueta de cantidad es dinamica por tipo y la nota viva calcula
  el stock resultante mientras escribe.
- AC-07: la nota de reemplazo de costo aparece SOLO si el costo previo es
  mayor que cero.
- AC-08: la lista de movimientos muestra el costo de un AJUSTE que lo lleve.
- AC-09: SIN cambio de schema. La columna costo_unitario ya existe en
  movim_inventario (NOT NULL). git diff vacio en las migraciones.
- AC-10: device test en Android verificado POR ARTEFACTO (respaldo JSON), no
  por narrativa: el AJUSTE inicial con costo, el AJUSTE de correccion y la
  COMPRA posterior con su promedio ponderado.

## Fuera de alcance

Editar el costo promedio a mano en "Editar producto" (saltaria el historial
de movimientos, que es la fuente de verdad). La alerta de stock bajo. El aviso
en la lista de productos con costo 0. Las nueve pantallas con ionViewWillEnter
sin manejo de error (deuda de la Decision 056). La columna duplicada
fecha_creacion / created_at y el trim() faltante en el nombre del cliente,
detectados en el respaldo de iOS (Decision 058).

## Riesgo ya descartado con evidencia

actualizarCostoPromedioProducto llama a ejecutarRun(sql, values, true): YA es
consciente de transaccion. NO hay cuarta aparicion del patron de la Decision
028. El cambio queda acotado a crearMovimientoInterno, el modal y el alta.

Deuda anotada, no bloqueante: ese true esta FIJO en el codigo, no es un
parametro. Funciona porque crearMovimientoInterno siempre corre dentro de una
transaccion (Decision 026), pero es una suposicion implicita que ningun test
defiende.
