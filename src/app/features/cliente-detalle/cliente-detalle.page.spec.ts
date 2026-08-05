import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';

import { ClienteDetallePage } from './cliente-detalle.page';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { TransaccionDeleteUndoService } from './transaccion-delete-undo.service';

const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: () => 'dummy-id',
    },
  },
};

const modalControllerMock = jasmine.createSpyObj('ModalController', ['create']);
const alertControllerMock = jasmine.createSpyObj('AlertController', ['create']);
const toastControllerMock = jasmine.createSpyObj('ToastController', ['create']);
const routerMock = jasmine.createSpyObj('Router', ['navigate']);
const databaseServiceMock = jasmine.createSpyObj('DatabaseService', [
  'obtenerClientePorId',
  'obtenerTransaccionesPorCliente',
  'crearTransaccion',
  'softDeleteTransaccion',
  'restoreTransaccion',
]);
const freemiumServiceMock = jasmine.createSpyObj('FreemiumService', ['puedeEscribir']);
const preferencesServiceMock = jasmine.createSpyObj('PreferencesService', ['getNombreNegocio']);
let alertConfig: any;
let toastConfig: any;
let alertElement: any;
let toastElement: any;

describe('ClienteDetallePage', () => {
  let component: ClienteDetallePage;
  let fixture: ComponentFixture<ClienteDetallePage>;

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

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      return alertElement;
    });

    toastControllerMock.create.and.callFake(async (config: any) => {
      toastConfig = config;
      return toastElement;
    });

    routerMock.events = new Subject().asObservable();
    routerMock.navigate.and.resolveTo(true);

    databaseServiceMock.obtenerClientePorId.and.resolveTo({
      id: 'dummy-id',
      nombre: 'Cliente Prueba',
      telefono: '3001234567',
      habeas_data_flag: true,
      fecha_creacion: Date.now(),
      deleted_at: null,
      created_at: null,
      updated_at: null,
      store_id: null,
      created_by: null,
    });
    databaseServiceMock.obtenerTransaccionesPorCliente.and.resolveTo([]);
    databaseServiceMock.crearTransaccion.and.resolveTo(undefined);
    databaseServiceMock.softDeleteTransaccion.and.resolveTo(undefined);
    databaseServiceMock.restoreTransaccion.and.resolveTo(undefined);
    freemiumServiceMock.puedeEscribir.and.resolveTo(true);
    preferencesServiceMock.getNombreNegocio.and.resolveTo('');

    TestBed.configureTestingModule({
      imports: [ClienteDetallePage],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ModalController, useValue: modalControllerMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: Router, useValue: routerMock },
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: FreemiumService, useValue: freemiumServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteDetallePage);
    component = fixture.componentInstance;
    spyOn(component, 'cargarDatos').and.resolveTo();
  }));

  it('soft-deletes a transaction and stages undo when confirmed', async () => {
    const transaccion = {
      id: 'transaccion-1',
      cliente_id: 'dummy-id',
      tipo: 'fiado' as const,
      monto: 100,
      concepto: 'Fiado inicial',
      fecha: Date.now(),
    };

    const transaccionDeleteUndoService = fixture.debugElement.injector.get(TransaccionDeleteUndoService);
    const stageSpy = spyOn(transaccionDeleteUndoService, 'stage').and.callThrough();

    databaseServiceMock.softDeleteTransaccion.calls.reset();

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      if (config.header === '¿Eliminar movimiento?') {
        await config.buttons[1].handler();
      }
      return alertElement;
    });

    await component.confirmarEliminarTransaccion(transaccion as any);

    expect(databaseServiceMock.softDeleteTransaccion).toHaveBeenCalledWith('transaccion-1');
    expect(stageSpy).toHaveBeenCalled();
    expect(component.cargarDatos).toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalled();
    expect(toastConfig.message).toBe('Transacción eliminada');
  });

  it('restores the transaction and reloads data from the undo toast handler', async () => {
    const transaccion = {
      id: 'transaccion-1',
      cliente_id: 'dummy-id',
      tipo: 'fiado' as const,
      monto: 100,
      concepto: 'Fiado inicial',
      fecha: Date.now(),
    };

    component.cliente = {
      id: 'dummy-id',
      nombre: 'Cliente Prueba',
      telefono: '3001234567',
      habeas_data_flag: true,
      fecha_creacion: Date.now(),
      deleted_at: null,
      created_at: null,
      updated_at: null,
      store_id: null,
      created_by: null,
    };

    const transaccionDeleteUndoService = fixture.debugElement.injector.get(TransaccionDeleteUndoService);
    const consumeSpy = spyOn(transaccionDeleteUndoService, 'consume').and.returnValue(transaccion as any);
    const clearSpy = spyOn(transaccionDeleteUndoService, 'clear').and.callThrough();
    databaseServiceMock.restoreTransaccion.calls.reset();

    alertControllerMock.create.and.callFake(async (config: any) => {
      alertConfig = config;
      if (config.header === '¿Eliminar movimiento?') {
        await config.buttons[1].handler();
      }
      return alertElement;
    });

    toastControllerMock.create.and.callFake(async (config: any) => {
      toastConfig = config;
      await config.buttons[0].handler();
      return toastElement;
    });

    await component.confirmarEliminarTransaccion(transaccion as any);

    expect(databaseServiceMock.restoreTransaccion).toHaveBeenCalledWith('transaccion-1');
    expect(component.cargarDatos).toHaveBeenCalledTimes(2);
  });

  it('blocks manual fiado when freemium is expired but allows abono', async () => {
    component.cliente = {
      id: 'dummy-id',
      nombre: 'Cliente Prueba',
      telefono: '3001234567',
      habeas_data_flag: true,
      fecha_creacion: Date.now(),
      deleted_at: null,
      created_at: null,
      updated_at: null,
      store_id: null,
      created_by: null,
    };

    modalControllerMock.create.and.resolveTo({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: { tipo: 'fiado', monto: 1000, concepto: '' }, role: null }),
    } as any);

    freemiumServiceMock.puedeEscribir.and.resolveTo(false);

    await component.abrirModalTransaccion('fiado');
    expect(databaseServiceMock.crearTransaccion).not.toHaveBeenCalled();
    expect(freemiumServiceMock.puedeEscribir).toHaveBeenCalledTimes(1);

    freemiumServiceMock.puedeEscribir.calls.reset();
    databaseServiceMock.crearTransaccion.calls.reset();
    modalControllerMock.create.and.resolveTo({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: { tipo: 'abono', monto: 1000, concepto: '' }, role: null }),
    } as any);

    await component.abrirModalTransaccion('abono');
    expect(databaseServiceMock.crearTransaccion).toHaveBeenCalledTimes(1);
    expect(freemiumServiceMock.puedeEscribir).not.toHaveBeenCalled();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
