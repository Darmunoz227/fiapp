import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { ClienteDetallePage } from './cliente-detalle.page';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';

const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: () => 'dummy-id',
    },
  },
};

const modalControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    onWillDismiss: () => Promise.resolve({ data: null, role: null }),
  }),
};

const alertControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
  }),
};

const toastControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve(),
  }),
};

const routerMock = {
  events: new Subject().asObservable(),
  navigate: jasmine.createSpy('navigate').and.resolveTo(true),
};

const databaseServiceMock = {
  obtenerClientePorId: jasmine.createSpy('obtenerClientePorId').and.resolveTo(null),
  obtenerTransaccionesPorCliente: jasmine.createSpy('obtenerTransaccionesPorCliente').and.resolveTo([]),
  crearTransaccion: jasmine.createSpy('crearTransaccion').and.resolveTo(undefined),
  softDeleteTransaccion: jasmine.createSpy('softDeleteTransaccion').and.resolveTo(undefined),
  restoreTransaccion: jasmine.createSpy('restoreTransaccion').and.resolveTo(undefined),
};

const preferencesServiceMock = {
  getNombreNegocio: jasmine.createSpy('getNombreNegocio').and.resolveTo(''),
};

describe('ClienteDetallePage', () => {
  let component: ClienteDetallePage;
  let fixture: ComponentFixture<ClienteDetallePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ClienteDetallePage],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ModalController, useValue: modalControllerMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: Router, useValue: routerMock },
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteDetallePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});