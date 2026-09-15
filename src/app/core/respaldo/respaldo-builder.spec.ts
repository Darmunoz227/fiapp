import { construirRespaldo } from './respaldo-builder';
import { SCHEMA_VERSION } from '../database/schema-version';
import { Cliente } from '../models/cliente.model';
import { MovimInventario } from '../models/movim-inventario.model';
import { Venta } from '../models/venta.model';
import { VentaItem } from '../models/venta-item.model';

describe('construirRespaldo', () => {
  const vacio = { clientes: [], transacciones: [], productos: [], movim_inventario: [], ventas: [], venta_items: [], producciones: [], produccion_items: [], gastos: [], gastos_recurrentes: [] };

  it('incluye las seis tablas como arrays', () => {
    const r = construirRespaldo(vacio, '2026-08-05T00:00:00.000Z');
    expect(Array.isArray(r.data.clientes)).toBe(true);
    expect(Array.isArray(r.data.transacciones)).toBe(true);
    expect(Array.isArray(r.data.productos)).toBe(true);
    expect(Array.isArray(r.data.movim_inventario)).toBe(true);
    expect(Array.isArray(r.data.ventas)).toBe(true);
    expect(Array.isArray(r.data.venta_items)).toBe(true);
  });

  it('incluye producciones y produccion_items (schema v8)', () => {
    const r = construirRespaldo(vacio as any, '2026-08-05T00:00:00.000Z');
    const data = r.data as unknown as Record<string, unknown>;
    expect(Array.isArray(data['producciones'])).toBe(true);
    expect(Array.isArray(data['produccion_items'])).toBe(true);
  });

  it('embebe config cuando se le entrega', () => {
    const config = {
      catalogo_fiado: [{ id: 'c1', nombre: 'Tinto', precio: 1500 }],
      nombre_negocio: 'Tienda Diego',
    };
    const r = construirRespaldo(vacio as any, 'x', config as any);
    expect(r.config?.nombre_negocio).toBe('Tienda Diego');
    expect(r.config?.catalogo_fiado.length).toBe(1);
    expect(r.config?.catalogo_fiado[0].nombre).toBe('Tinto');
  });

  it('NO emite config cuando no se le entrega', () => {
    const r = construirRespaldo(vacio as any, 'x');
    expect(r.config).toBeUndefined();
  });

  it('embebe schema_version desde la constante, nunca un literal', () => {
    const r = construirRespaldo(vacio, '2026-08-05T00:00:00.000Z');
    expect(r.schema_version).toBe(SCHEMA_VERSION);
  });

  it('embebe exported_at tal cual se le entrega', () => {
    const r = construirRespaldo(vacio, '2026-08-05T00:00:00.000Z');
    expect(r.exported_at).toBe('2026-08-05T00:00:00.000Z');
  });

  it('conserva filas con deleted_at, no las filtra (AC-02)', () => {
    const borrado: Cliente = { id: 'c1', nombre: 'Borrado', deleted_at: 1700000000000 } as Cliente;
    const movBorrado: MovimInventario = { id: 'm1', producto_id: 'p1', tipo: 'COMPRA', cantidad: 5, costo_unitario: 100, fecha: 1, deleted_at: 1700000000000 };
    const r = construirRespaldo({ ...vacio, clientes: [borrado], movim_inventario: [movBorrado] }, 'x');
    expect(r.data.clientes.length).toBe(1);
    expect(r.data.clientes[0].deleted_at).toBe(1700000000000);
    expect(r.data.movim_inventario[0].deleted_at).toBe(1700000000000);
  });

  it('una venta de tres lineas da una fila en ventas y tres en venta_items (AC-03)', () => {
    const venta: Venta = { id: 'v1', tipo_pago: 'CONTADO', monto_contado: 3000, monto_fiado: null, fecha: 1 };
    const linea = (id: string): VentaItem => ({ id, venta_id: 'v1', producto_id: 'p' + id, cantidad: 1, precio_venta: 1000, costo_unitario: 500, ganancia: 500, created_at: null, updated_at: null, deleted_at: null, store_id: null, created_by: null });
    const r = construirRespaldo({ ...vacio, ventas: [venta], venta_items: [linea('i1'), linea('i2'), linea('i3')] }, 'x');
    expect(r.data.ventas.length).toBe(1);
    expect(r.data.venta_items.length).toBe(3);
  });
});
