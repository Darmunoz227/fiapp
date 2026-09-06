# Plan - Feature 030 Produccion MVP

## Estrategia
Schema v8 (tablas NUEVAS, sin rebuild de tablas existentes). Cambios
quirurgicos aditivos (||) en 4 puntos ya identificados con evidencia.
Orden: modelo de datos -> logica pura (costeo/stock) -> capa BD
transaccional -> UI de captura -> UI de activacion (modo_produccion) ->
device test con foco en REGRESION de comerciantes existentes.

## Schema v8 (migracion)
- SCHEMA_VERSION: 7 -> 8.
- crearTablasSiFaltan: agregar producciones y produccion_items (mismo
  patron que crearVentaItemsSiFaltan, CREATE TABLE IF NOT EXISTS + 2
  indices). Llamar desde AMBOS caminos: instalacion nueva Y
  migrarEsquemaSiNecesario (idempotente, sin rebuild).
- productos: agregar columna modo_produccion via agregarColumnaSiFalta
  ('productos', 'modo_produccion', 'INTEGER DEFAULT 0'). Boolean como
  0/1 igual que habeas_data_flag.
- Rama web: mockWebProducciones y mockWebProduccionItems, mismo patron
  que mockWebVentas/mockWebVentaItems.

## Los 4 cambios quirurgicos (orden de ejecucion)
1. movim-inventario.model.ts: añadir 'PRODUCCION' al union type.
2. inventory-calculations.ts calcularStockDerivado: cambiar
   "if (tipo === 'COMPRA')" a "if (tipo === 'COMPRA' || tipo ===
   'PRODUCCION')". Un solo caracter de diferencia, maximo cuidado en
   no tocar nada mas de la funcion.
3. database.service.ts crearMovimientoInterno: mismo cambio de OR en
   la condicion que dispara calcularCostoPromedioPonderado.
4. inventory-movement.page.ts anularMovimiento: extender el bloqueo
   con el mismo mensaje adaptado ("Las PRODUCCIONES se corrigen con
   un AJUSTE").
Cada cambio se hace y se corre la suite ANTES de tocar el siguiente
punto, para aislar cualquier regresion a un solo commit (AC-05).

## Capa de datos nueva
Modelos: Produccion (id, fecha, nota, +5 auditoria), ProduccionItem
(id, produccion_id, producto_id, cantidad, costo_unitario_declarado,
+5 auditoria).

registrarProduccion(produccion, items, movimientos): espejo exacto de
registrarVenta. Dentro de ejecutarEnTransaccion: insertProduccion,
loop insertProduccionItem, loop crearMovimientoInterno (tipo
PRODUCCION). Sin transaccionFiado (produccion no genera fiado).

obtenerProducciones(): espejo de obtenerVentas (combina cabecera +
items, filtra deleted_at IS NULL, rama web vs nativa).

## Capa UI
1. Activar modo_produccion: checkbox/toggle en editar-producto
   (Feature #25/#28), opt-in explicito, no afecta productos existentes
   (default false).
2. Pantalla nueva registrar-produccion (espejo estructural de
   fiado-productos): seleccionar N productos en modo_produccion, cada
   uno con cantidad + costo_unitario_declarado editable inline, "a ojo"
   sin validacion de desglose. Guardar dispara registrarProduccion.
3. Calculadora de overhead: pantalla/modal OPCIONAL y separada,
   manual/on-demand (costos fijos mensuales / unidades estimadas =
   sugerencia de costo por unidad), nunca automatica ni obligatoria.
4. Costo declarado editable: reusar edicion de producto existente
   (Feature #25), sin friccion extra (evidencia #7).

## Pruebas (TDD, RED antes de GREEN)
1. calcularStockDerivado: PRODUCCION suma cantidad (igual que COMPRA).
2. crearMovimientoInterno: PRODUCCION actualiza costo_promedio via
   promedio ponderado (igual formula que COMPRA).
3. anularMovimiento: PRODUCCION bloqueado, mismo patron que COMPRA.
4. registrarProduccion: 1 cabecera + N items + N movimientos en una
   sola transaccion (rama web, mockWeb*).
5. registrarProduccion: cada linea con su propio costo, sin prorrateo.
6. REGRESION explicita: correr TODA la suite existente de COMPRA,
   VENTA, AJUSTE, MERMA sin tocar ni un assert viejo (AC-05).

## Gates
- Suite completa verde antes de cada commit, incluyendo regresion.
- git diff de crearMovimientoInterno y calcularStockDerivado debe
  mostrar SOLO el OR agregado, ninguna otra linea tocada.
- Device test Pixel_8 + iOS: activar modo_produccion en un producto,
  registrar una produccion multi-linea, confirmar stock y costo_promedio
  actualizados, vender ese producto y verificar ganancia correcta,
  confirmar que un producto SIN modo_produccion no muestra ninguna UI
  nueva (regresion visual para comerciantes).
