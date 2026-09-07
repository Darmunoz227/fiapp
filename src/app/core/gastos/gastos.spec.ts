import { normalizarAMensual, calcularFijosMensuales } from './gastos';
import { GastoRecurrente } from '../models/gasto-recurrente.model';

describe('normalizarAMensual', () => {
  it('convierte cada frecuencia a base mensual', () => {
    expect(normalizarAMensual(10000, 'DIARIO')).toBe(300000);
    expect(normalizarAMensual(50000, 'SEMANAL')).toBeCloseTo(216666.67, 1);
    expect(normalizarAMensual(100000, 'QUINCENAL')).toBe(200000);
    expect(normalizarAMensual(800000, 'MENSUAL')).toBe(800000);
    expect(normalizarAMensual(1200000, 'ANUAL')).toBe(100000);
  });

  it('devuelve 0 con valores no numericos o negativos', () => {
    expect(normalizarAMensual(NaN, 'MENSUAL')).toBe(0);
    expect(normalizarAMensual(-500, 'MENSUAL')).toBe(0);
  });
});

describe('calcularFijosMensuales', () => {
  const base = { categoria: 'x', tipo_gasto: 'FIJO' as const, frecuencia: 'MENSUAL' as const, activo: true };

  it('suma solo los FIJOS activos, normalizados a mes', () => {
    const recurrentes = [
      { id: 'a', ...base, categoria: 'Arriendo', valor_estimado: 800000 },
      { id: 'b', ...base, categoria: 'Servicios', valor_estimado: 180000 },
      { id: 'c', ...base, categoria: 'Vigilancia', valor_estimado: 1200000, frecuencia: 'ANUAL' as const },
    ] as GastoRecurrente[];

    expect(calcularFijosMensuales(recurrentes)).toBe(1080000);
  });

  it('ignora los VARIABLE y los inactivos', () => {
    const recurrentes = [
      { id: 'a', ...base, valor_estimado: 800000 },
      { id: 'b', ...base, valor_estimado: 500000, tipo_gasto: 'VARIABLE' as const },
      { id: 'c', ...base, valor_estimado: 300000, activo: false },
    ] as GastoRecurrente[];

    expect(calcularFijosMensuales(recurrentes)).toBe(800000);
  });

  it('acepta activo como 1/0 numerico (rama nativa SQLite)', () => {
    const recurrentes = [
      { id: 'a', ...base, valor_estimado: 800000, activo: 1 as unknown as boolean },
      { id: 'b', ...base, valor_estimado: 300000, activo: 0 as unknown as boolean },
    ] as GastoRecurrente[];

    expect(calcularFijosMensuales(recurrentes)).toBe(800000);
  });

  it('devuelve 0 con lista vacia', () => {
    expect(calcularFijosMensuales([])).toBe(0);
  });
});
