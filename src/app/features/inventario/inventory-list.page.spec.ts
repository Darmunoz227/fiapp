import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';

import { InventoryListPage } from './inventory-list.page';
import { DatabaseService } from '../../core/database/database.service';
import { Producto } from '../../core/models/producto.model';

const databaseServiceMock = jasmine.createSpyObj('DatabaseService', ['crearProducto', 'obtenerProductos']);
const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);

describe('InventoryListPage', () => {
  let component: InventoryListPage;
  let fixture: ComponentFixture<InventoryListPage>;

  beforeEach(waitForAsync(() => {
    databaseServiceMock.crearProducto.and.resolveTo(undefined);
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    databaseServiceMock.crearProducto.calls.reset();
    databaseServiceMock.obtenerProductos.calls.reset();

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
        { provide: ToastController, useValue: toastControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('creates a valid product and sends the expected persisted fields', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = 12500;
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

  it('does not create a product when the name is empty', async () => {
    component.nombre = '   ';
    component.precio_venta = 12500;
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('does not create a product when the sale price is invalid', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = 0;
    component.tipo_venta = 'UNIDAD';
    component.minimo_stock = 3;

    await component.crearProducto();

    expect(databaseServiceMock.crearProducto).not.toHaveBeenCalled();
  });

  it('does not create a product when the minimum stock is negative', async () => {
    component.nombre = 'Carne molida';
    component.precio_venta = 12500;
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
});