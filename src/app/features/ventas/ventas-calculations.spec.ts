import { calcularTotalVenta, derivarTipoPago, generarConceptoFiado } from "./ventas-calculations";

describe("ventas-calculations", () => {
  describe("calcularTotalVenta", () => {
    it("multiplies precio by cantidad for UNIDAD products", () => {
      expect(calcularTotalVenta(1500, 3)).toBe(4500);
    });

    it("multiplies precio by cantidad for PESO products (grams)", () => {
      expect(calcularTotalVenta(12.5, 2350)).toBe(29375);
    });

    it("returns 0 when cantidad is 0", () => {
      expect(calcularTotalVenta(1500, 0)).toBe(0);
    });
  });

  describe("derivarTipoPago", () => {
    it("returns CONTADO when monto fiado is 0", () => {
      expect(derivarTipoPago(30000, 0)).toBe("CONTADO");
    });

    it("returns FIADO when monto contado is 0", () => {
      expect(derivarTipoPago(0, 30000)).toBe("FIADO");
    });

    it("returns MIXTO when both amounts are greater than 0", () => {
      expect(derivarTipoPago(10000, 20000)).toBe("MIXTO");
    });

    it("returns CONTADO for the degenerate zero-value sale", () => {
      expect(derivarTipoPago(0, 0)).toBe("CONTADO");
    });
  });

  describe('generarConceptoFiado', () => {
    it('names the first two lines plus the remainder for three lines', () => {
      expect(generarConceptoFiado([
        { cantidad: 2, nombre: 'Carne molida' },
        { cantidad: 1, nombre: 'Panela' },
        { cantidad: 1, nombre: 'Lechuga' },
      ])).toBe('2 Carne molida, 1 Panela y 1 mas');
    });

    it('omits the remainder suffix for one line', () => {
      expect(generarConceptoFiado([
        { cantidad: 3, nombre: 'Carne molida' },
      ])).toBe('3 Carne molida');
    });

    it('omits the remainder suffix for two lines', () => {
      expect(generarConceptoFiado([
        { cantidad: 2, nombre: 'Carne molida' },
        { cantidad: 1, nombre: 'Panela' },
      ])).toBe('2 Carne molida, 1 Panela');
    });
  });
});
