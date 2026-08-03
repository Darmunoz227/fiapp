import { filtrarVentasPorRango, calcularResumenVentas, RangoReporte, ResumenVentas } from './reportes-calculations';
import { VentaBase, VentaConItems } from '../../core/models/venta-con-items.model';
import { VentaItem } from '../../core/models/venta-item.model';

function crearVentaParcial(overrides: Partial<VentaBase> = {}): VentaBase {
  return {
    id: overrides.id ?? 'venta-1',
    tipo_pago: overrides.tipo_pago ?? 'CONTADO',
    monto_contado: overrides.monto_contado ?? 1500,
    monto_fiado: overrides.monto_fiado ?? 0,
    cliente_id: overrides.cliente_id ?? null,
    fecha: overrides.fecha ?? Date.now(),
    created_at: overrides.created_at ?? null,
    updated_at: overrides.updated_at ?? null,
    deleted_at: overrides.deleted_at ?? null,
    store_id: overrides.store_id ?? null,
    created_by: overrides.created_by ?? null,
  };
}

function crearVentaItemParcial(overrides: Partial<VentaItem> = {}): VentaItem {
  return {
    id: overrides.id ?? 'venta-item-1',
    venta_id: overrides.venta_id ?? 'venta-1',
    producto_id: overrides.producto_id ?? 'producto-1',
    cantidad: overrides.cantidad ?? 1,
    precio_venta: overrides.precio_venta ?? 1500,
    costo_unitario: overrides.costo_unitario ?? 1000,
    ganancia: overrides.ganancia ?? 500,
    created_at: overrides.created_at ?? null,
    updated_at: overrides.updated_at ?? null,
    deleted_at: overrides.deleted_at ?? null,
    store_id: overrides.store_id ?? null,
    created_by: overrides.created_by ?? null,
  };
}

function crearVentaConItemsParcial(ventaOverrides: Partial<VentaBase> = {}, items: VentaItem[] = []): VentaConItems {
  return {
    venta: crearVentaParcial(ventaOverrides),
    items,
  };
}

describe('reportes-calculations', () => {
  describe('filtrarVentasPorRango', () => {
    it('TODO returns all ventas', () => {
      const ahora = new Date(2026, 6, 24, 15, 0, 0).getTime();
      const ventas = [
        crearVentaConItemsParcial({ id: 'v1', fecha: ahora - 1000 }, [crearVentaItemParcial({ venta_id: 'v1' })]),
        crearVentaConItemsParcial({ id: 'v2', fecha: ahora - 2000 }, [crearVentaItemParcial({ venta_id: 'v2' })]),
        crearVentaConItemsParcial({ id: 'v3', fecha: ahora - 3000 }, [crearVentaItemParcial({ venta_id: 'v3' })]),
      ];

      const resultado = filtrarVentasPorRango(ventas, 'TODO', ahora);

      expect(resultado).toEqual(ventas);
    });

    it('HOY includes start-of-today and today, excludes just-before-midnight yesterday', () => {
      const ahora = new Date(2026, 6, 24, 15, 0, 0).getTime();
      const startOfToday = new Date(2026, 6, 24, 0, 0, 0).getTime();
      const ventas = [
        crearVentaConItemsParcial({ id: 'a', fecha: startOfToday }, [crearVentaItemParcial({ venta_id: 'a' })]),
        crearVentaConItemsParcial({ id: 'b', fecha: startOfToday - 1 }, [crearVentaItemParcial({ venta_id: 'b' })]),
        crearVentaConItemsParcial({ id: 'c', fecha: ahora }, [crearVentaItemParcial({ venta_id: 'c' })]),
      ];

      const resultado = filtrarVentasPorRango(ventas, 'HOY', ahora);

      expect(resultado.map((venta) => venta.venta.id)).toEqual(['a', 'c']);
    });
  });

  describe('calcularResumenVentas', () => {
    it('aggregates CONTADO + FIADO', () => {
      const ventas = [
        crearVentaConItemsParcial({
          id: 'v1',
          tipo_pago: 'CONTADO',
          monto_contado: 2000,
          monto_fiado: 0,
        }, [crearVentaItemParcial({ venta_id: 'v1', cantidad: 2, precio_venta: 1000, ganancia: 400 })]),
        crearVentaConItemsParcial({
          id: 'v2',
          tipo_pago: 'FIADO',
          monto_contado: 0,
          monto_fiado: 1500,
        }, [crearVentaItemParcial({ venta_id: 'v2', cantidad: 1, precio_venta: 1500, ganancia: 500 })]),
      ];

      const resumen = calcularResumenVentas(ventas);

      const esperado: ResumenVentas = {
        totalVendido: 3500,
        gananciaTotal: 900,
        numeroVentas: 2,
        contadoCount: 1,
        fiadoCount: 1,
        mixtoCount: 0,
        contadoTotal: 2000,
        fiadoTotal: 1500,
      };

      expect(resumen).toEqual(esperado);
    });

    it('empty array → all zeros', () => {
      const resumen = calcularResumenVentas([]);

      const esperado: ResumenVentas = {
        totalVendido: 0,
        gananciaTotal: 0,
        numeroVentas: 0,
        contadoCount: 0,
        fiadoCount: 0,
        mixtoCount: 0,
        contadoTotal: 0,
        fiadoTotal: 0,
      };

      expect(resumen).toEqual(esperado);
    });
  });

  it("counts a MIXTO sale in mixtoCount and splits its pesos across both totals", () => {
    const ventas = [crearVentaConItemsParcial({ id: "v-mix", monto_contado: 10000, monto_fiado: 20000, tipo_pago: "MIXTO", cliente_id: "c1" }, [
      crearVentaItemParcial({ venta_id: 'v-mix', cantidad: 2, precio_venta: 15000, ganancia: 28000 }),
    ])];
    const resumen = calcularResumenVentas(ventas);
    expect(resumen.totalVendido).toBe(30000);
    expect(resumen.contadoTotal).toBe(10000);
    expect(resumen.fiadoTotal).toBe(20000);
    expect(resumen.mixtoCount).toBe(1);
    expect(resumen.contadoCount).toBe(0);
    expect(resumen.fiadoCount).toBe(0);
  });

  it("keeps both invariants over a mixed dataset", () => {
    const ventas = [
      crearVentaConItemsParcial({ id: "a", monto_contado: 1000, monto_fiado: 0, tipo_pago: "CONTADO" }, [crearVentaItemParcial({ venta_id: 'a', cantidad: 1, precio_venta: 1000, ganancia: 400 })]),
      crearVentaConItemsParcial({ id: "b", monto_contado: 0, monto_fiado: 2000, tipo_pago: "FIADO", cliente_id: "c1" }, [crearVentaItemParcial({ venta_id: 'b', cantidad: 1, precio_venta: 2000, ganancia: 500 })]),
      crearVentaConItemsParcial({ id: "c", monto_contado: 2000, monto_fiado: 3000, tipo_pago: "MIXTO", cliente_id: "c1" }, [crearVentaItemParcial({ venta_id: 'c', cantidad: 1, precio_venta: 5000, ganancia: 1200 })]),
    ];
    const resumen = calcularResumenVentas(ventas);
    expect(resumen.contadoTotal + resumen.fiadoTotal).toBe(resumen.totalVendido);
    expect(resumen.contadoCount + resumen.fiadoCount + resumen.mixtoCount).toBe(resumen.numeroVentas);
  });
});
