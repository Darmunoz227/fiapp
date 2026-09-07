import { normalizarAMensual } from './gastos';

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
