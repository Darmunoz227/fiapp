# Tasks - Feature 028 Editar cliente

## Fase 1: Capa de datos (RED -> GREEN)
- T001 [RED] Test: actualizarCliente actualiza nombre y telefono
  del mismo id y setea updated_at (rama web mockWebClientes).
- T002 [RED] Test: actualizarCliente NO altera created_at ni
  fecha_creacion del cliente.
- T003 [GREEN] Implementar actualizarCliente en database.service.ts
  (rama web + rama nativa UPDATE ... WHERE id AND deleted_at IS NULL).
- T004 [GATE] npm test -- --watch=false; confirmar TOTAL verde.

## Fase 2: Capa UI del modal (RED -> GREEN)
- T005 [RED] Test: modo 'editar' precarga nombre y telefono desde
  @Input() cliente en ngOnInit.
- T006 [RED] Test: en modo 'editar', guardar() llama
  actualizarCliente y NO crearCliente.
- T007 [RED] Test: telefono '' se actualiza a un valor real.
- T008 [GREEN] Implementar @Input() modo y cliente, titulo
  dinamico, y bifurcacion crear/editar en guardar().
- T009 [GATE] npm test -- --watch=false; confirmar TOTAL verde.

## Fase 3: Capa Home (cableado UI)
- T010 Agregar ion-item-option "Editar" (primary) junto a
  Eliminar en el ion-item-sliding de home.page.html.
- T011 Implementar abrirModalEditarCliente(cliente) en
  home.page.ts con componentProps { modo:'editar', cliente } y
  recarga de lista al cerrar (patron del modal existente).
- T012 [GATE] npm test -- --watch=false; confirmar TOTAL verde.

## Fase 4: Verificacion en dispositivo
- T013 Rebuild real: ng build + npx cap sync android + cap run.
  Confirmar www/main.js fresco (ls -la + grep del codigo nuevo)
  antes de asumir cualquier bug (leccion Decision 046/048).
- T014 [DEVICE] Editar un cliente real en Pixel_8: nombre y
  telefono cambian; respaldo JSON confirma updated_at con
  timestamp y created_at/fecha_creacion intactos.
- T015 [DEVICE] Con trial expirado, guardar es bloqueado.
- T016 Completar telefono vacio '' a numero real en device.

## Fase 5: Cierre
- T017 Actualizar docs/DECISIONS.md (Decision 050) y
  docs/PROJECT_CONTEXT.md (Feature #28 DONE).
- T018 Merge a main con --no-ff tras verificar suite verde en
  la rama y arbol limpio.

## Definicion de terminado
- 5 tests nuevos verdes (2 datos + 3 UI), suite total verde.
- Device test Pixel_8 aprobado con evidencia de respaldo JSON.
- Sin cambios de schema ni SCHEMA_VERSION (git diff vacio).
