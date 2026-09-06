import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { DatabaseService } from './database.service';
import { Cliente } from '../models/cliente.model';
import { calcularStockDerivado } from '../../features/inventario/inventory-calculations';
import { MovimInventario } from '../models/movim-inventario.model';
import { VentaConItems } from '../models/venta-con-items.model';
import { Producto } from '../models/producto.model';
import { Transaccion } from '../models/transaccion.model';
import { VentaItem } from '../models/venta-item.model';
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

  function crearConexionInicializacion(): { sqlite: any; db: any } {
    const db = {
      isDBOpen: jasmine.createSpy('isDBOpen').and.resolveTo({ result: true }),
      open: jasmine.createSpy('open').and.resolveTo(undefined),
      query: jasmine.createSpy('query').and.callFake((sql: string) => {
        if (sql.includes('PRAGMA user_version')) {
          return Promise.resolve({ values: [{ user_version: 0 }] });
        }

        return Promise.resolve({ values: [] });
      }),
      execute: jasmine.createSpy('execute').and.resolveTo(undefined),
    };

    const sqlite = {
      isConnection: jasmine.createSpy('isConnection').and.resolveTo({ result: false }),
      retrieveConnection: jasmine.createSpy('retrieveConnection').and.resolveTo(db),
      createConnection: jasmine.createSpy('createConnection').and.resolveTo(db),
    };

    return { sqlite, db };
  }

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
      venta_id: overrides.venta_id ?? null,
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

  function crearVentaParcial(overrides: Partial<LegacyVentaRow> = {}): LegacyVentaRow {
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

  function crearVentaItemParcial(overrides: Partial<VentaItem> = {}): VentaItem {
    return {
      id: overrides.id ?? 'venta-item-1',
      venta_id: overrides.venta_id ?? 'venta-1',
      producto_id: overrides.producto_id ?? 'producto-1',
      cantidad: overrides.cantidad ?? 1,
      precio_venta: overrides.precio_venta ?? 1500,
      costo_unitario: overrides.costo_unitario ?? 1000,
      ganancia: overrides.ganancia ?? 500,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      deleted_at: overrides.deleted_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  function crearVentaItemDesdeVenta(venta: LegacyVentaRow): VentaItem {
    return crearVentaItemParcial({
      id: `venta-item-${venta.id}`,
      venta_id: venta.id,
      producto_id: venta.producto_id,
      cantidad: venta.cantidad,
      precio_venta: venta.precio_venta,
      costo_unitario: venta.costo_unitario,
      ganancia: venta.ganancia,
      created_at: venta.created_at ?? null,
      updated_at: venta.updated_at ?? null,
      deleted_at: venta.deleted_at ?? null,
      store_id: venta.store_id ?? null,
      created_by: venta.created_by ?? null,
    });
  }

  function crearMovimiento(movimiento: MovimInventario): Promise<void> {
    const servicioInterno = service as unknown as { crearMovimiento(movimiento: MovimInventario): Promise<void> };
    return Promise.resolve().then(() => servicioInterno.crearMovimiento(movimiento));
  }

  function obtenerMovimientosPorProducto(productoId: string): Promise<MovimInventario[]> {
    const servicioInterno = service as unknown as { obtenerMovimientosPorProducto(productoId: string): Promise<MovimInventario[]> };
    return Promise.resolve().then(() => servicioInterno.obtenerMovimientosPorProducto(productoId));
  }

  function obtenerMockClientes(): Cliente[] {
    return (service as unknown as { mockWebClientes: Cliente[] }).mockWebClientes;
  }

  function obtenerMockTransacciones(): Transaccion[] {
    return (service as unknown as { mockWebTransacciones: Transaccion[] }).mockWebTransacciones;
  }

  async function obtenerMockTransaccionesOrdenadas(): Promise<Transaccion[]> {
    return service.obtenerTransacciones();
  }

  function obtenerMockMovimientos(): MovimInventario[] {
    return (service as unknown as { mockWebMovimInventario: MovimInventario[] }).mockWebMovimInventario;
  }

  function obtenerMockVentaItems(): VentaItem[] {
    return (service as unknown as { mockWebVentaItems: VentaItem[] }).mockWebVentaItems;
  }

  function obtenerMockVentas(): VentaConItems[] {
    const ventas = (service as unknown as { mockWebVentas: Venta[] }).mockWebVentas;
    const items = obtenerMockVentaItems();

    return ventas.map((venta) => ({
      venta,
      items: items.filter((item) => item.venta_id === venta.id),
    }));
  }

  it('reuses the in-flight initialization promise so concurrent callers only run once', async () => {
    (Capacitor.getPlatform as jasmine.Spy).and.returnValue('android');

    const { sqlite, db } = crearConexionInicializacion();
    (service as unknown as { sqlite: typeof sqlite }).sqlite = sqlite;

    const primera = service.initializePlugin();
    const segunda = service.initializePlugin();

    await expectAsync(primera).toBeResolvedTo(true);
    await expectAsync(segunda).toBeResolvedTo(true);

    expect(sqlite.isConnection).toHaveBeenCalledTimes(1);
    expect(sqlite.createConnection).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalled();
  });

  function registrarVentaExtendida(
    venta: Venta,
    items: VentaItem[],
    movimientos: MovimInventario[],
    transaccionFiado?: Transaccion,
  ): Promise<void> {
    const registrarVenta = service.registrarVenta.bind(service) as unknown as (
      venta: Venta,
      items: VentaItem[],
      movimientos: MovimInventario[],
      transaccionFiado?: Transaccion,
    ) => Promise<void>;

    return registrarVenta(venta, items, movimientos, transaccionFiado);
  }

  it('softDeleteCliente hides the client from obtenerClientes but keeps the deleted_at mark internally', async () => {
    const cliente = crearClienteParcial({ id: 'cliente-1' });
    await service.crearCliente(cliente);

    await service.softDeleteCliente('cliente-1');

    const clientesVisibles = await service.obtenerClientes();
    expect(clientesVisibles.length).toBe(0);

    const mockClientes = obtenerMockClientes();
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

  it('crearCliente genera created_at cuando no viene', async () => {
    const antes = Date.now();
    await service.crearCliente(crearClienteParcial({ id: 'cliente-audit-1', created_at: null }));
    const creado = obtenerMockClientes().find((c) => c.id === 'cliente-audit-1');
    expect(typeof creado!.created_at).toBe('number');
    expect(creado!.created_at as number).toBeGreaterThanOrEqual(antes);
  });

  it('crearCliente respeta un created_at explicito', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-audit-2', created_at: 1700000000000 }));
    const creado = obtenerMockClientes().find((c) => c.id === 'cliente-audit-2');
    expect(creado!.created_at).toBe(1700000000000);
  });

  it('crearProducto genera created_at cuando no viene', async () => {
    const antes = Date.now();
    await service.crearProducto(crearProductoParcial({ id: 'producto-audit-1', created_at: null }));
    const mock = (service as unknown as { mockWebProductos: Producto[] }).mockWebProductos;
    const creado = mock.find((p) => p.id === 'producto-audit-1');
    expect(typeof creado!.created_at).toBe('number');
    expect(creado!.created_at as number).toBeGreaterThanOrEqual(antes);
  });

  it('crearProducto respeta un created_at explicito', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'producto-audit-2', created_at: 1700000000000 }));
    const mock = (service as unknown as { mockWebProductos: Producto[] }).mockWebProductos;
    const creado = mock.find((p) => p.id === 'producto-audit-2');
    expect(creado!.created_at).toBe(1700000000000);
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

    const mockTransacciones = obtenerMockTransacciones();
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

  it('actualizarCliente actualiza nombre y telefono del mismo id y setea updated_at', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1', nombre: 'Ana', telefono: '' }));

    await service.actualizarCliente(crearClienteParcial({ id: 'c1', nombre: 'Ana Maria', telefono: '3009998888' }));

    const clientes = obtenerMockClientes();
    expect(clientes.length).toBe(1);
    expect(clientes[0].id).toBe('c1');
    expect(clientes[0].nombre).toBe('Ana Maria');
    expect(clientes[0].telefono).toBe('3009998888');
    expect(clientes[0].updated_at).toEqual(jasmine.any(Number));
  });

  it('actualizarCliente NO altera created_at ni fecha_creacion', async () => {
    const fecha = 1700000000000;
    await service.crearCliente(crearClienteParcial({ id: 'c2', created_at: 1700000000000, fecha_creacion: fecha }));

    await service.actualizarCliente(crearClienteParcial({ id: 'c2', nombre: 'Nuevo Nombre' }));

    const cliente = obtenerMockClientes().find((c) => c.id === 'c2');
    expect(cliente?.created_at).toBe(1700000000000);
    expect(cliente?.fecha_creacion).toBe(fecha);
  });

  it('obtenerTransacciones returns all non-deleted transactions ordered by fecha DESC on the web mock path', async () => {
    await service.crearTransaccion(crearTransaccionParcial({ id: 'tx-old', fecha: 10, cliente_id: 'cliente-1' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'tx-mid', fecha: 20, cliente_id: 'cliente-2' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'tx-new', fecha: 30, cliente_id: 'cliente-3' }));
    await service.softDeleteTransaccion('tx-mid');

    const transacciones = await obtenerMockTransaccionesOrdenadas();

    expect(transacciones.map((transaccion) => transaccion.id)).toEqual(['tx-new', 'tx-old']);
    expect(transacciones.every((transaccion) => transaccion.deleted_at == null)).toBeTrue();
  });

  it('obtenerTransacciones queries the native path ordered by fecha DESC and excludes deleted rows', async () => {
    (Capacitor.getPlatform as jasmine.Spy).and.returnValue('android');

    const rows: Transaccion[] = [
      crearTransaccionParcial({ id: 'tx-old', fecha: 10, deleted_at: null }),
      crearTransaccionParcial({ id: 'tx-new', fecha: 30, deleted_at: null }),
    ];
    const querySpy = jasmine.createSpy('query').and.resolveTo({ values: rows } as { values: Transaccion[] });
    (service as unknown as { db: { query: jasmine.Spy }; isInitialized: boolean }).db = { query: querySpy };
    (service as unknown as { isInitialized: boolean }).isInitialized = true;

    const transacciones = await service.obtenerTransacciones();

    expect(querySpy).toHaveBeenCalledWith('SELECT * FROM transacciones WHERE deleted_at IS NULL ORDER BY fecha DESC');
    expect(transacciones).toEqual(rows);
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

    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [movimientoVenta]);

    const movimientos = await obtenerMovimientosPorProducto('p1');
    const ventas = await service.obtenerVentas();
    const ventaItems = obtenerMockVentaItems();
    const deudasCliente = await service.obtenerTransaccionesPorCliente('c1');

    expect(calcularStockDerivado(movimientos)).toBe(7);
    expect(ventas).toContain(jasmine.objectContaining({
      venta: jasmine.objectContaining({
        id: 'venta-1',
        tipo_pago: 'CONTADO',
        monto_contado: 4500,
        monto_fiado: 0,
        cliente_id: null,
      }),
      items: jasmine.arrayContaining([
        jasmine.objectContaining({
          producto_id: 'p1',
          cantidad: 3,
          precio_venta: 1500,
          costo_unitario: 1000,
          ganancia: 1500,
        }),
      ]),
    }));
    expect(ventaItems).toContain(jasmine.objectContaining({ id: 'venta-item-venta-1', ganancia: 1500 }));
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

    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [movimientoVenta], transaccionFiado);

    const movimientos = await obtenerMovimientosPorProducto('p1');
    const ventas = await service.obtenerVentas();
    const deudasCliente = await service.obtenerTransaccionesPorCliente('c1');

    expect(calcularStockDerivado(movimientos)).toBe(7);
    expect(ventas).toContain(jasmine.objectContaining({
      venta: jasmine.objectContaining({ id: 'venta-2', cliente_id: 'c1', tipo_pago: 'FIADO' }),
      items: jasmine.arrayContaining([
        jasmine.objectContaining({ venta_id: 'venta-2', producto_id: 'p1', cantidad: 3, precio_venta: 1500, costo_unitario: 1000, ganancia: 1500 }),
      ]),
    }));
    expect(deudasCliente).toContain(jasmine.objectContaining({ id: 'transaccion-fiado-1', tipo: 'fiado' }));
  });
  it('PRODUCCION actualiza costo_promedio via promedio ponderado, igual que COMPRA', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-produccion-1',
      producto_id: 'p1',
      tipo: 'PRODUCCION',
      cantidad: 10,
      costo_unitario: 800,
    }));

    const costoDespues = (await service.obtenerProductos())
      .find((producto) => producto.id === 'p1')!.costo_promedio;

    expect(costoDespues).toBe(800);
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

    const movimientos = obtenerMockMovimientos();
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
  it('actualizarProducto activa modo_produccion cuando se provee explicitamente', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await service.actualizarProducto('p1', 'Empanada', 1500, 5, true);

    const producto = (await service.obtenerProductos()).find((p) => p.id === 'p1');
    expect(producto?.modo_produccion).toBe(true);
  });

  it('actualizarProducto NO altera modo_produccion cuando no se provee (compatibilidad hacia atras)', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p2', costo_promedio: 1000 }));
    await service.actualizarProducto('p2', 'Camiseta', 30000, 3, true);

    await service.actualizarProducto('p2', 'Camiseta Roja', 32000, 3);

    const producto = (await service.obtenerProductos()).find((p) => p.id === 'p2');
    expect(producto?.modo_produccion).toBe(true);
    expect(producto?.nombre).toBe('Camiseta Roja');
  });

  it('registrarProduccion crea 1 cabecera + N items + N movimientos en una sola transaccion', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));
    await service.crearProducto(crearProductoParcial({ id: 'p2', costo_promedio: 500 }));

    const produccion = { id: 'produccion-1', fecha: Date.now(), nota: null } as any;
    const items = [
      { id: 'pi-1', produccion_id: 'produccion-1', producto_id: 'p1', cantidad: 20, costo_unitario_declarado: 800 } as any,
      { id: 'pi-2', produccion_id: 'produccion-1', producto_id: 'p2', cantidad: 15, costo_unitario_declarado: 300 } as any,
    ];
    const movimientos = [
      crearMovimientoParcial({ id: 'mov-p1', producto_id: 'p1', tipo: 'PRODUCCION', cantidad: 20, costo_unitario: 800 }),
      crearMovimientoParcial({ id: 'mov-p2', producto_id: 'p2', tipo: 'PRODUCCION', cantidad: 15, costo_unitario: 300 }),
    ];

    await service.registrarProduccion(produccion, items, movimientos);

    const producciones = await service.obtenerProducciones();
    expect(producciones.length).toBe(1);
    expect(producciones[0].items.length).toBe(2);
    expect(producciones[0].produccion.id).toBe('produccion-1');

    const costoP1 = (await service.obtenerProductos()).find((p) => p.id === 'p1')!.costo_promedio;
    const costoP2 = (await service.obtenerProductos()).find((p) => p.id === 'p2')!.costo_promedio;
    expect(costoP1).toBe(800);
    expect(costoP2).toBe(300);
  });

  it('reemplazarTodo restaura producciones, items y el flag modo_produccion', async () => {
    const data: any = {
      clientes: [],
      transacciones: [],
      productos: [{ id: 'p1', nombre: 'Empanada', precio_venta: 2500, tipo_venta: 'UNIDAD', minimo_stock: 5, costo_promedio: 800, modo_produccion: true }],
      movim_inventario: [],
      ventas: [],
      venta_items: [],
      producciones: [{ id: 'prod-1', fecha: 1700000000000, nota: null }],
      produccion_items: [{ id: 'pi-1', produccion_id: 'prod-1', producto_id: 'p1', cantidad: 10, costo_unitario_declarado: 800 }],
    };

    const conteo: any = await service.reemplazarTodo(data);

    expect(conteo.producciones).toBe(1);
    expect(conteo.produccion_items).toBe(1);

    const producciones = await service.obtenerProducciones();
    expect(producciones.length).toBe(1);
    expect(producciones[0].items.length).toBe(1);

    const producto = (await service.obtenerProductos()).find((p) => p.id === 'p1');
    expect(producto?.modo_produccion).toBeTruthy();
  });

  it('resetInventario borra tambien producciones y produccion_items (schema v8)', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    const produccion = { id: 'produccion-reset', fecha: Date.now(), nota: null } as any;
    const items = [
      { id: 'pi-reset', produccion_id: 'produccion-reset', producto_id: 'p1', cantidad: 5, costo_unitario_declarado: 400 } as any,
    ];
    const movimientos = [
      crearMovimientoParcial({ id: 'mov-reset', producto_id: 'p1', tipo: 'PRODUCCION', cantidad: 5, costo_unitario: 400 }),
    ];
    await service.registrarProduccion(produccion, items, movimientos);
    expect((await service.obtenerProducciones()).length).toBe(1);

    await service.resetInventario();

    expect((await service.obtenerProducciones()).length).toBe(0);
    expect((await service.obtenerProductos()).length).toBe(0);
  });

  it('cada linea de produccion actualiza el costo_promedio de SU propio producto, sin mezclar costos', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'pan', costo_promedio: 1000 }));
    await service.crearProducto(crearProductoParcial({ id: 'recorte', costo_promedio: 100 }));

    const produccion = { id: 'produccion-2', fecha: Date.now(), nota: 'horneada manana' } as any;
    const items = [
      { id: 'pi-3', produccion_id: 'produccion-2', producto_id: 'pan', cantidad: 30, costo_unitario_declarado: 900 } as any,
      { id: 'pi-4', produccion_id: 'produccion-2', producto_id: 'recorte', cantidad: 10, costo_unitario_declarado: 50 } as any,
    ];
    const movimientos = [
      crearMovimientoParcial({ id: 'mov-pan', producto_id: 'pan', tipo: 'PRODUCCION', cantidad: 30, costo_unitario: 900 }),
      crearMovimientoParcial({ id: 'mov-recorte', producto_id: 'recorte', tipo: 'PRODUCCION', cantidad: 10, costo_unitario: 50 }),
    ];

    await service.registrarProduccion(produccion, items, movimientos);

    const costoPan = (await service.obtenerProductos()).find((p) => p.id === 'pan')!.costo_promedio;
    const costoRecorte = (await service.obtenerProductos()).find((p) => p.id === 'recorte')!.costo_promedio;
    expect(costoPan).toBe(900);
    expect(costoRecorte).toBe(50);
  });

  it('registrarProduccion ROLLBACK: si una linea falla, NADA persiste', async () => {
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    const produccion = { id: 'produccion-fallida', fecha: Date.now(), nota: null } as any;
    const items = [
      { id: 'pi-ok', produccion_id: 'produccion-fallida', producto_id: 'p1', cantidad: 10, costo_unitario_declarado: 800 } as any,
      { id: 'pi-fail', produccion_id: 'produccion-fallida', producto_id: 'no-existe', cantidad: 5, costo_unitario_declarado: 400 } as any,
    ];
    const movimientos = [
      crearMovimientoParcial({ id: 'mov-ok', producto_id: 'p1', tipo: 'PRODUCCION', cantidad: 10, costo_unitario: 800 }),
      crearMovimientoParcial({ id: 'mov-fail', producto_id: 'no-existe', tipo: 'PRODUCCION', cantidad: 5, costo_unitario: 400 }),
    ];

    await expectAsync(service.registrarProduccion(produccion, items, movimientos)).toBeRejected();

    const producciones = await service.obtenerProducciones();
    expect(producciones.length).toBe(0);

    const costoP1 = (await service.obtenerProductos()).find((p) => p.id === 'p1')!.costo_promedio;
    expect(costoP1).toBe(1000);
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

    await expectAsync(registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [movimientoVenta], transaccionFiado)).toBeRejected();

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

    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [movimientoVenta]);

    await crearMovimiento(crearMovimientoParcial({
      id: 'movimiento-compra-2',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 2000,
    }));

    const ventas = await service.obtenerVentas();
    const ventaPersistida = ventas.find((item) => item.venta.id === 'venta-3');
    const ventaItemPersistido = obtenerMockVentaItems().find((item) => item.id === 'venta-item-venta-3');

    expect(ventaPersistida).toEqual(jasmine.objectContaining({
      venta: jasmine.objectContaining({
        id: 'venta-3',
        tipo_pago: 'CONTADO',
        monto_contado: 4500,
        monto_fiado: 0,
        cliente_id: null,
      }),
      items: jasmine.arrayContaining([
        jasmine.objectContaining({ ganancia: 1500 }),
      ]),
    }));
    expect(ventaItemPersistido).toEqual(jasmine.objectContaining({ ganancia: 1500 }));
  });

  it('soft-deleting a sale soft-deletes its lines in the same transaction', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));
    await service.crearProducto(crearProductoParcial({ id: 'p1', costo_promedio: 1000 }));

    await crearMovimiento(crearMovimientoParcial({
      id: 'compra-soft-delete',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-soft-delete-1',
      producto_id: 'p1',
      cantidad: 2,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1000,
      tipo_pago: 'CONTADO',
      monto_contado: 3000,
      monto_fiado: 0,
      cliente_id: null,
    });

    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [crearMovimientoParcial({
      id: 'mov-venta-soft-delete-1',
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 2,
      costo_unitario: 0,
    })]);

    await service.softDeleteVenta('venta-soft-delete-1');

    const ventas = await service.obtenerVentas();
    const ventaEliminada = obtenerMockVentas().find((item) => item.venta.id === 'venta-soft-delete-1');

    expect(ventas.length).toBe(0);
    expect(ventaEliminada?.venta.deleted_at).not.toBeNull();
    expect(ventaEliminada?.items.every((item) => item.deleted_at != null)).toBeTrue();
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
    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [mov], tx);
    const ventas = await service.obtenerVentas();
    const movimientos = await obtenerMovimientosPorProducto("p1");
    const deudas = await service.obtenerTransaccionesPorCliente("c1");
    expect(ventas).toContain(jasmine.objectContaining({
      venta: jasmine.objectContaining({ id: "v-mix", monto_contado: 10000, monto_fiado: 20000 }),
      items: jasmine.arrayContaining([
        jasmine.objectContaining({ venta_id: "v-mix" }),
      ]),
    }));
    expect(movimientos.filter((m) => m.tipo === "VENTA").length).toBe(1);
    expect(deudas).toContain(jasmine.objectContaining({ id: "tx-mix", monto: 20000 }));
  });

  it("REJECTS a sale whose amounts do not add up to the total", async () => {
    await service.crearCliente(crearClienteParcial({ id: "c1" }));
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-bad", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-bad", producto_id: "p1", cantidad: 2, precio_venta: 15000, cliente_id: "c1", monto_contado: 10000, monto_fiado: 5000 });
    const mov = crearMovimientoParcial({ id: "mv-bad", producto_id: "p1", tipo: "VENTA", cantidad: 2, costo_unitario: 0 });
    await expectAsync(registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [mov])).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS a negative amount", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-neg", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-neg", producto_id: "p1", cantidad: 1, precio_venta: 1500, monto_contado: 3000, monto_fiado: -1500 });
    const mov = crearMovimientoParcial({ id: "mv-neg", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [mov])).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS null amounts", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-null", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-null", producto_id: "p1", cantidad: 1, precio_venta: 1500 });
    const ventaConMontosNulos: LegacyVentaRow = { ...venta, monto_contado: null, monto_fiado: null };
    const mov = crearMovimientoParcial({ id: "mv-null", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(registrarVentaExtendida(ventaConMontosNulos, [crearVentaItemDesdeVenta(ventaConMontosNulos)], [mov])).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("REJECTS monto_fiado greater than 0 without a cliente_id", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1000 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-nocli", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1000 }));
    const venta = crearVentaParcial({ id: "v-nocli", producto_id: "p1", cantidad: 1, precio_venta: 1500, cliente_id: null, monto_contado: 500, monto_fiado: 1000 });
    const mov = crearMovimientoParcial({ id: "mv-nocli", producto_id: "p1", tipo: "VENTA", cantidad: 1, costo_unitario: 0 });
    await expectAsync(registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [mov])).toBeRejected();
    expect((await service.obtenerVentas()).length).toBe(0);
  });

  it("ACCEPTS float representation noise within the one-cent tolerance", async () => {
    await service.crearProducto(crearProductoParcial({ id: "p1", costo_promedio: 1 }));
    await crearMovimiento(crearMovimientoParcial({ id: "mc-float", producto_id: "p1", tipo: "COMPRA", cantidad: 10, costo_unitario: 1 }));
    const venta = crearVentaParcial({ id: "v-float", producto_id: "p1", cantidad: 3, precio_venta: 1.1, costo_unitario: 1, ganancia: 0.3, monto_contado: 3.3, monto_fiado: 0 });
    const mov = crearMovimientoParcial({ id: "mv-float", producto_id: "p1", tipo: "VENTA", cantidad: 3, costo_unitario: 0 });
    await registrarVentaExtendida(venta, [crearVentaItemDesdeVenta(venta)], [mov]);
    expect((await service.obtenerVentas()).length).toBe(1);
  });

  it('multi-item sale writes one sale, three items and three VENTA movements', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));

    const productos = [
      crearProductoParcial({ id: 'p1', costo_promedio: 1000 }),
      crearProductoParcial({ id: 'p2', costo_promedio: 1500 }),
      crearProductoParcial({ id: 'p3', costo_promedio: 2500 }),
    ];

    for (const producto of productos) {
      await service.crearProducto(producto);
      await crearMovimiento(crearMovimientoParcial({
        id: `compra-${producto.id}`,
        producto_id: producto.id,
        tipo: 'COMPRA',
        cantidad: 10,
        costo_unitario: producto.costo_promedio,
      }));
    }

    const venta = crearVentaParcial({
      id: 'venta-multi-1',
      producto_id: 'p1',
      cantidad: 1,
      precio_venta: 6000,
      costo_unitario: 1000,
      ganancia: 1900,
      tipo_pago: 'CONTADO',
      monto_contado: 6000,
      monto_fiado: 0,
      cliente_id: null,
    });

    const items = [
      crearVentaItemParcial({ id: 'vi-1', venta_id: 'venta-multi-1', producto_id: 'p1', cantidad: 1, precio_venta: 1000, costo_unitario: 1000, ganancia: 0 }),
      crearVentaItemParcial({ id: 'vi-2', venta_id: 'venta-multi-1', producto_id: 'p2', cantidad: 1, precio_venta: 2000, costo_unitario: 1500, ganancia: 500 }),
      crearVentaItemParcial({ id: 'vi-3', venta_id: 'venta-multi-1', producto_id: 'p3', cantidad: 1, precio_venta: 3000, costo_unitario: 2500, ganancia: 500 }),
    ];

    const movimientos = [
      crearMovimientoParcial({ id: 'mv-1', producto_id: 'p1', tipo: 'VENTA', cantidad: 1, costo_unitario: 0 }),
      crearMovimientoParcial({ id: 'mv-2', producto_id: 'p2', tipo: 'VENTA', cantidad: 1, costo_unitario: 0 }),
      crearMovimientoParcial({ id: 'mv-3', producto_id: 'p3', tipo: 'VENTA', cantidad: 1, costo_unitario: 0 }),
    ];

    await registrarVentaExtendida(venta, items, movimientos);

    expect(obtenerMockVentas().length).toBe(1);
    expect(obtenerMockVentaItems().length).toBe(3);
    expect(obtenerMockMovimientos().filter((movimiento) => movimiento.tipo === 'VENTA').length).toBe(3);
  });

  it('if any write fails mid-sale, nothing is persisted', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'c1' }));

    const producto = crearProductoParcial({ id: 'p1', costo_promedio: 1000 });
    await service.crearProducto(producto);
    await crearMovimiento(crearMovimientoParcial({
      id: 'compra-p1',
      producto_id: 'p1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1000,
    }));

    const venta = crearVentaParcial({
      id: 'venta-falla-1',
      producto_id: 'p1',
      cantidad: 1,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 500,
      tipo_pago: 'FIADO',
      monto_contado: 0,
      monto_fiado: 1500,
      cliente_id: 'c1',
    });

    const items = [crearVentaItemParcial({ id: 'vi-falla-1', venta_id: 'venta-falla-1', producto_id: 'p1', cantidad: 1, precio_venta: 1500, costo_unitario: 1000, ganancia: 500 })];
    const movimientos = [crearMovimientoParcial({ id: 'mv-falla-1', producto_id: 'p1', tipo: 'VENTA', cantidad: 1, costo_unitario: 0 })];
    const transaccionFiado = crearTransaccionParcial({ id: 'tx-falla-1', cliente_id: 'c1', tipo: 'fiado', monto: 1500, concepto: 'Venta a crédito' });

    const transacciones = obtenerMockTransacciones();
    spyOn(transacciones, 'push').and.throwError('simulated mid-sale failure');

    await expectAsync(registrarVentaExtendida(venta, items, movimientos, transaccionFiado)).toBeRejected();

    expect(obtenerMockVentas().length).toBe(0);
    expect(obtenerMockVentaItems().length).toBe(0);
    expect(obtenerMockMovimientos().filter((movimiento) => movimiento.tipo === 'VENTA').length).toBe(0);
    expect(obtenerMockTransacciones().length).toBe(0);
  });
});

type LegacyVentaRow = {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  costo_unitario: number;
  ganancia: number;
  tipo_pago: 'CONTADO' | 'FIADO' | 'MIXTO';
  monto_contado: number | null;
  monto_fiado: number | null;
  cliente_id: string | null;
  fecha: number;
  created_at: number | null;
  updated_at: number | null;
  deleted_at: number | null;
  store_id: string | null;
  created_by: string | null;
};

interface FakeDbState {
  tables: Map<string, string[]>;
  rows: Map<string, Array<Record<string, unknown>>>;
  indexes: Set<string>;
  userVersion: number;
}

interface FakeDb {
  execute: jasmine.Spy;
  query: jasmine.Spy;
  run: jasmine.Spy;
  beginTransaction: jasmine.Spy;
  commitTransaction: jasmine.Spy;
  rollbackTransaction: jasmine.Spy;
}

type DatabaseServiceMigracionInterno = {
  db: FakeDb;
  isInitialized: boolean;
  asegurarEsquema(): Promise<void>;
};

function crearDbMigracion(ventasRows: LegacyVentaRow[], reducedShape: boolean): { db: FakeDb; state: FakeDbState } {
  const estado: FakeDbState = {
    tables: new Map<string, string[]>([
      [
        'ventas',
        reducedShape
          ? ['id', 'tipo_pago', 'monto_contado', 'monto_fiado', 'cliente_id', 'fecha', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by']
          : ['id', 'producto_id', 'cantidad', 'precio_venta', 'costo_unitario', 'ganancia', 'tipo_pago', 'monto_contado', 'monto_fiado', 'cliente_id', 'fecha', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by'],
      ],
    ]),
    rows: new Map<string, Array<Record<string, unknown>>>([
      ['ventas', ventasRows.map((venta) => ({ ...venta }))],
    ]),
    indexes: new Set<string>(reducedShape ? ['ventas_fecha_idx'] : ['ventas_producto_id_idx']),
    userVersion: 6,
  };

  const columnasVentaReducida = ['id', 'tipo_pago', 'monto_contado', 'monto_fiado', 'cliente_id', 'fecha', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by'];
  const columnasVentaItem = ['id', 'venta_id', 'producto_id', 'cantidad', 'precio_venta', 'costo_unitario', 'ganancia', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by'];

  const db: FakeDb = {
    execute: jasmine.createSpy('execute').and.callFake(async (sql: string) => {
      const normalizado = sql.replace(/\s+/g, ' ').trim();

      if (normalizado === 'PRAGMA foreign_keys = OFF;' || normalizado === 'PRAGMA foreign_keys = ON;') {
        return;
      }

      if (normalizado.includes('CREATE TABLE IF NOT EXISTS ventas (') && !estado.tables.has('ventas')) {
        estado.tables.set('ventas', columnasVentaReducida);
        estado.rows.set('ventas', []);
      }

      if (normalizado.includes('DROP TABLE IF EXISTS ventas_nueva;')) {
        estado.tables.delete('ventas_nueva');
        estado.rows.delete('ventas_nueva');
      }

      if (normalizado.includes('CREATE TABLE ventas_nueva (')) {
        estado.tables.set('ventas_nueva', columnasVentaReducida);
        estado.rows.set('ventas_nueva', []);
      }

      if (normalizado.includes('CREATE TABLE IF NOT EXISTS venta_items (') && !estado.tables.has('venta_items')) {
        estado.tables.set('venta_items', columnasVentaItem);
        estado.rows.set('venta_items', []);
      }

      if (normalizado.includes('DROP TABLE ventas;')) {
        estado.tables.delete('ventas');
        estado.rows.delete('ventas');
        estado.indexes.delete('ventas_producto_id_idx');
        estado.indexes.delete('ventas_fecha_idx');
      }

      if (normalizado.includes('ALTER TABLE ventas_nueva RENAME TO ventas;')) {
        const columnas = estado.tables.get('ventas_nueva') ?? columnasVentaReducida;
        const filas = estado.rows.get('ventas_nueva') ?? [];
        estado.tables.set('ventas', columnas);
        estado.rows.set('ventas', filas);
        estado.tables.delete('ventas_nueva');
        estado.rows.delete('ventas_nueva');
      }

      if (normalizado.includes('CREATE INDEX IF NOT EXISTS ventas_fecha_idx')) {
        estado.indexes.add('ventas_fecha_idx');
      }

      if (normalizado.includes('CREATE INDEX IF NOT EXISTS ventas_producto_id_idx')) {
        estado.indexes.add('ventas_producto_id_idx');
      }

      if (normalizado.includes('CREATE INDEX IF NOT EXISTS venta_items_venta_id_idx')) {
        estado.indexes.add('venta_items_venta_id_idx');
      }

      if (normalizado.includes('CREATE INDEX IF NOT EXISTS venta_items_producto_id_idx')) {
        estado.indexes.add('venta_items_producto_id_idx');
      }

      if (normalizado.startsWith('PRAGMA user_version =')) {
        const version = Number(normalizado.split('=')[1]?.replace(';', '').trim() ?? 0);
        estado.userVersion = version;
      }
    }),
    query: jasmine.createSpy('query').and.callFake(async (sql: string) => {
      const normalizado = sql.replace(/\s+/g, ' ').trim();

      if (normalizado.startsWith('PRAGMA table_info(')) {
        const tabla = normalizado.match(/^PRAGMA table_info\(([^)]+)\);?$/)?.[1] ?? '';
        const columnas = estado.tables.get(tabla) ?? [];
        return { values: columnas.map((name) => ({ name })) };
      }

      if (normalizado === 'PRAGMA user_version;') {
        return { values: [{ user_version: estado.userVersion }] };
      }

      if (normalizado === 'PRAGMA foreign_key_check;') {
        return { values: [] };
      }

      if (normalizado.startsWith('SELECT') && normalizado.includes('FROM ventas')) {
        return {
          values: [...(estado.rows.get('ventas') ?? [])].sort((izquierda, derecha) => Number(derecha['fecha']) - Number(izquierda['fecha'])),
        };
      }

      return { values: [] };
    }),
    run: jasmine.createSpy('run').and.callFake(async (sql: string, values: unknown[]) => {
      const normalizado = sql.replace(/\s+/g, ' ').trim();

      if (normalizado.startsWith('INSERT INTO ventas_nueva')) {
        const [id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha, created_at, updated_at, deleted_at, store_id, created_by] = values as [string, string, number | null, number | null, string | null, number, number | null, number | null, number | null, string | null, string | null];
        const filas = estado.rows.get('ventas_nueva') ?? [];
        filas.push({ id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha, created_at, updated_at, deleted_at, store_id, created_by });
        estado.rows.set('ventas_nueva', filas);
      }

      if (/^INSERT(?: OR IGNORE)? INTO venta_items\b/.test(normalizado)) {
        const [id, venta_id, producto_id, cantidad, precio_venta, costo_unitario, ganancia, created_at, updated_at, deleted_at, store_id, created_by] = values as [string, string, string, number, number, number, number, number | null, number | null, number | null, string | null, string | null];
        const filas = estado.rows.get('venta_items') ?? [];
        filas.push({ id, venta_id, producto_id, cantidad, precio_venta, costo_unitario, ganancia, created_at, updated_at, deleted_at, store_id, created_by });
        estado.rows.set('venta_items', filas);
      }

      return {};
    }),
    beginTransaction: jasmine.createSpy('beginTransaction').and.resolveTo(undefined),
    commitTransaction: jasmine.createSpy('commitTransaction').and.resolveTo(undefined),
    rollbackTransaction: jasmine.createSpy('rollbackTransaction').and.resolveTo(undefined),
  };

  return { db, state: estado };
}

describe('DatabaseService migration v5->v6', () => {
  function prepararServicio(db: FakeDb): DatabaseServiceMigracionInterno {
    const servicio = TestBed.inject(DatabaseService) as unknown as DatabaseServiceMigracionInterno;
    servicio.db = db;
    servicio.isInitialized = true;
    return servicio;
  }

  it('rebuilds legacy ventas rows into venta_items when the table still has producto_id', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const { db, state } = crearDbMigracion([
      {
        id: 'venta-1',
        producto_id: 'producto-1',
        cantidad: 2,
        precio_venta: 1500,
        costo_unitario: 1000,
        ganancia: 1000,
        tipo_pago: 'CONTADO',
        monto_contado: 3000,
        monto_fiado: 0,
        cliente_id: null,
        fecha: 1710000000000,
        created_at: 1710000001000,
        updated_at: null,
        deleted_at: null,
        store_id: 'store-1',
        created_by: 'user-1',
      },
      {
        id: 'venta-2',
        producto_id: 'producto-2',
        cantidad: 3,
        precio_venta: 2500,
        costo_unitario: 1200,
        ganancia: 3900,
        tipo_pago: 'FIADO',
        monto_contado: 0,
        monto_fiado: 7500,
        cliente_id: 'cliente-1',
        fecha: 1710000002000,
        created_at: null,
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      },
    ], false);

    const servicio = prepararServicio(db);

    await servicio.asegurarEsquema();

    expect(state.tables.get('ventas')).toEqual(['id', 'tipo_pago', 'monto_contado', 'monto_fiado', 'cliente_id', 'fecha', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by']);
    expect(state.tables.get('venta_items')).toEqual(['id', 'venta_id', 'producto_id', 'cantidad', 'precio_venta', 'costo_unitario', 'ganancia', 'created_at', 'updated_at', 'deleted_at', 'store_id', 'created_by']);
    expect(state.rows.get('ventas')).toEqual(jasmine.arrayContaining([
      jasmine.objectContaining({ id: 'venta-2', tipo_pago: 'FIADO', cliente_id: 'cliente-1', fecha: 1710000002000 }),
      jasmine.objectContaining({ id: 'venta-1', tipo_pago: 'CONTADO', cliente_id: null, fecha: 1710000000000 }),
    ]));
    expect(state.rows.get('venta_items')).toEqual(jasmine.arrayContaining([
      jasmine.objectContaining({ id: 'venta-1', venta_id: 'venta-1', producto_id: 'producto-1', cantidad: 2, precio_venta: 1500, costo_unitario: 1000, ganancia: 1000 }),
      jasmine.objectContaining({ id: 'venta-2', venta_id: 'venta-2', producto_id: 'producto-2', cantidad: 3, precio_venta: 2500, costo_unitario: 1200, ganancia: 3900 }),
    ]));
    expect(state.indexes.has('ventas_fecha_idx')).toBeTrue();
  });

  it('running the migration twice leaves the database unchanged once ventas is reduced', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const { db, state } = crearDbMigracion([
      {
        id: 'venta-1',
        producto_id: 'producto-1',
        cantidad: 1,
        precio_venta: 1000,
        costo_unitario: 700,
        ganancia: 300,
        tipo_pago: 'CONTADO',
        monto_contado: 1000,
        monto_fiado: 0,
        cliente_id: null,
        fecha: 1710000003000,
        created_at: null,
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      },
    ], false);

    const servicio = prepararServicio(db);

    await servicio.asegurarEsquema();
    const snapshot = {
      tables: new Map(state.tables),
      rows: new Map(Array.from(state.rows.entries()).map(([tabla, filas]) => [tabla, filas.map((fila) => ({ ...fila }))])),
      indexes: new Set(state.indexes),
    };

    await servicio.asegurarEsquema();

    expect(state.tables).toEqual(snapshot.tables);
    expect(state.rows).toEqual(snapshot.rows);
    expect(state.indexes).toEqual(snapshot.indexes);
    expect((db.run.calls.allArgs().filter(([sql]) => /^INSERT(?: OR IGNORE)? INTO venta_items\b/.test(String(sql).replace(/\s+/g, ' ').trim())).length)).toBe(1);
  });

  it('resetInventario clears inventory and sales while preserving clients and transactions', async () => {
    const servicio = TestBed.inject(DatabaseService);
    const cliente: Cliente = {
      id: 'cliente-reset',
      nombre: 'Cliente Reset',
      telefono: '3000000000',
      habeas_data_flag: true,
      fecha_creacion: Date.now(),
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };
    const transaccion: Transaccion = {
      id: 'transaccion-reset',
      cliente_id: 'cliente-reset',
      venta_id: 'venta-reset',
      tipo: 'fiado',
      monto: 10000,
      concepto: 'Venta fiada antes del reset',
      fecha: Date.now(),
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };
    const producto: Producto = {
      id: 'producto-reset',
      nombre: 'Producto Reset',
      precio_venta: 12000,
      tipo_venta: 'UNIDAD',
      minimo_stock: 1,
      costo_promedio: 8000,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };
    const movimiento: MovimInventario = {
      id: 'movimiento-reset',
      producto_id: 'producto-reset',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 8000,
      motivo: 'Compra antes del reset',
      fecha: Date.now(),
      actor_id: null,
      stock_calculado_anterior: null,
      cantidad_fisica: null,
      diferencia_calculada: null,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };
    const venta: Venta = {
      id: 'venta-reset',
      tipo_pago: 'FIADO',
      monto_contado: 0,
      monto_fiado: 10000,
      cliente_id: 'cliente-reset',
      fecha: Date.now(),
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };
    const item: VentaItem = {
      id: 'venta-item-reset',
      venta_id: 'venta-reset',
      producto_id: 'producto-reset',
      cantidad: 1,
      precio_venta: 12000,
      costo_unitario: 8000,
      ganancia: 4000,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };

    (servicio as unknown as { mockWebClientes: Cliente[] }).mockWebClientes.push(cliente);
    (servicio as unknown as { mockWebTransacciones: Transaccion[] }).mockWebTransacciones.push(transaccion);
    (servicio as unknown as { mockWebProductos: Producto[] }).mockWebProductos.push(producto);
    (servicio as unknown as { mockWebMovimInventario: MovimInventario[] }).mockWebMovimInventario.push(movimiento);
    (servicio as unknown as { mockWebVentas: Venta[] }).mockWebVentas.push(venta);
    (servicio as unknown as { mockWebVentaItems: VentaItem[] }).mockWebVentaItems.push(item);

    await servicio.resetInventario();

    expect((servicio as unknown as { mockWebProductos: Producto[] }).mockWebProductos).toEqual([]);
    expect((servicio as unknown as { mockWebMovimInventario: MovimInventario[] }).mockWebMovimInventario).toEqual([]);
    expect((servicio as unknown as { mockWebVentas: Venta[] }).mockWebVentas).toEqual([]);
    expect((servicio as unknown as { mockWebVentaItems: VentaItem[] }).mockWebVentaItems).toEqual([]);

    expect((servicio as unknown as { mockWebClientes: Cliente[] }).mockWebClientes).toEqual([cliente]);
    expect((servicio as unknown as { mockWebTransacciones: Transaccion[] }).mockWebTransacciones).toEqual([transaccion]);
    expect((servicio as unknown as { mockWebTransacciones: Transaccion[] }).mockWebTransacciones[0].venta_id).toBe('venta-reset');
  });

});
