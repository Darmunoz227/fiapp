# Feature 030 - Produccion (costo declarado + multi-linea, MVP Nivel 1)

## Contexto
FiApp nacio para comerciantes de compra-venta. Dos prospectos son
PRODUCTORES: la hija del ambulante (arepas, empanadas, carimanolas,
fritos, jugos) que vende por pedido a restaurantes y panaderias, y una
panaderia referida por Bancamia Venecia (aun sin visitar). El costo de
un producto fabricado no puede derivarse de COMPRA (Decision 009/040)
porque una empanada nunca se compra, se produce.

Este spec formaliza specs/spike-produccion/notas.md v2, que combina
evidencia de campo (1 caso puntual) con evidencia de MERCADO (5 anos de
experiencia en microfinanzas Bancamia, cientos de productores
evaluados). FiApp es generico para cientos de miles de merchants: las
decisiones de este spec se apoyan en el patron de mercado, no en las
particularidades de un solo piloto.

## Evidencia (ver spike v2 para detalle completo)
Evidencia de mercado (n=cientos, Bancamia):
1. 85% conoce su costo a ojo, sin desglose ingrediente por ingrediente.
2. Produccion es mayoritariamente DIARIA.
3. Subproductos/multi-linea son COMUNES en panaderias de barrio (no
   nicho), invalida el supuesto "1 produccion = 1 producto".
4. Overhead de costos fijos rara vez se mantiene actualizado.
5. Insumos en bodega: proporcion 50/50, NO es minoria.
6. Precio detal/mayorista depende del rubro, no es universal.
7. El costo de produccion fluctua con frecuencia (factores extrinsecos
   de la economia), contrario a la hipotesis inicial de estabilidad.

Evidencia de codigo (venta_items/Decision 031 como espejo exacto):
- ventas/venta_items: cabecera + N lineas, patron a replicar para
  producciones/produccion_items.
- crearMovimientoInterno: COMPRA actualiza costo_promedio via
  calcularCostoPromedioPonderado; VENTA/MERMA validan stock suficiente.
- calcularStockDerivado (inventory-calculations.ts): COMPRA suma,
  VENTA/MERMA restan, AJUSTE aplica delta.
- anularMovimiento bloquea COMPRA explicitamente (se corrige con AJUSTE).

## Modelo de datos (schema v8, tablas NUEVAS, sin rebuild)
Espejo exacto de ventas/venta_items (Decision 031), CREATE TABLE IF NOT
EXISTS puro, sin migracion de tablas existentes:

producciones: id, fecha, nota (nullable), + 5 columnas de auditoria
  (created_at, updated_at, deleted_at, store_id, created_by).

produccion_items: id, produccion_id (FK), producto_id (FK), cantidad,
  costo_unitario_declarado, + 5 columnas de auditoria. Indices por
  produccion_id y producto_id, mismo patron que venta_items.

TipoMovimientoInventario gana un quinto valor: 'PRODUCCION' (junto a
COMPRA, VENTA, AJUSTE, MERMA). Modelo Producto gana modo_produccion:
boolean (default false), flag opt-in explicito por producto.

## Cambios quirurgicos (4 puntos, todos con OR agregado a rama COMPRA)
1. movim-inventario.model.ts: agregar 'PRODUCCION' al union type.
2. database.service.ts crearMovimientoInterno (~L625): if (tipo ===
   'COMPRA' || tipo === 'PRODUCCION') reutiliza EXACTAMENTE el mismo
   calculo de costo promedio ponderado, sin duplicar formula.
3. inventory-calculations.ts calcularStockDerivado (~L12): if (tipo ===
   'COMPRA' || tipo === 'PRODUCCION') return stock + cantidad.
4. inventory-movement.page.ts anularMovimiento (~L91): bloquear
   PRODUCCION igual que COMPRA (se corrige con AJUSTE, protege el
   promedio ponderado ya actualizado).

Los 4 cambios son aditivos (||), CERO modificacion de la rama COMPRA
existente. Comerciantes de compra-venta jamas generan tipo PRODUCCION;
su flujo actual permanece IDENTICO, verificado por regresion (ver AC).

## Reglas de negocio
- modo_produccion es opt-in por producto; comerciantes normales nunca
  lo activan y no ven ninguna UI de produccion.
- Un evento de produccion tiene N lineas (produccion_items), cada linea
  con SU PROPIO costo_unitario_declarado independiente (evidencia #1 y
  #3: nadie prorratea costo compartido entre subproductos).
- costo_unitario_declarado se declara "a ojo" por el productor, NUNCA
  se pide desglose de ingredientes (evidencia #1, 85%).
- Registrar produccion debe sentirse RAPIDO y repetible como una venta
  diaria (evidencia #2), no como un evento raro tipo compra mensual.
- Editar el costo declarado debe ser tan facil como editar precio_venta
  (Feature #25): el costo fluctua con frecuencia (evidencia #7), NO es
  estable a largo plazo como se penso inicialmente.
- Overhead de costos fijos: calculadora OPCIONAL y MANUAL/on-demand,
  nunca un dashboard que exija actualizacion constante (evidencia #4).
- Ventas y fiados de productos en modo_produccion: CERO codigo nuevo,
  reusan integramente venta_items/fiado existente (utilidad correcta
  porque costo_promedio ya quedo actualizado por PRODUCCION).

## Fuera de alcance (NO sobre-implementar)
- Recetas/BOM ingrediente por ingrediente (evidencia #1 lo descarta).
- Insumos en bodega: opt-in confirmado 50/50 (evidencia #5), pero
  modulo de FASE 2, no MVP. Arquitectura debe dejar la puerta abierta
  sin romper nada (modo_produccion ya sirve de gancho futuro).
- Precio detal/mayorista dual: depende del rubro (evidencia #6),
  backlog, no MVP.
- Prorrateo automatico de costo entre lineas de una misma produccion.
- Merma de horneado / transformacion compleja (Decision 017 vigente).

## Criterios de aceptacion
- AC-01: registrarProduccion crea 1 cabecera + N lineas + N movimientos
  tipo PRODUCCION, todo en una sola transaccion (espejo registrarVenta).
- AC-02: cada linea actualiza costo_promedio de SU producto via
  calcularCostoPromedioPonderado, igual formula que COMPRA.
- AC-03: calcularStockDerivado suma cantidad para movimientos
  PRODUCCION, igual que COMPRA.
- AC-04: anularMovimiento bloquea PRODUCCION con mensaje equivalente a
  COMPRA (se corrige con AJUSTE).
- AC-05: REGRESION - la suite completa de tests existentes de COMPRA,
  VENTA, AJUSTE, MERMA sigue en verde SIN modificar ningun test viejo.
- AC-06: un producto con modo_produccion=false (default) no expone
  ninguna UI de produccion; comportamiento identico al actual.
- AC-07: costo_unitario_declarado se puede editar en cualquier momento
  sin fricción, reflejando evidencia #7.
