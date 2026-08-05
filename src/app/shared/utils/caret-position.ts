export function calcularPosicionCursor(textoCrudo: string, posicionCursor: number, textoFormateado: string): number {
  const digitosAntes = textoCrudo.slice(0, posicionCursor).replace(/\D/g, "").length;

  if (digitosAntes === 0) {
    return 0;
  }

  let digitosVistos = 0;

  for (let i = 0; i < textoFormateado.length; i++) {
    if (/\d/.test(textoFormateado[i])) {
      digitosVistos++;
    }

    if (digitosVistos === digitosAntes) {
      return i + 1;
    }
  }

  return textoFormateado.length;
}
