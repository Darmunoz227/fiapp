# Spike - Negocios de PRODUCCION en FiApp

## Estado: INVESTIGACION (sin codigo). Fuente de verdad para el
## futuro spec formal. NO tocar schema hasta validar con pilotos.

## Contexto
FiApp nacio para comercios de COMPRA-VENTA. Dos prospectos nuevos son
PRODUCTORES: la hija del ambulante (produce arepas, empanadas,
carimanolas, fritos, jugos, avenas; vende por pedido a restaurantes y
panaderias) y una panaderia referida por Bancamia Venecia. El costo de
un producto fabricado NO puede derivarse de compras (Decision 009/040)
porque una empanada nunca se compra, se produce.

## Evidencia de campo (visita + 5 anos en microfinanzas Bancamia)
1. INSUMOS vs TERMINADO: solo les interesa el producto TERMINADO.
   Inventario de insumos en bodega = OPT-IN para los pocos que lo
   quieran, nunca obligatorio.
2. ESTABILIDAD DEL COSTO: muy estable, cambia cada 1-2 anos. NO se
   recalcula por lote. Esto es la llave del diseno.
3. PEDIDOS COMO VENTAS: si. La hija produce por pedido y necesita su
   utilidad. Ademas FIA: panaderias le quedan debiendo la mitad y pagan
   a plazo. Es una venta MIXTA (parte contado, parte fiado).
4. OVERHEAD MENSUAL: los productores conocen bien sus costos fijos
   mensuales (mano de obra, gas, arriendo, servicios) porque el sistema
   financiero se los pide asi para evaluar creditos.

## Evidencia de MERCADO (experiencia agregada, 5 anos Bancamia)
A diferencia de la evidencia de campo (1 caso puntual: la hija del
ambulante), esta seccion resume patrones observados en CIENTOS de
microproductores evaluados para credito en Bancamia. Es evidencia
estadisticamente mas confiable para decisiones GENERICAS de producto,
porque FiApp no es software a la medida de unos pocos pilotos.

1. COSTO A OJO ES DOMINANTE: 85% de los productores conocian su costo
   unitario a ojo, sin desglose ingrediente por ingrediente. Confirma
   con fuerza estadistica el modelo "costo declarado, sin BOM".
2. PRODUCCION ES DIARIA: la mayoria produce a diario (igual la hija del
   ambulante: la panaderia le pide a diario). El registro de produccion
   debe sentirse como una VENTA diaria (rapido, repetible), no como un
   evento raro tipo compra mensual.
3. SUBPRODUCTOS SON COMUNES, NO AISLADOS: en panaderias de barrio (no
   las grandes, fuera del nicho de FiApp) es MUY comun que un evento de
   produccion genere VARIOS productos de salida (ganchos de venta,
   recortes, etc). Esto invalida el supuesto "1 produccion = 1 producto".
4. OVERHEAD NO SE MANTIENE FRESCO: los productores rara vez actualizaban
   su desglose de gastos fijos. El calculador de overhead debe ser
   MANUAL/ocasional, nunca un dashboard que exija actualizacion constante.
5. INSUMOS EN BODEGA: proporcion 50/50, NO es nicho minoritario. Sigue
   siendo opt-in (la mitad no lo quiere), pero pasa a ser modulo serio
   de Fase 2, no una idea descartable.
6. PRECIO DETAL/MAYORISTA: depende del rubro (panaderia = detal, cuero
   u otros productos = mayorista). Confirmado como patron RECURRENTE
   real, pero sigue fuera del MVP (backlog anotado).
7. ESTABILIDAD DEL COSTO ES BAJA, NO ALTA: contradice la hipotesis
   inicial (evidencia de un caso). Es PRACTICAMENTE UNIVERSAL que el
   costo fluctue por factores extrinsecos de la economia nacional. La
   arquitectura de costo declarado se mantiene (sigue siendo correcta
   por el punto 1), pero la UX de EDITAR el costo debe ser tan rapida y
   friccionless como editar un precio de venta, NUNCA algo enterrado.

## Modelo propuesto: COSTO EN DOS CAPAS
Costo real por unidad = costo directo aprox + prorrateo de fijos.

### Capa 1 - Costo directo aproximado (lo que ya saben)
Un SOLO campo por producto: "cuanto te cuesta en insumos hacer una
empanada" -> ella dice ~500. NO se piden ingredientes uno por uno
(evidencia #1: nadie llena recetas/BOM).

### Capa 2 - Prorrateo de costos fijos (helper OPCIONAL)
Costos fijos del mes (mano obra + gas + arriendo + servicios) / unidades
producidas del mes = overhead por unidad.
Ej: 3.000.000 / 10.000 = 300 por unidad.
Costo real = 500 (directo) + 300 (overhead) = 800.
El helper SUGIERE el costo; la productora lo puede ajustar. Opcional.

## Decision clave (por validar): costo DECLARADO, no derivado
Por evidencia #2 (costo estable 1-2 anos), el costo de produccion es un
ATRIBUTO DECLARADO del producto (costo_produccion_unitario), NO un
derivado del log de movimientos. Cuando suba en 2 anos, la productora lo
edita con la Feature #25 (editar producto) ya existente. Sin recalculo,
sin promedio ponderado, sin migracion de historia.

Esto es un cambio conceptual frente a Decision 009/040 (donde el costo
se deriva de COMPRAS), pero es legitimo: para un productor no hay compra
que derivar, hay un costo que el conoce. Debe documentarse como decision
formal cuando se escriba el spec.

## CORRECCION v2: produccion es MULTI-LINEA, no 1 producto
Hallazgo de mercado #3 invalida el supuesto original de "1 produccion =
1 producto". Un evento de produccion debe soportar VARIAS lineas de
producto de salida (subproductos/ganchos de venta), igual patron que
venta multi-linea (venta_items, Feature #11, Decision 031). Cada linea
declara su PROPIO costo unitario por separado (hallazgo #1: nadie
quiere prorratear costo compartido entre subproductos, siguen estimando
"a ojo" cada uno). Cero matematica de prorrateo automatico entre lineas.

## Como entra el producto al stock (2 opciones, POR DECIDIR)
Hoy los movimientos son COMPRA/VENTA/AJUSTE/MERMA y deben ser
semanticamente distintos (Decision 015).
- Opcion A: reusar COMPRA con costo autodeclarado. Cero schema, pero
  miente semanticamente ("compro" algo que "fabrico") y ensucia reportes.
- Opcion B (recomendada): nuevo tipo PRODUCCION. Semantica honesta,
  reportes claros, y vuelve al costo autodeclarado una fuente legitima
  (resuelve la tension de Decision 040). Cuesta enum nuevo + schema v8
  con migracion cuidadosa (Decision 021).

## Ventas y fiados: CERO codigo nuevo
La venta al por mayor con fiado parcial es identica en estructura a un
fiado de calle: venta MIXTA (monto_contado + monto_fiado) que ya existe
(Feature #7/#11, Decision 027/031). Solo hay que alimentarla con el
costo de produccion correcto. La utilidad sale sola.

## Alcance MVP Nivel 1 (candidato a Feature futura)
1. Producto marcable como "de produccion" con costo_produccion_unitario.
2. Registrar produccion (entrada de stock) sin exigir compra.
3. Ventas/fiados: REUSAN lo existente, ahora con utilidad correcta.
4. OPCIONAL: calculadora de overhead mensual (aporte microfinanzas).
5. OPCIONAL/FUTURO: inventario de insumos en bodega (opt-in).

## Fuera de alcance (NO sobre-implementar)
- Recetas / BOM ingrediente por ingrediente: nadie las llena (evid #1).
- Recalculo de costo por lote: el costo es estable (evid #2).
- Merma de horneado / transformacion compleja: Decision 017 vigente.
- Cliente mayorista con pedidos recurrentes / estado de cuenta: backlog.
- Mismo producto con dos precios (papa detal / hija por mayor): tema
  aparte de variantes-multiprecio, no mezclar aqui.

## Preguntas abiertas - RESUELTAS por evidencia de mercado (v2)
1. Unidades vs solo costo -> produccion MULTI-LINEA, cada linea declara
   unidades + costo propio (ver correccion arriba).
2. Overhead mensual fijo vs recalculado -> MANUAL/ocasional, nunca
   automatico (hallazgo #4).
3. Clientes mayoristas de la hija -> AUN sin numero exacto, pero
   confirmado que precio detal/mayorista depende del RUBRO (hallazgo
   #6), no es universal; permanece backlog, fuera del MVP.
4. Insumos en bodega -> proporcion 50/50 confirmada (hallazgo #5), opt-in
   pero modulo serio de Fase 2, ya no descartable.

## Preguntas abiertas por validar en la proxima visita
- Al registrar produccion, prefieren capturar UNIDADES producidas
  (produje 200) o solo declarar el costo y vender contra stock libre?
- El overhead lo quieren mensual fijo, o recalcularlo cuando cambie la
  nomina/arriendo? (hipotesis: mensual, editable a mano).
- Cuantos clientes mayoristas maneja la hija? (define si vale la pena
  un futuro modulo de estado de cuenta).
- Insumos en bodega: la panaderia SI querria controlarlos? (define si
  el opt-in de insumos entra en Nivel 1 o se difiere).

## Proximo paso
Validar con la hija y la panaderia. Con sus respuestas, escribir el spec
formal (spec.md -> plan.md -> tasks.md) siguiendo SDD, decidir Opcion A
vs B para el movimiento, y recien ahi tocar schema si aplica.
