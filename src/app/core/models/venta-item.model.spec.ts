import { VentaItem } from './venta-item.model';

describe('VentaItem', () => {
  it('defines the sale line fields required by feature 011', () => {
    const ventaItem: VentaItem = {
      id: 'venta-item-1',
      venta_id: 'venta-1',
      producto_id: 'producto-1',
      cantidad: 3,
      precio_venta: 2500,
      costo_unitario: 1200,
      ganancia: 3900,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };

    expect(ventaItem.id).toBe('venta-item-1');
    expect(ventaItem.venta_id).toBe('venta-1');
    expect(ventaItem.producto_id).toBe('producto-1');
    expect(ventaItem.cantidad).toBe(3);
    expect(ventaItem.precio_venta).toBe(2500);
    expect(ventaItem.costo_unitario).toBe(1200);
    expect(ventaItem.ganancia).toBe(3900);
    expect(ventaItem.created_at).toBeNull();
    expect(ventaItem.updated_at).toBeNull();
    expect(ventaItem.deleted_at).toBeNull();
    expect(ventaItem.store_id).toBeNull();
    expect(ventaItem.created_by).toBeNull();
  });
});