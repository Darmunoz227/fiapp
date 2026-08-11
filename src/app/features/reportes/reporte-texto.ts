import { ResumenReporte } from './reportes-calculations';
import { formatCurrencyCOP } from '../../shared/utils/formatters';

export function construirTextoReporte(
  resumen: ResumenReporte,
  nombreNegocio: string,
  rango: string,
): string {
  const negocio = nombreNegocio.trim() || 'Mi Negocio';
  const promedio = resumen.numeroVentas > 0
    ? Math.round(resumen.totalVendido / resumen.numeroVentas)
    : 0;
  const margen = resumen.totalVendido > 0
    ? Math.round((resumen.gananciaTotal / resumen.totalVendido) * 100)
    : 0;

  const lineas = [
    '📊 Reporte FiApp - ' + rango,
    negocio,
    '',
    '💰 Vendido: $' + formatCurrencyCOP(resumen.totalVendido),
    '📈 Ganancia: $' + formatCurrencyCOP(resumen.gananciaTotal) + ' (margen ' + margen + ' por ciento)',
    '🎫 Venta promedio: $' + formatCurrencyCOP(promedio),
    '🛒 Ventas: ' + resumen.numeroVentas,
    '',
    'Como te pagaron las ventas:',
    '  De contado: $' + formatCurrencyCOP(resumen.contadoTotal),
    '  Quedo fiado: $' + formatCurrencyCOP(resumen.fiadoTotal),
    '',
    'Movimientos de fiado aparte:',
    '  Fiados a mano: $' + formatCurrencyCOP(resumen.fiadoManualTotal),
    '  Abonos recibidos: $' + formatCurrencyCOP(resumen.abonoTotal),
  ];

  return lineas.join('\n');
}
