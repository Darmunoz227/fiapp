# Tasks - Feature 029 Comprobante WhatsApp

## Fase 1: Helpers puros (RED -> GREEN)
- T001 [RED] Test construirUrlWhatsApp: '300 123-4567' + 'hola' da
  https://wa.me/573001234567?text=hola (numero limpio, prefijo 57).
- T002 [RED] Test construirUrlWhatsApp encodea espacios y emojis en
  el mensaje.
- T003 [GREEN] Implementar core/whatsapp/whatsapp.ts.
- T004 [RED] Test calcularSaldoCliente suma fiados, resta abonos, 0.
- T005 [RED] Test calcularSaldoCliente sobre lista vacia devuelve 0.
- T006 [GREEN] Implementar core/fiado/saldo.ts.
- T007 [GATE] npm test; confirmar TOTAL verde.

## Fase 2: Migrar cliente-detalle al helper (sin cambiar texto)
- T008 Refactor enviarCobroWhatsApp: delegar armado de URL a
  construirUrlWhatsApp; el texto del mensaje NO cambia.
- T009 Refactor enviarReciboWhatsApp: idem.
- T010 [GATE] npm test; suite verde (sin regresion, AC-05).

## Fase 3: Boton en fiado-productos
- T011 Implementar enviarComprobante() en fiado-productos.page.ts:
  guarda temprano si no hay telefono (toast guia), consulta
  transacciones, calcula saldo, arma mensaje y abre construirUrlWhatsApp.
- T012 HTML: boton "Enviar comprobante" (icono logoWhatsapp) entre
  "Ver deuda" y "Registrar otro" en la pantalla de confirmacion.
- T013 [GATE] npm test; suite verde.

## Fase 4: Verificacion en dispositivo
- T014 Rebuild real: npm run build + npx cap sync android. Confirmar
  bundle fresco (grep del codigo nuevo en www/*.js) antes de probar.
- T015 [DEVICE] Registrar un fiado y tocar "Enviar comprobante":
  WhatsApp abre con recibo, nombre, total, concepto y saldo ACTUALIZADO
  (incluye el fiado recien creado).
- T016 [DEVICE] Cliente sin telefono: aparece el toast guia y NO se
  abre WhatsApp.
- T017 [DEVICE] Regresion: cliente-detalle envia el MISMO mensaje de
  cobro y de recibo que antes.

## Fase 5: Cierre
- T018 Actualizar docs/DECISIONS.md (Decision 051) y
  docs/PROJECT_CONTEXT.md (Feature #29 DONE).
- T019 Merge a main con --no-ff tras verificar suite verde y arbol
  limpio.

## Definicion de terminado
- 4 tests nuevos verdes (2 URL + 2 saldo), suite total verde.
- Device test Pixel_8 aprobado (con y sin telefono, saldo correcto,
  sin regresion en cliente-detalle).
- Sin cambios de BD ni schema (git diff vacio en database.service.ts).
