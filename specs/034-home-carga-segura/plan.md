# Plan — Feature #34, carga segura del Inicio

**Rama:** `034-home-carga-segura`
**Spec:** `spec.md` (leer la sección 0 antes de implementar)

---

## 1. Enfoque técnico

Tres cambios, en este orden:

1. **Manejo de error DENTRO de `cargarClientesYDeudas`** (D-5). Cubre por
   construcción los cinco puntos de llamada — `:63`, `:194`, `:208`, `:234`,
   `:259` — sin tocar ninguno.
2. **Construcción en arreglo LOCAL y asignación atómica al final** (AC-07).
   Es la única forma de cumplir "nunca mostrar la lista a medias" con el `push`
   incremental actual de `:153`.
3. **Bloque de error en el template**, gobernado por un flag (D-7). Sin
   componente standalone nuevo.

### Por qué NO basta con volver `async` el hook

`ionViewWillEnter` en `:61` no es `async` y en `:63` se llama sin `await`.
Volverlo `async` NO arregla nada por sí solo: Ionic no espera el promise de un
lifecycle hook, así que sigue siendo fire-and-forget. Sólo habilita un
`try/catch` interno. Por eso el manejo va dentro de la carga, no en la firma
del hook.

### Estado del componente

Tres flags nuevos en `HomePage`, todos con valor inicial explícito:

- `errorCarga: boolean = false` — hay un fallo de lectura sin resolver.
- `cargando: boolean = false` — hay una carga en curso (AC-09 / D-6).
- El estado vacío legítimo NO necesita flag: es `clientesActivos.length === 0`
  **con `errorCarga === false`** (AC-06).

### Forma del método

    async cargarClientesYDeudas() {
      this.cargando = true;
      try {
        // construir TODO en locales: clientesLocal, totalLocal
        // un solo try alrededor del recorrido completo
        // asignar a this.* SOLO al final, si todo salió bien
        this.errorCarga = false;
      } catch (error) {
        this.errorCarga = true;
        // NO tocar this.clientesActivos ni this.totalCartera aquí:
        // el template no los renderiza mientras errorCarga sea true
      } finally {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    }

**El `catch` por cliente de `:143` se ELIMINA.** Hoy convierte un error de
lectura en `deudaTotal: 0`. Con la opción A acordada, ese error debe propagar y
tumbar la carga entera.

`reintentarCarga()` es un método nuevo y delgado que sólo llama a
`cargarClientesYDeudas()`. Se separa para que el template tenga un handler
propio y para que el test de AC-05 no dependa del hook.

### Archivos tocados

| Archivo | Cambio |
| --- | --- |
| `src/app/home/home.page.ts` | flags, método reescrito, `reintentarCarga()` |
| `src/app/home/home.page.html` | bloque de error + `*ngIf` de ocultamiento |
| `src/app/home/home.page.scss` | clases NUEVAS del bloque |
| `src/app/home/home.page.spec.ts` | `describe` anidado nuevo |

`database.service.ts` NO se toca. Al cerrar la feature, `git diff` sobre ese
archivo debe salir VACÍO (mismo criterio de verificación que la Feature #23).

### Reglas de estilo que aplican

- **Cero clases CSS renombradas** (AC-10). Las clases del bloque de error son
  NUEVAS y aditivas. El test de regresión de AC-06 de la Feature #30 consulta
  `querySelector('.boton-registrar-produccion')` y es la única garantía escrita
  de que un comerciante sin modo producción no ve UI nueva.
- **Variables Ionic con fallback** (Decision 030): las tarjetas ya fallaron una
  vez por consumir `--ion-item-background` sin fallback y resolver al gris del
  fondo. Modo oscuro se verifica explícitamente.
- **Rojo SOLO para deuda, verde SOLO para saldado** (Decision 054). El bloque
  de error **no** es deuda: usa el azul de acento y neutros, no `danger`.
- **Emoji para ETIQUETAR, SVG para lo que se TOCA** (Decision 054). El botón
  Reintentar es un `ion-button` real, no un emoji.

## 2. Estrategia de tests

### El obstáculo, y cómo se rodea sin modificar nada

`home.page.spec.ts:88` tiene `spyOn(component, 'cargarClientesYDeudas')` como
última sentencia del `beforeEach(waitForAsync(...))` global. Es global: aplica
a todos los tests del archivo.

Solución con **cero tests existentes modificados**: un `describe` anidado NUEVO
al final del archivo, cuyo propio `beforeEach` haga

    (component.cargarClientesYDeudas as jasmine.Spy).and.callThrough();

El spy global sigue instalado para los tests viejos; sólo dentro del describe
nuevo se ejecuta el método real. No se borra ni se debilita nada.

### Cómo se provoca el RED

Con los mocks que el archivo ya usa:

- `databaseServiceMock.obtenerClientes.and.rejectWith(new Error('...'))` → A.
- `databaseServiceMock.obtenerTransaccionesPorCliente.and.rejectWith(...)` → B.

### `detectChanges()` explícito, obligatorio

El bloque de error es TEMPLATE. La Decision 052 documentó que
`editar-producto.component.spec.ts` nunca llamaba `fixture.detectChanges()` y
por eso un toggle ausente pasó desapercibido durante toda la vida del proyecto.
Los tests de template de esta feature lo llaman explícitamente (criterio
Decision 022).

### Un RED válido

Un RED debe fallar por la ASERCIÓN, no por error de compilación ni de TestBed.
Con flags que aún no existen, el archivo no compila y el RED sería inválido.
Por eso el tasks.md declara los flags y el método vacío ANTES de escribir los
tests, y sólo después escribe la lógica.

## 3. Fases y gates

| Fase | Contenido | Gate |
| --- | --- | --- |
| **0** | Commit de documentación: spec, plan, tasks | árbol limpio. Sin código |
| **1** | Andamiaje: flags + `reintentarCarga()` vacío | 280 SUCCESS |
| **2** | RED de lógica (AC-01, AC-02, AC-07) | fallan por ASERCIÓN |
| **3** | GREEN de lógica; `catch` de `:143` eliminado | `TOTAL: N SUCCESS` |
| **4** | RED de template (AC-03 a AC-06) | fallan por ASERCIÓN |
| **5** | GREEN de template: HTML + SCSS | `TOTAL: N SUCCESS` |
| **6** | Gate completo + grep de seguridad | sin ocurrencias NUEVAS |
| **7** | Device test en Android Pixel_8 | ver sección 4 |
| **8** | Decision 056 + PROJECT_CONTEXT sync | documentado |
| **9** | Merge a `main` con `--no-ff` | verde en main |

Comandos: build `npm run build`; tests
`npm test -- --watch=false --browsers=ChromeHeadless`.

## 4. Device test — CÓMO se provoca el fallo (PREGUNTA ABIERTA)

El escenario real (archivos cifrados en iOS) NO se provoca a voluntad en el
emulador Android. Tres caminos, a decidir con Diego antes de la fase 7:

1. **Build temporal con un `throw` inyectado** en `obtenerClientes`, sólo para
   ver el bloque en device, revertido antes del commit. El más directo y el más
   fácil de olvidar revertir: exige `git diff` explícito antes de commitear.
2. **Reproducir el caso iOS real** en el simulador: app a segundo plano,
   teléfono bloqueado, volver. Es el escenario auténtico, pero iOS depende del
   certificado gratuito de Apple, que expira a los 7 días — y hoy iOS está
   BLOQUEADO por UIScene (rama `035-ios-uiscene`, sin migrar).
3. **Aceptar verificación sólo del camino feliz en device** y documentar que la
   rama de error se probó sólo con la suite. Honesta pero débil: no cumple el
   espíritu de la Decision 052.

Recomendación del supervisor: **camino 1**, con el revert verificado por
`git diff` vacío antes del commit de la fase 6.

Antes de cada device test: `npm run build` + `npx cap sync` + `npx cap run`
(Decision 053: `cap sync` NO instala; `cap run` pide el dispositivo de forma
interactiva y muere si se le pone una tubería — usar `--target` y nunca
redirigir su salida). Verificar el bundle fresco con un string literal que sólo
exista en el código NUEVO — por ejemplo `Desbloquea el telefono` — y contra
`android/app/src/main/assets/public/*.js`, no sólo contra `www/`.

**NG8103:** no aplica, porque no se crea componente standalone nuevo (D-7).
Correr `npm run build | grep -c "NG8103"` igual: cuesta nada y confirma el 0.

## 5. Lo que este plan NO hace

- No toca `DatabaseService` ni el schema.
- No arregla las otras nueve pantallas.
- No clasifica la causa del error (D-4 sigue abierto).
- No agrega reintento automático ni telemetría.
