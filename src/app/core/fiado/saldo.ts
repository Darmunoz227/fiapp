import { Transaccion } from '../models/transaccion.model';

/**
 * Calcula el saldo (deuda) de un cliente a partir de sus transacciones:
 * un fiado suma y un abono resta, empezando en 0. Patron unificado que
 * antes se repetia en Home y cliente-detalle (Decision 036).
 */
export function calcularSaldoCliente(transacciones: Transaccion[]): number {
  return transacciones.reduce((saldo, t) => {
    if (t.tipo === 'fiado') return saldo + t.monto;
    if (t.tipo === 'abono') return saldo - t.monto;
    return saldo;
  }, 0);
}
