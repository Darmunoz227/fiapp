# Feature 023 - Plan

## Approach

Read-only feature. TDD estricto: RED antes de GREEN.

No schema change. No migration. No database writes.

### Paso RED

Nuevos tests en `inventory-calculations.spec.ts` (mismo archivo que ya cubre
`esStockBajo`, Decision 036: extraer, probar, luego replicar) para una función
pura nueva:

```
calcularValorTotalInventario(lineas: LineaValorInventario[]): number
LineaValorInventario = { stock_derivado: number; costo_promedio: number }
```

Casos obligatorios del task:

- inventario vacío => 0                       (reduce con acumulador 0)
- stock > 0, costo_promedio 0 => aporta 0, no NaN
- varios productos => suma correcta
- stock 0, costo > 0 => aporta 0

Se ejecuta la suite y se EVIDENCIA el fallo antes de implementar.

### Paso GREEN 1 — función pura

Implementación mínima en `inventory-calculations.ts`: un `reduce` que suma
`stock_derivado * costo_promedio` por línea, empezando en 0.
Sin NaN por construcción: los dos sumandos son number tipados; el caso
"Sin costo registrado" es multiplicar por cero, que da 0 exacto.

Por qué firma con líneas y NO con productos + map de resúmenes: la función
queda libre de tipos de UI (`Producto`, `ResumenInventario`) y testeable con
literales; la página es quien traduce su estado a líneas. Mismo corte que
Decision 036: la lógica delicada pura, handlers finos en la página.

### Paso GREEN 2 — cableado presentación

- `InventoryListPage.valorTotalInventarioTexto()`:
  construye las líneas desde `this.productos` + `stockActual(id)` +
  `producto.costo_promedio` (estado ya cargado en `cargarProductos`, cero
  queries nuevas), llama la función pura y formatea con `formatCurrencyCOP`.
- HTML: bloque resumen "Valor total del inventario" encima del ion-list,
  con el mismo *ngIf de productos.length > 0.
- SCSS: solo variables Ionic existentes (--ion-color-medium,
  --ion-text-color). Ningún color literal nuevo (Decision 029/030).

## Why no persistence

El total es segundo orden: stock ya deriva del log inmutable (Decision 009)
y valor por producto ya se negó a persistirse (Decision 040).
Persistirlo recrearía el error de los caches de stock: divergencia contra la
fuente de verdad. El número cabe en pantalla y se recalcula al render.

## Risks

R1. Duplicación de cálculo: prohibido reescribir la fórmula en otra parte;
    la página delega SIEMPRE en la función pura (precedente calcularTotalVenta,
    Decision 027: tres copias de una fórmula son tres lugares para divergir).
R2. NaN entrando por datos corruptos: fuera de alcance; si stock_derivado o
    costo_promedio fueran NaN el bug estaría aguas arriba (log de movimientos),
    no en esta suma. Los tests fijan el comportamiento con inputs válidos.
R3. Producto "Sin costo registrado" distorsionando el total: su fila oculta el
    valor textualmente pero numéricamente aporta 0, que ES lo que hay hoy:
    mercancía de costo desconocido no se cuenta como capital conocido.
    El total muestra solo lo verificable. Consistente con AC-02 de Feature 019.
R4. Rendimiento: reduce O(n) sobre productos ya en memoria. Sin consultas.
