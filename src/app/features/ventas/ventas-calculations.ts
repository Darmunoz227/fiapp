import { TipoPago } from "../../core/models/venta.model";

/**
 * Canonical total for a sale. Single source of truth for this formula.
 * Behavior is intentionally identical to the previous inline duplicates:
 * plain multiplication, no rounding added or removed.
 */
export function calcularTotalVenta(precioVenta: number, cantidad: number): number {
  return precioVenta * cantidad;
}

export type LineaConceptoFiado = {
  cantidad: number;
  nombre: string;
};

export function generarConceptoFiado(lineas: LineaConceptoFiado[]): string {
  const primerasLineas = lineas.slice(0, 2).map((linea) => `${linea.cantidad} ${linea.nombre}`);

  if (lineas.length <= 2) {
    return primerasLineas.join(', ');
  }

  return `${primerasLineas.join(', ')} y ${lineas.length - 2} mas`;
}

/**
 * tipo_pago is a PROJECTION of the amounts, never authored by hand.
 * Amounts are the source of truth. No insert or update may write tipo_pago
 * literally; it must always come from this helper.
 */
export function derivarTipoPago(montoContado: number | null, montoFiado: number | null): TipoPago {
  const contado = montoContado ?? 0;
  const fiado = montoFiado ?? 0;

  if (fiado === 0) {
    return "CONTADO";
  }

  if (contado === 0) {
    return "FIADO";
  }

  return "MIXTO";
}
