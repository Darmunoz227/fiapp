import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';

import { VentasPage } from './ventas.page';
import { DatabaseService } from '../../core/database/database.service';
import { Cliente } from '../../core/models/cliente.model';
import { MovimInventario } from '../../core/models/movim-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { VentaItem } from '../../core/models/venta-item.model';
import { Venta } from '../../core/models/venta.model';

const productosMock: Producto[] = [
  {
    id: 'p1',
    nombre: 'Producto 1',
    precio_venta: 1500,
    tipo_venta: 'UNIDAD',
    minimo_stock: 0,
    costo_promedio: 1000,
    created_at: Date.now(),
    updated_at: null,
    deleted_at: null,
    store_id: null,
    created_by: null,
  },
];

const clientesMock: Cliente[] = [
  {
    id: 'c1',
    nombre: 'Cliente 1',
    telefono: '3000000000',
    habeas_data_flag: true,
    fecha_creacion: Date.now(),
    created_at: null,
    updated_at: null,
    deleted_at: null,
    store_id: null,
    created_by: null,
  },
];

describe('VentasPage', () => {
  let component: VentasPage;
  let fixture: ComponentFixture<VentasPage>;
  let lastToastConfig: unknown;

  const databaseServiceMock = jasmine.createSpyObj('DatabaseService', [
    'obtenerProductos',
    'obtenerClientes',
    'obtenerMovimientosPorProducto',
    'registrarVenta',
  ]);

  const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);

  beforeEach(waitForAsync(() => {
    databaseServiceMock.obtenerProductos.and.resolveTo(productosMock);
    databaseServiceMock.obtenerClientes.and.resolveTo(clientesMock);
    databaseServiceMock.obtenerMovimientosPorProducto.and.resolveTo([] as MovimInventario[]);
    databaseServiceMock.registrarVenta.and.resolveTo(undefined);

    databaseServiceMock.obtenerProductos.calls.reset();
    databaseServiceMock.obtenerClientes.calls.reset();
    databaseServiceMock.obtenerMovimientosPorProducto.calls.reset();
    databaseServiceMock.registrarVenta.calls.reset();

    lastToastConfig = undefined;
    toastControllerMock.create.and.callFake(async (config: unknown) => {
      lastToastConfig = config;
      return {
        present: async () => undefined,
      };
    });
    toastControllerMock.create.calls.reset();

    TestBed.configureTestingModule({
      imports: [VentasPage],
      providers: [
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: ToastController, useValue: toastControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('CONTADO sale calls registrarVenta with sale, one item and one movement', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 3;
    component.tipo_pago = 'CONTADO';

    await component.registrarVenta();

    expect(databaseServiceMock.registrarVenta).toHaveBeenCalledTimes(1);

    const call = databaseServiceMock.registrarVenta.calls.mostRecent();
    const venta = call.args[0] as Venta;
    const items = call.args[1] as VentaItem[];
    const movimientos = call.args[2] as MovimInventario[];

    expect(call.args.length).toBe(3);
    expect(venta).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
      tipo_pago: 'CONTADO',
      cliente_id: null,
    }));
    expect(items).toHaveSize(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      venta_id: venta.id,
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
    }));
    expect(movimientos).toHaveSize(1);
    expect(movimientos[0]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    }));
  });

  it('FIADO without client selected does NOT call registrarVenta and shows danger toast', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 3;
    component.tipo_pago = 'FIADO';
    component.clienteId = '';

    await component.registrarVenta();

    expect(databaseServiceMock.registrarVenta).not.toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Debes seleccionar un cliente para el saldo fiado',
      color: 'danger',
    }));
  });

  it('FIADO with client calls registrarVenta with items, movements and transaccionFiado', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 3;
    component.tipo_pago = 'FIADO';
    component.clienteId = 'c1';

    await component.registrarVenta();

    expect(databaseServiceMock.registrarVenta).toHaveBeenCalledTimes(1);

    const call = databaseServiceMock.registrarVenta.calls.mostRecent();
    const venta = call.args[0] as Venta;
    const items = call.args[1] as VentaItem[];
    const movimientos = call.args[2] as MovimInventario[];
    const transaccionFiado = call.args[3] as Transaccion;

    expect(call.args.length).toBe(4);
    expect(venta).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
      tipo_pago: 'FIADO',
      cliente_id: 'c1',
    }));
    expect(items).toHaveSize(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      venta_id: venta.id,
      producto_id: 'p1',
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1500,
    }));
    expect(movimientos).toHaveSize(1);
    expect(movimientos[0]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
    }));
    expect(transaccionFiado).toEqual(jasmine.objectContaining({
      cliente_id: 'c1',
      tipo: 'fiado',
      monto: 4500,
      concepto: 'Venta a crédito',
    }));
  });

  it('invalid cantidad (0) does NOT call registrarVenta', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 0;
    component.tipo_pago = 'CONTADO';

    await component.registrarVenta();

    expect(databaseServiceMock.registrarVenta).not.toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'La cantidad debe ser mayor a 0',
      color: 'danger',
    }));
  });
});