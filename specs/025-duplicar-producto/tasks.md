# Tasks - Feature 025 (Duplicar producto)

## Logica del componente
- [ ] T001 - RED: en editar-producto.component.spec.ts, ampliar dbMock para
      declarar 'crearProducto' (resolveTo). Escribir tests nuevos de modo
      duplicar:
      - modo 'duplicar' + guardar valido llama crearProducto (NO
        actualizarProducto) con costo_promedio 0 e id distinto de 'p1'.
      - copia tipo_venta del original ('UNIDAD').
      - respeta el precio editado (4200), no fuerza el original (3500).
      - freemium bloquea -> no llama crearProducto.
      Ejecutar suite y confirmar RED (no existe @Input modo ni la
      bifurcacion en guardar).
- [ ] T002 - GREEN: agregar @Input() modo con default 'editar' y bifurcar
      guardar(): editar hace actualizarProducto (como hoy); duplicar
      construye Producto nuevo (uuidv4, costo 0, tipo_venta del original)
      y llama crearProducto. Suite verde, sin regresiones en los tests
      existentes de modo editar.

## UI del modal
- [ ] T003 - GREEN: en el HTML del modal, titulo condicional "Duplicar
      producto" vs "Editar producto" segun modo. Foco al final del campo
      nombre en modo duplicar (cosmetico, simplificable si se complica).

## UI de la pagina y swipe
- [ ] T004a - GREEN: abrirDuplicado(producto) en inventory-list.page.ts
      (abre el modal con modo 'duplicar', recarga productos si guardado).
- [ ] T004b - GREEN: segunda ion-item-option "Duplicar" en el swipe de
      inventory-list.page.html, color distinto a Editar.

## Cierre
- [ ] T005 - Gate: suite completa TOTAL SUCCESS.
- [ ] T006 - Device test Android: swipe muestra Editar y Duplicar; duplicar
      abre modal titulado Duplicar con datos precargados; editar solo el
      nombre y guardar crea producto nuevo con costo 0; el original queda
      intacto; repetir varias tallas rapido; un precio editado se respeta.
- [ ] T007 - Redactar Decision 047 en docs/DECISIONS.md.
- [ ] T007b - Sincronizar docs/PROJECT_CONTEXT.md (Feature #25, 47 decisions).
- [ ] T008 - Commit final de codigo + docs.
- [ ] T009 - Merge --no-ff a main + gate post-merge.
