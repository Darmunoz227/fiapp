import { filtrarVentasPorRango, calcularResumenVentas, RangoReporte, ResumenVentas } from './reportes-calculations';
import { Venta } from '../../core/models/venta.model';

function crearVentaParcial(overrides: Partial<Venta> = {}): Venta {
  return {
    id: overrides.id ?? 'venta-1',
    producto_id: overrides.producto_id ?? 'producto-1',
    cantidad: overrides.cantidad ?? 1,
    precio_venta: overrides.precio_venta ?? 1500,
    costo_unitario: overrides.costo_unitario ?? 1000,
    ganancia: overrides.ganancia ?? 500,
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

describe('reportes-calculations', () => {
  describe('filtrarVentasPorRango', () => {
    it('TODO returns all ventas', () => {
      const ahora = new Date(2026, 6, 24, 15, 0, 0).getTime();
      const ventas = [
        crearVentaParcial({ id: 'v1', fecha: ahora - 1000 }),
        crearVentaParcial({ id: 'v2', fecha: ahora - 2000 }),
        crearVentaParcial({ id: 'v3', fecha: ahora - 3000 }),
      ];

      const resultado = filtrarVentasPorRango(ventas, 'TODO', ahora);

      expect(resultado).toEqual(ventas);
    });

    it('HOY includes start-of-today and today, excludes just-before-midnight yesterday', () => {
      const ahora = new Date(2026, 6, 24, 15, 0, 0).getTime();
      const startOfToday = new Date(2026, 6, 24, 0, 0, 0).getTime();
      const ventas = [
        crearVentaParcial({ id: 'a', fecha: startOfToday }),
        crearVentaParcial({ id: 'b', fecha: startOfToday - 1 }),
        crearVentaParcial({ id: 'c', fecha: ahora }),
      ];

      const resultado = filtrarVentasPorRango(ventas, 'HOY', ahora);

      expect(resultado.map((venta) => venta.id)).toEqual(['a', 'c']);
    });
  });

  describe('calcularResumenVentas', () => {
    it('aggregates CONTADO + FIADO', () => {
      const ventas = [
        crearVentaParcial({
          id: 'v1',
          tipo_pago: 'CONTADO',
          precio_venta: 1000,
          cantidad: 2,
          ganancia: 400,
        }),
        crearVentaParcial({
          id: 'v2',
          tipo_pago: 'FIADO',
          precio_venta: 1500,
          cantidad: 1,
          ganancia: 500,
        }),
      ];

      const resumen = calcularResumenVentas(ventas);

      const esperado: ResumenVentas = {
        totalVendido: 3500,
        gananciaTotal: 900,
        numeroVentas: 2,
        contadoCount: 1,
        fiadoCount: 1,
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
        contadoTotal: 0,
        fiadoTotal: 0,
      };

      expect(resumen).toEqual(esperado);
    });
  });
});
