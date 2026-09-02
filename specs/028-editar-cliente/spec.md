# Feature 028 - Editar cliente (nombre + telefono)

## Contexto
El merchant ambulante fia a clientes cuyo telefono no siempre
tiene al momento de crearlos; los completa de a poco. Hoy no
existe forma de editar un cliente: la unica via es eliminarlo
(bloqueada si deudaTotal > 0, Decision 007) o saldar la deuda.
Friccion severa sobre el flujo estrella de fiados.

## Evidencia del codigo actual
- database.service.ts NO tiene actualizarCliente/editarCliente;
  los unicos UPDATE clientes son soft-delete (1020) y restore (1033).
- crearCliente (445) tiene rama web (mockWebClientes) y nativa
  (INSERT + ejecutarRun), createdAt calculado una vez (Decision 048).
- Cliente.telefono es string REQUERIDO (puede quedar '' vacio).
- Home ya tiene ion-item-sliding sobre clientes con una sola
  opcion Eliminar (danger). Modal nuevo-cliente en shared/modals.

## Alcance
Editar SOLO nombre y telefono de un cliente existente.
- Entrada: swipe -> nueva opcion "Editar" (color primary) junto
  a "Eliminar" en el ion-item-sliding de Home (espejo Feature #25).
- Reuso: NuevoClienteComponent con @Input() modo: 'crear'|'editar'
  (espejo de editar-producto, Decision 038).
- DB: nuevo actualizarCliente que hace UPDATE de nombre, telefono
  y updated_at (primer codigo que escribe updated_at en clientes).

## Reglas de negocio
- nombre: requerido, no vacio (misma validacion que crear).
- telefono: OPCIONAL, se permite pasar de '' a un numero real;
  no se obliga (el merchant los completa paulatinamente).
- habeas_data_flag NO es editable en esta feature.
- created_at/fecha_creacion NO se tocan; updated_at = Date.now().
- Gate freemium: puedeEscribir bloquea el GUARDADO (Decision 033).
- SIN PIN: editar nombre/telefono no es destructivo (a diferencia
  de editar-producto en Decision 049); NO se gatea con PIN.

## Fuera de alcance
- Importar contactos del telefono (spike futuro).
- Editar habeas_data_flag, store_id, created_by.
- Migracion de clientes historicos (updated_at queda null hasta
  que se editen; solo los editados reciben timestamp).

## Criterios de aceptacion
- AC-01: swipe muestra Editar y Eliminar; Editar abre el modal
  titulado "Editar cliente" precargado con nombre y telefono.
- AC-02: guardar actualiza nombre y telefono del MISMO id, sin
  crear un cliente nuevo, y setea updated_at con timestamp fresco.
- AC-03: created_at y fecha_creacion permanecen sin cambios.
- AC-04: con trial expirado, guardar es bloqueado por puedeEscribir.
- AC-05: se puede completar un telefono vacio ('') a uno real.
