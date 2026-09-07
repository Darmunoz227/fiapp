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

## Fuera de alcance
- Cierre de caja y arqueo (cuadrar lo contado contra lo esperado).
- Forma de pago discriminada (Feature #33).
- Categorias de gasto configurables por el merchant: en este MVP son una
  lista fija corta; ampliarla es backlog.
- Reportes historicos de gastos por categoria.
- Cualquier automatismo que cree gastos sin confirmacion.

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
- AC-08: sin ventas registradas, el punto de equilibrio informa que aun
  no es calculable, sin dividir por cero.
- AC-09: REGRESION - un merchant que nunca registre un gasto no ve
  ninguna UI nueva en sus flujos actuales, y la suite existente sigue
  verde sin modificar tests viejos.
- AC-10: las dos tablas nuevas viajan en el respaldo y se restauran
  (Decision 053), y el reinicio de inventario NO las toca: un gasto no es
  inventario.
