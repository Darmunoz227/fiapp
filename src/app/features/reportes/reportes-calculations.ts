import { VentaConItems } from '../../core/models/venta-con-items.model';
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

export function filtrarVentasPorRango(ventas: VentaConItems[], rango: RangoReporte, ahora: number): VentaConItems[] {
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

  return ventas.filter((venta) => venta.venta.fecha >= startOfDay && venta.venta.fecha < startOfNextDay);
}

export function calcularResumenVentas(ventas: VentaConItems[]): ResumenVentas {
  return ventas.reduce<ResumenVentas>(
    (resumen, ventaConItems) => {
      const totalVenta = ventaConItems.items.reduce(
        (acumulado, item) => acumulado + calcularTotalVenta(item.precio_venta, item.cantidad),
        0,
      );

      resumen.totalVendido += totalVenta;
      resumen.gananciaTotal += ventaConItems.items.reduce((acumulado, item) => acumulado + item.ganancia, 0);
      resumen.numeroVentas += 1;

      resumen.contadoTotal += ventaConItems.venta.monto_contado ?? 0;
      resumen.fiadoTotal += ventaConItems.venta.monto_fiado ?? 0;

      const tipo = derivarTipoPago(ventaConItems.venta.monto_contado ?? 0, ventaConItems.venta.monto_fiado ?? 0);
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