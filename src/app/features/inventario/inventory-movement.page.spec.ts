import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

import { InventoryMovementPage } from './inventory-movement.page';
import { DatabaseService } from '../../core/database/database.service';
import { MovimInventario } from '../../core/models/movim-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { calcularStockDerivado } from './inventory-calculations';

const productosMock: Producto[] = [
  {
    id: 'producto-1',
    nombre: 'Carne molida',
    precio_venta: 12500,
    tipo_venta: 'PESO',
    minimo_stock: 3000,
    costo_promedio: 1500,
    created_at: Date.now(),
    updated_at: null,
    deleted_at: null,
    store_id: null,
    created_by: null,
  },
];

describe('InventoryMovementPage', () => {
  let component: InventoryMovementPage;
  let fixture: ComponentFixture<InventoryMovementPage>;
  let movimientosMock: MovimInventario[];

  const databaseServiceMock = jasmine.createSpyObj('DatabaseService', [
    'crearMovimiento',
    'obtenerProductos',
    'obtenerMovimientosPorProducto',
  ]);

  const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'productoId' ? 'producto-1' : null),
      },
    },
  };

  function crearMovimientoParcial(overrides: Partial<MovimInventario> = {}): MovimInventario {
    return {
      id: overrides.id ?? 'movimiento-1',
      producto_id: overrides.producto_id ?? 'producto-1',
      tipo: overrides.tipo ?? 'COMPRA',
      cantidad: overrides.cantidad ?? 10,
      costo_unitario: overrides.costo_unitario ?? 1000,
      motivo: overrides.motivo ?? 'Movimiento de inventario',
      fecha: overrides.fecha ?? Date.now(),
      actor_id: overrides.actor_id ?? null,
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

  beforeEach(waitForAsync(() => {
    movimientosMock = [];

    databaseServiceMock.obtenerProductos.and.callFake(async () => productosMock);
    databaseServiceMock.obtenerMovimientosPorProducto.and.callFake(async () => [...movimientosMock]);
    databaseServiceMock.crearMovimiento.and.callFake(async (movimiento: MovimInventario) => {
      movimientosMock = [...movimientosMock, movimiento];
    });

    databaseServiceMock.crearMovimiento.calls.reset();
    databaseServiceMock.obtenerProductos.calls.reset();
    databaseServiceMock.obtenerMovimientosPorProducto.calls.reset();

    toastControllerMock.create.and.callFake(async (_config: any) => ({
      present: () => Promise.resolve(),
    } as any));
    toastControllerMock.create.calls.reset();

    TestBed.configureTestingModule({
      imports: [InventoryMovementPage],
      providers: [
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryMovementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('loads product + derived stock on init', async () => {
    movimientosMock = [
      crearMovimientoParcial({ id: 'mov-1', tipo: 'COMPRA', cantidad: 10, costo_unitario: 1000 }),
      crearMovimientoParcial({ id: 'mov-2', tipo: 'VENTA', cantidad: 2, costo_unitario: 0 }),
    ];

    await component.cargarDatos();

    expect(databaseServiceMock.obtenerProductos).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.obtenerMovimientosPorProducto).toHaveBeenCalledWith('producto-1');
    expect(component.producto?.id).toBe('producto-1');
    expect(component.producto?.nombre).toBe('Carne molida');
    expect(component.movimientos).toEqual(movimientosMock);
    expect(component.stockDerivado).toBe(calcularStockDerivado(movimientosMock));
  });

  it('registers a COMPRA, refreshes derived stock, and clears the form', async () => {
    component.tipo = 'COMPRA';
    component.cantidad = 10;
    component.costo_unitario = 1200;
    component.motivo = 'Entrada inicial';

    await component.registrarMovimiento();

    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledWith(jasmine.objectContaining({
      producto_id: 'producto-1',
      tipo: 'COMPRA',
      cantidad: 10,
      costo_unitario: 1200,
      motivo: 'Entrada inicial',
    }));
    expect(component.stockDerivado).toBe(10);
    expect(component.tipo).toBe('COMPRA');
    expect(component.cantidad).toBe(0);
    expect(component.costo_unitario).toBe(0);
    expect(component.motivo).toBe('');
  });

  it('registers a VENTA and applies the derived stock change', async () => {
    movimientosMock = [
      crearMovimientoParcial({ id: 'mov-1', tipo: 'COMPRA', cantidad: 10, costo_unitario: 1000 }),
    ];

    component.tipo = 'VENTA';
    component.cantidad = 3;
    component.costo_unitario = 999;
    component.motivo = 'Venta mostrador';

    await component.registrarMovimiento();

    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledWith(jasmine.objectContaining({
      producto_id: 'producto-1',
      tipo: 'VENTA',
      cantidad: 3,
      costo_unitario: 0,
      motivo: 'Venta mostrador',
    }));
    expect(component.stockDerivado).toBe(7);
    expect(component.cantidad).toBe(0);
    expect(component.motivo).toBe('');
  });

  it('registers a MERMA and applies the derived stock change', async () => {
    movimientosMock = [
      crearMovimientoParcial({ id: 'mov-1', tipo: 'COMPRA', cantidad: 10, costo_unitario: 1000 }),
    ];

    component.tipo = 'MERMA';
    component.cantidad = 2;
    component.costo_unitario = 123;
    component.motivo = 'Rotura';

    await component.registrarMovimiento();

    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledWith(jasmine.objectContaining({
      producto_id: 'producto-1',
      tipo: 'MERMA',
      cantidad: 2,
      costo_unitario: 0,
      motivo: 'Rotura',
    }));
    expect(component.stockDerivado).toBe(8);
    expect(component.cantidad).toBe(0);
    expect(component.motivo).toBe('');
  });

  it('registers an AJUSTE using physical count and stores the computed delta', async () => {
    movimientosMock = [
      crearMovimientoParcial({ id: 'mov-1', tipo: 'COMPRA', cantidad: 10, costo_unitario: 1000 }),
    ];

    await component.cargarDatos();

    component.tipo = 'AJUSTE';
    component.conteo_fisico = 8;
    component.motivo = 'Conteo físico';

    await component.registrarMovimiento();

    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledWith(jasmine.objectContaining({
      producto_id: 'producto-1',
      tipo: 'AJUSTE',
      cantidad: 0,
      cantidad_fisica: 8,
      stock_calculado_anterior: 10,
      diferencia_calculada: -2,
      motivo: 'Conteo físico',
    }));
    expect(component.conteo_fisico).toBe(0);
    expect(component.motivo).toBe('');
    expect(component.tipo).toBe('COMPRA');
  });

  it('shows the service error and keeps the form when stock is blocked', async () => {
    databaseServiceMock.crearMovimiento.and.rejectWith(new Error('Stock insuficiente para registrar el movimiento'));

    component.tipo = 'VENTA';
    component.cantidad = 99;
    component.costo_unitario = 0;
    component.motivo = 'Venta sin stock';

    await component.registrarMovimiento();

    expect(databaseServiceMock.crearMovimiento).toHaveBeenCalledTimes(1);
    expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Stock insuficiente para registrar el movimiento',
      color: 'danger',
    }));
    expect(component.cantidad).toBe(99);
    expect(component.motivo).toBe('Venta sin stock');
    expect(component.tipo).toBe('VENTA');
  });
});