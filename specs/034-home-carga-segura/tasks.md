# Tasks — Feature #34, carga segura del Inicio

**Rama:** `034-home-carga-segura` (recreada desde main el 2026-09-22;
incluye el cherry-pick `ff71608` con la renumeración del backlog).
**Base:** 280 tests verdes, schema v9, árbol limpio.
**Regla transversal:** confirmar `TOTAL: N SUCCESS` en pantalla ANTES de cada
commit de código. Ningún bloque `python3` avanza sin ver su `OK:`.

---

## Fase 0 — Documentación ANTES de código

- **T001** — `specs/034-home-carga-segura/` con `spec.md`, `plan.md` y
  `tasks.md`.
- **T002** — `git add specs/034-home-carga-segura/` — **NUNCA `git commit -am`**,
  son archivos nuevos y `-am` los saltaría.
- **T003** — Commit: `docs: spec, plan y tasks de la Feature #34`.
- **T004** — Confirmar con `git status` que el árbol queda limpio. **Sin una
  sola línea de código todavía.**

## Fase 1 — Andamiaje (para que el RED falle por la aserción)

- **T005** — En `home.page.ts`, declarar `errorCarga: boolean = false;` y
  `cargando: boolean = false;` junto a `totalCartera` (`:39`) y
  `clientesActivos` (`:40`).
- **T006** — Agregar `async reintentarCarga(): Promise<void>` que sólo llame a
  `this.cargarClientesYDeudas()`. Sin lógica propia.
- **T007** — Gate: `npm test -- --watch=false --browsers=ChromeHeadless`.
  Esperado **280 SUCCESS**: nada cambió de comportamiento. Si baja de 280,
  parar y averiguar por qué antes de seguir.
- **T008** — Commit: `feat: andamiaje de estado de carga y error en Home`.

## Fase 2 — RED de lógica

- **T009** — Crear al FINAL de `home.page.spec.ts` un `describe` anidado nuevo
  cuyo `beforeEach` haga
  `(component.cargarClientesYDeudas as jasmine.Spy).and.callThrough();`.
  **No modificar el `beforeEach` global ni el spy de `:88`.**
- **T010** — Test AC-01: `obtenerClientes` rechaza → `errorCarga === true`.
- **T011** — Test AC-02: `obtenerClientes` resuelve con 2 clientes y
  `obtenerTransaccionesPorCliente` rechaza para el segundo → `errorCarga` true
  y `clientesActivos.length === 0`. **Ningún cliente con `deudaTotal` 0 por un
  error de lectura.**
- **T012** — Test AC-07: en el caso de T011, `totalCartera` NO quedó con la
  suma parcial del primer cliente.
- **T013** — Test AC-06: lectura exitosa que devuelve `[]` →
  `errorCarga === false`. El vacío legítimo NO es un error.
- **T014** — Test camino feliz: 2 clientes con transacciones →
  `errorCarga === false`, lista completa y `totalCartera` correcto.
- **T015** — **RED verificado con salida real.** Los cinco tests deben fallar
  por la ASERCIÓN, no por compilación ni por TestBed. Pegar la salida. Si
  alguno falla por otra razón, NO es un RED válido: corregir el test.

## Fase 3 — GREEN de lógica

- **T016** — Reescribir `cargarClientesYDeudas`: construir en locales
  (`clientesLocal`, `totalLocal`), un solo `try` alrededor del recorrido
  completo, asignar a `this.*` sólo al final.
- **T017** — **Eliminar el `catch` por cliente de `:143`.** Es el que convierte
  un error de lectura en `deudaTotal: 0`. Verificar con `grep` que ya no está.
- **T018** — `finally` con `this.cargando = false;` y
  `this.cdr.detectChanges();`.
- **T019** — Gate: suite verde. Confirmar `TOTAL: N SUCCESS`.
- **T020** — Commit: `feat: la carga del Inicio falla completa en vez de
  mostrar datos falsos (AC-01, AC-02, AC-07)`.

## Fase 4 — RED de template

- **T021** — Test AC-03: con `errorCarga === true` y `fixture.detectChanges()`,
  el DOM NO contiene el bloque de cartera, ni el buscador, ni la lista, ni el
  botón principal, ni el FAB. Usar `querySelector` sobre las clases EXISTENTES.
- **T022** — Test AC-01 (texto): el DOM contiene el texto literal acordado
  completo, no un fragmento.
- **T023** — Test AC-04: la barra superior y el nombre del negocio siguen
  presentes durante el error.
- **T024** — Test AC-05: tocar Reintentar reejecuta la carga; si ahora
  resuelve, `errorCarga === false` y la lista aparece.
- **T025** — Test AC-06 (template): cero clientes + `errorCarga === false` →
  se ve el estado vacío de siempre, NO el bloque de error.
- **T026** — **RED verificado con salida real.** Pegar la salida.

## Fase 5 — GREEN de template

- **T027** — `home.page.html`: bloque de error con `*ngIf="errorCarga"`, con el
  texto acordado y un `ion-button` Reintentar que llame a `reintentarCarga()`.
- **T028** — Envolver en `*ngIf="!errorCarga"` la cartera (`html:49`), el
  buscador, la lista y el botón principal (D-1, D-2, D-3).
- **T029** — Ocultar el FAB durante el error. **Cuidado:** el FAB lleva
  `margin-bottom: env(safe-area-inset-bottom)` de la Decision 042 y fue
  CONSERVADO por evidencia de campo en la Decision 054 — ocultarlo
  condicionalmente no puede romper ninguna de las dos.
- **T030** — Estado de carga de Reintentar con `cargando` (AC-09).
- **T031** — `home.page.scss`: clases NUEVAS. Variables Ionic **con fallback**
  (Decision 030). Azul de acento y neutros, NO `danger`.
- **T032** — Gate: suite verde. Confirmar `TOTAL: N SUCCESS`.
- **T033** — Commit: `feat: estado de error con Reintentar en el Inicio`.

## Fase 6 — Gate completo

- **T034** — Suite completa verde. Anotar el número: 280 base + los nuevos.
- **T035** — **Cero tests existentes modificados** (AC-11): `git diff` sobre
  `home.page.spec.ts` sólo con INSERCIONES fuera del describe nuevo.
- **T036** — Grep de seguridad de `as any`, `@ts-ignore` y `$any(`: limpio
  salvo las **4 ocurrencias PREEXISTENTES** en `core/fiado/fiado-productos.ts`
  (Feature #22). Cualquier ocurrencia NUEVA se rechaza.
- **T037** — `git diff src/app/core/database/database.service.ts` VACÍO.
- **T038** — `npm run build | grep -c "NG8103"` debe dar **0**.
- **T039** — `.boton-registrar-produccion` intacta y su test de regresión
  (AC-06 de la Feature #30) verde.

## Fase 7 — Device test

- **T040** — **DECIDIR CON DIEGO cómo se provoca el fallo** (plan.md §4).
  **Esta tarea BLOQUEA la fase 7.**
- **T041** — `npm run build && npx cap sync android && npx cap run android
  --target Pixel_8`. Sin tuberías sobre `cap run` (Decision 053).
- **T042** — Confirmar bundle FRESCO con un string que sólo exista en el código
  nuevo, contra `android/app/src/main/assets/public/*.js`, no sólo `www/`.
- **T043** — Device, camino feliz: sin regresión en lista, total, buscador, FAB
  y swipe de Editar/Eliminar.
- **T044** — Device, camino de error (según T040): bloque visible, texto
  legible, Reintentar funcional.
- **T045** — Modo oscuro: `adb shell "cmd uimode night yes"` y `no`, sin
  reiniciar la app. Legible en ambas apariencias.
- **T046** — Pantalla angosta (360px): el media query tiene selectores
  parcialmente huérfanos (Decision 054) y NINGÚN test renderiza a 360px.

## Fase 8 — Cierre documental

- **T047** — Escribir la **Decision 056** en `docs/DECISIONS.md`.
- **T048** — Sincronizar `docs/PROJECT_CONTEXT.md`. **Ojo:** está desfasado
  desde el 2026-09-15: le falta la evidencia de campo del 17 (dos cajas, el
  cuaderno como libro contable, el FONDO, el spike de proveedores) y el roster
  de 5 pilotos del `spike-segmento`.
- **T049** — Mover el ítem de EN CURSO a HECHO en `PROMPT_SUPERVISOR_FIAPP.md`.
- **T050** — Commit de documentación.

## Fase 9 — Merge

- **T051** — `git checkout main && git merge --no-ff 034-home-carga-segura`.
- **T052** — Suite verde EN MAIN antes de cerrar.

---

## Anotado, NO se hace aquí

- Las nueve pantallas con `ionViewWillEnter` (lista en spec.md §4).
- `inventory-list.page.ts:60` — el `?? false` sobre `stock_bajo`.
- D-4: clasificar la causa del error.
- La alerta de stock bajo (bloqueo de Yudith): a la espera de evidencia de uso
  real. `AJUSTE` ya existe y mueve stock sin pedir costo
  (`inventory-calculations.ts:21`), así que el candidato "¿cuántos tienes hoy?"
  es viable — pero se decide con datos, no antes.
