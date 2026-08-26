# Feature 023: Total global de inventario

## Status

Draft

## Problem

El merchant ya ve el valor a costo POR PRODUCTO en Inventario (Feature 019 /
Decision 040), pero no ve cuánto capital tiene amarrado en TODO el inventario.
Para un negocio pequeño esa cifra es la respuesta directa a "¿cuánta plata
tengo metida en mercancía?" hoy exige sumar fila por fila a mano.

## Decision

Valor total global del inventario, DERIVADO y mostrado arriba de la lista:

valor_total_inventario = Σ (stock_derivado × costo_promedio)
                          sobre todos los productos activos

Reglas del cálculo (coherentes con lo que cada fila ya muestra):

- Producto normal: aporta stock × costo_promedio.
- Producto con stock > 0 y costo_promedio = 0 (su fila dice "Sin costo
  registrado"): APORTA 0 al total. No NaN, no rompe la suma.
- Producto con stock = 0: aporta 0 aunque tenga costo_promedio > 0.
- Inventario vacío: el total es 0.

## Scope

Read-only, presentación única.

- Función PURA nueva en `inventory-calculations.ts`
  (`calcularValorTotalInventario`), testeable sin framework ni DOM.
- Render en `inventory-list.page.ts` + `inventory-list.page.html`
  (+ estilos mínimos en scss, SOLO variables Ionic, Decision 029/030).
- Reusa `stockActual(producto.id)` y `producto.costo_promedio` que la página
  YA calcula. Cero queries nuevas, cero lecturas repetidas.

## Fuera de alcance

- NO se crea tabla, columna, migración ni se cambia SCHEMA_VERSION
  (Decision 040: segundo nivel derivado, nunca persistido).
- NO se toca DatabaseService, el native write path ni ninguna escritura.
- NO cambia el cálculo por producto existente (`valorInventarioTexto`);
  se REÚSA, no se duplica.
- NO se toca freemium (leer es gratis, Decision 033).
- Esta rama NO se mezcla a main automáticamente; el merge espera la
  verificación on-device de AC-07.

## Functional requirements

RF-01. Mostrar una línea "Valor total del inventario" sobre la lista de
       productos, visible solo cuando hay productos (mismo gate de la lista).
RF-02. El valor lo calcula una función pura alimentada por líneas
       {stock_derivado, costo_promedio} construidas a partir del estado que la
       página ya tiene. Sin acceso a base de datos dentro de la función.
RF-03. Dinero formateado con el formatter existente `formatCurrencyCOP`
       (COP sin decimales, constitución).
RF-04. Un producto sin costo registrado aporta 0 al total (no NaN).
RF-05. Valor derivado, nunca persistido.

## Acceptance criteria

AC-01. Array vacío de líneas => total 0 (inventario vacío).
AC-02. Línea stock > 0 con costo_promedio 0 => aporta 0, sin NaN, y la suma
       de las demás líneas queda correcta.
AC-03. Varios productos => suma exacta de stock × costo_promedio.
AC-04. Producto con stock 0 y costo promedio > 0 => aporta 0.
AC-05. Sin cambios de esquema: ni CREATE/ALTER TABLE, ni columnas nuevas,
       ni SCHEMA_VERSION tocado. Grep confirma cero diffs en
       core/database/database.service.ts y core/database/schema-version.ts.
AC-06. Suite completa en verde (TOTAL: N SUCCESS) SIN borrar ni debilitar
       ningún test existente.
AC-07. Verificación BY HAND en Android Pixel_8 pendiente del piloto
       (gate antes de merge, mismo estándar de las Features 035-041).
