import { normalizarAMensual, calcularFijosMensuales, calcularMargenPromedio, calcularPuntoEquilibrio, calcularTotalGastos, sugerirTipoGasto, CATEGORIAS_GASTO } from './gastos';
import { Gasto } from '../models/gasto.model';
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

describe('calcularMargenPromedio', () => {
  it('devuelve la proporcion de ganancia sobre lo vendido', () => {
    expect(calcularMargenPromedio(1000000, 400000)).toBeCloseTo(0.4, 5);
  });

  it('devuelve 0 sin ventas, sin dividir por cero', () => {
    expect(calcularMargenPromedio(0, 0)).toBe(0);
    expect(calcularMargenPromedio(0, 50000)).toBe(0);
  });

  it('devuelve 0 con entradas no numericas o negativas', () => {
    expect(calcularMargenPromedio(NaN, 400000)).toBe(0);
    expect(calcularMargenPromedio(-100, 40)).toBe(0);
    expect(calcularMargenPromedio(1000, -40)).toBe(0);
  });
});

describe('calcularPuntoEquilibrio', () => {
  it('divide los fijos entre el margen y expone el equivalente diario', () => {
    const r = calcularPuntoEquilibrio(1500000, 0.4);
    expect(r.calculable).toBe(true);
    expect(r.ventaNecesariaMensual).toBe(3750000);
    expect(r.ventaNecesariaDiaria).toBe(125000);
  });

  it('NO es calculable sin margen, y nunca devuelve Infinity', () => {
    const r = calcularPuntoEquilibrio(1500000, 0);
    expect(r.calculable).toBe(false);
    expect(r.ventaNecesariaMensual).toBe(0);
    expect(Number.isFinite(r.ventaNecesariaMensual)).toBe(true);
  });

  it('NO es calculable sin gastos fijos registrados', () => {
    expect(calcularPuntoEquilibrio(0, 0.4).calculable).toBe(false);
  });
});

describe('calcularTotalGastos', () => {
  it('suma los valores e ignora los no numericos o negativos', () => {
    const gastos = [
      { id: 'a', valor: 800000 },
      { id: 'b', valor: 180000 },
      { id: 'c', valor: -500 },
      { id: 'd', valor: NaN },
    ] as Gasto[];
    expect(calcularTotalGastos(gastos)).toBe(980000);
  });

  it('devuelve 0 con lista vacia', () => {
    expect(calcularTotalGastos([])).toBe(0);
  });
});

describe('sugerirTipoGasto', () => {
  it('sugiere FIJO para arriendo y servicios', () => {
    expect(sugerirTipoGasto('Arriendo')).toBe('FIJO');
    expect(sugerirTipoGasto('Servicios')).toBe('FIJO');
  });

  it('sugiere VARIABLE para el resto', () => {
    expect(sugerirTipoGasto('Transporte')).toBe('VARIABLE');
    expect(sugerirTipoGasto('Comida')).toBe('VARIABLE');
    expect(sugerirTipoGasto('Otro')).toBe('VARIABLE');
  });

  it('NO incluye Mercancia: eso es una COMPRA de inventario, no un gasto', () => {
    expect(CATEGORIAS_GASTO).not.toContain('Mercancia');
    expect(CATEGORIAS_GASTO).not.toContain('Mercancía');
  });
});
