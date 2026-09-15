# Plan - Feature 032 Gastos y punto de equilibrio

## Estrategia
Schema v9 con dos tablas NUEVAS, sin rebuild ni migracion de tablas
existentes. Orden: modelo de datos -> logica pura (normalizacion de
frecuencia y punto de equilibrio) -> capa BD -> UI de registro -> UI de
plantillas -> auditoria de las operaciones que enumeran tablas -> device.

## Schema v9
- SCHEMA_VERSION: 8 -> 9.
- crearTablasSiFaltan: gastos_recurrentes y gastos (CREATE TABLE IF NOT
  EXISTS + indice por fecha). Llamar desde AMBOS caminos: instalacion
  nueva Y migrarEsquemaSiNecesario (idempotente).
- Rama web: mockWebGastos y mockWebGastosRecurrentes.
- SIN FK con CASCADE en recurrente_id: borrar una plantilla no debe
  arrastrar los gastos pagados.

## Logica pura (core/gastos/)
- normalizarAMensual(valor, frecuencia): DIARIO x30, SEMANAL x4.33,
  QUINCENAL x2, MENSUAL x1, ANUAL /12.
- calcularFijosMensuales(recurrentes): suma solo activos con tipo FIJO,
  normalizados.
- calcularMargenPromedio(totalVendido, gananciaTotal): 0 si no hay
  ventas, nunca NaN ni Infinity.
- calcularPuntoEquilibrio(fijosMensuales, margen): devuelve
  { calculable: boolean, ventaNecesaria: number }. Sin margen no es
  calculable; NUNCA se inventa un numero.
- calcularTotalGastos(gastos): suma simple, reusa filtrarPorRangoFecha.

## Capa de datos
crearGasto, obtenerGastos, crearGastoRecurrente, obtenerGastosRecurrentes,
desactivarGastoRecurrente. Espejo del patron de crearProducto: INSERT que
nombra TODAS las columnas (Decision 048), createdAt con la misma variable
en ambas ramas.

## Auditoria obligatoria de tablas nuevas (leccion Decision 052)
Antes de cerrar la feature, revisar TODA operacion que enumera tablas:
1. ejecutarEnTransaccion: snapshot y restore de los 2 mocks nuevos.
2. resetInventario: NO debe tocar gastos (un gasto no es inventario).
   Verificar explicitamente que NO se agregan.
3. respaldo: RespaldoData, builder, lectores crudos, validador TABLAS.
4. reemplazarTodo: DELETE e INSERT de las 2 tablas + conteo.
Cada punto con su test. No esperar a device para descubrirlos.

## Capa UI
1. Registrar gasto: formulario corto (categoria, valor, fecha por defecto
   hoy, tipo, observacion opcional). Debe sentirse rapido.
2. Lista de gastos del mes con total arriba.
3. Plantillas recurrentes: crear, listar, desactivar, y el boton
   "Registrar el pago de este mes" que precarga y exige confirmacion.
4. Punto de equilibrio: bajo demanda, mostrando las dos cifras de origen.

## Gates
- Suite verde antes de cada commit.
- grep de seguridad limpio (salvo los 4 as any preexistentes).
- Verificacion en device con bundle fresco confirmado por STRING LITERAL,
  y cap run con --target y sin tuberia (Decision 053).
