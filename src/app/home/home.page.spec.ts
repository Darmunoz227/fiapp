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
});
