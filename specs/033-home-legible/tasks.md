# Tasks - Feature 033 Inicio legible

## Fase 1: Header
- T001 Iconos a blanco, ~24px, etiqueta de una palabra debajo
  (Reportes, Vender, Inventario, Ajustes), toque >= 48px.
- T002 Invertir jerarquia: nombre del negocio prominente, marca FiApp
  secundaria.
- T003 [GATE] npm test.

## Fase 2: Cuerpo
- T004 Eliminar watermark-container del template y sus estilos.
- T005 Tarjeta del total: etiqueta gris pequena CONSERVANDO el emoji de
  la bolsa, monto en casi negro, sombra suave.
- T006 Boton de fiado a primary, altura >= 56px.
- T007 Buscador dentro de un campo con borde.
- T008 [GATE] npm test.

## Fase 3: Clientes y FAB
- T009 Filas de cliente como tarjetas >= 64px con avatar, nombre, linea
  de estado (Debe / Al dia) y monto con color semantico.
- T010 FAB: se CONSERVA (evidencia E2). Solo cambia color para no
  competir con la accion principal.
- T011 [GATE] npm test; el test de AC-06 debe seguir verde SIN tocarlo.

## Fase 4: Device
- T012 Rebuild + cap sync + cap run --target, sin tuberia.
- T013 [DEVICE] Los 4 iconos se distinguen y se leen sus etiquetas.
- T014 [DEVICE][REGRESION] Buscar, entrar al detalle, editar y eliminar
  por swipe, registrar fiado, crear cliente con el FAB: todo funciona.
- T015 [DEVICE] Modo oscuro legible.
- T016 [DEVICE] AC-06 en device: con producto en modo_produccion aparece
  el boton; sin el, no.

## Fase 5: Cierre
- T017 Decision 054 + PROJECT_CONTEXT + PROMPT_SUPERVISOR (anotar E3: la
  accion principal del Inicio deberia depender del tipo de merchant).
- T018 Merge a main con --no-ff.

## Definicion de terminado
- Los 9 AC verificados.
- CERO clases CSS renombradas, CERO tests modificados.
