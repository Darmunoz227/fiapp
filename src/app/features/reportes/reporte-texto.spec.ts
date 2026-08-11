import { construirTextoReporte } from './reporte-texto';
import { ResumenReporte } from './reportes-calculations';

describe('construirTextoReporte', () => {
  const base: ResumenReporte = {
    totalVendido: 150000, gananciaTotal: 45000, numeroVentas: 6,
    contadoCount: 3, fiadoCount: 1, mixtoCount: 2,
    contadoTotal: 90000, fiadoTotal: 60000,
    fiadoManualTotal: 50000, abonoTotal: 20000,
  };

  it('incluye las cifras principales', () => {
    const t = construirTextoReporte(base, 'Tienda Deportiva', 'Hoy');
    expect(t).toContain('Tienda Deportiva');
    expect(t).toContain('Hoy');
    expect(t).toContain('150.000');
    expect(t).toContain('45.000');
    expect(t).toContain('Ventas: 6');
  });

  it('calcula venta promedio y margen', () => {
    const t = construirTextoReporte(base, 'Tienda', 'Todo');
    expect(t).toContain('25.000');
    expect(t).toContain('30');
  });

  it('separa los dos grupos de fiado bajo encabezados distintos', () => {
    const t = construirTextoReporte(base, 'Tienda', 'Hoy');
    expect(t).toContain('Como te pagaron las ventas');
    expect(t).toContain('Movimientos de fiado aparte');
    expect(t).toContain('Fiados a mano');
  });

  it('con cero ventas no divide por cero', () => {
    const vacio: ResumenReporte = { ...base, totalVendido: 0, gananciaTotal: 0, numeroVentas: 0, contadoTotal: 0, fiadoTotal: 0 };
    const t = construirTextoReporte(vacio, 'Tienda', 'Hoy');
    expect(t).toContain('Venta promedio: $0');
    expect(t).not.toContain('NaN');
    expect(t).not.toContain('Infinity');
  });

  it('degrada a encabezado generico con nombre vacio', () => {
    const t = construirTextoReporte(base, '', 'Hoy');
    expect(t).toContain('Reporte FiApp');
    expect(t).not.toContain('undefined');
  });
});
