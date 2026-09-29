# Plan de Implementacion - Feature 040 (Reconstruido)

**Fase 1: Capa de Datos (Ejecutada)**
1. Definir el modelo `Proveedor`.
2. Crear `ProveedorRepository` implementando el CRUD basico.
3. Crear migracion en SQLite para la tabla `proveedores` y alterar la tabla `productos` añadiendo la columna `proveedor_id`.

**Fase 2: Capa de UI - Administracion (Ejecutada)**
1. Crear el componente Standalone `ProveedoresListPage`.
2. Mejorar la UX mostrando notas in-line en la lista, reduciendo clics.

**Fase 3: Asociacion con Inventario (Ejecutada)**
1. Inyectar logica de carga en el modal de edicion (`editar-producto.component.ts`) y la lista de creacion (`inventory-list.page.ts`).
2. Resolver inyeccion HTML del `ion-select` respetando la arquitectura de componentes Standalone.
3. Mostrar etiqueta y boton dinamico de WhatsApp en la vista de inventario.
