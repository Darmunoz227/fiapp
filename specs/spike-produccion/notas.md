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
