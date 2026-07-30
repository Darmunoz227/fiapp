import { TipoPago } from "../../core/models/venta.model";

/**
 * Canonical total for a sale. Single source of truth for this formula.
 * Behavior is intentionally identical to the previous inline duplicates:
 * plain multiplication, no rounding added or removed.
 */
export function calcularTotalVenta(precioVenta: number, cantidad: number): number {
  return precioVenta * cantidad;
}

/**
 * tipo_pago is a PROJECTION of the amounts, never authored by hand.
 * Amounts are the source of truth. No insert or update may write tipo_pago
 * literally; it must always come from this helper.
 */
export function derivarTipoPago(montoContado: number, montoFiado: number): TipoPago {
  if (montoFiado === 0) {
    return "CONTADO";
  }

  if (montoContado === 0) {
    return "FIADO";
  }

  return "MIXTO";
}
