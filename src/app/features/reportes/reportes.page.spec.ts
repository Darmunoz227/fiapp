import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';

import { ReportesPage } from './reportes.page';
import { DatabaseService } from '../../core/database/database.service';
import { VentaConItems } from '../../core/models/venta-con-items.model';
import { Venta } from '../../core/models/venta.model';
import { VentaItem } from '../../core/models/venta-item.model';
import { Producto } from '../../core/models/producto.model';

function crearVentaParcial(overrides: Partial<Venta> = {}): Venta {
  return {
    id: overrides.id ?? 'venta-1',
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

function crearVentaConItemsParcial(ventaOverrides: Partial<Venta> = {}, items: VentaItem[] = []): VentaConItems {
  return {
    venta: crearVentaParcial(ventaOverrides),
    items,
  };
}

function crearVentaItemParcial(overrides: Partial<VentaItem> = {}): VentaItem {
  return {
    id: overrides.id ?? 'vi-1',
    venta_id: overrides.venta_id ?? 'v1',
    producto_id: overrides.producto_id ?? 'p1',
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

describe('ReportesPage', () => {
  let component: ReportesPage;
  let fixture: ComponentFixture<ReportesPage>;

  const databaseServiceMock = jasmine.createSpyObj('DatabaseService', [
    'obtenerVentas',
    'obtenerProductos',
  ]);

  const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);

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

  beforeEach(waitForAsync(() => {
    databaseServiceMock.obtenerProductos.and.resolveTo(productosMock);
    databaseServiceMock.obtenerVentas.and.resolveTo([
      crearVentaConItemsParcial({
        id: 'v1',
        tipo_pago: 'CONTADO',
        monto_contado: 2000,
        monto_fiado: 0,
        fecha: Date.now(),
      }, [
        crearVentaItemParcial({ id: 'vi-1', venta_id: 'v1', cantidad: 2, precio_venta: 1000, ganancia: 400 }),
      ]),
      crearVentaConItemsParcial({
        id: 'v2',
        tipo_pago: 'FIADO',
        monto_contado: 0,
        monto_fiado: 1500,
        fecha: Date.now(),
      }, [
        crearVentaItemParcial({ id: 'vi-2', venta_id: 'v2', cantidad: 1, precio_venta: 1500, ganancia: 500 }),
      ]),
    ]);

    databaseServiceMock.obtenerVentas.calls.reset();
    databaseServiceMock.obtenerProductos.calls.reset();

    toastControllerMock.create.calls.reset();

    TestBed.configureTestingModule({
      imports: [ReportesPage],
      providers: [
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: ToastController, useValue: toastControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('loads ventas and computes the resumen for TODO on init', async () => {
    await component.cargar();

    expect(databaseServiceMock.obtenerVentas).toHaveBeenCalledTimes(1);
    expect(databaseServiceMock.obtenerProductos).toHaveBeenCalledTimes(1);
    expect(component.resumen.numeroVentas).toBe(2);
    expect(component.resumen.totalVendido).toBe(3500);
    expect(component.resumen.gananciaTotal).toBe(900);
    expect(component.resumen.contadoCount).toBe(1);
    expect(component.resumen.fiadoCount).toBe(1);
  });

  it('ventasFiltradas is sorted newest first', async () => {
    const older = Date.now() - 1000;
    const newer = Date.now();

    databaseServiceMock.obtenerVentas.and.resolveTo([
      crearVentaConItemsParcial({ id: 'v-old', fecha: older }, [crearVentaItemParcial({ venta_id: 'v-old' })]),
      crearVentaConItemsParcial({ id: 'v-new', fecha: newer }, [crearVentaItemParcial({ venta_id: 'v-new' })]),
    ]);

    await component.cargar();

    expect(component.ventasFiltradas[0].venta.id).toBe('v-new');
    expect(component.ventasFiltradas[1].venta.id).toBe('v-old');
  });

  it('nombreProducto returns the product name, or fallback when missing', async () => {
    await component.cargar();

    expect(component.nombreProducto('p1')).toBe('Producto 1');
    expect(component.nombreProducto('nope')).toBe('Producto eliminado');
  });

  it("cambiarRango('HOY') recomputes for today", async () => {
    const ahora = Date.now();
    const haceDiezDias = ahora - 10 * 24 * 60 * 60 * 1000;

    databaseServiceMock.obtenerVentas.and.resolveTo([
      crearVentaConItemsParcial({ id: 'v-hoy', fecha: ahora }, [crearVentaItemParcial({ venta_id: 'v-hoy' })]),
      crearVentaConItemsParcial({ id: 'v-antigua', fecha: haceDiezDias }, [crearVentaItemParcial({ venta_id: 'v-antigua' })]),
    ]);

    await component.cargar();
    component.cambiarRango('HOY');

    expect(component.resumen.numeroVentas).toBe(1);
  });

  it('empty ventas → resumen all zeros', async () => {
    databaseServiceMock.obtenerVentas.and.resolveTo([]);

    await component.cargar();

    expect(component.resumen.numeroVentas).toBe(0);
    expect(component.resumen.totalVendido).toBe(0);
  });
});
