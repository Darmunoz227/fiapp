# Plan - Feature 025 (Duplicar producto)

## Cambios en EditarProductoComponent

### Nuevo input de modo
- Agregar: @Input() modo: 'editar' | 'duplicar' = 'editar';
- El default 'editar' preserva el comportamiento actual sin tocar a los
  llamadores existentes (abrirEdicion no pasa modo, asi que usa 'editar').

### ngOnInit
- Sin cambios en la precarga de nombre/precio/minimo_stock (sirve para
  ambos modos: en duplicar tambien queremos los valores del original).
- En modo 'duplicar', ademas, colocar el foco al final del campo nombre
  (se implementa en la vista/afterViewInit o via un metodo del input;
  detalle fino de UX, no bloquea la logica).

### guardar() - bifurcacion por modo
Tras las validaciones existentes (nombre no vacio, precio > 0, stock >= 0)
y el guard freemium (sin cambios), bifurcar:
- modo 'editar' (actual): await actualizarProducto(this.producto.id,
  nombre, precioVenta, minimoStock); dismiss({ guardado: true }).
- modo 'duplicar' (nuevo): construir un Producto nuevo:
    id: uuidv4()
    nombre: nombre (editado)
    precio_venta: precioVenta (editado)
    tipo_venta: this.producto.tipo_venta (copiado del original)
    minimo_stock: minimoStock (editado)
    costo_promedio: 0 (NUNCA copiado)
  await crearProducto(nuevo); dismiss({ guardado: true }).

### Titulo del modal
- El HTML del modal muestra "Duplicar producto" cuando modo === 'duplicar',
  y "Editar producto" cuando modo === 'editar' (ya sea con *ngIf o binding).

## Cambios en inventory-list.page.ts
- Nuevo metodo abrirDuplicado(producto: Producto): abre el mismo modal
  EditarProductoComponent con componentProps: { producto, modo: 'duplicar' }.
  Tras onWillDismiss, si data?.guardado, recargar productos (igual patron
  que abrirEdicion).

## Cambios en inventory-list.page.html
- Dentro del ion-item-options existente (side="end"), agregar una segunda
  ion-item-option "Duplicar" con color distinto a "Editar" (ej. secondary o
  tertiary), que llama (click)="abrirDuplicado(producto)".

## Tests (TDD, RED antes de GREEN)
En editar-producto.component.spec.ts:
- Ampliar el mock: dbMock debe declarar tambien 'crearProducto' y resolverTo.
- RED nuevos tests:
  1. modo 'duplicar' + guardar valido -> llama crearProducto (NO
     actualizarProducto), con costo_promedio 0 y un id distinto de 'p1'.
  2. modo 'duplicar' -> el producto creado copia tipo_venta del original
     ('UNIDAD').
  3. modo 'duplicar' -> respeta el precio editado (ej. 4200), no fuerza el
     del original (3500).
  4. modo 'duplicar' + freemium bloquea -> no llama crearProducto.
  5. modo 'editar' (default) sigue llamando actualizarProducto como hoy
     (test de no-regresion; los tests existentes ya cubren esto, verificar
     que siguen verdes).
- Nota: como id es uuid dinamico, el test verifica crearProducto llamado
  con jasmine.objectContaining({ nombre, precio_venta, tipo_venta,
  minimo_stock, costo_promedio: 0 }) y que el id NO sea 'p1'.

## Riesgos
- Bajo en datos: reusa crearProducto ya probado, sin schema, sin migracion.
- Regresion del modo editar: mitigada porque 'editar' es el default y los
  tests existentes de actualizarProducto deben seguir verdes sin cambios.
- UX del foco al final del nombre: es cosmetico; si el manejo del cursor se
  complica en el modal, se puede simplificar a solo pre-llenar sin forzar
  posicion, sin bloquear el feature.

## Pasos de ejecucion
T001 - RED: ampliar mock con crearProducto y escribir los tests nuevos de
       modo duplicar. Confirmar que fallan (el @Input modo y la bifurcacion
       no existen).
T002 - GREEN: agregar @Input modo y la bifurcacion en guardar(). Suite verde.
T003 - GREEN: titulo del modal segun modo (HTML) + foco al final del nombre.
T004 - GREEN: abrirDuplicado en la pagina + segunda opcion de swipe en HTML.
T005 - Gate: suite completa TOTAL SUCCESS.
T006 - Device test Android (duplicar, editar nombre, guardar, original
       intacto, costo 0, precio editable, varias tallas rapido).
T007 - Decision 047 + PROJECT_CONTEXT sync.
T008 - Merge --no-ff a main.
