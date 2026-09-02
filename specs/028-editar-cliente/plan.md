# Plan - Feature 028 Editar cliente

## Estrategia
Espejar el patron ya probado de editar-producto (Decision 038)
y crearCliente (Decision 048). Sin schema, sin migracion: las
columnas nombre, telefono y updated_at ya existen en la tabla.
Schema v7 permanece intacto.

## Capa de datos (database.service.ts)
Nuevo metodo actualizarCliente(cliente: Cliente): Promise<void>
- Rama web: buscar por id en mockWebClientes y reasignar nombre,
  telefono y updated_at = Date.now() (mantener el resto igual).
- Rama nativa: UPDATE clientes SET nombre=?, telefono=?,
  updated_at=? WHERE id=? AND deleted_at IS NULL, via ejecutarRun.
- NO tocar created_at, fecha_creacion, habeas_data_flag, store_id.

## Capa UI (NuevoClienteComponent)
Agregar @Input() modo: 'crear' | 'editar' (default 'crear') y
@Input() cliente?: Cliente para precargar en modo editar.
- ngOnInit: si modo === 'editar', precargar nombre y telefono.
- Titulo dinamico: "Editar cliente" vs "Nuevo cliente".
- guardar(): en 'editar' llama actualizarCliente sobre el mismo
  id; en 'crear' mantiene crearCliente sin cambios.
- Gate: puedeEscribir antes de persistir (Decision 033).

## Capa Home (home.page.html / home.page.ts)
- Agregar segunda ion-item-option "Editar" (color primary) en el
  ion-item-options existente, junto a Eliminar (danger).
- (click)="abrirModalEditarCliente(cliente)".
- home.page.ts: nuevo metodo que abre el modal con
  componentProps { modo: 'editar', cliente }, y recarga la lista
  al cerrar (patron del modal de nuevo cliente ya existente).

## Pruebas (TDD, RED antes de GREEN)
1. actualizarCliente actualiza nombre/telefono del mismo id y
   setea updated_at (rama web, mockWebClientes).
2. actualizarCliente NO altera created_at ni fecha_creacion.
3. modo 'editar' precarga nombre y telefono del cliente.
4. modo 'editar' llama actualizarCliente, NO crearCliente.
5. telefono vacio '' se puede actualizar a un valor real.
Handlers de ModalController y puedeEscribir siguen la convencion
del proyecto (no test unitario del AlertController).

## Riesgos y gates
- Freemium: guardar bloqueado con trial expirado (verificar en
  device, no solo en suite web).
- Device test Android Pixel_8: editar un cliente real, confirmar
  via respaldo JSON que updated_at trae timestamp y created_at
  quedo intacto (patron de evidencia Decision 038/048).
- SIN cambios en schema ni SCHEMA_VERSION (confirmar con git diff
  vacio en la constante de version).
