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

function crearMovimientoCompraParcial(productoId: string, cantidad: number, costoUnitario: number): MovimInventario {
  return {
    id: `compra-${productoId}`,
    producto_id: productoId,
    tipo: 'COMPRA',
    cantidad,
    costo_unitario: costoUnitario,
    motivo: null,
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
}

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
    databaseServiceMock.obtenerMovimientosPorProducto.and.callFake(async (productoId: string) => {
      if (productoId === 'p1') {
        return [crearMovimientoCompraParcial('p1', 10, 1000)];
      }

      return [];
    });
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

  it('agrega una línea al carrito con costo congelado y totales vivos', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 3;

    await component.agregarLinea();

    expect(component.carrito).toHaveSize(1);
    expect(component.carrito[0]).toEqual(jasmine.objectContaining({
      producto: jasmine.objectContaining({ id: 'p1', nombre: 'Producto 1' }),
      cantidad: 3,
      precio_venta: 1500,
      costo_unitario: 1000,
      bloqueada: false,
    }));
    expect(component.totalVenta).toBe(4500);
    expect(component.gananciaTotal).toBe(1500);
    expect(component.puedeConfirmar).toBeTrue();
  });

  it('editar cantidad y eliminar una línea actualizan los totales', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 2;
    await component.agregarLinea();

    component.precio = 1800;
    component.cantidad = 1;
    await component.agregarLinea();

    expect(component.totalVenta).toBe(4800);

    await component.onCantidadLineaChange(component.carrito[0], 4);
    expect(component.totalVenta).toBe(7800);
    expect(component.gananciaTotal).toBe(2800);

    await component.eliminarLinea(component.carrito[1].id);
    expect(component.carrito).toHaveSize(1);
    expect(component.totalVenta).toBe(6000);
    expect(component.gananciaTotal).toBe(2000);
  });

  it('bloquea solo la línea que excede el stock y mantiene el resto sellable', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 8;
    await component.agregarLinea();

    component.precio = 1500;
    component.cantidad = 3;
    await component.agregarLinea();

    expect(component.carrito).toHaveSize(2);
    expect(component.carrito[0].bloqueada).toBeFalse();
    expect(component.carrito[1].bloqueada).toBeTrue();
    expect(component.carrito[1].motivoBloqueo).toBe('Disponible: 2');
    expect(component.puedeConfirmar).toBeFalse();
  });

  it('permite repetir el mismo producto en líneas separadas sin fusionarlas', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 2;
    await component.agregarLinea();

    component.precio = 1800;
    component.cantidad = 1;
    await component.agregarLinea();

    expect(component.carrito).toHaveSize(2);
    expect(component.carrito[0].producto.id).toBe('p1');
    expect(component.carrito[1].producto.id).toBe('p1');
    expect(component.carrito[0].precio_venta).toBe(1500);
    expect(component.carrito[1].precio_venta).toBe(1800);
    expect(component.carrito[1].repetida).toBeTrue();
  });

  it('FIADO with no client selected does NOT call registrarVenta and shows danger toast', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 2;
    await component.agregarLinea();

    component.tipo_pago = 'FIADO';
    component.clienteId = '';

    await component.registrarVenta();

    expect(databaseServiceMock.registrarVenta).not.toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Debes seleccionar un cliente para el saldo fiado',
      color: 'danger',
    }));
  });

  it('invalid cantidad (0 or negative) is rejected at add time', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 0;

    await component.agregarLinea();

    expect(component.carrito).toHaveSize(0);
    expect(databaseServiceMock.registrarVenta).not.toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'La cantidad debe ser mayor a 0',
      color: 'danger',
    }));

    toastControllerMock.create.calls.reset();

    component.cantidad = -1;
    await component.agregarLinea();

    expect(component.carrito).toHaveSize(0);
    expect(databaseServiceMock.registrarVenta).not.toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'La cantidad debe ser mayor a 0',
      color: 'danger',
    }));
  });

  it('CONTADO y MIXTO submiten una venta con items y movimientos por línea', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 2;
    await component.agregarLinea();

    component.precio = 1800;
    component.cantidad = 1;
    await component.agregarLinea();

    component.tipo_pago = 'MIXTO';
    component.abono = 2000;
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
      monto_contado: 2000,
      monto_fiado: 2800,
      tipo_pago: 'MIXTO',
      cliente_id: 'c1',
    }));
    expect(items).toHaveSize(2);
    expect(items[0]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      cantidad: 2,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1000,
    }));
    expect(items[1]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      cantidad: 1,
      precio_venta: 1800,
      costo_unitario: 1000,
      ganancia: 800,
    }));
    expect(movimientos).toHaveSize(2);
    expect(movimientos.every((movimiento) => movimiento.tipo === 'VENTA')).toBeTrue();
    expect(transaccionFiado).toEqual(jasmine.objectContaining({
      cliente_id: 'c1',
      tipo: 'fiado',
      monto: 2800,
      concepto: 'Venta a crédito',
    }));
  });

  it('FIADO-only sale passes transaccionFiado', async () => {
    await component.cargarProductos();

    component.productoId = 'p1';
    component.precio = 1500;
    component.cantidad = 2;
    await component.agregarLinea();

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
      monto_contado: 0,
      monto_fiado: 3000,
      tipo_pago: 'FIADO',
      cliente_id: 'c1',
    }));
    expect(items).toHaveSize(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      cantidad: 2,
      precio_venta: 1500,
      costo_unitario: 1000,
      ganancia: 1000,
    }));
    expect(movimientos).toHaveSize(1);
    expect(movimientos[0]).toEqual(jasmine.objectContaining({
      producto_id: 'p1',
      tipo: 'VENTA',
      cantidad: 2,
      costo_unitario: 0,
    }));
    expect(transaccionFiado).toEqual(jasmine.objectContaining({
      cliente_id: 'c1',
      tipo: 'fiado',
      monto: 3000,
      concepto: 'Venta a crédito',
    }));
  });
});
