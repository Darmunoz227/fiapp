# Feature 025 - Duplicar producto en Inventario

## Origen del insight
Piloto de campo, merchant de tienda de ropa deportiva (audio WhatsApp).
Maneja articulos con multiples variantes de talla y color (ej. Buzo Hombre
en 12 referencias: 3 tallas x 2 colores x variantes). Crear cada variante
significa reescribir manualmente TODOS los campos del formulario (nombre,
precio, tipo de venta, stock minimo), cambiando solo una palabra del
nombre (la talla o el color). La friccion fue tan alta que empezo a llevar
el inventario en cuaderno primero y transcribir despues, mismo patron de
"batch, no uno por uno" ya visto en otros pilotos.

Confirmado con Diego: la segunda merchant de ropa (no deportiva) tiene el
MISMO problema y por eso aun no ha completado su inventario en la app.
Prioridad alta: 2 de 3 merchants bloqueados por esta friccion.

## Insight fundamental
El problema no es la velocidad del formulario en si. El problema es que
crear una variante de un producto ya existente obliga a reescribir datos
que NO cambian (precio, tipo de venta, stock minimo) para variar solo un
dato que SI cambia (una palabra en el nombre, y a veces el precio en
tallas extremas con descuento). La app deberia recordar "esto ya lo
definiste, solo cambia lo que es distinto".

## Decision de alcance: Fase 1 de 2
Se descartan por ahora las "variantes formales" (producto base + talla +
color como atributos relacionados, con schema nuevo). Esa es una inversion
de arquitectura mayor (Fase 2, backlog futuro) que requeriria validar mas
a fondo con ambas merchants de ropa antes de comprometer schema.

Fase 1 (este feature): "Duplicar producto" - cada variante SIGUE siendo un
producto independiente en la base de datos (sin relacion formal entre
ellas), pero la CREACION de una nueva variante parte de una copia editable
de un producto existente, en vez de un formulario vacio.

## Decision de negocio confirmada (Diego)
- El precio de venta normalmente es igual entre variantes, pero PUEDE
  variar (ej. tallas muy grandes o muy chicas con descuento para animar
  venta). El precio se copia del original pero queda EDITABLE antes de
  guardar, nunca se asume fijo.
- costo_promedio del producto duplicado inicia en 0 (Sin costo registrado),
  NUNCA se copia el costo del original. El costo se deriva de movimientos
  reales de compra (Decision 040); copiar un costo sin compra real detras
  rompería la trazabilidad. La merchant registra la primera compra de la
  nueva variante como con cualquier producto nuevo.
- tipo_venta SI se copia del original sin exponerse para editar (el modal
  de edicion actual tampoco expone este campo).
- minimo_stock se copia del original pero queda editable.
- El nombre se pre-llena con el texto completo del original y el foco del
  input queda al FINAL del texto (no seleccionado), para que la merchant
  simplemente AÑADA la diferencia (ej. "Buzo Hombre Rojo" -> agrega
  " - Talla M" al final) en vez de reescribir todo.

## Decision de UI: swipe (a diferencia del catalogo de fiado)
Se usa swipe como disparador de "Duplicar", junto a la opcion "Editar" que
ya existe en el mismo ion-item-sliding (Feature #17). Razones:
- Precedente: la pantalla de Inventario YA usa swipe para editar; las
  merchants de ropa ya estan entrenadas en ese gesto.
- Publico distinto al ambulante: aqui NO aplica la regla de "cero swipe,
  toque grande" que se impuso al catalogo de fiado por el publico mayor.
- Consistencia dentro del mismo modulo: cambiar de patron de interaccion
  entre acciones del mismo item confundiria mas que ayudar.
"Duplicar" se agrega como una segunda ion-item-option dentro del
ion-item-options existente, con color distinto a "Editar" para diferenciar.

## Implementacion tecnica
Se REUSA EditarProductoComponent (no se crea un componente nuevo) añadiendo
un modo explicito:
- @Input() modo: 'editar' | 'duplicar' (default 'editar', comportamiento
  actual sin cambios).
- En modo 'editar': guardar() llama actualizarProducto(this.producto.id,...)
  como hoy, UPDATE sobre el mismo id. Sin cambios.
- En modo 'duplicar': guardar() genera un id nuevo (uuidv4) y llama
  crearProducto(...) con nombre editado, precio editado, minimo_stock
  editado, tipo_venta copiado del original y costo_promedio 0. Es un INSERT
  de un producto NUEVO, el original queda intacto.
- El titulo del modal refleja el modo ("Editar producto" vs "Duplicar
  producto") para que la merchant sepa que esta creando, no editando.
- En modo 'duplicar', ngOnInit pre-llena nombre/precio/minimo_stock del
  original y coloca el foco al final del campo nombre.

## Alcance
- src/app/shared/modals/editar-producto/editar-producto.component.ts y su
  HTML: añadir el modo y el guardado condicional.
- src/app/features/inventario/inventory-list.page.ts: nuevo metodo
  abrirDuplicado(producto) que abre el mismo modal con modo 'duplicar'.
- src/app/features/inventario/inventory-list.page.html: segunda
  ion-item-option "Duplicar" en el swipe.

## Fuera de alcance
- NO se modela talla/color como atributos formales (eso es Fase 2, backlog).
- NO se crea relacion entre el producto original y su duplicado; siguen
  siendo productos 100% independientes en la base de datos.
- NO se cambia el schema ni SCHEMA_VERSION. crearProducto ya existe y se usa
  tal cual.
- NO se copia costo_promedio (inicia en 0 por diseño).
- NO se expone tipo_venta para editar (se copia del original, igual que el
  modal de edicion actual no lo expone).

## Reuso de precedentes
- crearProducto de DatabaseService ya existe (usado por el alta normal).
- uuidv4 ya se usa en inventory-list.page.ts para generar ids.
- El guard freemium puedeEscribir ya esta en guardar() y aplica igual al
  duplicado (crear es escritura).
- EditarProductoComponent ya tiene validacion de nombre/precio/minimo_stock.

## Acceptance criteria
AC-01. Swipe sobre un producto muestra dos opciones: Editar y Duplicar.
AC-02. Tocar Duplicar abre el modal con titulo "Duplicar producto", con
       nombre, precio y minimo_stock pre-llenados del original y el foco al
       final del campo nombre.
AC-03. Al guardar en modo duplicar se crea un producto NUEVO (id distinto)
       via crearProducto; el original permanece sin cambios.
AC-04. El producto duplicado inicia con costo_promedio 0 (Sin costo
       registrado en la lista) y stock derivado 0 hasta que se registre un
       movimiento de compra.
AC-05. El precio del duplicado puede editarse antes de guardar y se guarda
       el valor editado, no forzosamente el del original.
AC-06. tipo_venta del duplicado es igual al del original.
AC-07. En modo editar, el comportamiento es identico al actual (UPDATE
       sobre el mismo producto), sin regresiones.
AC-08. El guardado del duplicado respeta el guard freemium puedeEscribir.

## Gate de pruebas
- TDD: RED antes de GREEN en editar-producto.component.spec.ts (si existe)
  para el guardado condicional segun modo.
- Suite completa TOTAL SUCCESS antes de cada commit de codigo.
- Device test Android: duplicar un producto, editar solo el nombre (añadir
  talla al final), guardar, confirmar que aparece como producto nuevo con
  costo 0 y que el original sigue intacto; repetir para varias tallas
  rapidamente; confirmar que un precio editado en el duplicado se respeta.
