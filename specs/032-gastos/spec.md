# Feature 032 - Gastos y punto de equilibrio

## Contexto
Los dos merchants de ropa coincidieron en campo (n=2): necesitan saber
con que base abren el dia, que gastos tienen, y sobre todo "cuanto tengo
que vender hoy para cubrir el arriendo". Esa ultima pregunta NO es un
cierre de caja: es un PUNTO DE EQUILIBRIO, y es lo que el merchant piensa
al ABRIR, no al cerrar.

El objetivo del producto no es que el merchant aprenda contabilidad. Es
que FiApp le responda "cuanto gaste" y "cuanto necesito vender para
cubrir mis gastos" en su propio lenguaje.

## Hallazgo de evidencia previo al diseno
`calcularResumenVentas` YA devuelve totalVendido y gananciaTotal, asi que
el margen promedio (gananciaTotal / totalVendido) es derivable HOY sin
datos nuevos. El punto de equilibrio solo necesita los gastos fijos: no
depende de proveedores, ni de forma de pago, ni del dashboard. Por eso
entra en esta feature y no en una posterior.

`filtrarPorRangoFecha` ya es generico (recibe un extractor de fecha), asi
que sirve para gastos sin codigo nuevo; solo hay que agregar 'MES' al
tipo RangoReporte, cambio aditivo.

## Alcance
- Registrar un gasto ocurrido.
- Definir gastos recurrentes como PLANTILLA, sin generar movimientos
  automaticos.
- Calcular el punto de equilibrio a partir de los fijos mensuales y el
  margen real de las ventas.

## Decision central - plantilla y hecho son DOS conceptos distintos

Un gasto recurrente ("pago 800.000 de arriendo cada mes") es una
INTENCION. Un gasto registrado ("el 5 de septiembre pague 800.000") es un
HECHO. Se modelan por separado, en dos tablas.

**Razon:** el punto de equilibrio necesita los fijos mensuales AUNQUE no
se hayan pagado todavia este mes. Con una sola tabla no se puede
distinguir "debo pagar" de "ya pague", y el calculo daria cero a
principio de mes, justo cuando el merchant mas lo necesita.

**Decision - la recurrencia NUNCA genera movimientos automaticos.** La
plantilla no crea gastos sola. En la lista de recurrentes, cada uno
ofrece un boton "Registrar el pago de este mes" que PRECARGA categoria,
valor y tipo, editables, y el merchant confirma. Un toque, control total,
cero movimientos fantasma. Mismo criterio que la calculadora de overhead
de la Decision 052: opcional, manual, on-demand.

**Decision - el gasto registrado guarda recurrente_id nullable.** Si
viene de una plantilla, queda el vinculo y se puede responder "ya pague
el arriendo de este mes?". Un gasto suelto (la nevera, el tinto) lo deja
en null.

**Decision - tipo_gasto se copia al registrar, no se lee de la
plantilla.** El gasto registrado es historia: si manana la plantilla
cambia de FIJO a VARIABLE, los gastos ya registrados NO deben cambiar.
Mismo criterio que Decision 038 (editar un precio no reescribe ventas) y
que AC-07 de la Decision 052 (el costo se declara hacia adelante).

## Modelo de datos (schema v9, dos tablas NUEVAS, sin rebuild)

gastos_recurrentes: id, categoria, valor_estimado, tipo_gasto
  (FIJO|VARIABLE), frecuencia (DIARIO|SEMANAL|QUINCENAL|MENSUAL|ANUAL),
  activo (INTEGER DEFAULT 1), + 5 columnas de auditoria.

gastos: id, categoria, valor, fecha, observacion (nullable), tipo_gasto
  (FIJO|VARIABLE), recurrente_id (nullable, FK a gastos_recurrentes),
  + 5 columnas de auditoria. Indice por fecha.

**Sin FK con CASCADE en recurrente_id:** borrar una plantilla NO debe
borrar los gastos ya pagados. La plantilla se desactiva (activo = 0), no
se elimina; el historial es intocable.

## Punto de equilibrio

Funcion pura: gastos fijos mensuales / margen promedio = venta necesaria.

- Fijos mensuales: suma de gastos_recurrentes activos con tipo FIJO,
  NORMALIZADOS a mes segun su frecuencia (diario x30, semanal x4.33,
  quincenal x2, mensual x1, anual /12).
- Margen promedio: gananciaTotal / totalVendido del rango TODO. Si no hay
  ventas, no hay margen y el resultado es "aun no calculable" - NUNCA una
  division por cero ni un numero inventado.
- Se muestra bajo demanda, con las dos cifras de origen visibles para que
  el merchant entienda de donde sale.

## Costo y gasto NO son lo mismo (regla anti doble-conteo)

**COSTO** es lo que cuesta el producto que se vende: vive dentro de la
mercancia y YA esta implementado en FiApp como costo_promedio, que se
actualiza con COMPRA (Feature #2) y con PRODUCCION (Decision 052) y se
descuenta al vender para calcular la ganancia congelada (Decision 027).

**GASTO** es lo que cuesta tener el negocio abierto: existe aunque no se
venda nada. Es lo que esta feature introduce.

**Riesgo detectado en el prototipo: DOBLE CONTEO.** Si el merchant
registra una compra de mercancia como gasto, esa plata se descuenta dos
veces: una via costo_promedio al vender, y otra como gasto. Peor aun en
el punto de equilibrio, cuyo margen YA tiene descontado el costo de la
mercancia; sumar la mercancia como gasto inflaria artificialmente cuanto
cree el merchant que necesita vender.

**Decision - regla en lenguaje del merchant:** "Si lo vas a vender, es
una COMPRA de inventario. Si es para que el negocio funcione, es un
GASTO."

**Decision - la categoria "Mercancia" NO existe en gastos.** Se elimina
de la lista de categorias. Las categorias del MVP son: Arriendo,
Servicios, Transporte, Comida, Mantenimiento, Otro. Si el merchant busca
donde registrar mercancia, la pantalla lo redirige a Inventario con una
linea corta, en vez de dejarlo registrar mal.

**Consecuencia para la Feature #34 (proveedores):** una compra a
proveedor NO es un gasto. Es una COMPRA de inventario con una deuda
asociada. Eso simplifica esa feature y evita duplicar el concepto.

## Clasificar FIJO vs VARIABLE sin saber contabilidad

**Problema real (feedback de campo):** varios merchants no distinguen un
gasto fijo de uno variable. Si clasifican mal, el punto de equilibrio da
un numero erroneo y la feature pierde su valor.

**Decision - la pregunta discriminante es "lo pagas aunque no vendas
nada?".** Se descarta la formulacion "se repite todos los meses" porque
es AMBIGUA: la mercancia tambien se compra todos los meses y no es un
gasto fijo. El texto en pantalla debe ser:

- FIJO: "Lo pagas aunque no vendas nada." Ejemplos: arriendo, servicios,
  internet, vigilancia.
- VARIABLE: "Solo lo pagas cuando el negocio se mueve." Ejemplos:
  mercancia, transporte, domicilios, tintos.

**Decision - la categoria PRECARGA el tipo, editable.** Al elegir el chip
de categoria, el tipo se marca solo: Arriendo y Servicios sugieren FIJO;
Mercancia, Transporte y Comida sugieren VARIABLE. El merchant puede
cambiarlo siempre. Asi no decide en la mayoria de los casos: la app
propone y el corrige. Mismo criterio que la calculadora de overhead de la
Decision 052 (sugerir sin imponer). La sugerencia es una funcion PURA y
testeable, no logica dispersa en la UI.

**Decision - NO se agrega un tercer tipo "extraordinario".** Un gasto
como reparar la nevera no es fijo ni variable en sentido estricto, pero
un tercer tipo complica la clasificacion para el merchant y el punto de
equilibrio solo necesita saber que es FIJO. Se registra como VARIABLE; la
categoria ya aporta el detalle si algun dia se necesita distinguirlo.

## Evidencia de campo (2026-09-07, merchant de ropa deportiva)

Preguntado por que gastos anota hoy, el merchant respondio: NO anota los
gastos hormiga. Los tintos de la jornada y los almuerzos corrientes no
los registra; solo anota lo significativo (un almuerzo caro, una
reparacion) o cuando saca efectivo de la caja para un gasto familiar.

**Consecuencia 1 - el punto de equilibrio NO se ve afectado.** Los gastos
hormiga son VARIABLES, y calcularFijosMensuales solo suma los FIJOS. El
calculo se apoya en arriendo y servicios, que son exactamente los que el
merchant SI recuerda y registraria. La feature mas valiosa funciona con
la disciplina que el merchant YA tiene, no con la que quisieramos.

**Consecuencia 2 - el total de "gastos del mes" sera INCOMPLETO y la
pantalla debe ser honesta.** No se fuerza al merchant a registrar
hormigas: no lo hara, y una app que exige disciplina inexistente se
abandona. En su lugar, bajo el total va una linea gris: "Solo cuenta lo
que registraste." Mismo criterio que la Decision 049 al documentar el
alcance real del PIN: no vender lo que no es.

**Consecuencia 3 - RETIRO PERSONAL es un tercer concepto, distinto de
costo y de gasto.** Sacar efectivo de la caja para la casa no es un gasto
del negocio: registrarlo como tal hunde la utilidad y el punto de
equilibrio exigiria vender de mas. Pero NO registrarlo hace que la caja
no cuadre al cierre, que es justo la queja que origino el ciclo de caja.
Es la causa mas probable de los descuadres reportados. Se documenta aqui
y se resuelve en la feature de ciclo de caja, donde el arqueo le da
sentido. Fuera de alcance de la #32.

**Consecuencia 4 - reordena la prioridad DENTRO de la feature.** El
registro de gasto suelto NO es la pantalla principal: tendra poco uso. El
valor real esta en (a) las plantillas recurrentes, que se configuran una
vez y se confirman con un toque al mes, y (b) el punto de equilibrio. La
UI debe darles ese protagonismo.

## Por que gastos se separa del CICLO DE CAJA (justificacion del corte)

El backlog advierte "NO fragmentar el ciclo de caja en features sueltas:
forma de pago sin cierre es un dato que nadie usa". Esta feature NO
contradice esa regla, y conviene dejar escrito por que.

**El criterio no es "no fragmentar", es QUE PREGUNTA queda respondida.**
Forma de pago sin cierre fragmenta por CAPA: guarda un dato cuyo sentido
depende de una pieza que aun no existe. Gastos + punto de equilibrio
responde una pregunta COMPLETA por si sola: "cuanto necesito vender para
cubrir mis gastos" funciona sin apertura, sin forma de pago y sin cierre.
Se entrega, se usa y da valor el mismo dia.

**Evidencia que respalda el corte:** el merchant NO anota gastos hormiga
pero SI recuerda arriendo y servicios, que son los unicos que alimentan
el punto de equilibrio (ver Evidencia de campo). La feature funciona con
la disciplina que el merchant YA tiene.

**Sobre el schema v9:** no existe reserva de numeros. Las versiones son
secuenciales, no un espacio nombrado. El backlog decia "seria v9" porque
en ese momento era el siguiente. El ciclo de caja sera v10.

**ACOPLAMIENTO CONOCIDO con el ciclo de caja - gastos NO registra forma
de pago.** El arqueo del cierre calculara: base + ventas en efectivo -
gastos en efectivo - retiros = lo esperado. La tabla gastos de v9 NO
tiene columna de forma de pago. Si el arqueo asumiera que todo gasto
salio de la caja, descuadraria cuando el merchant pague el arriendo por
transferencia.

Esto NO bloquea el diseno futuro: agregar una columna nullable es
aditivo y el proyecto lo ha hecho repetidamente con agregarColumnaSiFalta
(Decisions 027, 048, 052). Se documenta para que nadie asuma que gasto =
efectivo. Cuando llegue el ciclo de caja, gastos ganara forma_pago
nullable; los gastos historicos quedaran en null y el arqueo debera
tratar null como "no se sabe", nunca como "efectivo".

**Lo que SI se dejo deliberadamente fuera para no encajonar el diseno:**
el retiro personal (sacar efectivo de la caja para la casa) NO se modelo
como gasto, aunque era la via mas rapida. Es un tercer concepto y
meterlo en gastos habria hundido la utilidad del negocio y contaminado el
punto de equilibrio. Esa decision es la mejor prueba de que el corte fue
deliberado y no oportunista.

## Fuera de alcance
- Cierre de caja y arqueo (cuadrar lo contado contra lo esperado).
- Forma de pago discriminada (Feature #33).
- Categorias de gasto configurables por el merchant: en este MVP son una
  lista fija corta; ampliarla es backlog.
- Reportes historicos de gastos por categoria.
- Cualquier automatismo que cree gastos sin confirmacion.
- Retiro personal / sacar efectivo de la caja para la casa: es un tercer
  concepto, va con el ciclo de caja (ver Evidencia de campo).

## Criterios de aceptacion
- AC-01: registrar un gasto suelto (categoria, valor, fecha, tipo,
  observacion opcional) lo persiste con recurrente_id null.
- AC-02: crear una plantilla recurrente NO crea ningun gasto.
- AC-03: "Registrar el pago de este mes" precarga los datos de la
  plantilla, permite editarlos y solo persiste tras confirmacion.
- AC-04: un gasto creado desde plantilla guarda recurrente_id y copia
  tipo_gasto; cambiar la plantilla despues no altera ese gasto.
- AC-05: desactivar una plantilla no borra los gastos ya registrados.
- AC-06: el total de gastos del mes suma solo los gastos del mes en
  curso, usando filtrarPorRangoFecha.
- AC-07: el punto de equilibrio normaliza correctamente cada frecuencia a
  base mensual.
- AC-07b: el punto de equilibrio muestra tambien el equivalente DIARIO
  (mensual / 30), porque el merchant decide al abrir la tienda, no a fin
  de mes.
- AC-07c: elegir una categoria precarga el tipo de gasto sugerido, y el
  merchant puede cambiarlo antes de guardar.
- AC-07d: la lista de categorias de gasto NO incluye "Mercancia"; la
  pantalla ofrece una linea que redirige a Inventario para ese caso
  (regla anti doble-conteo).
- AC-08: sin ventas registradas, el punto de equilibrio informa que aun
  no es calculable, sin dividir por cero.
- AC-09: REGRESION - un merchant que nunca registre un gasto no ve
  ninguna UI nueva en sus flujos actuales, y la suite existente sigue
  verde sin modificar tests viejos.
- AC-10: las dos tablas nuevas viajan en el respaldo y se restauran
  (Decision 053), y el reinicio de inventario NO las toca: un gasto no es
  inventario.
