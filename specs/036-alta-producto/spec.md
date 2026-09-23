# Feature #36 — Alta de producto sin bloquear

**Rama:** `036-alta-producto` (035 está tomada por iOS/UIScene)
**Origen:** bloqueo REAL de un piloto (Yudith, tienda de ropa)
**Fecha:** 2026-09-23
**Schema:** SIN cambio. SCHEMA_VERSION sigue en 9. Cero migración.

---

## 0. Decisiones acordadas ANTES del spec

Acordadas sobre el prototipo HTML (Decision 054), fuera del repo:

| ID | Decisión |
| --- | --- |
| **D-1** | Opción B1: se INVIERTE la pregunta. El alta pregunta "¿Cuántos tienes hoy?" y crea un AJUSTE. NO pide costo. |
| **D-2** | `minimo_stock` pasa a OPCIONAL con default 0. Sin esto, `20 <= 20` vuelve a encender la alerta y el bloqueo se repite con otra cara. |
| **D-3** | La cantidad inicial permite 0 explícito (vendió todo / aún no llega), pero no puede quedar en blanco. |
| **D-4** | Los productos ya rotos (los de Yudith, en 0) NO se tocan. Ella los corrige con un AJUSTE desde la pantalla de movimientos. |
| **D-5** | El AJUSTE inicial lleva `motivo` = "Inventario inicial", escrito por la APP, no pedido al merchant. Mismo criterio que el concepto legible del fiado (Decision 039/044). |
| **D-6** | Duplicar producto (Feature #25) TAMBIÉN pregunta la cantidad. Si no, Miguel duplica 12 variantes y las 12 nacen en 0 con alerta roja. |
| **D-7** | Producto y movimiento inicial se guardan en UNA sola transacción, vía un método nuevo `crearProductoConStockInicial`. Ver sección 2: esto NO es preferencia, es obligatorio. |

## 1. Contexto

Yudith intentó cargar su inventario. El formulario de alta pide cuatro datos
y NINGUNO es "cuántos tienes": la única casilla de cantidad se llama "Stock
mínimo". Ella escribió ahí lo que tenía físicamente, nunca registró una
COMPRA, el stock derivado quedó en 0 y la alerta roja se quedó encendida
PARA SIEMPRE. Se confundió y dejó de usar la app.

No es bug de código: el stock derivado del log es correcto (Decision 009).
Es un hueco de ONBOARDING. Ella no se equivocó — contestó la única pregunta
de cantidad que se le hizo.

## 2. Evidencia — verificada contra el código, con línea

### El formulario nunca pregunta la cantidad

`inventory-list.page.html:20-35` pide Nombre, Precio de venta (con
`placeholder="Ej. 12.000"`), Tipo de venta y Stock mínimo. El campo de stock
mínimo NO tiene placeholder ni ayuda, a diferencia del precio.

`inventory-list.page.ts:87-133` (`crearProducto`) guarda el producto con
`costo_promedio: 0` y **no crea ningún movimiento**. Sin movimientos,
`calcularStockDerivado` devuelve 0.

`inventory-calculations.ts:3` — `esStockBajo(0, 20)` → `0 <= 20` → alerta.

### La trampa: arreglar solo el flujo NO apaga la alerta

El corte es `stockDerivado <= minimoStock`. Si ella escribe "tengo 20" y
"mínimo 20", el resultado es `20 <= 20` → **alerta igual**. Por eso D-2 no es
un detalle cosmético: es parte del arreglo.

### AJUSTE mueve stock SIN pedir costo — verificado

`inventory-calculations.ts:51-61` (`calcularDeltaAjuste`) usa
`diferencia_calculada`, o `cantidad_fisica - stock_calculado_anterior`.
`inventory-movement.page.ts:130-145` guarda el AJUSTE con `cantidad: 0` y
`costo_unitario: 0`. No hay costo que pedir.

Además `crearMovimientoInterno` solo consulta el producto
(`obtenerProductoPorIdInterno`) cuando el tipo es COMPRA o PRODUCCION. Con
AJUSTE ni lo lee, así que no hay riesgo de que la lectura no vea el producto
recién insertado dentro de la misma transacción.

### D-7 es obligatorio, no preferencia: `crearProducto` NO es consciente de transacciones

`database.service.ts:743` hace `await this.ejecutarRun(sql, values);` — SIN
el tercer parámetro. Y la firma en `:1553`:

    private async ejecutarRun(sql, values, dentroDeTx = false) {
      return this.db.run(sql, values, !dentroDeTx);
    }

Por defecto `dentroDeTx = false` → `db.run(..., true)` → **abre su propia
transacción**. Llamar `crearProducto` dentro de un `ejecutarEnTransaccion`
produciría una transacción ANIDADA: el bug de la Decision 028, que la
Decision 055 documentó REINTRODUCIDO en `crearGasto` y
`crearGastoRecurrente` ("Importar un respaldo CON gastos fallaba el 100% de
las veces; sin gastos pasaba, y por eso nadie lo vio").

Es la TERCERA vez que aparece este patrón. Esta vez se atrapa antes de
escribir el código.

El proyecto ya tiene la solución aplicada tres veces:
`crearTransaccion(t, dentroDeTx = false)` (`:688`),
`crearGasto(g, dentroDeTx = false)` (`:1164`),
`crearGastoRecurrente(r, dentroDeTx = false)` (`:1201`).
`crearProducto` es el que FALTA en ese patrón — deuda preexistente que esta
feature destapa, igual que la Feature #30 destapó que `crearProducto` no
escribía `modo_produccion` (patrón Decision 048).

## 3. Problema en una frase

El alta de producto pregunta cuál es el mínimo pero nunca cuánto hay, así que
todo producto nuevo nace en cero y se castiga con una alerta roja que el
merchant no sabe apagar.

## 4. Alcance

**DENTRO:**

- `core/database/database.service.ts` — `crearProducto` gana
  `dentroDeTx = false` y lo propaga a `ejecutarRun`; método nuevo
  `crearProductoConStockInicial(producto, movimiento)`.
- `features/inventario/inventory-list.page.ts` / `.html` — campo nuevo
  "¿Cuántos tienes hoy?", `minimo_stock` a opcional, llamada al método nuevo.
- `shared/modals/editar-producto/` — la misma pregunta en modo duplicar (D-6).
- Sus `.spec.ts` respectivos.

**FUERA — anotado, no se hace aquí:**

1. El `?? false` sobre `stock_bajo` en `inventory-list.page.ts:60` (deuda de
   la Decision 056): si el resumen no llegó, responde "todo bien".
2. Las nueve pantallas con `ionViewWillEnter` sin manejo de error.
3. Agrupación/buscador del carrito de ventas y el importador CSV.
4. Los productos ya rotos de Yudith (D-4).

## 5. Criterios de aceptación

- **AC-01** — El alta pide "¿Cuántos tienes hoy?" como campo OBLIGATORIO.
  Acepta 0 explícito; rechaza vacío y negativos con un toast de validación.
- **AC-02** — Al guardar se crean el producto Y un movimiento AJUSTE en UNA
  sola transacción. `stock_calculado_anterior: 0`,
  `cantidad_fisica: <lo que escribió>`, `diferencia_calculada: <lo mismo>`.
- **AC-03** — Ese AJUSTE lleva `motivo` = "Inventario inicial", generado por
  la app. Al merchant no se le pide nada.
- **AC-04** — `minimo_stock` es OPCIONAL. Vacío guarda 0. La columna sigue
  siendo `INTEGER NOT NULL` y 0 es un valor válido: cero cambio de schema.
- **AC-05** — Un producto recién creado con cantidad > 0 y sin mínimo NO
  muestra la alerta de stock bajo. Es el caso exacto de Yudith.
- **AC-06** — Si el movimiento falla, la transacción hace ROLLBACK y NO queda
  un producto huérfano sin movimiento. Verificable: tras el fallo,
  `obtenerProductos` no contiene ese producto.
- **AC-07** — `crearProducto` gana `dentroDeTx = false`. Con ese default, los
  llamadores existentes NO cambian de comportamiento: cero regresión.
- **AC-08** — Duplicar producto pregunta la cantidad igual que el alta (D-6).
  El costo del duplicado sigue iniciando en 0 (Decision 047, intacta).
- **AC-09** — Cero cambio de schema y cero migración. SCHEMA_VERSION sigue
  en 9.
- **AC-10 (ENMENDADO 2026-09-23)** — Suite completa verde y **ningun test
  existente se DEBILITA**. La version original decia "cero tests existentes
  modificados" y es INALCANZABLE aqui: `inventory-list.page.spec.ts` tiene
  SEIS tests que asertan sobre `crearProducto` (`:59`, `:60`, `:80`, `:91`,
  `:102`, `:113`). Al pasar la pagina a `crearProductoConStockInicial`, los
  cuatro de validacion (`not.toHaveBeenCalled()`) seguirian en VERDE pero
  VACUOS: se cumplirian trivialmente porque ese metodo ya no se llama nunca.
  Eso es exactamente el falso verde que la Decision 022 prohibe. Por eso los
  seis se ACTUALIZAN para asertar sobre el metodo nuevo, cada uno listado en
  el tasks.md con su linea y su razon. No se borra ni se relaja NINGUNA
  asercion: el conteo de expects por test se mantiene o sube.
  Diferencia con la Feature #34, donde "cero modificados" SI era realista:
  alla solo se agrego comportamiento nuevo; aca cambia COMO se guarda un
  producto, asi que los tests que describen ese guardado cambian con el.

## 6. Riesgos

- **Toca la rama NATIVA** (INSERT de movimiento en SQLite). La suite corre
  solo la rama web mock: device test OBLIGATORIO (Decision 052). Dos bugs
  pasaron en verde por esto en la Feature #30.
- **Transacción anidada**: si `crearProducto` no propaga `dentroDeTx`, el bug
  de la Decision 028 vuelve por tercera vez. Es el riesgo central.
- **Divergencia web/nativo**: la rama web de `crearProducto` hace `push` a un
  mock y retorna ANTES de tocar `ejecutarRun`. El parámetro nuevo no la
  afecta, pero la suite tampoco puede verlo fallar. Device.
- **La validación de `minimo_stock`** hoy rechaza `NaN` y negativos
  (`inventory-list.page.ts:111`). Al volverlo opcional hay que distinguir
  "vacío" (válido, = 0) de "texto inválido" (rechazar).

## 7. Fuera de alcance explícito

- Pedir el costo en el alta (opción B2, descartada: Lady sabe que gana 40%
  pero no calcula el costo unitario).
- Un estado visual nuevo "Falta registrar cuánto tienes" (opción B3).
- Importar inventario desde archivo.
- Reparar los productos ya creados en 0.
