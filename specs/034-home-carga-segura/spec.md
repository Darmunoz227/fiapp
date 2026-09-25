# Feature #34 — Carga segura del Inicio

**Rama:** `034-home-carga-segura`
**Ítem de backlog:** bug de lectura silenciosa en Home (0a)
**Evidencia verificada:** 2026-09-18 · **Spec escrito:** 2026-09-22
**Tipo:** corrección de bug PREEXISTENTE (no nace de la Feature #32)
**Schema:** SIN cambio. SCHEMA_VERSION sigue en 9. Cero migración.

---

## 0. PENDIENTE DE CONFIRMACIÓN (leer antes que nada)

Este spec se escribió con **A1 como default explícito** porque Diego autorizó
avanzar sin cerrar la disposición sobre el prototipo. Las decisiones D-1, D-2 y
D-3 están tomadas por el supervisor, NO por Diego. Si Diego las cambia, cambia
el spec y cambia el tasks.md.

Prototipo de referencia: `prototipo-034-home-carga-segura.html` (fuera del
repo, mismo criterio que el prototipo de la Feature #32, commit `59dfb95`).

Lo que SÍ está acordado por Diego, y no se toca:

- Opción A: falla TODA la carga, nunca una carga parcial.
- Texto literal: "Tus datos están protegidos. Desbloquea el teléfono y toca
  Reintentar para verlos."
- Tres reglas: nunca decir "no tienes clientes"; nunca mostrar la lista a
  medias (el total de cartera mentiría); botón Reintentar OBLIGATORIO.

---

## 1. Contexto

`src/app/home/home.page.ts` tiene dos modos de fallo que hacen que un error de
lectura se le muestre al merchant como un hecho de negocio falso. Diagnosticado
el 2026-09-15 y anotado en el commit `46d0677`. Reproducido en iPhone: la app
volvió de segundo plano con el teléfono bloqueado, iOS tenía los archivos
cifrados, y Diego creyó que había perdido todo.

En una app cuyo corazón es el fiado, decirle al merchant que nadie le debe es
el peor dato que la pantalla puede dar. Con RETENCION como problema #1
(contexto 2026-09-22), una pantalla que miente es una fuga directa.

## 2. Evidencia — verificada contra el código, con línea

### Modo A — falla la lectura de clientes

| Línea | Código | Efecto |
| --- | --- | --- |
| `:135` | `this.totalCartera = 0;` | borra el total ANTES de leer |
| `:136` | `this.clientesActivos = [];` | borra la lista ANTES de leer |
| `:137` | `await this.dbService.obtenerClientes();` | **sin `try/catch`** |
| `:61` | `ionViewWillEnter() {` | **no es `async`** |
| `:63` | `this.cargarClientesYDeudas();` | **sin `await` y sin `catch`** |

Si `obtenerClientes()` lanza, la excepción sale del método, nadie la atrapa y
la promesa flotante se pierde. La pantalla queda con lista vacía y `$ 0`
**para siempre**, sin ninguna señal.

### Modo B — falla UN cliente (el dato financiero falso)

| Línea | Código | Efecto |
| --- | --- | --- |
| `:143` | `catch (error) { ... transacciones = []; }` | traga el error |
| `:148-152` | suma `fiado` y resta `abono` sobre `[]` | `deudaCliente = 0` |
| `:153` | `push({ ..., deudaTotal: deudaCliente })` | entra a la lista con 0 |
| `:159` | `this.totalCartera += deudaCliente;` | **el total acumula ese 0** |
| `html:81` | `cliente.deudaTotal <= 0 ? 'Al dia' : 'Debe'` | imprime "Al dia" |
| `html:83` | `[color]="... 'success' : 'danger'"` | lo pinta VERDE |

Un cliente que debe $ 150.000 aparece "Al dia $ 0" en verde, y el bloque
TOTAL QUE ME DEBEN (`html:49`, `html:52`) muestra una cifra silenciosamente
menor a la real.

### Defecto estructural que impide cumplir la regla acordada

| Línea | Código | Problema |
| --- | --- | --- |
| `:153` | `this.clientesActivos.push(...)` | construcción INCREMENTAL |
| `:161` | `this.clientesFiltrados = [...this.clientesActivos];` | publica lo que haya |

Con `push` cliente por cliente, una falla a mitad del recorrido deja la lista a
medias — exactamente lo que la regla acordada prohíbe. No es estilo: es la
razón por la que hay que construir en un arreglo LOCAL y asignar al final.

### Cobertura actual: cero

`home.page.spec.ts:88` ejecuta
`spyOn(component, 'cargarClientesYDeudas').and.resolveTo();` como última
sentencia del `beforeEach(waitForAsync(...))`. **El cuerpo del método nunca se
ejecuta en la suite.** Las líneas `:158` y `:192` solo verifican que fue
llamada; `:114`, `:136` y `:167` arman objetos con `deudaTotal` a mano.

Mismo hallazgo que la Decision 052 documentó para
`editar-producto.component.spec.ts`, cuyo template jamás estuvo cubierto en
toda la vida del proyecto.

Consecuencia directa: un test nuevo que llame al método real estaría probando
el espía. El RED sería inválido (pasaría en verde, o fallaría por la razón
equivocada). Ver plan.md.

## 3. Problema en una frase

El Inicio no distingue **"no hay datos"** de **"no pude leer los datos"**, y
resuelve la ambigüedad con el mensaje más tranquilizador y más falso posible.

## 4. Alcance

**DENTRO — solo `src/app/home/`:**

- `home.page.ts` — manejo de error dentro de `cargarClientesYDeudas`,
  construcción en arreglo local, método `reintentarCarga()`.
- `home.page.html` — bloque de estado de error, ocultamiento condicional de la
  cartera, el buscador, la lista, el botón principal y el FAB.
- `home.page.scss` — estilos del bloque nuevo.
- `home.page.spec.ts` — `describe` anidado nuevo. **Cero tests existentes
  modificados.**

**FUERA — anotado como deuda, con nombre y línea:**

1. **Las otras nueve pantallas con `ionViewWillEnter`:** `ventas.page.ts:92`,
   `configuraciones.page.ts:48`, `reportes.page.ts:91`,
   `cliente-detalle.page.ts:61`, `inventory-movement.page.ts:77`,
   `inventory-list.page.ts:49` (no `async`), y `fiado-productos.page.ts:50`,
   `registrar-produccion.page.ts:40`, `gastos.page.ts:45` (`async`). **Ser
   `async` no las protege:** Ionic no espera el promise de un lifecycle hook,
   así que sigue siendo fire-and-forget.
2. **`inventory-list.page.ts:60`** — `?? false` sobre `stock_bajo`: si el
   resumen no llegó, "stock bajo" responde "todo bien". Mismo patrón. Lo
   necesitará el ítem de la alerta de stock cuando le toque.
3. **Clasificar la causa del error** (ver D-4).

Se anota siguiendo el hallazgo central de la Decision 052: auditar el patrón
completo ANTES de cerrar la feature, aunque se arregle un solo punto.

## 5. Criterios de aceptación

- **AC-01** — Si `obtenerClientes()` falla, la pantalla muestra el bloque de
  error con el texto acordado literal y un botón Reintentar. NUNCA una lista
  vacía, NUNCA `$ 0`.
- **AC-02** — Si `obtenerTransaccionesPorCliente()` falla para UN cliente,
  falla TODA la carga y se muestra el mismo bloque. Ningún cliente aparece con
  `deudaTotal` 0 por un error de lectura.
- **AC-03** — Durante el estado de error NO se renderizan: el bloque TOTAL QUE
  ME DEBEN, el buscador, la lista de clientes, el botón "Registrar fiado" ni el
  FAB. (D-1, D-2, D-3 — default del supervisor.)
- **AC-04** — La barra superior (`ion-toolbar` con nombre del negocio y las
  cuatro pastillas) SE CONSERVA. Es chrome de marca fijo (Decision 029) y las
  otras pantallas sí pueden leer.
- **AC-05** — Tocar Reintentar reejecuta la carga. Si tiene éxito, el bloque de
  error desaparece y la lista y el total aparecen completos y correctos.
- **AC-06 — el estado vacío LEGÍTIMO sigue funcionando.** Un merchant con cero
  clientes y lectura exitosa ve el estado vacío de siempre, NO el bloque de
  error. Son dos estados distintos y no se pueden confundir.
- **AC-07** — La carga se construye en un arreglo LOCAL y se asigna a
  `clientesActivos` / `clientesFiltrados` / `totalCartera` sólo si el recorrido
  completo tuvo éxito. En ningún instante se publica una lista a medias.
- **AC-08** — Los otros cuatro puntos de recarga (`:194`, `:208`, `:234`,
  `:259`: crear, borrar y deshacer cliente) quedan cubiertos por el mismo
  manejo, sin tocarlos uno por uno. (D-5.)
- **AC-09** — Mientras Reintentar está en curso se muestra un estado de carga.
  (D-6.)
- **AC-10 — cero regresión visual.** No se renombra NINGUNA clase CSS existente
  y no se mueve ningún elemento de sitio. Se respeta el principio rector de la
  Decision 054 y el test de regresión de AC-06 de la Feature #30
  (`querySelector('.boton-registrar-produccion')`).
- **AC-11** — Suite completa verde con **cero tests existentes modificados**.

## 6. Decisiones de diseño

| ID | Decisión | Estado |
| --- | --- | --- |
| **D-1** | El bloque de cartera se OCULTA durante el error. No se muestra un guion. Un guion puede leerse como cero de reojo, justo en la pareja mayor a la que apunta el proyecto. | Default supervisor |
| **D-2** | El buscador se OCULTA. Buscar sobre una lista que no existe devuelve vacío y repite la mentira. | Default supervisor |
| **D-3** | El FAB y "Registrar fiado" se OCULTAN. Los dos flujos terminan necesitando los clientes que no se pudieron leer. | Default supervisor |
| **D-4** | **Un solo texto para todo fallo de lectura.** Riesgo ANOTADO, no resuelto: el texto acordado nombra una causa concreta (archivos cifrados en iOS). Ante otro fallo (BD corrupta, migración a medias) manda a desbloquear un teléfono que ya está desbloqueado. | Acordado con riesgo |
| **D-5** | El manejo de error vive DENTRO de `cargarClientesYDeudas`, no en `ionViewWillEnter`. Así los cinco puntos de llamada quedan cubiertos sin tocarlos. | Supervisor |
| **D-6** | Reintentar muestra estado de carga. Sin él, un segundo fallo rápido parece que el botón no hace nada. | Default supervisor |
| **D-7** | **No se crea componente standalone nuevo.** El bloque de error es markup dentro de `home.page.html`, gobernado por un flag. Evita por construcción la regla NG8103 de la Decision 055. | Supervisor |

## 7. Riesgos

- **La suite es CIEGA al fallo real.** Los mocks web nunca fallan al leer, y el
  caso reproducido (archivos cifrados en iOS) sólo existe en device. La rama de
  error SÍ es testeable con un mock que rechaza la promesa, pero el escenario
  real exige device.
- **`reintentarCarga` sobre un error persistente** puede dejar al merchant
  tocando el botón sin resultado. Aceptado: es preferible a la pantalla vacía
  de hoy, que no ofrece ninguna salida.
- **D-4 sigue abierto** y no se cierra en esta feature.

## 8. Fuera de alcance explícito

- Reintento automático, backoff o telemetría de errores.
- Clasificación de la causa del fallo.
- Cualquier cambio en `DatabaseService` — `git diff` sobre
  `database.service.ts` debe quedar VACÍO al cerrar.
- Las nueve pantallas del punto 4.
- La alerta de stock bajo, a la espera de la evidencia de uso real de la
  merchant que retoma el 2026-09-18.
