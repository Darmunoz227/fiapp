# Plan — Feature #36, alta de producto sin bloquear

**Rama:** `036-alta-producto`
**Spec:** `spec.md` (leer la sección 0 antes de implementar)

---

## 1. Enfoque técnico

Tres cambios, en este orden:

1. **`crearProducto` gana `dentroDeTx = false`** y lo propaga a
   `ejecutarRun`. Con ese default los llamadores actuales no cambian de
   comportamiento. Es el mismo patrón ya aplicado en `crearTransaccion`
   (`:688`), `crearGasto` (`:1164`) y `crearGastoRecurrente` (`:1201`).
2. **Método nuevo `crearProductoConStockInicial`**, la única forma de
   cumplir AC-02 y AC-06:

       async crearProductoConStockInicial(producto, movimiento) {
         return this.ejecutarEnTransaccion(async () => {
           await this.crearProducto(producto, true);
           await this.crearMovimientoInterno(movimiento);
         });
       }

   `crearMovimientoInterno` YA está diseñado para correr dentro de una
   transacción: así se usa en `:1066` y `:1159`.
3. **UI**: campo "¿Cuántos tienes hoy?" obligatorio, `minimo_stock` opcional,
   y la misma pregunta en modo duplicar.

### Por qué NO dos llamadas separadas

`crearProducto(...)` seguido de `crearMovimiento(...)` son DOS transacciones.
Si la segunda falla, el producto queda guardado sin movimiento: exactamente
el estado roto que esta feature arregla. Y envolver ambas desde la página
anidaría transacciones (Decision 028).

### Archivos tocados

| Archivo | Cambio |
| --- | --- |
| `core/database/database.service.ts` | `dentroDeTx` + método nuevo |
| `features/inventario/inventory-list.page.ts` / `.html` | campo + validación |
| `shared/modals/editar-producto/*` | cantidad en modo duplicar (D-6) |
| los `.spec.ts` de los tres | describes nuevos, cero tests modificados |

## 2. Estrategia de tests

### Cómo se logra un RED VÁLIDO

El andamiaje declara `crearProductoConStockInicial` **creando solo el
producto**, sin el movimiento. Así el archivo compila y el test falla por la
ASERCIÓN (`movimientos.length` 0 en vez de 1), no por compilación ni por
"is not a function". Un método que lanza `Error('no implementado')` sería un
RED INVÁLIDO: fallaría por excepción.

### Qué prueba la suite y qué NO

La suite corre la rama WEB mock. Puede probar:

- que se crea el movimiento y con qué valores (AC-02, AC-03)
- la validación del formulario (AC-01, AC-04)
- que `esStockBajo` no se enciende con cantidad > 0 y mínimo 0 (AC-05)
- que los llamadores viejos de `crearProducto` siguen igual (AC-07)

NO puede probar:

- el rollback real de SQLite (AC-06). La rama web usa arrays y no tiene
  transacciones: un test web del rollback daría un falso verde.
- que no haya transacción anidada.

Las dos van a DEVICE, por artefacto (respaldo JSON exportado), no por
captura. Criterio de la Decision 055.

### `detectChanges()` explícito

Los tests de template llaman `fixture.detectChanges()` explícitamente
(criterio Decision 022). La Decision 052 documentó que
`editar-producto.component.spec.ts` nunca lo llamaba y por eso su template
jamás estuvo cubierto — y justo ese componente se toca aquí por D-6.

## 3. Fases y gates

| Fase | Contenido | Gate |
| --- | --- | --- |
| **0** | Commit de spec, plan, tasks | árbol limpio. Sin código |
| **1** | `dentroDeTx` + método andamio (sin movimiento) | 290 SUCCESS |
| **2** | RED de datos (AC-02, AC-03, AC-07) | fallan por ASERCIÓN |
| **3** | GREEN de datos | `TOTAL: N SUCCESS` |
| **4** | RED de UI (AC-01, AC-04, AC-05, AC-08) | fallan por ASERCIÓN |
| **5** | GREEN de UI: alta + duplicar | `TOTAL: N SUCCESS` |
| **6** | Gate completo + grep de seguridad | ver abajo |
| **7** | Device test en Pixel_8 | por ARTEFACTO |
| **8** | Decision 057 + PROJECT_CONTEXT sync | documentado |
| **9** | Merge `--no-ff` | verde en main |

**Gate de build (regla nueva de la Decision 056):** verificar el EXIT CODE
explícitamente, nunca solo un grep — una tubería se traga el código de
salida y un `grep -c` devuelve 0 sobre un build ROTO:

    npm run build > /tmp/build.log 2>&1; echo "EXIT: $?"

## 4. Device test — qué se verifica y cómo

El respaldo JSON exportado es la evidencia, no la captura (Decision 055).

1. Crear un producto con cantidad 20 y sin mínimo. En el JSON debe aparecer
   el producto con `minimo_stock: 0` Y un movimiento AJUSTE con
   `cantidad_fisica: 20`, `stock_calculado_anterior: 0`,
   `motivo: "Inventario inicial"`.
2. En la lista, ese producto muestra stock 20 y **ninguna alerta roja**
   (AC-05, el caso de Yudith).
3. Crear uno con cantidad 0: se guarda, y la alerta SÍ aparece — es correcto,
   no hay nada en el local.
4. Duplicar un producto (D-6): pregunta la cantidad y el duplicado nace con
   su propio AJUSTE y `costo_promedio` en 0.
5. **Rollback (AC-06):** con un `throw` temporal inyectado en
   `crearMovimientoInterno`, guardar debe fallar y el producto NO debe
   aparecer en la lista. Revertir con `git diff` vacío antes de commitear.

Antes de cada device test: `npm run build` + `npx cap sync` +
`npx cap run android --target Pixel_8`, sin tuberías sobre `cap run`
(Decision 053). Verificar bundle fresco con `Inventario inicial`, cadena
nueva que no existía antes.

## 5. Lo que este plan NO hace

- No cambia schema ni migra nada.
- No repara los productos ya creados en 0 (D-4).
- No toca el `?? false` de `inventory-list.page.ts:60`.
- No pide costo en el alta.
