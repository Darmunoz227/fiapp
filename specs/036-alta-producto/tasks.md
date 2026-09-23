# Tasks — Feature #36, alta de producto sin bloquear

**Rama:** `036-alta-producto`
**Base:** 290 tests verdes, schema v9, árbol limpio (merge de la #34).
**Regla transversal:** confirmar `TOTAL: N SUCCESS` ANTES de cada commit de
código. Ningún bloque `python3` avanza sin ver su `OK:`. Todo gate de build
verifica el EXIT CODE, nunca solo un grep (Decision 056).

---

## Fase 0 — Documentación ANTES de código

- **T001** — `specs/036-alta-producto/` con spec, plan y tasks.
- **T002** — `git add specs/036-alta-producto/` — NUNCA `git commit -am`.
- **T003** — Commit: `docs: spec, plan y tasks de la Feature #36`.
- **T004** — `git status` limpio. Sin una sola línea de código todavía.

## Fase 1 — Andamiaje

- **T005** — `crearProducto(producto, dentroDeTx = false)` en
  `database.service.ts:712`, propagando el flag a `ejecutarRun` en `:743`.
- **T006** — Método nuevo `crearProductoConStockInicial(producto, movimiento)`
  que por ahora SOLO crea el producto dentro de `ejecutarEnTransaccion`, sin
  el movimiento. Así el RED de la fase 2 falla por ASERCIÓN y no por
  compilación (ver plan.md §2).
- **T007** — Gate: `npm test -- --watch=false --browsers=ChromeHeadless`.
  Esperado **290 SUCCESS**: nada cambió de comportamiento. Si baja, parar.
- **T008** — Commit: `feat: crearProducto consciente de transaccion y andamio
  de stock inicial`.

## Fase 2 — RED de datos

- **T009** — `describe` anidado nuevo al final de `database.service.spec.ts`.
  No modificar ningún test existente.
- **T010** — Test AC-02: tras `crearProductoConStockInicial`, el producto
  existe Y hay exactamente UN movimiento AJUSTE para ese producto.
- **T011** — Test AC-02 (valores): ese movimiento tiene
  `stock_calculado_anterior: 0`, `cantidad_fisica: 20` y
  `diferencia_calculada: 20`.
- **T012** — Test AC-03: ese movimiento tiene `motivo: 'Inventario inicial'`.
- **T013** — **RED verificado con salida real.** Los tres deben fallar por la
  ASERCIÓN. Pegar la salida. Si alguno falla por compilación o por
  "is not a function", NO es RED válido: corregir el test, no el código.

## Fase 3 — GREEN de datos

- **T014** — Completar `crearProductoConStockInicial`: agregar
  `await this.crearMovimientoInterno(movimiento)` DENTRO del mismo
  `ejecutarEnTransaccion`, después de `crearProducto(producto, true)`.
- **T015** — Test AC-07: verificar que los llamadores existentes de
  `crearProducto` (sin segundo argumento) siguen pasando. Es regresión pura:
  si la suite baja de su número, el default `false` está mal.
- **T016** — Gate: suite verde. Confirmar `TOTAL: N SUCCESS`.
- **T017** — Commit: `feat: producto y stock inicial en una sola transaccion
  (AC-02, AC-03, AC-07)`.

## Fase 4 — RED de UI

- **T018** — `describe` anidado nuevo en `inventory-list.page.spec.ts`.
- **T019** — Test AC-01: sin cantidad (campo vacío) NO se crea el producto y
  se muestra el toast de validación. Con `0` SÍ se crea (D-3).
- **T020** — Test AC-04: `minimo_stock` vacío guarda el producto con
  `minimo_stock: 0`, sin toast de error.
- **T021** — Test AC-05: producto creado con cantidad 20 y mínimo vacío →
  `esStockBajo(20, 0)` es `false`. Es el caso exacto de Yudith.
- **T022** — **RED verificado con salida real.** Pegar la salida.

## Fase 5 — GREEN de UI

- **T023** — `inventory-list.page.html`: campo nuevo "¿Cuántos tienes hoy?"
  con hint "Cuenta lo que hay en el local ahora", y "Stock mínimo" pasa a
  "Stock mínimo (opcional)" con hint "Si lo dejas vacío, no te avisamos".
- **T024** — `inventory-list.page.ts`: propiedad nueva para la cantidad;
  validación que acepta 0 y rechaza vacío/negativo/NaN; `minimo_stock` vacío
  se normaliza a 0 SIN rechazar (cuidado: hoy `:111` rechaza `NaN`, y vacío
  produce `NaN`).
- **T025** — Construir el AJUSTE y llamar a `crearProductoConStockInicial`.
  Copiar la forma del movimiento de `inventory-movement.page.ts:130-145`
  (`cantidad: 0`, `costo_unitario: 0`).
- **T026** — D-6: la misma pregunta en `editar-producto.component` en modo
  duplicar. `costo_promedio` del duplicado sigue iniciando en 0 (Decision
  047 intacta). Llamar `fixture.detectChanges()` en sus tests.
- **T027** — Gate: suite verde. Commit: `feat: el alta pregunta cuanto tienes
  y el minimo pasa a opcional (AC-01, AC-04, AC-05, AC-08)`.

## Fase 6 — Gate completo

- **T028** — Suite completa verde. Anotar: 290 base + los nuevos.
- **T029** — CERO tests existentes modificados (AC-10): `git diff` sobre los
  tres `.spec.ts` solo con INSERCIONES.
- **T030** — Grep de seguridad de `as any`, `@ts-ignore` y `$any(`: limpio
  salvo las 4 PREEXISTENTES en `core/fiado/fiado-productos.ts` (Feature #22).
- **T031** — `npm run build > /tmp/build.log 2>&1; echo "EXIT: $?"` debe dar
  **EXIT: 0**. Revisar también el presupuesto de estilos si se tocó SCSS.
- **T032** — `grep -c "NG8103" /tmp/build.log` debe dar **0**.
- **T033** — `grep -c "SCHEMA_VERSION = 9"` sigue en 9 y `git diff` no toca
  ninguna sentencia `CREATE TABLE` (AC-09).

## Fase 7 — Device test (por ARTEFACTO, no por captura)

- **T034** — `npm run build && npx cap sync android`, luego
  `npx cap run android --target Pixel_8`. Sin tuberías sobre `cap run`.
- **T035** — Bundle fresco: buscar `Inventario inicial` en
  `android/app/src/main/assets/public/*.js`. Es cadena NUEVA, no da falso
  positivo (aprendizaje de la Decision 053).
- **T036** — Crear producto con cantidad 20 y sin mínimo. Exportar respaldo y
  confirmar en el JSON: `minimo_stock: 0`, un AJUSTE con `cantidad_fisica: 20`,
  `stock_calculado_anterior: 0`, `motivo: "Inventario inicial"`.
- **T037** — En la lista ese producto muestra stock 20 y NINGUNA alerta roja
  (AC-05). Crear otro con cantidad 0: se guarda y la alerta SÍ aparece.
- **T038** — Duplicar un producto (D-6): pregunta la cantidad, nace con su
  propio AJUSTE y `costo_promedio` en 0.
- **T039** — **AC-06 rollback:** inyectar un `throw` TEMPORAL en
  `crearMovimientoInterno`, intentar guardar, confirmar que el producto NO
  aparece en la lista. Revertir y verificar `git diff` VACÍO antes de seguir.

## Fase 8 — Cierre documental

- **T040** — **Decision 057** en `docs/DECISIONS.md`: el hueco de onboarding,
  por qué D-2 era parte del arreglo, la tercera aparición del patrón de
  transacción anidada, y la evidencia de device por artefacto.
- **T041** — Sincronizar `docs/PROJECT_CONTEXT.md`.
- **T042** — Actualizar el ítem del backlog en `PROMPT_SUPERVISOR_FIAPP.md`.
- **T043** — Commit de documentación.

## Fase 9 — Merge

- **T044** — `git checkout main && git merge --no-ff 036-alta-producto`.
- **T045** — Suite verde Y `EXIT: 0` EN MAIN antes de cerrar.

---

## Anotado, NO se hace aquí

- El `?? false` sobre `stock_bajo` en `inventory-list.page.ts:60`.
- Las nueve pantallas con `ionViewWillEnter` (deuda de la Decision 056).
- Los productos ya creados en 0 (D-4): se corrigen con un AJUSTE manual.
- Agrupación/buscador del carrito e importador CSV.
