import { Venta } from '../../core/models/venta.model';
import { calcularTotalVenta, derivarTipoPago } from '../ventas/ventas-calculations';

export type RangoReporte = 'HOY' | 'TODO';

export interface ResumenVentas {
  totalVendido: number;
  gananciaTotal: number;
  numeroVentas: number;
  contadoCount: number;
  fiadoCount: number;
  mixtoCount: number;
  contadoTotal: number;
  fiadoTotal: number;
}

export function filtrarVentasPorRango(ventas: Venta[], rango: RangoReporte, ahora: number): Venta[] {
  if (rango === 'TODO') {
    return ventas;
  }

  const fechaActual = new Date(ahora);
  const startOfDay = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    fechaActual.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const startOfNextDay = startOfDay + 24 * 60 * 60 * 1000;

  return ventas.filter((venta) => venta.fecha >= startOfDay && venta.fecha < startOfNextDay);
}

export function calcularResumenVentas(ventas: Venta[]): ResumenVentas {
  return ventas.reduce<ResumenVentas>(
    (resumen, venta) => {
      const totalVenta = calcularTotalVenta(venta.precio_venta, venta.cantidad);

      resumen.totalVendido += totalVenta;
      resumen.gananciaTotal += venta.ganancia;
      resumen.numeroVentas += 1;

      resumen.contadoTotal += venta.monto_contado ?? 0;
      resumen.fiadoTotal += venta.monto_fiado ?? 0;

      const tipo = derivarTipoPago(venta.monto_contado ?? 0, venta.monto_fiado ?? 0);
      if (tipo === 'CONTADO') {
        resumen.contadoCount += 1;
      } else if (tipo === 'FIADO') {
        resumen.fiadoCount += 1;
      } else {
        resumen.mixtoCount += 1;
      }

      return resumen;
    },
    {
      totalVendido: 0,
      gananciaTotal: 0,
      numeroVentas: 0,
      contadoCount: 0,
      fiadoCount: 0,
      mixtoCount: 0,
      contadoTotal: 0,
      fiadoTotal: 0,
    },
  );
}