# Tasks - Feature 031 Respaldo completo y restaurable

## Fase 1: Parte A - Compatibilidad de versiones
- T001 [RED] Test: respaldo v7 sin producciones/produccion_items se
  acepta y ambas llegan como arreglos vacios.
- T002 [RED] Test: version mayor a SCHEMA_VERSION rechaza
  VERSION_INCOMPATIBLE.
- T003 [RED] Test: version menor a 7 rechaza VERSION_INCOMPATIBLE.
- T004 [GREEN] respaldo-validator: constante MINIMA, comparacion por
  rango, relleno de tablas ausentes.
- T005 [GATE] npm test; suite verde, tests viejos del validador intactos.

## Fase 2: Parte B - Config de negocio
- T006 Modelo RespaldoConfig + config opcional en Respaldo.
- T007 [RED] Test: construirRespaldo embebe config cuando se le pasa.
- T008 [RED] Test: construirRespaldo NO emite config cuando no se pasa.
- T009 [GREEN] construirRespaldo con tercer parametro opcional.
- T010 [RED] Test: validarRespaldo devuelve config si existe, undefined
  si falta, sin rechazar el respaldo.
- T011 [GREEN] validarRespaldo expone config.
- T012 [GATE] npm test; suite verde.

## Fase 3: Integracion en Configuraciones
- T013 Exportar: armar config con catalogo y nombre de negocio.
- T014 Importar: restaurar catalogo y nombre SOLO si vienen con
  contenido; vacio o ausente no borra lo existente.
- T015 [GATE] npm test + grep de seguridad: confirmar que pin, licencia
  y fechas NO aparecen en el armado de config.

## Fase 4: Verificacion en dispositivo (smoke)
- T016 Rebuild real + cap sync; confirmar bundle fresco con strings
  literales (Decision 052).
- T017 [DEVICE] Exportar y abrir el JSON: config presente con catalogo y
  nombre; SIN pin, SIN licencia, SIN fecha_instalacion.
- T018 [DEVICE] Reiniciar inventario, importar y confirmar que el
  catalogo de fiado vuelve.
- T019 [DEVICE][REGRESION] Importar un respaldo v8 sin config: se acepta
  y el catalogo actual NO se borra.

## Fase 5: Cierre
- T020 Decision 053 + PROJECT_CONTEXT + PROMPT_SUPERVISOR (backlog).
- T021 Merge a main con --no-ff.

## Definicion de terminado
- Los 9 AC del spec verificados.
- Ningun test viejo debilitado (Decision 036).
- grep confirma que ninguna clave sensible viaja en el respaldo.
