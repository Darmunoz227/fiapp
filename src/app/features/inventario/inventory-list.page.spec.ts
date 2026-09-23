import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController, ModalController } from '@ionic/angular/standalone';

import { InventoryListPage } from './inventory-list.page';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { ResumenInventario } from '../../core/models/resumen-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { esStockBajo } from './inventory-calculations';

const databaseServiceMock = jasmine.createSpyObj('DatabaseService', ['crearProducto', 'crearProductoConStockInicial', 'obtenerProductos', 'obtenerResumenInventario']);
const freemiumServiceMock = jasmine.createSpyObj('FreemiumService', ['puedeEscribir']);
const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);
const modalControllerMock = jasmine.createSpyObj('ModalController', ['create']);

describe('InventoryListPage', () => {
  let component: InventoryListPage;
  let fixture: ComponentFixture<InventoryListPage>;

  beforeEach(waitForAsync(() => {
    databaseServiceMock.crearProducto.and.resolveTo(undefined);
    databaseServiceMock.crearProductoConStockInicial.and.resolveTo(undefined);
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    databaseServiceMock.obtenerResumenInventario.and.resolveTo([]);
    freemiumServiceMock.puedeEscribir.and.resolveTo(true);
    databaseServiceMock.crearProducto.calls.reset();
    databaseServiceMock.crearProductoConStockInicial.calls.reset();
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
    component.cantidad_inicial = 10;
    component.nombre = 'Carne molida';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProductoConStockInicial).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearProductoConStockInicial).toHaveBeenCalledWith(jasmine.objectContaining({
      nombre: 'Carne molida',
      precio_venta: 12500,
      tipo_venta: 'UNIDAD',
      minimo_stock: 3,
      costo_promedio: 0,
    }), jasmine.objectContaining({
      tipo: 'AJUSTE',
      cantidad_fisica: 10,
      diferencia_calculada: 10,
      stock_calculado_anterior: 0,
      motivo: 'Inventario inicial',
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
    expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
  });

  it('does not create a product when the name is empty', async () => {
    component.nombre = '   ';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
  });

  it('does not create a product when the sale price is invalid', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = '';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
  });

  it('does not create a product when the minimum stock is negative', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = '12.500';
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = -1;

    await component.crearProducto();

    expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
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

  describe('stock inicial en el alta (Feature #36)', () => {
    function llenarFormularioValido(): void {
      component.nombre = 'Buzo Nike Azul M';
      component.precio_venta = '85.000';
      component.tipo_venta = 'UNIDAD';
    }

    it('AC-01: sin cantidad inicial NO crea el producto y avisa', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = null;
      component.minimo_stock = null;

      await component.crearProducto();

      expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
      expect(toastControllerMock.create).toHaveBeenCalled();
    });

    it('AC-01: cantidad inicial 0 SI crea el producto', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = 0;
      component.minimo_stock = null;

      await component.crearProducto();

      expect(databaseServiceMock.crearProductoConStockInicial).toHaveBeenCalledTimes(1);
    });

    it('AC-01: cantidad inicial negativa NO crea el producto', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = -5;
      component.minimo_stock = null;

      await component.crearProducto();

      expect(databaseServiceMock.crearProductoConStockInicial).not.toHaveBeenCalled();
    });

    it('AC-04: minimo_stock vacio guarda el producto con minimo 0', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = 20;
      component.minimo_stock = null;

      await component.crearProducto();

      const args = databaseServiceMock.crearProductoConStockInicial.calls.mostRecent()?.args ?? [{}, {}];
      expect(args[0].minimo_stock).toBe(0);
    });

    it('AC-02 y AC-03: el movimiento es un AJUSTE con el conteo y el motivo correctos', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = 20;
      component.minimo_stock = null;

      await component.crearProducto();

      const args = databaseServiceMock.crearProductoConStockInicial.calls.mostRecent()?.args ?? [{}, {}];
      expect(args[1].tipo).toBe('AJUSTE');
      expect(args[1].stock_calculado_anterior).toBe(0);
      expect(args[1].cantidad_fisica).toBe(20);
      expect(args[1].diferencia_calculada).toBe(20);
      expect(args[1].motivo).toBe('Inventario inicial');
      expect(args[1].producto_id).toBe(args[0].id);
    });

    it('AC-05: el producto de Yudith (20 unidades, sin minimo) NO queda en stock bajo', async () => {
      llenarFormularioValido();
      component.cantidad_inicial = 20;
      component.minimo_stock = null;

      await component.crearProducto();

      const args = databaseServiceMock.crearProductoConStockInicial.calls.mostRecent()?.args ?? [{}, {}];
      expect(args[0].minimo_stock).toBe(0);
      expect(args[1].cantidad_fisica).toBe(20);
      expect(esStockBajo(args[1].cantidad_fisica, args[0].minimo_stock)).toBe(false);
    });
  });
});
