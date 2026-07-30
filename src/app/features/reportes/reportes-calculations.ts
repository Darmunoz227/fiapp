import { Venta } from '../../core/models/venta.model';
import { calcularTotalVenta } from '../ventas/ventas-calculations';

export type RangoReporte = 'HOY' | 'TODO';

export interface ResumenVentas {
  totalVendido: number;
  gananciaTotal: number;
  numeroVentas: number;
  contadoCount: number;
  fiadoCount: number;
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

      if (venta.tipo_pago === 'CONTADO') {
        resumen.contadoCount += 1;
        resumen.contadoTotal += totalVenta;
      } else if (venta.tipo_pago === 'FIADO') {
        resumen.fiadoCount += 1;
        resumen.fiadoTotal += totalVenta;
      }

      return resumen;
    },
    {
      totalVendido: 0,
      gananciaTotal: 0,
      numeroVentas: 0,
      contadoCount: 0,
      fiadoCount: 0,
      contadoTotal: 0,
      fiadoTotal: 0,
    },
  );
}