export function verificarPin(ingresado: string, guardado: string | null): boolean {
  const pinGuardado = (guardado ?? '').trim();
  if (pinGuardado === '') {
    return true;
  }
  return ingresado.trim() === pinGuardado;
}
