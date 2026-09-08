# Tasks - Feature 032 Gastos y punto de equilibrio

## Fase 1: Schema v9 (sin rebuild)
- T001 Modelos Gasto y GastoRecurrente (interfaces TS) + tipos
  TipoGasto y FrecuenciaGasto.
- T002 SCHEMA_VERSION 8 -> 9.
- T003 crearTablasSiFaltan: gastos_recurrentes y gastos (CREATE TABLE IF
  NOT EXISTS + indice por fecha), en AMBOS caminos. SIN CASCADE en
  recurrente_id.
- T004 Rama web: mockWebGastos y mockWebGastosRecurrentes.
- T005 [GATE] npm test; suite verde sin tests nuevos aun.

## Fase 2: Logica pura (RED -> GREEN, core/gastos/)
- T006 [RED] normalizarAMensual: las 5 frecuencias.
- T007 [GREEN] Implementar.
- T008 [RED] calcularFijosMensuales: suma solo activos con tipo FIJO,
  normalizados; ignora VARIABLE e inactivos.
- T009 [GREEN] Implementar.
- T010 [RED] calcularMargenPromedio: 0 sin ventas, nunca NaN.
- T011 [RED] calcularPuntoEquilibrio: calculable false sin margen, sin
  dividir por cero.
- T012 [GREEN] Implementar ambas.
- T013 [GATE] npm test.

## Fase 3: Capa de datos
- T014 [RED] crearGasto persiste con recurrente_id null (AC-01).
- T015 [RED] crearGastoRecurrente NO crea ningun gasto (AC-02).
- T016 [RED] desactivar plantilla no borra gastos registrados (AC-05).
- T017 [GREEN] crearGasto, obtenerGastos, crearGastoRecurrente,
  obtenerGastosRecurrentes, desactivarGastoRecurrente. INSERT que nombra
  TODAS las columnas (Decision 048).
- T018 [GATE] npm test.

## Fase 4: Auditoria de tablas nuevas (leccion Decision 052)
- T019 [RED] ejecutarEnTransaccion snapshotea los 2 mocks nuevos.
- T020 [RED] resetInventario NO borra gastos (un gasto no es inventario).
- T021 [RED] respaldo incluye y restaura las 2 tablas (AC-10).
- T022 [GREEN] Modelo, builder, lectores crudos, validador TABLAS,
  reemplazarTodo y ConteoImportacion.
- T023 [GATE] npm test.

## Fase 5: UI
- T024 Pantalla registrar gasto (formulario corto, fecha por defecto hoy).
- T025 Lista de gastos del mes con total (reusa filtrarPorRangoFecha con
  el rango MES nuevo).
- T026 Plantillas recurrentes: crear, listar, desactivar.
- T027 Boton "Registrar el pago de este mes": precarga, editable, exige
  confirmacion (AC-03, AC-04).
- T028 Punto de equilibrio bajo demanda, mostrando las cifras de origen.
- T029 [GATE] npm test + grep de seguridad.

## ESTADO AL 2026-09-08 (retomar aqui)
Fases 1 a 5 COMPLETAS en la rama 032-gastos. 274 tests verdes, arbol
limpio. La rama ya tiene main mergeado (Feature 033 y Decision 054).
PENDIENTE: Fase 6 (device) y Fase 7 (cierre).
Prototipo visual acordado: output/prototipo-gastos-fiapp.html
La UI se simplifico a UNA pantalla /gastos con tres secciones (punto de
equilibrio, plantillas, gastos del mes) + captura via AlertController,
en vez de las 4 pantallas del prototipo.

## Fase 6: Device
- T030 Rebuild + cap sync + cap run --target, sin tuberia. Confirmar
  bundle con STRING LITERAL nuevo (Decision 053).
- T031 [DEVICE][REGRESION] Un merchant sin gastos no ve UI nueva en sus
  flujos actuales (AC-09).
- T032 [DEVICE] Registrar un gasto suelto y verlo en la lista del mes.
- T033 [DEVICE] Crear plantilla de arriendo; confirmar que NO aparece
  ningun gasto hasta confirmar el pago.
- T034 [DEVICE] Punto de equilibrio con datos reales.
- T035 [DEVICE] Exportar, reiniciar inventario, importar: los gastos
  sobreviven al reinicio y vuelven en el respaldo (AC-10).

## Fase 7: Cierre
- T036 Decision 054 + PROJECT_CONTEXT + PROMPT_SUPERVISOR.
- T037 Merge a main con --no-ff.

## Definicion de terminado
- Los 10 AC del spec verificados.
- Ningun test viejo debilitado (Decision 036).
- Las 4 operaciones que enumeran tablas auditadas ANTES de device.
