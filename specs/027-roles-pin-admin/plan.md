# Plan - Feature 027 (PIN de administrador)

## 1. Funcion pura: src/app/core/seguridad/pin.ts
export function verificarPin(ingresado, guardado): boolean
- guardado null o vacio -> true (sin PIN configurado, se permite).
- guardado con valor -> ingresado.trim() === guardado.trim().
Tests en pin.spec.ts (RED antes de GREEN):
- null guardado -> true con cualquier ingresado.
- '' guardado -> true (tratado como sin configurar).
- '1234' guardado, '1234' ingresado -> true.
- '1234' guardado, '1234 ' con espacios ingresado -> true (trim).
- '1234' guardado, '9999' ingresado -> false.

## 2. Preferences: pin_administrador
En PreferencesService, KEY nueva pin_administrador (string) con:
- getPinAdministrador(): Promise<string | null>
- setPinAdministrador(pin: string): Promise<void>
Mismo patron get/set con try/catch que las demas KEY.

## 3. SeguridadService (nuevo, inyectable)
src/app/core/seguridad/seguridad.service.ts
Depende de AlertController y PreferencesService.

Metodo central:
  async ejecutarConPin(accion: () => Promise<void> | void): Promise<void>
Logica:
1. pin = await prefs.getPinAdministrador().
2. Si verificarPin no aplica (pin null) -> ejecutar accion directamente y return.
   (equivale a: sin PIN configurado, no se pregunta nada.)
3. Si hay pin, mostrar AlertController con input password (mismo estilo que
   mostrarAlertaCodigoActivacion). En el handler:
   - si verificarPin(ingresado, pin) -> await accion().
   - si no -> mostrar alerta simple "PIN incorrecto", no ejecutar.

Metodos de configuracion del PIN (para Configuraciones):
  async tienePin(): Promise<boolean>  (pin != null)
  async configurarPin(nuevo: string): Promise<void>  (setPinAdministrador)
  async cambiarPin(actual, nuevo): Promise<boolean>
    - lee pin guardado, verificarPin(actual, guardado); si ok setea nuevo y
      devuelve true; si no, false.

## 4. Gates en las 3 pantallas destructivas
- configuraciones.page.ts reiniciarInventario: envolver el cuerpo actual con
  seguridad.ejecutarConPin(() => { ...flujo REINICIAR existente... }).
- inventory-list.page.ts abrirEdicion: envolver la apertura del modal con
  ejecutarConPin.
- inventory-movement.page.ts anularMovimiento: envolver el softDelete con
  ejecutarConPin.
En los tres casos, sin PIN configurado el comportamiento es identico al actual.

## 5. UI de Configuraciones - seccion Seguridad
Nueva seccion en configuraciones.page.html con:
- Si NO hay PIN: boton "Establecer PIN de administrador" -> alert con un input
  password (nuevo PIN) -> configurarPin.
- Si SI hay PIN: texto "PIN activo" + boton "Cambiar PIN" -> alert con dos
  inputs (PIN actual, PIN nuevo) -> cambiarPin; si actual incorrecto, avisa.
- Metodos en configuraciones.page.ts: establecerPin(), cambiarPinAdmin(),
  cargar el estado tienePin en ionViewWillEnter para mostrar el boton correcto.

## Tests (TDD)
- pin.spec.ts: los 5 casos de verificarPin (RED antes de GREEN).
- SeguridadService: como envuelve AlertController (IO), se prueba la logica
  pura (verificarPin) por separado; el servicio se valida por device test,
  igual que el resto de flujos con AlertController que el proyecto no testea
  unitariamente (mostrarAlertaBloqueo, mostrarAlertaCodigoActivacion).
- Los specs existentes de configuraciones/inventory que usan estas pantallas
  deben seguir verdes: al no haber PIN configurado en los mocks, ejecutarConPin
  ejecuta la accion directo, sin cambiar el comportamiento observado por los
  tests. Verificar y, si algun mock necesita el nuevo SeguridadService
  inyectado, agregarlo al TestBed (sin debilitar aserciones).

## Riesgos
- Medio: se tocan 3 pantallas sensibles. Mitigado porque el gate es un wrapper
  que, sin PIN, es transparente (ejecuta la accion tal cual).
- Atencion a los specs de las 3 pantallas: si inyectan servicios por
  constructor, habra que proveer SeguridadService en sus TestBed. Confirmar
  con RED que la suite sigue compilando tras inyectarlo.
- No romper el flujo de REINICIAR: el PIN se pide ANTES del alert de escribir
  REINICIAR, no en vez de. Son dos barreras encadenadas.

## Pasos de ejecucion
T001 - RED: pin.spec.ts con los 5 casos de verificarPin. Confirmar fallo.
T002 - GREEN: implementar verificarPin en core/seguridad/pin.ts. Suite verde.
T003 - GREEN: PreferencesService getPinAdministrador/setPinAdministrador.
T004 - GREEN: SeguridadService (ejecutarConPin, tienePin, configurarPin,
       cambiarPin) reusando el patron de AlertController existente.
T005 - GREEN: gate en las 3 pantallas (reiniciarInventario, abrirEdicion,
       anularMovimiento) via ejecutarConPin. Ajustar TestBed si hace falta.
T006 - GREEN: seccion Seguridad en Configuraciones (establecer/cambiar PIN).
T007 - Gate: suite completa TOTAL SUCCESS.
T008 - Device test Android (ver spec: sin PIN todo normal; configurar; con PIN
       las 3 piden PIN; duplicar no pide; cambiar PIN exige el actual).
T009 - Decision 049 + PROJECT_CONTEXT sync.
T010 - Merge --no-ff a main.
