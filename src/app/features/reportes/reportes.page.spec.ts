import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';

import { ReportesPage } from './reportes.page';
import { DatabaseService } from '../../core/database/database.service';
import { Producto } from '../../core/models/producto.model';
import { Venta } from '../../core/models/venta.model';

function crearVentaParcial(overrides: Partial<Venta> = {}): Venta {
  return {
    id: overrides.id ?? 'venta-1',
    producto_id: overrides.producto_id ?? 'p1',
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
      crearVentaParcial({
        id: 'v1',
        tipo_pago: 'CONTADO',
        precio_venta: 1000,
        cantidad: 2,
        ganancia: 400,
        fecha: Date.now(),
      }),
      crearVentaParcial({
        id: 'v2',
        tipo_pago: 'FIADO',
        precio_venta: 1500,
        cantidad: 1,
        ganancia: 500,
        fecha: Date.now(),
      }),
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
      crearVentaParcial({ id: 'v-old', fecha: older }),
      crearVentaParcial({ id: 'v-new', fecha: newer }),
    ]);

    await component.cargar();

    expect(component.ventasFiltradas[0].id).toBe('v-new');
    expect(component.ventasFiltradas[1].id).toBe('v-old');
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
      crearVentaParcial({ id: 'v-hoy', fecha: ahora }),
      crearVentaParcial({ id: 'v-antigua', fecha: haceDiezDias }),
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
