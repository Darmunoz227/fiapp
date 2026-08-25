# Tasks - Feature #22 (Fiado por productos)

## Pieza A: logica pura + catalogo
- [ ] T001 - RED: escribir specs de calcularTotalFiado (suma correcta, item
      inexistente ignorado, cantidad negativa tratada como 0, carrito vacio = 0)
- [ ] T001b - RED: specs de construirConceptoFiado (ej. "3 Empanada, 1 Jugo",
      ignora cantidad 0, orden estable, carrito vacio = string vacio)
- [ ] T002 - GREEN: implementar calcularTotalFiado y construirConceptoFiado en
      src/app/core/fiado/fiado-productos.ts
- [ ] T002b - Crear modelo CatalogoItem en src/app/core/models/catalogo-item.model.ts
- [ ] T003 - RED: specs de get/set catalogo en PreferencesService (round-trip,
      JSON invalido devuelve [], vacio devuelve [])
- [ ] T003b - GREEN: KEY_CATALOGO_FIADO + getCatalogoFiado/setCatalogoFiado
- [ ] T004 - CRUD catalogo en Configuraciones: crear, editar nombre/precio,
      retirar item. Sin swipe como accion principal.
- [ ] T004b - Confirmar TOTAL SUCCESS tras Pieza A

## Pieza B: flujo de registro
- [ ] T005 - Pagina fiado-productos con 3 estados (cliente / grid / confirmacion)
- [ ] T005b - Footer sticky con VALOR TOTAL y GUARDAR; boton Cambiar cliente
- [ ] T005c - Empty-state si el catalogo esta vacio con atajo a Configuraciones
- [ ] T005d - Boton de entrada al flujo desde Home
- [ ] T006 - Guardar via crearTransaccion (tipo fiado, venta_id null, monto=total,
      concepto=generado) envuelto en guard freemium puedeEscribir
- [ ] T006b - Pantalla de confirmacion + compartir WhatsApp (Decision 035)

## Cierre
- [ ] T007 - Gate: suite completa TOTAL SUCCESS
- [ ] T008 - Device test Android Pixel_8: crear catalogo, registrar fiado
      multi-producto, deuda del cliente sube por el monto correcto, concepto
      legible guardado, venta_id NULL, inventario NO se movio, bloqueo con
      trial expirado
- [ ] T009 - Redactar Decision 043 en docs/DECISIONS.md
- [ ] T009b - Sincronizar docs/PROJECT_CONTEXT.md (Feature #22, 43 decisions)
- [ ] T010 - Commit final de codigo + docs
- [ ] T011 - Merge --no-ff a main + gate post-merge
