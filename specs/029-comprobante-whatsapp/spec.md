# Feature 029 - Comprobante de fiado por WhatsApp (atajo directo)

## Contexto
Tras registrar un fiado por productos (Feature #22), la pantalla
"¡Fiado registrado!" solo ofrece "Ver deuda" y "Registrar otro". Para
enviar el comprobante por WhatsApp, el merchant debe navegar al detalle
del cliente. El ambulante, en su flujo post-pico, necesita mandarlo de
una vez. Se agrega un tercer boton que reusa el patron wa.me directo que
ya existe en cliente-detalle (enviarReciboWhatsApp), sin inventar otra
experiencia.

## Evidencia del codigo actual
- cliente-detalle ya envia por WhatsApp con wa.me/57 + telefonoLimpio
  (replace /\D/g) + window.open, en enviarCobroWhatsApp y
  enviarReciboWhatsApp. El bloque url esta DUPLICADO 2 veces.
- El calculo de saldo (fiado suma, abono resta) se repite en Home y en
  cliente-detalle (lineas 100-103).
- DB solo expone obtenerTransaccionesPorCliente; el saldo se calcula en
  la capa de pagina, no en BD.
- fiado-productos ya importa logoWhatsapp y tiene en memoria
  clienteSeleccionado, conceptoGuardado, totalGuardado.

## Alcance
Extraer DOS funciones puras (patron extraer-probar-replicar, Decision
036) y luego usarlas en el boton nuevo:
1. construirUrlWhatsApp(telefono, mensaje): limpia el numero con
   replace(/\D/g,''), antepone 57 y arma wa.me/57...?text=encoded.
2. calcularSaldoCliente(transacciones): suma fiado, resta abono,
   empieza en 0.
Migrar los 2 metodos de cliente-detalle al helper de URL (suite verde
como red). Agregar enviarComprobante() en fiado-productos.

## Reglas de negocio
- El boton "Enviar comprobante" va entre "Ver deuda" y "Registrar otro"
  en la pantalla de confirmacion.
- enviarComprobante consulta obtenerTransaccionesPorCliente tras guardar,
  calcula el saldo con calcularSaldoCliente (ya incluye el fiado recien
  creado) y arma el mensaje.
- Si el cliente NO tiene telefono (vacio): mostrar un toast que sugiere
  agregarlo con Editar (Feature #28), NO abrir un wa.me roto.
- NO gatear con freemium: enviar un recibo es comunicacion, no una
  escritura de negocio (el fiado ya se guardo y su guard ya corrio).

## Formato del mensaje
🧾 Recibo de Fiado
Hola {nombre}, registramos tu fiado por ${totalGuardado}.
Detalle: {concepto}

Saldo actual: ${saldo}
{nombreNegocio}

## Fuera de alcance
- Normalizar/validar prefijo pais mas alla de replace(/\D/g,'').
- Cambiar el mensaje existente de fiados manuales en cliente-detalle
  (solo se migra su ARMADO de URL al helper, el texto queda igual).
- Envio automatico sin intervencion del usuario (siempre abre WhatsApp).

## Criterios de aceptacion
- AC-01: construirUrlWhatsApp('300 123-4567', 'hola') devuelve
  https://wa.me/573001234567?text=hola (numero limpio, prefijo 57).
- AC-02: calcularSaldoCliente suma fiados y resta abonos, arrancando 0.
- AC-03: la pantalla de confirmacion muestra 3 botones; el nuevo abre
  WhatsApp con el recibo, nombre, total, concepto y saldo actualizado.
- AC-04: si el cliente no tiene telefono, se muestra un toast guia y NO
  se intenta abrir WhatsApp.
- AC-05: los 2 metodos de cliente-detalle siguen enviando el MISMO
  mensaje que hoy, ahora via el helper compartido (sin regresion).
