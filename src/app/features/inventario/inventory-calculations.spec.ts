import { esStockBajo, calcularValorTotalInventario, LineaValorInventario } from './inventory-calculations';

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
