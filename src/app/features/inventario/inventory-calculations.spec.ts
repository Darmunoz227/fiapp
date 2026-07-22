import { esStockBajo } from './inventory-calculations';

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