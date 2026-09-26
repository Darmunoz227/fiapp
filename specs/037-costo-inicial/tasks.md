# Tasks - Feature 037

T001 crear rama 037-costo-inicial desde main
T002 commitear spec, plan y tasks ANTES de codigo
T003 andamiaje: firma de resolverCostoPromedio devolviendo costoPromedioActual
T004 verificar con grep -n "^describe(" donde entra el describe nuevo
T005 RED AC-04: AJUSTE con costo reemplaza (afirmar 4000, NO 3750)
T006 RED AC-03: AJUSTE sin costo no toca el costo
T007 RED AC-05: regresion, COMPRA sigue ponderando
T008 verificar la salida REAL del RED: "Expected X to be Y" en los tres
T009 GREEN de resolverCostoPromedio
T010 cablear crearMovimientoInterno a resolverCostoPromedio
T011 RED del alta con costo (anclado a argumentos reales)
T012 GREEN del alta: campo de costo opcional en inventory-list
T013 el AJUSTE inicial de la Feature 036 pasa a llevar el costo declarado
T014 modal: etiqueta dinamica por tipo (COMPRA / MERMA)
T015 modal: nota viva con el stock resultante
T016 modal: campo de costo opcional en AJUSTE
T017 modal: nota de reemplazo solo si costo previo mayor que 0
T018 historial: mostrar el costo en un AJUSTE que lo lleve
T019 gate npm test
T020 gate npm run build con EXIT CODE explicito y NG8103 en 0
T021 verificar bundle con cadena nueva ANTES del emulador
T022 device test AC-01: alta con costo
T023 device test AC-02: alta sin costo (la 036 intacta)
T024 device test AC-04: AJUSTE de correccion sobre producto heredado
T025 device test AC-05: COMPRA posterior con promedio ponderado
T026 exportar respaldo JSON y validar los cuatro casos por artefacto
T027 AC-09: git diff vacio en migraciones
T028 Decision 059
T029 sync docs/PROJECT_CONTEXT.md
T030 sync backlog en PROMPT_SUPERVISOR_FIAPP.md
T031 merge --no-ff a main
T032 gate sobre main
T033 push a origin-privado
