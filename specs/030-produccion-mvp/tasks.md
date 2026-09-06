# Tasks - Feature 030 Produccion MVP

## Fase 1: Schema v8 (sin rebuild)
- T001 Modelos Produccion y ProduccionItem (interfaces TS).
- T002 movim-inventario.model.ts: agregar 'PRODUCCION' al union type.
- T003 SCHEMA_VERSION 7 -> 8.
- T004 crearTablasSiFaltan: agregar producciones + produccion_items
  (CREATE TABLE IF NOT EXISTS + 2 indices, espejo venta_items).
  Llamar tambien desde migrarEsquemaSiNecesario (idempotente).
- T005 productos: agregarColumnaSiFalta modo_produccion INTEGER
  DEFAULT 0, en AMBOS caminos (crear + migrar).
- T006 Rama web: mockWebProducciones, mockWebProduccionItems.
- T007 [GATE] npm test; confirmar TOTAL verde (sin tests nuevos aun,
  solo verificar que el schema compila y no rompe nada existente).

## Fase 2: Los 4 cambios quirurgicos (RED -> GREEN, uno a la vez)
- T008 [RED] Test calcularStockDerivado: movimiento PRODUCCION suma
  cantidad al stock (igual que COMPRA).
- T009 [GREEN] inventory-calculations.ts: agregar || tipo ===
  'PRODUCCION' a la condicion de COMPRA. git diff debe mostrar SOLO
  esa linea.
- T010 [GATE] npm test; suite verde, incluye tests viejos de COMPRA/
  VENTA/AJUSTE/MERMA sin modificar (regresion T1 de AC-05).
- T011 [RED] Test crearMovimientoInterno: PRODUCCION actualiza
  costo_promedio via calcularCostoPromedioPonderado, igual formula
  que COMPRA.
- T012 [GREEN] database.service.ts: agregar || tipo === 'PRODUCCION'
  a la condicion en crearMovimientoInterno. git diff quirurgico.
- T013 [GATE] npm test; suite verde (regresion T2 de AC-05).
- T014 [RED] Test anularMovimiento: PRODUCCION bloqueado con mensaje
  equivalente a COMPRA.
- T015 [GREEN] inventory-movement.page.ts: extender el bloqueo.
- T016 [GATE] npm test; suite verde (regresion T3 de AC-05).

## Fase 3: registrarProduccion (RED -> GREEN)
- T017 [RED] Test: registrarProduccion crea 1 cabecera + N items + N
  movimientos tipo PRODUCCION en una sola transaccion (rama web).
- T018 [RED] Test: cada linea actualiza el costo_promedio de SU
  propio producto, sin mezclar costos entre lineas (AC evidencia #3).
- T019 [RED] Test: si una linea excede validacion, ninguna linea se
  persiste (atomicidad, patron ejecutarEnTransaccion).
- T020 [GREEN] Implementar registrarProduccion + insertProduccion +
  insertProduccionItem (espejo registrarVenta/insertVenta/insertVentaItem).
- T021 [GREEN] Implementar obtenerProducciones (espejo obtenerVentas).
- T022 [GATE] npm test; suite verde.

## Fase 4: UI
- T023 editar-producto: toggle modo_produccion (opt-in explicito,
  default false, sin afectar productos existentes).
- T024 Pantalla registrar-produccion: seleccionar productos en
  modo_produccion, cantidad + costo_unitario_declarado editable
  inline por linea (espejo estructural de fiado-productos).
- T025 Entrada a la pantalla: boton visible SOLO si el merchant tiene
  al menos un producto en modo_produccion (no ensuciar UI de
  comerciantes que nunca lo activan).
- T026 Calculadora de overhead (modal separado, opcional): costos
  fijos mensuales / unidades estimadas = sugerencia editable de costo.
- T027 [GATE] npm test; suite verde.

## Fase 5: Verificacion en dispositivo (foco en NO afectar comerciantes)
- T028 Rebuild real: npm run build + cap sync (Android e iOS).
  Confirmar bundle fresco (grep del codigo nuevo) antes de probar.
- T029 [DEVICE][REGRESION] Un producto SIN modo_produccion: flujo de
  COMPRA/VENTA/AJUSTE/MERMA identico al actual, CERO UI nueva visible.
- T030 [DEVICE] Activar modo_produccion en un producto nuevo.
- T031 [DEVICE] Registrar una produccion multi-linea (2+ productos),
  costo declarado distinto por linea; confirmar stock y costo_promedio
  actualizados correctamente por producto.
- T032 [DEVICE] Vender un producto producido: confirmar ganancia
  correcta (precio_venta - costo_promedio actualizado por PRODUCCION).
- T033 [DEVICE] Intentar anular un movimiento PRODUCCION: bloqueado,
  mensaje equivalente a COMPRA.
- T034 [DEVICE] Costo que fluctua (AC-07, ver Decision 052): registrar
  una SEGUNDA produccion del mismo producto con un costo declarado
  distinto y confirmar que el costo_promedio se mueve por promedio
  ponderado, mientras la produccion anterior queda INTACTA. El costo se
  declara hacia adelante; NO se reescribe historia (Decision 024/038).

## Fase 6: Cierre
- T035 Actualizar docs/DECISIONS.md (Decision 052) y
  docs/PROJECT_CONTEXT.md (Feature #30 DONE, schema v8).
- T036 Merge a main con --no-ff tras verificar suite verde y arbol
  limpio.

## Definicion de terminado
- Tests nuevos verdes: calcularStockDerivado, crearMovimientoInterno,
  anularMovimiento, registrarProduccion (multiples casos).
- REGRESION verificada: CERO test existente de COMPRA/VENTA/AJUSTE/
  MERMA modificado ni debilitado (AC-05).
- git diff de los 4 puntos quirurgicos muestra SOLO el OR agregado.
- Device test Android + iOS: comerciante sin modo_produccion ve CERO
  cambio; productor con modo_produccion activo completa el ciclo
  produccion -> venta -> ganancia correcta.
- Schema v8 documentado, migracion sin rebuild verificada en device.
