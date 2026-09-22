import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular/standalone';

import { HomePage } from './home.page';
import { DatabaseService } from '../core/database/database.service';
import { PreferencesService } from '../core/preferences/preferences.service';
import { FreemiumService } from '../core/freemium/freemium.service';
import { ClienteDeleteUndoService } from './cliente-delete-undo.service';

const modalControllerMock = jasmine.createSpyObj('ModalController', ['create']);
const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);
const alertControllerMock = jasmine.createSpyObj('AlertController', ['create']);
const routerMock = jasmine.createSpyObj('Router', ['navigate']);
const databaseServiceMock = jasmine.createSpyObj('DatabaseService', [
  'obtenerClientes',
  'obtenerTransaccionesPorCliente',
  'softDeleteCliente',
  'restoreCliente',
  'obtenerProductos',
]);
const preferencesServiceMock = jasmine.createSpyObj('PreferencesService', [
  'getNombreNegocio',
  'setNombreNegocio',
]);
const freemiumServiceMock = jasmine.createSpyObj('FreemiumService', ['puedeAgregarCliente']);
let alertConfig: any;
let toastConfig: any;
let alertElement: any;
let toastElement: any;

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(waitForAsync(() => {
    alertConfig = null;
    toastConfig = null;

    alertElement = {
      present: jasmine.createSpy('present').and.resolveTo(undefined),
    };
    toastElement = {
      present: jasmine.createSpy('present').and.resolveTo(undefined),
      onDidDismiss: jasmine.createSpy('onDidDismiss').and.resolveTo(undefined),
    };

    modalControllerMock.create.and.resolveTo({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: null, role: null }),
    } as any);

    toastControllerMock.create.and.callFake(async (config: any) => {
      toastConfig = config;
      return toastElement;
    });

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      return alertElement;
    });

    routerMock.navigate.and.resolveTo(true);
    databaseServiceMock.obtenerClientes.and.resolveTo([]);
    databaseServiceMock.obtenerTransaccionesPorCliente.and.resolveTo([]);
    databaseServiceMock.softDeleteCliente.and.resolveTo(undefined);
    databaseServiceMock.restoreCliente.and.resolveTo(undefined);
    databaseServiceMock.obtenerProductos.and.resolveTo([]);
    preferencesServiceMock.getNombreNegocio.and.resolveTo('');
    preferencesServiceMock.setNombreNegocio.and.resolveTo(undefined);
    freemiumServiceMock.puedeAgregarCliente.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: ModalController, useValue: modalControllerMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: Router, useValue: routerMock },
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
        { provide: FreemiumService, useValue: freemiumServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    spyOn(component, 'cargarClientesYDeudas').and.resolveTo();
  }));

  it('muestra el boton de produccion si hay un producto en modo produccion', async () => {
    databaseServiceMock.obtenerProductos.and.resolveTo([
      { id: 'a', nombre: 'Empanada', ...{ precio_venta: 100, tipo_venta: 'UNIDAD', minimo_stock: 0, costo_promedio: 0 }, modo_produccion: 1 },
    ] as any);
    await component.cargarProductosDeProduccion();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.boton-registrar-produccion')).not.toBeNull();
  });

  it('AC-06 REGRESION: no muestra el boton si ningun producto tiene modo produccion', async () => {
    databaseServiceMock.obtenerProductos.and.resolveTo([
      { id: 'b', nombre: 'Arroz', ...{ precio_venta: 100, tipo_venta: 'UNIDAD', minimo_stock: 0, costo_promedio: 0 }, modo_produccion: false },
      { id: 'c', nombre: 'Sal', ...{ precio_venta: 100, tipo_venta: 'UNIDAD', minimo_stock: 0, costo_promedio: 0 } },
    ] as any);
    await component.cargarProductosDeProduccion();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.boton-registrar-produccion')).toBeNull();
  });

  it('shows the block alert and does not soft-delete when the client has positive debt', async () => {
    const cliente = {
      id: 'cliente-1',
      nombre: 'Cliente 1',
      deudaTotal: 50,
    };

    const clienteDeleteUndoService = fixture.debugElement.injector.get(ClienteDeleteUndoService);
    const stageSpy = spyOn(clienteDeleteUndoService, 'stage').and.callThrough();

    databaseServiceMock.softDeleteCliente.calls.reset();

    await component.confirmarEliminarCliente(cliente);

    expect(alertControllerMock.create).toHaveBeenCalled();
    expect(databaseServiceMock.softDeleteCliente).not.toHaveBeenCalled();
    expect(stageSpy).not.toHaveBeenCalled();

    expect(alertConfig.header).toBe('No se puede borrar');
    expect(alertConfig.message).toContain('saldo positivo');
  });

  it('soft-deletes a zero-debt client and stages undo when confirmed', async () => {
    const cliente = {
      id: 'cliente-1',
      nombre: 'Cliente 1',
      deudaTotal: 0,
    };

    const clienteDeleteUndoService = fixture.debugElement.injector.get(ClienteDeleteUndoService);
    const stageSpy = spyOn(clienteDeleteUndoService, 'stage').and.callThrough();
    const consumeSpy = spyOn(clienteDeleteUndoService, 'consume').and.callThrough();
    const clearSpy = spyOn(clienteDeleteUndoService, 'clear').and.callThrough();

    databaseServiceMock.softDeleteCliente.calls.reset();

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      if (config.header === '¿Eliminar cliente?') {
        await config.buttons[1].handler();
      }
      return alertElement;
    });

    await component.confirmarEliminarCliente(cliente);

    expect(databaseServiceMock.softDeleteCliente).toHaveBeenCalledWith('cliente-1');
    expect(stageSpy).toHaveBeenCalled();
    expect(component.cargarClientesYDeudas).toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalled();
    expect(toastConfig.message).toBe('Cliente eliminado');
  });

  it('restores the client and reloads the list from the undo toast handler', async () => {
    const cliente = {
      id: 'cliente-1',
      nombre: 'Cliente 1',
      deudaTotal: 0,
    };

    const clienteDeleteUndoService = fixture.debugElement.injector.get(ClienteDeleteUndoService);
    const consumeSpy = spyOn(clienteDeleteUndoService, 'consume').and.returnValue(cliente as any);
    const clearSpy = spyOn(clienteDeleteUndoService, 'clear').and.callThrough();
    databaseServiceMock.restoreCliente.calls.reset();

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      if (config.header === '¿Eliminar cliente?') {
        await config.buttons[1].handler();
      }
      return alertElement;
    });

    toastControllerMock.create.and.callFake(async (config: any) => {
      toastConfig = config;
      await config.buttons[0].handler();
      return toastElement;
    });

    await component.confirmarEliminarCliente(cliente);

    expect(databaseServiceMock.restoreCliente).toHaveBeenCalledWith('cliente-1');
    expect(component.cargarClientesYDeudas).toHaveBeenCalledTimes(2);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('carga segura (Feature #34)', () => {
    beforeEach(() => {
      (component.cargarClientesYDeudas as jasmine.Spy).and.callThrough();
    });

    afterEach(() => {
      databaseServiceMock.obtenerClientes.and.resolveTo([]);
      databaseServiceMock.obtenerTransaccionesPorCliente.and.resolveTo([]);
    });

    function dosClientesElSegundoFalla() {
      databaseServiceMock.obtenerClientes.and.resolveTo([
        { id: 'c1', nombre: 'Ana', telefono: '300' },
        { id: 'c2', nombre: 'Jorge', telefono: '301' },
      ]);
      databaseServiceMock.obtenerTransaccionesPorCliente.and.callFake((id: string) => {
        if (id === 'c2') {
          return Promise.reject(new Error('lectura fallida'));
        }
        return Promise.resolve([{ tipo: 'fiado', monto: 150000 }]);
      });
    }

    it('AC-01: si falla la lectura de clientes, marca errorCarga y no publica lista', async () => {
      databaseServiceMock.obtenerClientes.and.rejectWith(new Error('lectura fallida'));

      await component.cargarClientesYDeudas().catch(() => undefined);

      expect(component.errorCarga).toBe(true);
      expect(component.clientesActivos.length).toBe(0);
    });

    it('AC-02: si falla UN cliente, falla TODA la carga y nadie queda en deuda cero', async () => {
      dosClientesElSegundoFalla();

      await component.cargarClientesYDeudas().catch(() => undefined);

      expect(component.errorCarga).toBe(true);
      expect(component.clientesActivos.length).toBe(0);
    });

    it('AC-07: no publica un total parcial cuando la carga falla a mitad', async () => {
      dosClientesElSegundoFalla();

      await component.cargarClientesYDeudas().catch(() => undefined);

      expect(component.totalCartera).toBe(0);
      expect(component.clientesFiltrados.length).toBe(0);
    });

    it('AC-06: cero clientes con lectura exitosa NO es un error', async () => {
      databaseServiceMock.obtenerClientes.and.resolveTo([]);

      await component.cargarClientesYDeudas();

      expect(component.errorCarga).toBe(false);
      expect(component.clientesActivos.length).toBe(0);
    });

    it('camino feliz: dos clientes con deuda cargan completos y sin error', async () => {
      databaseServiceMock.obtenerClientes.and.resolveTo([
        { id: 'c1', nombre: 'Ana', telefono: '300' },
        { id: 'c2', nombre: 'Jorge', telefono: '301' },
      ]);
      databaseServiceMock.obtenerTransaccionesPorCliente.and.resolveTo([
        { tipo: 'fiado', monto: 50000 },
      ]);

      await component.cargarClientesYDeudas();

      expect(component.errorCarga).toBe(false);
      expect(component.clientesActivos.length).toBe(2);
      expect(component.totalCartera).toBe(100000);
    });
  });
});
