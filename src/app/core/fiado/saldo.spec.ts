import { calcularSaldoCliente } from './saldo';
import { Transaccion } from '../models/transaccion.model';

describe('calcularSaldoCliente', () => {
  function tx(over: Partial<Transaccion> = {}): Transaccion {
    return {
      id: over.id ?? 't1',
      cliente_id: over.cliente_id ?? 'c1',
      tipo: over.tipo ?? 'fiado',
      monto: over.monto ?? 0,
      concepto: over.concepto ?? '',
      fecha: over.fecha ?? Date.now(),
    };
  }

  it('suma fiados y resta abonos desde 0 (AC-02)', () => {
    const saldo = calcularSaldoCliente([
      tx({ tipo: 'fiado', monto: 10000 }),
      tx({ tipo: 'fiado', monto: 5000 }),
      tx({ tipo: 'abono', monto: 3000 }),
    ]);
    expect(saldo).toBe(12000);
  });

  it('lista vacia devuelve 0', () => {
    expect(calcularSaldoCliente([])).toBe(0);
  });

  it('solo abonos da saldo negativo', () => {
    const saldo = calcularSaldoCliente([tx({ tipo: 'abono', monto: 2000 })]);
    expect(saldo).toBe(-2000);
  });
});
