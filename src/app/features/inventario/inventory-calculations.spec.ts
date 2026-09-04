import { esStockBajo, calcularValorTotalInventario, LineaValorInventario, calcularStockDerivado } from './inventory-calculations';

describe('inventory-calculations', () => {
  describe('esStockBajo', () => {
    it('returns false when stock is above minimum', () => {
      expect(esStockBajo(10, 5)).toBeFalse();
    });

    it('returns true when stock is exactly at the minimum', () => {
      expect(esStockBajo(5, 5)).toBeTrue();
    });

    it('returns true when stock is below minimum', () => {
      expect(esStockBajo(3, 5)).toBeTrue();
    });

    it('returns true when both stock and minimum are zero', () => {
      expect(esStockBajo(0, 0)).toBeTrue();
    });
  });
});
describe('calcularValorTotalInventario', () => {
  it('inventario vacio devuelve 0', () => {
    expect(calcularValorTotalInventario([])).toBe(0);
  });

  it('suma stock por costo de varias lineas', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 10, costo_promedio: 5000 },
      { stock_derivado: 3, costo_promedio: 2000 },
    ];
    expect(calcularValorTotalInventario(lineas)).toBe(56000);
  });

  it('linea con stock > 0 y costo 0 aporta 0 y no rompe la suma', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 10, costo_promedio: 5000 },
      { stock_derivado: 4, costo_promedio: 0 },
    ];
    const total = calcularValorTotalInventario(lineas);
    expect(total).toBe(50000);
    expect(Number.isNaN(total)).toBe(false);
  });

  it('linea con stock 0 y costo > 0 aporta 0', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 0, costo_promedio: 9000 },
    ];
    expect(calcularValorTotalInventario(lineas)).toBe(0);
  });
});

describe('calcularStockDerivado - PRODUCCION', () => {
  function movProduccion(cantidad: number): any {
    return {
      id: 'm1',
      producto_id: 'p1',
      tipo: 'PRODUCCION',
      cantidad,
      costo_unitario: 800,
      motivo: null,
      fecha: Date.now(),
      actor_id: null,
      stock_calculado_anterior: null,
      cantidad_fisica: null,
      diferencia_calculada: null,
      deleted_at: null,
    };
  }

  it('PRODUCCION suma cantidad al stock, igual que COMPRA', () => {
    const movimientos = [movProduccion(50)];
    expect(calcularStockDerivado(movimientos)).toBe(50);
  });

  it('PRODUCCION se acumula con otros movimientos existentes', () => {
    const compra: any = { ...movProduccion(10), tipo: 'COMPRA' };
    const produccion = movProduccion(20);
    expect(calcularStockDerivado([compra, produccion])).toBe(30);
  });
});
