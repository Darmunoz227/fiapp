import { calcularTotalVenta, derivarTipoPago } from "./ventas-calculations";

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
});
