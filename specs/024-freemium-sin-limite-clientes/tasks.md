# Tasks - Feature 024

## Parte A: eliminar limite de clientes
- [ ] T001 - RED: ajustar tests de freemium.service.spec.ts que dependian
      del limite de clientes. El test de "trial expired" debe usar dias=26
      (no 21) y ya no mockear contarClientes en 7. Agregar test nuevo:
      con contarClientes=50 y dias=10, puedeEscribir() debe ser true.
      Ejecutar la suite y confirmar que estos tests fallan con el codigo
      actual (que aun tiene LIMITE_CLIENTES=7 y LIMITE_DIAS=20).
- [ ] T002 - GREEN: en freemium.service.ts, eliminar LIMITE_CLIENTES,
      cambiar LIMITE_DIAS a 25, quitar bloqueadoPorClientes de
      obtenerEstado(), simplificar el tipo motivo a 'tiempo' | 'ninguno'.
      Re-ejecutar la suite: los tests de T001 pasan, cero regresiones.

## Parte B: recordatorios de compromiso
- [ ] T003 - RED: agregar tests nuevos en freemium.service.spec.ts para
      verificarRecordatorioCompromiso: dispara en dia 8, no dispara en dia
      9 si ya se vio hoy, no dispara en dia distinto a 8/17, no dispara con
      licencia premium, no dispara con trial bloqueado, no repite si se
      llama dos veces el mismo dia. Ejecutar y confirmar fallo (metodo no
      existe todavia).
- [ ] T004a - GREEN: agregar en PreferencesService la KEY
      ultimo_dia_recordatorio_mostrado con get/set, siguiendo el patron de
      trial_bloqueado.
- [ ] T004b - GREEN: agregar en FreemiumService las constantes
      DIAS_RECORDATORIO=[8,17] y el metodo verificarRecordatorioCompromiso
      con el mensaje de compromiso (sin la palabra feedback) y los botones
      Cerrar / Escribirle a Diego. Re-ejecutar la suite: tests de T003
      pasan, cero regresiones.
- [ ] T005 - Cablear la llamada a verificarRecordatorioCompromiso() en
      app.component.ts, despues de inicializarEstadoFreemium(), sin
      bloquear el arranque de la app.

## Cierre
- [ ] T006 - Gate: suite completa TOTAL SUCCESS.
- [ ] T007 - Device test Android: crear mas de 7 clientes y confirmar que
      la app NO bloquea (solo por tiempo); verificar que el recordatorio
      aparece en los dias esperados sin bloquear la interaccion y que no
      se repite el mismo dia.
- [ ] T008 - Redactar Decision 046 en docs/DECISIONS.md.
- [ ] T008b - Sincronizar docs/PROJECT_CONTEXT.md (Feature #24, 46 decisions).
- [ ] T009 - Commit final de codigo + docs.
- [ ] T010 - Merge --no-ff a main + gate post-merge.
