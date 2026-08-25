# Plan - Feature #22 (Fiado por productos)

## Decisiones de navegacion (Diego)
- 1B: el flujo de fiado por productos se inicia DESDE HOME, con un boton
  dedicado, replicando el prototipo validado (cliente -> productos -> guardar).
- 2A: la gestion del catalogo (CRUD) vive en Configuraciones. Ademas, atajo
  contextual: si el catalogo esta vacio al entrar al flujo de fiado, mostrar
  un empty-state con boton directo a crear el catalogo.

## Piezas y orden de construccion
Se construye la Pieza A (catalogo) antes que la Pieza B (flujo), porque el
flujo consume el catalogo.

## Modelo de datos (sin schema change)
- CatalogoItem (TypeScript interface, no tabla): { id, nombre, precio, emoji? }.
- Persistido en Preferences bajo KEY nueva 'catalogo_fiado' como JSON string,
  siguiendo el patron de PreferencesService (get/set con try/catch).
- El fiado se guarda como Transaccion existente: tipo 'fiado', venta_id null,
  monto = total calculado, concepto = string generado. Via crearTransaccion.
  NO se toca productos, inventario, venta_items ni registrarVenta.

## Logica pura testeable (TDD, RED antes de GREEN)
1. calcularTotalFiado(cart, catalogo): number - suma cantidad*precio. Guard
   contra items no encontrados y cantidades negativas.
2. construirConceptoFiado(cart, catalogo): string - ej. "3 Empanada, 1 Jugo".
   Ordena de forma estable, ignora cantidad 0. Reusa el espiritu de Decision 039.
3. Serializacion catalogo: parse/stringify robusto (JSON invalido -> catalogo
   vacio, no crash), siguiendo el manejo defensivo de PreferencesService.

## Archivos previstos (a confirmar en implementacion)
- src/app/core/preferences/preferences.service.ts (añadir KEY + get/set catalogo)
- src/app/core/models/catalogo-item.model.ts (nuevo, interface)
- src/app/core/fiado/fiado-productos.ts (nuevo, funciones puras calcular/construir)
- src/app/features/fiado-productos/ (nueva pagina del flujo, 3 estados)
- src/app/features/configuraciones/ (añadir seccion CRUD catalogo)
- src/app/home/home.page.html/.ts (boton de entrada al flujo)

## Requisitos de UI derivados del prototipo validado
- Footer con VALOR TOTAL y GUARDAR FIADO FIJO (sticky), la lista de productos
  hace scroll por encima. Verificado en el prototipo interactivo con 8 productos.
- Boton "Cambiar cliente" para volver a la seleccion sin perder el flujo.
- Botones grandes, alto contraste, badge de cantidad, boton "-" visible solo
  cuando la cantidad es > 0. PROHIBIDO swipe como interaccion principal.
- Guardado sujeto al guard freemium puedeEscribir (Decision 033).
- Confirmacion con recibo y opcion de compartir por WhatsApp (Decision 035).

## Pregunta abierta menor (no bloqueante, se resuelve en implementacion)
- Edicion rapida de cantidad (ej. tap-largo para escribir 8 en vez de tocar +
  ocho veces). Se evalua; por defecto NO se incluye en la primera version para
  mantener el camino feliz sin teclado.

## Pasos de ejecucion (alto nivel; el detalle atomico va en tasks.md)
T001 - RED: tests de calcularTotalFiado y construirConceptoFiado.
T002 - GREEN: implementar las funciones puras.
T003 - RED/GREEN: get/set catalogo en PreferencesService + serializacion.
T004 - CRUD catalogo en Configuraciones (crear/editar/retirar).
T005 - Pagina de flujo fiado por productos (3 estados) + boton en Home.
T006 - Integrar guardado via crearTransaccion con guard freemium.
T007 - Gate suite completa verde.
T008 - Device test Android Pixel_8 (deuda sube, concepto ok, venta_id null,
       inventario intacto, bloqueo con trial expirado).
T009 - Decision 043 + PROJECT_CONTEXT sync.
T010 - Merge --no-ff a main.

## Riesgos
- Bajo en datos: reusa un metodo probado (crearTransaccion) sin schema change.
- Medio en UX: es una pantalla nueva con estado (carrito). El riesgo real es de
  usabilidad, mitigado por el prototipo ya validado con el merchant.
- Atencion: el guard freemium debe envolver el guardado, no la navegacion, para
  no bloquear la construccion del fiado sino solo su persistencia.
