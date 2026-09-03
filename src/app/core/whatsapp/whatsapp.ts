/**
 * Construye una URL de WhatsApp (wa.me) para Colombia.
 * Limpia el telefono (solo digitos), antepone el prefijo 57 y encodea
 * el mensaje. Patron extraido de cliente-detalle (Decision 036).
 */
export function construirUrlWhatsApp(telefono: string, mensaje: string): string {
  const telefonoLimpio = telefono.replace(/\D/g, '');
  return 'https://wa.me/57' + telefonoLimpio + '?text=' + encodeURIComponent(mensaje);
}
