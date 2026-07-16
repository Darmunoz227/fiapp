import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular/standalone';

import { HomePage } from './home.page';
import { DatabaseService } from '../core/database/database.service';
import { PreferencesService } from '../core/preferences/preferences.service';
import { FreemiumService } from '../core/freemium/freemium.service';

const modalControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    onWillDismiss: () => Promise.resolve({ data: null, role: null }),
  }),
};

const toastControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve(),
  }),
};

const alertControllerMock = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
  }),
};

const routerMock = {
  navigate: jasmine.createSpy('navigate').and.resolveTo(true),
};

const databaseServiceMock = {
  obtenerClientes: jasmine.createSpy('obtenerClientes').and.resolveTo([]),
  obtenerTransaccionesPorCliente: jasmine.createSpy('obtenerTransaccionesPorCliente').and.resolveTo([]),
};

const preferencesServiceMock = {
  getNombreNegocio: jasmine.createSpy('getNombreNegocio').and.resolveTo(''),
  setNombreNegocio: jasmine.createSpy('setNombreNegocio').and.resolveTo(undefined),
};

const freemiumServiceMock = {
  puedeAgregarCliente: jasmine.createSpy('puedeAgregarCliente').and.resolveTo(true),
};

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(waitForAsync(() => {
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
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});