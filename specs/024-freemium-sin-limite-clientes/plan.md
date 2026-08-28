# Plan - Feature 024

## Cambios en freemium.service.ts

### Parte A - constantes y obtenerEstado()
- Eliminar: private readonly LIMITE_CLIENTES = 7;
- Cambiar: private readonly LIMITE_DIAS = 20; -> = 25;
- En obtenerEstado(): eliminar bloqueadoPorClientes y la llamada a
  this.dbService.contarClientes(). El unico criterio de bloqueo pasa a ser
  bloqueadoPorTiempo (diasDesdeInstalacion > LIMITE_DIAS).
- El tipo EstadoFreemium.motivo cambia de
  'clientes' | 'tiempo' | 'ninguno' a 'tiempo' | 'ninguno'.
- totalClientes se mantiene en el shape de EstadoFreemium por compatibilidad
  minima de tipo, pero ya no se usa para decidir bloqueo.
- DatabaseService.contarClientes() NO se toca (usado en otras partes).

### Parte B - recordatorios de compromiso

Nuevas constantes:
private readonly DIAS_RECORDATORIO = [8, 17];

Nuevo metodo en PreferencesService (mismo patron que trial_bloqueado):
KEY_ULTIMO_DIA_RECORDATORIO = 'ultimo_dia_recordatorio_mostrado'
getUltimoDiaRecordatorioMostrado(): Promise con fecha ISO (solo dia) o null
setUltimoDiaRecordatorioMostrado(fechaIso: string): Promise void

Se guarda la FECHA CALENDARIO (no el numero de dia del trial) en que se
mostro el ULTIMO recordatorio, para la regla de maximo una vez por dia
calendario. Se compara contra la fecha de HOY en formato YYYY-MM-DD.

Nuevo metodo en FreemiumService:
async verificarRecordatorioCompromiso(): Promise<void>

Logica:
1. Si tieneLicenciaPremium() -> return (AC-08).
2. Si getTrialBloqueado() -> return (AC-08).
3. dias = calcularDiasDesdeInstalacion().
4. Si dias no esta en DIAS_RECORDATORIO -> return (solo dispara en 8 y 17
   exactos, no en cualquier dia >= 8, para no repetir el mensaje cada dia
   entre el 8 y el 17).
5. hoy = fecha calendario actual (YYYY-MM-DD).
6. ultimoMostrado = getUltimoDiaRecordatorioMostrado().
7. Si ultimoMostrado === hoy -> return (AC-07, ya se mostro hoy).
8. Mostrar el Alert de compromiso (no bloqueante, sin relacion con
   mostrarAlertaBloqueo). Botones: Cerrar (cancel) / Escribirle a Diego
   (reusa contactarADiego()).
9. Persistir setUltimoDiaRecordatorioMostrado(hoy).

Punto de entrada: se llama desde app.component.ts, DESPUES de
inicializarEstadoFreemium(), sin bloquear el arranque.

## Por que dia exacto (8 y 17) y no rango
Si se disparara en CUALQUIER dia >= 8 mientras no se haya mostrado ese dia
calendario, el recordatorio aparaceria TODOS los dias desde el 8 en
adelante la primera vez que se abra la app cada dia, lo cual contradice
"solo 2 recordatorios en esta version". Fijar dias exactos (8 y 17) hace
que la ventana de aparicion sea de un unico dia calendario cada vez.

## Riesgo: reloj del dispositivo
Igual que ensureFechaInstalacion ya asume el reloj del dispositivo como
fuente de tiempo, este feature hereda la misma asuncion. Fuera de alcance
corregir desfases de reloj.

## Tests a ajustar en freemium.service.spec.ts
- Test 'trial expired': cambiar dias de 21 a 26 (por encima del nuevo
  limite de 25). Quitar el mock de contarClientes en 7 (ya no aplica).
- Test 'stays blocked...client count drops below limit': eliminar o
  reescribir; el escenario "menos clientes que el limite" ya no existe.
  Reemplazar por un test que confirme que un total alto de clientes
  (ej. 50) NO bloquea si los dias estan dentro del limite (AC-02).
- Test 'premium active': ajustar si referencia contarClientes.
- Tests NUEVOS para Parte B: verificarRecordatorioCompromiso en dia 8 SI
  dispara, dia 9 NO dispara si ya se vio hoy, dia distinto a 8/17 no
  dispara, con licencia premium no dispara, con trial bloqueado no dispara,
  segunda invocacion el mismo dia no repite el Alert.

## Pasos de ejecucion
T001 - RED: ajustar tests existentes de limite de clientes.
T002 - GREEN: Parte A. Quitar LIMITE_CLIENTES, subir LIMITE_DIAS a 25,
       simplificar obtenerEstado() y el tipo motivo.
T003 - RED: tests nuevos de verificarRecordatorioCompromiso (Parte B).
T004 - GREEN: metodos nuevos en PreferencesService + FreemiumService.
T005 - Cablear la llamada en app.component.ts.
T006 - Gate: suite completa verde.
T007 - Device test Android.
T008 - Decision 046 + PROJECT_CONTEXT sync.
T009 - Merge --no-ff a main.
