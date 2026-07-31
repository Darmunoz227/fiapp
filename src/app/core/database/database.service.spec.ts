import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { DatabaseService } from './database.service';
import { Cliente } from '../models/cliente.model';
import { calcularStockDerivado } from '../../features/inventario/inventory-calculations';
import { MovimInventario } from '../models/movim-inventario.model';
import { Producto } from '../models/producto.model';
import { Transaccion } from '../models/transaccion.model';
import { Venta } from '../models/venta.model';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatabaseService],
    });

    service = TestBed.inject(DatabaseService);
    spyOn(Capacitor, 'getPlatform').and.returnValue('web');
  });

  function crearClienteParcial(overrides: Partial<Cliente> = {}): Cliente {
    return {
      id: overrides.id ?? 'cliente-1',
      nombre: overrides.nombre ?? 'Cliente 1',
      telefono: overrides.telefono ?? '3001234567',
      habeas_data_flag: overrides.habeas_data_flag ?? true,
      fecha_creacion: overrides.fecha_creacion ?? Date.now(),
      deleted_at: overrides.deleted_at ?? null,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  function crearTransaccionParcial(overrides: Partial<Transaccion> = {}): Transaccion {
    return {
      id: overrides.id ?? 'transaccion-1',
      cliente_id: overrides.cliente_id ?? 'cliente-1',
      tipo: overrides.tipo ?? 'fiado',
      monto: overrides.monto ?? 100,
      concepto: overrides.concepto ?? 'Fiado inicial',
      fecha: overrides.fecha ?? Date.now(),
      deleted_at: overrides.deleted_at ?? null,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  function crearProductoParcial(overrides: Partial<Producto> = {}): Producto {
    return {
      id: overrides.id ?? 'producto-1',
      nombre: overrides.nombre ?? 'Producto 1',
      precio_venta: overrides.precio_venta ?? 2500,
      tipo_venta: overrides.tipo_venta ?? 'UNIDAD',
      minimo_stock: overrides.minimo_stock ?? 5,
      costo_promedio: overrides.costo_promedio ?? 1800,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      deleted_at: overrides.deleted_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  function crearMovimientoParcial(overrides: Partial<MovimInventario> = {}): MovimInventario {
    return {
      id: overrides.id ?? 'movimiento-1',
      producto_id: overrides.producto_id ?? 'producto-1',
      tipo: overrides.tipo ?? 'COMPRA',
      cantidad: overrides.cantidad ?? 10,
      costo_unitario: overrides.costo_unitario ?? 1000,
      motivo: overrides.motivo ?? 'Movimiento de inventario',
      fecha: overrides.fecha ?? Date.now(),
      actor_id: overrides.actor_id ?? 'usuario-1',
      stock_calculado_anterior: overrides.stock_calculado_anterior ?? null,
      cantidad_fisica: overrides.cantidad_fisica ?? null,
      diferencia_calculada: overrides.diferencia_calculada ?? null,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      deleted_at: overrides.deleted_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

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

  function crearMovimiento(movimiento: MovimInventario): Promise<void> {
    return Promise.resolve().then(() => (service as any).crearMovimiento(movimiento));
  }

  function obtenerMovimientosPorProducto(productoId: string): Promise<MovimInventario[]> {
    return Promise.resolve().then(() => (service as any).obtenerMovimientosPorProducto(productoId));
  }

  it('softDeleteCliente hides the client from obtenerClientes but keeps the deleted_at mark internally', async () => {
    const cliente = crearClienteParcial({ id: 'cliente-1' });
    await service.crearCliente(cliente);

    await service.softDeleteCliente('cliente-1');

    const clientesVisibles = await service.obtenerClientes();
    expect(clientesVisibles.length).toBe(0);

    const mockClientes = (service as any).mockWebClientes as Cliente[];
    expect(mockClientes.length).toBe(1);
    expect(mockClientes[0].id).toBe('cliente-1');
    expect(mockClientes[0].deleted_at).not.toBeNull();
  });

  it('restoreCliente brings a soft-deleted client back into obtenerClientes', async () => {
    const cliente = crearClienteParcial({ id: 'cliente-1' });
    await service.crearCliente(cliente);
    await service.softDeleteCliente('cliente-1');

    await service.restoreCliente('cliente-1');

    const clientesVisibles = await service.obtenerClientes();
    expect(clientesVisibles.length).toBe(1);
    expect(clientesVisibles[0].id).toBe('cliente-1');
    expect(clientesVisibles[0].deleted_at ?? null).toBeNull();
  });

  it('contarClientes excludes soft-deleted clients', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearCliente(crearClienteParcial({ id: 'cliente-2' }));
    await service.crearCliente(crearClienteParcial({ id: 'cliente-3' }));

    await service.softDeleteCliente('cliente-2');

    await expectAsync(service.contarClientes()).toBeResolvedTo(2);
  });

  it('obtenerClientePorId returns null for a soft-deleted client', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.softDeleteCliente('cliente-1');

    await expectAsync(service.obtenerClientePorId('cliente-1')).toBeResolvedTo(null);
  });

  it('softDeleteTransaccion excludes the transaction from obtenerTransaccionesPorCliente', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'transaccion-1', cliente_id: 'cliente-1' }));

    await service.softDeleteTransaccion('transaccion-1');

    const transaccionesVisibles = await service.obtenerTransaccionesPorCliente('cliente-1');
    expect(transaccionesVisibles.length).toBe(0);

    const mockTransacciones = (service as any).mockWebTransacciones as Transaccion[];
    expect(mockTransacciones.length).toBe(1);
    expect(mockTransacciones[0].id).toBe('transaccion-1');
    expect(mockTransacciones[0].deleted_at).not.toBeNull();
  });

  it('restoreTransaccion brings a soft-deleted transaction back into obtenerTransaccionesPorCliente', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'transaccion-1', cliente_id: 'cliente-1' }));
    await service.softDeleteTransaccion('transaccion-1');

    await service.restoreTransaccion('transaccion-1');

    const transaccionesVisibles = await service.obtenerTransaccionesPorCliente('cliente-1');
    expect(transaccionesVisibles.length).toBe(1);
    expect(transaccionesVisibles[0].id).toBe('transaccion-1');
    expect(transaccionesVisibles[0].deleted_at ?? null).toBeNull();
  });

  it('stores and retrieves a product with the expected persisted fields', async () => {
    const producto = crearProductoParcial({
      id: 'producto-1',
      nombre: 'Carne molida',
      precio_venta: 12500,
      tipo_venta: 'PESO',
      minimo_stock: 3000,
      costo_promedio: 9800,
    });

    await service.crearProducto(producto);

    const productos = await service.obtenerProductos();

    expect(productos.length).toBe(1);
    expect(productos[0]).toEqual(jasmine.objectContaining({
      id: 'producto-1',
      nombre: 'Carne molida',
      precio_venta: 12500,
      tipo_venta: 'PESO',
      minimo_stock: 3000,
      costo_promedio: 9800,
    }));
  });

  it('COMPRA increases derived stock', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1200,
      producto_id: 'producto-1',
    }));

    const movimientos = await obtenerMovimientosPorProducto('producto-1');

    expect(calcularStockDerivado(movimientos)).toBe(10);
  });

  it('VENTA reduces derived stock', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    const movimientos = await obtenerMovimientosPorProducto('producto-1');

    expect(calcularStockDerivado(movimientos)).toBe(7);
  });

  it('CONTADO sale drops stock, records venta with frozen ganancia, no client debt', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-1',
      monto_contado: 4500,
      monto_fiado: 0,
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
      tipo_pago: 'CONTADO',
      cliente_id: null,
    });

    const movimientoVenta = crearMovimientoParcial({
      id: 'movimiento-venta-1',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    });

    await service.registrarVenta(venta, movimientoVenta);

    const movimientos = await obtenerMovimientosPorProducto('p1');
    const ventas = await service.obtenerVentas();
    const deudasCliente = await service.obtenerTransaccionesPorCliente('c1');

    expect(calcularStockDerivado(movimientos)).toBe(7);
    expect(ventas).toContain(jasmine.objectContaining({ id: 'venta-1', ganancia: 1500 }));
    expect(deudasCliente.length).toBe(0);
  });

  it('FIADO sale atomically creates venta + VENTA movement + client debt', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-2',
      monto_contado: 0,
      monto_fiado: 4500,
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
      tipo_pago: 'FIADO',
      cliente_id: 'c1',
    });

    const movimientoVenta = crearMovimientoParcial({
      id: 'movimiento-venta-2',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    });

    const transaccionFiado = crearTransaccionParcial({
      id: 'transaccion-fiado-1',
      cliente_id: 'c1',
      tipo: 'fiado',
      monto: venta.precio_venta * venta.cantidad,
      concepto: 'Venta fiada',
    });

    await service.registrarVenta(venta, movimientoVenta, transaccionFiado);

    const movimientos = await obtenerMovimientosPorProducto('p1');
    const ventas = await service.obtenerVentas();
    const deudasCliente = await service.obtenerTransaccionesPorCliente('c1');

    expect(calcularStockDerivado(movimientos)).toBe(7);
    expect(ventas).toContain(jasmine.objectContaining({ id: 'venta-2', cliente_id: 'c1', tipo_pago: 'FIADO' }));
    expect(deudasCliente).toContain(jasmine.objectContaining({ id: 'transaccion-fiado-1', tipo: 'fiado' }));
  });
  it('COMPRA rollback: if the movement insert fails, costo_promedio is NOT modified', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-baseline',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 1000,
    }));

    const costoAntes = (await service.obtenerProductos())
      .find((producto) => producto.id === 'p1')!.costo_promedio;
    expect(costoAntes).toBe(1000);

    const movimientos = (service as any).mockWebMovimInventario as MovimInventario[];
    spyOn(movimientos, 'push').and.throwError('simulated movement insert failure');

    await expectAsync(crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-falla',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 2000,
    }))).toBeRejected();

    const costoDespues = (await service.obtenerProductos())
      .find((producto) => producto.id === 'p1')!.costo_promedio;

    expect(costoDespues).toBe(1000);
    expect((await obtenerMovimientosPorProducto('p1')).length).toBe(1);
  });
  it('ROLLBACK (mandatory): if a write fails, NOTHING persists', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-rollback-1',
      producto_id: 'p1',
      cantidad: 99,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 49500,
      tipo_pago: 'FIADO',
      cliente_id: 'c1',
    });

    const movimientoVenta = crearMovimientoParcial({
      id: 'movimiento-venta-rollback-1',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 99,
      costo_unitario: 0,
    });

    const transaccionFiado = crearTransaccionParcial({
      id: 'transaccion-fiado-rollback-1',
      cliente_id: 'c1',
      tipo: 'fiado',
      monto: venta.precio_venta * venta.cantidad,
      concepto: 'Venta fiada fallida',
    });

    await expectAsync(service.registrarVenta(venta, movimientoVenta, transaccionFiado)).toBeRejected();

    const movimientos = await obtenerMovimientosPorProducto('p1');
    const ventas = await service.obtenerVentas();
    const deudasCliente = await service.obtenerTransaccionesPorCliente('c1');

    expect(calcularStockDerivado(movimientos)).toBe(5);
    expect(ventas.length).toBe(0);
    expect(deudasCliente.some((transaccion) => transaccion.id === 'transaccion-fiado-rollback-1')).toBeFalse();
  });

  it('ganancia is immutable after a later COMPRA changes costo_promedio', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-3',
      monto_contado: 4500,
      monto_fiado: 0,
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
      tipo_pago: 'CONTADO',
      cliente_id: null,
    });

    const movimientoVenta = crearMovimientoParcial({
      id: 'movimiento-venta-3',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    });

    await service.registrarVenta(venta, movimientoVenta);

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-2',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 2000,
    }));

    const ventas = await service.obtenerVentas();
    const ventaPersistida = ventas.find((item) => item.id === 'venta-3');

    expect(ventaPersistida).toEqual(jasmine.objectContaining({ ganancia: 1500 }));
  });

  it('VENTA exceeding stock is BLOCKED', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    const movimientosAntes = await obtenerMovimientosPorProducto('producto-1');

    const venta = crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      tipo: 'VENTA',
      cantidad: 8,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    await expectAsync(venta).toBeRejected();

    const movimientosDespues = await obtenerMovimientosPorProducto('producto-1');

    expect(movimientosDespues.length).toBe(movimientosAntes.length);
  });

  it('MERMA exceeding stock is BLOCKED', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    const movimientosAntes = await obtenerMovimientosPorProducto('producto-1');

    const merma = crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-merma-1',
      tipo: 'MERMA',
      cantidad: 8,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    await expectAsync(merma).toBeRejected();

    const movimientosDespues = await obtenerMovimientosPorProducto('producto-1');

    expect(movimientosDespues.length).toBe(movimientosAntes.length);
  });

  it('Weighted-average cost on COMPRA', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1', costo_promedio: 0 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-2',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 2000,
      producto_id: 'producto-1',
    }));

    const productos = await service.obtenerProductos();

    expect(productos[0].costo_promedio).toBe(1500);
  });

  it('VENTA/AJUSTE/MERMA do NOT change costo_promedio', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1', costo_promedio: 0 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    const productoConCosto = (await service.obtenerProductos())[0];
    expect(productoConCosto.costo_promedio).toBe(1000);

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    const productoDespuesVenta = (await service.obtenerProductos())[0];
    expect(productoDespuesVenta.costo_promedio).toBe(1000);

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-merma-1',
      tipo: 'MERMA',
      cantidad: 1,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    const productoDespuesMerma = (await service.obtenerProductos())[0];
    expect(productoDespuesMerma.costo_promedio).toBe(1000);

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-ajuste-1',
      tipo: 'AJUSTE',
      cantidad: 0,
      costo_unitario: 0,
      producto_id: 'producto-1',
      stock_calculado_anterior: 10,
      cantidad_fisica: 8,
      diferencia_calculada: -2,
    }));

    const productoDespuesAjuste = (await service.obtenerProductos())[0];
    expect(productoDespuesAjuste.costo_promedio).toBe(1000);
  });

  it('AJUSTE stores delta + audit metadata', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    const movimientoAjuste = crearMovimientoParcial({
      id: 'movimiento-ajuste-1',
      tipo: 'AJUSTE',
      cantidad: 0,
      costo_unitario: 0,
      producto_id: 'producto-1',
      stock_calculado_anterior: 10,
      cantidad_fisica: 8,
      diferencia_calculada: -2,
    });

    await crearMovimiento(movimientoAjuste);

    const movimientos = await obtenerMovimientosPorProducto('producto-1');
    const movimientoAjustePersistido = movimientos.find((movimiento) => movimiento.id === 'movimiento-ajuste-1');

    expect(movimientoAjustePersistido).toEqual(jasmine.objectContaining({
      diferencia_calculada: -2,
      stock_calculado_anterior: 10,
      cantidad_fisica: 8,
    }));
  });

  it('soft-deleting a VENTA excludes it from active history and recomputes stock', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    }));

    await service.softDeleteMovimiento('movimiento-venta-1');

    const movimientos = await obtenerMovimientosPorProducto('p1');

    expect(movimientos.some((movimiento) => movimiento.id === 'movimiento-venta-1')).toBeFalse();
    expect(calcularStockDerivado(movimientos)).toBe(10);
  });

  it('soft-deleting a MERMA recomputes stock', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-merma-1',
      producto_id: 'p1',
      tipo: 'MERMA',
      cantidad: 2,
      costo_unitario: 0,
    }));

    await service.softDeleteMovimiento('movimiento-merma-1');

    const movimientos = await obtenerMovimientosPorProducto('p1');

    expect(movimientos.some((movimiento) => movimiento.id === 'movimiento-merma-1')).toBeFalse();
    expect(calcularStockDerivado(movimientos)).toBe(10);
  });

  it('soft-deleting an AJUSTE recomputes stock', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-ajuste-1',
      producto_id: 'p1',
      tipo: 'AJUSTE',
      cantidad: 0,
      costo_unitario: 0,
      stock_calculado_anterior: 10,
      cantidad_fisica: 8,
      diferencia_calculada: -2,
    }));

    await service.softDeleteMovimiento('movimiento-ajuste-1');

    const movimientos = await obtenerMovimientosPorProducto('p1');

    expect(movimientos.some((movimiento) => movimiento.id === 'movimiento-ajuste-1')).toBeFalse();
    expect(calcularStockDerivado(movimientos)).toBe(10);
  });

  it('soft-deleting a COMPRA is REJECTED', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    await expectAsync(service.softDeleteMovimiento('movimiento-compra-1')).toBeRejected();

    const movimientos = await obtenerMovimientosPorProducto('p1');

    expect(movimientos.some((movimiento) => movimiento.id === 'movimiento-compra-1')).toBeTrue();
  });

  it('restoring a soft-deleted VENTA makes it count again', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1' }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    }));

    await service.softDeleteMovimiento('movimiento-venta-1');
    await service.restoreMovimiento('movimiento-venta-1');

    const movimientos = await obtenerMovimientosPorProducto('p1');

    expect(movimientos.some((movimiento) => movimiento.id === 'movimiento-venta-1')).toBeTrue();
    expect(calcularStockDerivado(movimientos)).toBe(7);
  });

  it('obtenerResumenInventario reflects derived stock and low-stock status for COMPRA and VENTA movements', async () => {
    await service.crearProducto(crearProductoParcial({
      id: 'producto-1',
      minimo_stock: 5,
      costo_promedio: 1800,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
      producto_id: 'producto-1',
    }));

    const resumenDespuesCompra = await service.obtenerResumenInventario();
    expect(resumenDespuesCompra).toContain(jasmine.objectContaining({
      producto_id: 'producto-1',
      stock_derivado: 10,
      costo_promedio: 1000,
      stock_bajo: false,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-venta-1',
      tipo: 'VENTA',
      cantidad: 6,
      costo_unitario: 0,
      producto_id: 'producto-1',
    }));

    const resumenDespuesVenta = await service.obtenerResumenInventario();
    expect(resumenDespuesVenta).toContain(jasmine.objectContaining({
      producto_id: 'producto-1',
      stock_derivado: 4,
      costo_promedio: 1000,
      stock_bajo: true,
    }));
  });

  it('obtenerResumenInventario marks stock as low when it is exactly at the minimum', async () => {
    await service.crearProducto(crearProductoParcial({
      id: 'producto-2',
      minimo_stock: 5,
      costo_promedio: 2200,
    }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-2',
      tipo: 'COMPRA',
      cantidad: 5,
      costo_unitario: 900,
      producto_id: 'producto-2',
    }));

    const resumen = await service.obtenerResumenInventario();

    expect(resumen).toContain(jasmine.objectContaining({
      producto_id: 'producto-2',
      stock_derivado: 5,
      costo_promedio: 900,
      stock_bajo: true,
    }));
  });

  it("MIXTO sale persists venta, ONE movement, and fiado for the unpaid balance only", async () => {
    await service.crearCliente(crearClienteParcial({ id: "c1" }));
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-mix", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-mix", producto_id: "p1", cantidad: 2, precio_venta: 15000, costo_unitario: 1000, ganancia: 28000, tipo_pago: "MIXTO", cliente_id: "c1", monto_contado: 10000, monto_fiado: 20000 });
    const mov = crearMovimientoParcial({ id: "mv-mix", producto_id: "p1", tipo: "VENTA", cantidad: 2, costo_unitario: 0 });
    const tx = crearTransaccionParcial({ id: "tx-mix", cliente_id: "c1", tipo: "fiado", monto: 20000, concepto: "Saldo venta mixta" });
    await service.registrarVenta(venta, mov, tx);
    const ventas = await service.obtenerVentas();
    const movimientos = await obtenerMovimientosPorProducto("p1");
    const deudas = await service.obtenerTransaccionesPorCliente("c1");
    expect(ventas).toContain(jasmine.objectContaining({ id: "v-mix", monto_contado: 10000, monto_fiado: 20000 }));
    expect(movimientos.filter((m) => m.tipo === "VENTA").length).toBe(1);
    expect(deudas).toContain(jasmine.objectContaining({ id: "tx-mix", monto: 20000 }));
  });

  it("REJECTS a sale whose amounts do not add up to the total", async () => {
    await service.crearCliente(crearClienteParcial({ id: "c1" }));
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-bad", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-bad", producto_id: "p1", cantidad: 2, precio_venta: 15000, cliente_id: "c1", monto_contado: 10000, monto_fiado: 5000 });
    const mov = crearMovimientoParcial({ id: "mv-bad", producto_id: "p1", tipo: "VENTA", cantidad: 2, costo_unitario: 0 });
    await expectAsync(service.registrarVenta(venta, mov)).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS a negative amount", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-neg", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-neg", producto_id: "p1", cantidad: 1, precio_venta: 1500, monto_contado: 3000, monto_fiado: -1500 });
    const mov = crearMovimientoParcial({ id: "mv-neg", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(service.registrarVenta(venta, mov)).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS null amounts", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-null", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-null", producto_id: "p1", cantidad: 1, precio_venta: 1500 });
    (venta as any).monto_contado = null;
    (venta as any).monto_fiado = null;
    const mov = crearMovimientoParcial({ id: "mv-null", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(service.registrarVenta(venta, mov)).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS monto_fiado greater than 0 without a cliente_id", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-nocli", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-nocli", producto_id: "p1", cantidad: 1, precio_venta: 1500, cliente_id: null, monto_contado: 500, monto_fiado: 1000 });
    const mov = crearMovimientoParcial({ id: "mv-nocli", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(service.registrarVenta(venta, mov)).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("ACCEPTS float representation noise within the one-cent tolerance", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-float", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1 }));
    const venta = crearVentaParcial({ id: "v-float", producto_id: "p1", cantidad: 3, precio_venta: 1.1, costo_unitario: 1, ganancia: 0.3, monto_contado: 3.3, monto_fiado: 0 });
    const mov = crearMovimientoParcial({ id: "mv-float", producto_id: "p1", tipo: "VENTA", cantidad: 3, costo_unitario: 0 });
    await service.registrarVenta(venta, mov);
    expect((await service.obtenerVentas()).length).toBe(1);
  });
});
