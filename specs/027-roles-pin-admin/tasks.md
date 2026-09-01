# Tasks - Feature 027 (PIN de administrador)

## Logica pura
- [ ] T001 - RED: pin.spec.ts con 5 casos de verificarPin (null->true,
      ''->true, coincide->true, coincide con espacios->true, no coincide->false).
      Confirmar fallo (funcion no existe).
- [ ] T002 - GREEN: implementar verificarPin en src/app/core/seguridad/pin.ts.
      Suite verde.

## Persistencia
- [ ] T003 - GREEN: PreferencesService KEY pin_administrador +
      getPinAdministrador/setPinAdministrador (patron try/catch existente).

## Servicio de seguridad
- [ ] T004 - GREEN: SeguridadService (nuevo) con ejecutarConPin(accion),
      tienePin(), configurarPin(nuevo), cambiarPin(actual, nuevo). Reusa el
      AlertController con input password estilo mostrarAlertaCodigoActivacion.

## Gates en las 3 acciones destructivas
- [ ] T005a - reiniciarInventario (configuraciones): envolver con ejecutarConPin.
- [ ] T005b - abrirEdicion (inventory-list): envolver con ejecutarConPin.
- [ ] T005c - anularMovimiento (inventory-movement): envolver con ejecutarConPin.
- [ ] T005d - Ajustar TestBed de los specs afectados si requieren
      SeguridadService inyectado. Suite verde sin debilitar aserciones.

## UI de configuracion del PIN
- [ ] T006 - Seccion Seguridad en configuraciones (establecer PIN si no hay,
      cambiar PIN exigiendo el actual si ya existe). Cargar tienePin en
      ionViewWillEnter.

## Cierre
- [ ] T007 - Gate: suite completa TOTAL SUCCESS.
- [ ] T008 - Device test Android: sin PIN las 3 acciones normales; configurar
      PIN; con PIN las 3 piden PIN (correcto procede, incorrecto cancela);
      duplicar NO pide PIN; cambiar PIN exige el actual.
- [ ] T009 - Decision 049 en docs/DECISIONS.md.
- [ ] T009b - Sincronizar docs/PROJECT_CONTEXT.md (Feature #27, 49 decisions).
- [ ] T010 - Commit final + Merge --no-ff a main + gate post-merge.
