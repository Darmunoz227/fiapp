import { VentaConItems } from '../../core/models/venta-con-items.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { calcularTotalVenta, derivarTipoPago } from '../ventas/ventas-calculations';

export type RangoReporte = 'HOY' | 'MES' | 'TODO';

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

export interface ResumenTransacciones {
  fiadoManualTotal: number;
  abonoTotal: number;
}

export type ResumenReporte = ResumenVentas & ResumenTransacciones;

export function filtrarPorRangoFecha<T>(
  registros: T[],
  rango: RangoReporte,
  ahora: number,
  obtenerFecha: (registro: T) => number,
): T[] {
  if (rango === 'TODO') {
    return registros;
  }

  const fechaActual = new Date(ahora);

  if (rango === 'MES') {
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1, 0, 0, 0, 0).getTime();
    const inicioMesSiguiente = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
    return registros.filter((registro) => {
      const fecha = obtenerFecha(registro);
      return fecha >= inicioMes && fecha < inicioMesSiguiente;
    });
  }

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

  return registros.filter((registro) => {
    const fecha = obtenerFecha(registro);
    return fecha >= startOfDay && fecha < startOfNextDay;
  });
}

export function filtrarVentasPorRango(ventas: VentaConItems[], rango: RangoReporte, ahora: number): VentaConItems[] {
  return filtrarPorRangoFecha(ventas, rango, ahora, (venta) => venta.venta.fecha);
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

export function calcularResumenTransacciones(transacciones: Transaccion[]): ResumenTransacciones {
  const transaccionesManuales = transacciones.filter((transaccion) => transaccion.venta_id == null);

  return transaccionesManuales.reduce<ResumenTransacciones>(
    (resumen, transaccion) => {
      if (transaccion.tipo === 'fiado') {
        resumen.fiadoManualTotal += transaccion.monto;
      } else {
        resumen.abonoTotal += transaccion.monto;
      }

      return resumen;
    },
    {
      fiadoManualTotal: 0,
      abonoTotal: 0,
    },
  );
}