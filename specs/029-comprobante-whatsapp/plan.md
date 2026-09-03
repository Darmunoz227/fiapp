# Plan - Feature 029 Comprobante WhatsApp

## Estrategia
Extraer-probar-replicar (Decision 036). Primero dos funciones puras con
tests, luego migrar cliente-detalle al helper de URL con la suite verde
como red, y por ultimo cablear el boton en fiado-productos. Sin schema,
sin migracion, sin cambios en BD.

## Capa core (funciones puras)
Archivo core/whatsapp/whatsapp.ts:
- construirUrlWhatsApp(telefono: string, mensaje: string): string
  limpia telefono con replace(/\D/g,''), antepone '57', arma
  'https://wa.me/57' + limpio + '?text=' + encodeURIComponent(mensaje).

Archivo core/fiado/saldo.ts:
- calcularSaldoCliente(transacciones: Transaccion[]): number
  reduce: fiado suma monto, abono resta monto, inicio 0.

## Migracion de cliente-detalle (sin cambiar el texto)
enviarCobroWhatsApp y enviarReciboWhatsApp siguen armando su MISMO
mensaje, pero delegan el armado de la URL a construirUrlWhatsApp en vez
de repetir el bloque telefonoLimpio + wa.me + concatenacion. window.open
se mantiene. El texto de ambos mensajes NO cambia (AC-05).

## Capa fiado-productos (boton nuevo)
- Importar Share NO aplica: se usa el mismo window.open + wa.me directo.
- Nuevo metodo async enviarComprobante():
  1. si !clienteSeleccionado.telefono -> toast guia y return.
  2. transacciones = obtenerTransaccionesPorCliente(cliente.id).
  3. saldo = calcularSaldoCliente(transacciones).
  4. nombreNegocio = prefs.getNombreNegocio().
  5. armar mensaje (recibo + nombre + totalGuardado + concepto + saldo
     + negocio) y abrir construirUrlWhatsApp(telefono, mensaje).
- HTML: boton entre "Ver deuda" y "Registrar otro", icono logoWhatsapp.

## Pruebas (TDD, RED antes de GREEN)
1. construirUrlWhatsApp limpia numero y antepone 57 (AC-01).
2. construirUrlWhatsApp encodea el mensaje (espacios, emojis).
3. calcularSaldoCliente suma fiados y resta abonos desde 0 (AC-02).
4. calcularSaldoCliente sobre lista vacia devuelve 0.
Los handlers de ToastController y window.open siguen la convencion del
proyecto (no test unitario); se verifican por device test.

## Gates
- Suite completa verde antes de cada commit.
- Device test Pixel_8: enviar comprobante con y sin telefono, verificar
  saldo actualizado incluye el fiado recien creado, y confirmar que
  cliente-detalle sigue enviando el MISMO mensaje (sin regresion).
- git diff vacio en database.service.ts (sin cambios de BD ni schema).
