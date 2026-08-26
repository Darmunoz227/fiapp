import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, ToastController } from '@ionic/angular/standalone';

import { ConfiguracionesPage } from './configuraciones.page';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { FreemiumService } from '../../core/freemium/freemium.service';

type ResetAlertButton = {
  text?: string;
  role?: string;
  handler?: (data: { palabra?: string }) => boolean | Promise<boolean> | void | Promise<void>;
};

type CapturedAlertConfig = {
  header?: string;
  message?: string;
  buttons?: Array<string | ResetAlertButton>;
};

describe('ConfiguracionesPage', () => {
  let component: ConfiguracionesPage;
  let fixture: ComponentFixture<ConfiguracionesPage>;

  let dbServiceMock: jasmine.SpyObj<DatabaseService>;
  let prefsMock: jasmine.SpyObj<PreferencesService>;
  let freemiumMock: jasmine.SpyObj<FreemiumService>;
  let alertCtrlMock: jasmine.SpyObj<AlertController>;
  let toastCtrlMock: jasmine.SpyObj<ToastController>;

  let lastAlertConfig: CapturedAlertConfig | undefined;

  beforeEach(async () => {
    dbServiceMock = jasmine.createSpyObj('DatabaseService', [
      'resetInventario',
      'leerCrudoClientes',
      'leerCrudoTransacciones',
      'leerCrudoProductos',
      'leerCrudoMovimInventario',
      'leerCrudoVentas',
      'leerCrudoVentaItems',
    ]);

    dbServiceMock.resetInventario.and.resolveTo();
    dbServiceMock.leerCrudoClientes.and.resolveTo([]);
    dbServiceMock.leerCrudoTransacciones.and.resolveTo([]);
    dbServiceMock.leerCrudoProductos.and.resolveTo([]);
    dbServiceMock.leerCrudoMovimInventario.and.resolveTo([]);
    dbServiceMock.leerCrudoVentas.and.resolveTo([]);
    dbServiceMock.leerCrudoVentaItems.and.resolveTo([]);

    prefsMock = jasmine.createSpyObj('PreferencesService', [
      'getNombreNegocio',
      'setNombreNegocio',
      'clearNombreNegocio',
      'getCatalogoFiado',
      'setCatalogoFiado',
    ]);
    prefsMock.getNombreNegocio.and.resolveTo('Tienda');
    prefsMock.getCatalogoFiado.and.resolveTo([]);
    prefsMock.setCatalogoFiado.and.resolveTo();

    freemiumMock = jasmine.createSpyObj('FreemiumService', [
      'puedeEscribir',
      'activarLicenciaPremium',
    ]);
    freemiumMock.puedeEscribir.and.resolveTo(true);
    freemiumMock.activarLicenciaPremium.and.resolveTo();

    alertCtrlMock = jasmine.createSpyObj('AlertController', ['create']);
    alertCtrlMock.create.and.callFake(async (config?: Parameters<AlertController['create']>[0]) => {
      lastAlertConfig = config as CapturedAlertConfig | undefined;
      return {
        present: jasmine.createSpy('present').and.resolveTo(),
      } as unknown as HTMLIonAlertElement;
    });

    toastCtrlMock = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrlMock.create.and.resolveTo({
      present: jasmine.createSpy('present').and.resolveTo(),
    } as unknown as HTMLIonToastElement);

    await TestBed.configureTestingModule({
      imports: [ConfiguracionesPage],
      providers: [
        { provide: DatabaseService, useValue: dbServiceMock },
        { provide: PreferencesService, useValue: prefsMock },
        { provide: FreemiumService, useValue: freemiumMock },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: ToastController, useValue: toastCtrlMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function botonReiniciar(): ResetAlertButton {
    const botones = lastAlertConfig?.buttons ?? [];
    const boton = botones.find((item): item is ResetAlertButton => {
      return typeof item !== 'string' && item.text === 'Reiniciar';
    });

    if (!boton) {
      throw new Error('No se encontro el boton Reiniciar');
    }

    return boton;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not reset inventory when confirmation text is wrong', async () => {
    spyOn(component, 'generarArchivoRespaldo').and.resolveTo('cache://backup.json');

    await component.reiniciarInventario();

    const resultado = await botonReiniciar().handler?.({ palabra: 'NO' });

    expect(resultado).toBeFalse();
    expect(dbServiceMock.resetInventario).not.toHaveBeenCalled();
  });

  it('does not reset inventory when safety backup fails', async () => {
    spyOn(component, 'generarArchivoRespaldo').and.rejectWith(new Error('backup failed'));

    await component.reiniciarInventario();

    expect(dbServiceMock.resetInventario).not.toHaveBeenCalled();
  });

  it('resets inventory after backup and typed confirmation', async () => {
    spyOn(component, 'generarArchivoRespaldo').and.resolveTo('cache://backup.json');

    await component.reiniciarInventario();

    await botonReiniciar().handler?.({ palabra: 'REINICIAR' });

    expect(dbServiceMock.resetInventario).toHaveBeenCalled();
  });
});
