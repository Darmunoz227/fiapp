import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController, ModalController } from '@ionic/angular/standalone';

import { InventoryListPage } from './inventory-list.page';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { ResumenInventario } from '../../core/models/resumen-inventario.model';
import { Producto } from '../../core/models/producto.model';

const databaseServiceMock = jasmine.createSpyObj('DatabaseService', ['crearProducto', 'obtenerProductos', 'obtenerResumenInventario']);
const freemiumServiceMock = jasmine.createSpyObj('FreemiumService', ['puedeEscribir']);
const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);
const modalControllerMock = jasmine.createSpyObj('ModalController', ['create']);

describe('InventoryListPage', () => {
  let component: InventoryListPage;
  let fixture: ComponentFixture<InventoryListPage>;

  beforeEach(waitForAsync(() => {
    databaseServiceMock.crearProducto.and.resolveTo(undefined);
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    databaseServiceMock.obtenerResumenInventario.and.resolveTo([]);
    freemiumServiceMock.puedeEscribir.and.resolveTo(true);
    databaseServiceMock.crearProducto.calls.reset();
    databaseServiceMock.obtenerProductos.calls.reset();
    databaseServiceMock.obtenerResumenInventario.calls.reset();
    freemiumServiceMock.puedeEscribir.calls.reset();

    toastControllerMock.create.and.callFake(async (_config: any) => {
      return {
        present: () => Promise.resolve(),
      } as any;
    });
    toastControllerMock.create.calls.reset();

    TestBed.configureTestingModule({
      imports: [InventoryListPage],
      providers: [
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: FreemiumService, useValue: freemiumServiceMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: ModalController, useValue: modalControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('creates a valid product and sends the expected persisted fields', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearProducto).toHaveBeenCalledWith(jasmine.objectContaining({
      nombre: 'Carne molida',
      precio_venta: 12500,
      tipo_venta: 'UNIDAD',
      minimo_stock: 3,
      costo_promedio: 0,
    }));
  });

  it('blocks product creation when freemium is expired', async () => {
    freemiumServiceMock.puedeEscribir.and.resolveTo(false);

    component.nombre = 'Carne molida';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(freemiumServiceMock.puedeEscribir).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('does not create a product when the name is empty', async () => {
    component.nombre = '   ';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('does not create a product when the sale price is invalid', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = '';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('does not create a product when the minimum stock is negative', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = -1;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('loads products into the component list', async () => {
    const productosMock: Producto[] = [
      {
        id: 'producto-1',
        nombre: 'Carne molida',
        precio_venta: 12500,
        tipo_venta: 'PESO',
        minimo_stock: 3000,
        costo_promedio: 9800,
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      },
    ];

    databaseServiceMock.obtenerProductos.and.resolveTo(productosMock);

    await component.cargarProductos();

    expect(component.productos).toEqual(productosMock);
  });

  it('loads products and builds the resumen map on init', async () => {
    const productosMock: Producto[] = [
      {
        id: 'p1',
        nombre: 'Producto 1',
        precio_venta: 1000,
        tipo_venta: 'UNIDAD',
        minimo_stock: 5,
        costo_promedio: 1000,
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      },
      {
        id: 'p2',
        nombre: 'Producto 2',
        precio_venta: 2000,
        tipo_venta: 'PESO',
        minimo_stock: 5,
        costo_promedio: 1000,
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      },
    ];

    const resumenesMock: ResumenInventario[] = [
      {
        producto_id: 'p1',
        stock_derivado: 10,
        costo_promedio: 1000,
        stock_bajo: false,
      },
      {
        producto_id: 'p2',
        stock_derivado: 3,
        costo_promedio: 1000,
        stock_bajo: true,
      },
    ];

    databaseServiceMock.obtenerProductos.and.resolveTo(productosMock);
    databaseServiceMock.obtenerResumenInventario.and.resolveTo(resumenesMock);

    await component.cargarProductos();

    expect(component.productos.length).toBe(2);
    expect(component.resumenPorProducto.size).toBe(2);
  });

  it('esStockBajo returns the low-stock flag from the resumen', async () => {
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    databaseServiceMock.obtenerResumenInventario.and.resolveTo([
      {
        producto_id: 'p1',
        stock_derivado: 10,
        costo_promedio: 1000,
        stock_bajo: false,
      },
      {
        producto_id: 'p2',
        stock_derivado: 3,
        costo_promedio: 1000,
        stock_bajo: true,
      },
    ]);

    await component.cargarProductos();

    expect(component.esStockBajo('p1')).toBeFalse();
    expect(component.esStockBajo('p2')).toBeTrue();
    expect(component.esStockBajo('unknown')).toBeFalse();
  });

  it('stockActual returns the derived stock from the resumen', async () => {
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    databaseServiceMock.obtenerResumenInventario.and.resolveTo([
      {
        producto_id: 'p1',
        stock_derivado: 10,
        costo_promedio: 1000,
        stock_bajo: false,
      },
      {
        producto_id: 'p2',
        stock_derivado: 3,
        costo_promedio: 1000,
        stock_bajo: true,
      },
    ]);

    await component.cargarProductos();

    expect(component.stockActual('p1')).toBe(10);
    expect(component.stockActual('p2')).toBe(3);
    expect(component.stockActual('unknown')).toBe(0);
  });
  it('valorInventarioTexto returns formatted inventory value', () => {
  component.resumenPorProducto.set('p1', {
    producto_id: 'p1',
    stock_derivado: 10,
    costo_promedio: 5000,
    stock_bajo: false,
  });

  const producto: Producto = {
    id: 'p1',
    nombre: 'Producto',
    precio_venta: 1000,
    tipo_venta: 'UNIDAD',
    minimo_stock: 1,
    costo_promedio: 5000,
  };

  expect(component.valorInventarioTexto(producto)).toContain('50.000');
});

it('valorInventarioTexto shows missing cost when stock exists and cost is zero', () => {
  component.resumenPorProducto.set('p1', {
    producto_id: 'p1',
    stock_derivado: 10,
    costo_promedio: 0,
    stock_bajo: false,
  });

  const producto: Producto = {
    id: 'p1',
    nombre: 'Producto',
    precio_venta: 1000,
    tipo_venta: 'UNIDAD',
    minimo_stock: 1,
    costo_promedio: 0,
  };

  expect(component.valorInventarioTexto(producto))
    .toBe('Sin costo registrado');
});

it('valorInventarioTexto returns zero when stock is zero', () => {
  component.resumenPorProducto.set('p1', {
    producto_id: 'p1',
    stock_derivado: 0,
    costo_promedio: 5000,
    stock_bajo: false,
  });

  const producto: Producto = {
    id: 'p1',
    nombre: 'Producto',
    precio_venta: 1000,
    tipo_venta: 'UNIDAD',
    minimo_stock: 1,
    costo_promedio: 5000,
  };

  expect(component.valorInventarioTexto(producto)).toContain('0');
});
});