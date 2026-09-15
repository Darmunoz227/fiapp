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

## ESTADO AL 2026-09-11 (retomar aqui)
Fases 1 a 5 COMPLETAS en la rama 032-gastos. 274 tests verdes, arbol
limpio. La rama ya tiene main mergeado (Feature 033 y Decision 054).
DEVICE 2026-09-08/11: T030 T032 T033 T034 T035 PASADAS con evidencia.
T034 dio los 4 numeros predichos (2.250.000 mes / 75.000 dia / 900.000
fijos / 40% margen). T031 pendiente de revisar Reportes con 0 gastos.
Dos fixes commiteados: contexto transaccional en crearGasto (Dec 028) y
el resumen de importacion que omitia 4 tablas (patron Dec 052).
PENDIENTE: Fase 5-bis (UI), cerrar T031, y Fase 7.
Prototipo visual acordado: output/prototipo-gastos-fiapp.html
La UI se simplifico a UNA pantalla /gastos con tres secciones (punto de
equilibrio, plantillas, gastos del mes) + captura via AlertController,
en vez de las 4 pantallas del prototipo.

## Fase 5-bis: UI acordada sobre prototipo (Decision 055)
Prototipo: output/prototipo-gastos-captura-fiapp.html, acordado
2026-09-11. Chips Opcion A, explicacion Pareja 1, mensajes T-1 y T-4.
NOTA: el spec ya pedia "chip de categoria" y "el merchant puede
cambiarlo"; T040 y T041 corrigen una DESVIACION, no son diseno nuevo.

- T038 [RED] Extraer yaPagadoEsteMes a core/gastos/ con su test. Es la
  UNICA task de esta fase que la suite puede probar.
- T039 [D-6] RegistrarGastoComponent: modal propio que reemplaza al
  AlertController. Un alert no admite chips ni mezcla radios con texto.
- T040 [D-1] Chips de categoria desde CATEGORIAS_GASTO, sin texto libre.
- T041 [D-2] Tipo visible, precargado por sugerirTipoGasto y EDITABLE.
- T042 [D-3] Linea que redirige a Inventario (AC-07d, segunda mitad).

- T043 [D-8] Selector de fecha; hoy queda siempre "ahora".
- T044 [D-4] Modal de plantilla: categoria, las 5 frecuencias y tipo.
  Hoy frecuencia esta hardcodeada MENSUAL y 4 de 5 son inalcanzables.
- T045 [D-5] Desactivar plantilla con confirmacion (AC-05). La funcion
  ya existe en la BD y esta testeada; no tiene camino en la UI.
- T046 [D-9] Confirmacion con cifra util al guardar (AC-11).
- T047 Area segura inferior en gastos y ventas (AC-12). NO se prototipa:
  env(safe-area-inset-bottom) vale 0 en navegador; el defecto solo
  existe en device. Es recorte fisico, sin decision de producto adentro.
- T048 [D-10] Quitar color="primary" del toolbar de gastos: es pantalla
  interna, y la Decision 029 reservo el color de marca para el Home.
- T049 [GATE] npm test + grep de seguridad.

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
- T036 Decision 055 + PROJECT_CONTEXT + PROMPT_SUPERVISOR. OJO: la
  054 es "Inicio legible" y ya esta en main; gastos es la 055.
- T037 Merge a main con --no-ff.

## Definicion de terminado
- Los 10 AC del spec verificados.
- Ningun test viejo debilitado (Decision 036).
- Las 4 operaciones que enumeran tablas auditadas ANTES de device.
