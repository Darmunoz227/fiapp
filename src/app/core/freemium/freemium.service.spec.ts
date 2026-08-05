import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/standalone';

import { FreemiumService } from './freemium.service';
import { DatabaseService } from '../database/database.service';
import { PreferencesService } from '../preferences/preferences.service';

describe('FreemiumService', () => {
  let service: FreemiumService;

  const databaseServiceMock = jasmine.createSpyObj('DatabaseService', ['contarClientes']);
  const preferencesServiceMock = jasmine.createSpyObj('PreferencesService', [
    'ensureFechaInstalacion',
    'ensureLicenciaPremiumDefault',
    'setLicenciaPremium',
    'getLicenciaPremium',
    'getDiasDesdeInstalacion',
    'getTrialBloqueado',
    'setTrialBloqueado',
  ]);
  const alertControllerMock = jasmine.createSpyObj('AlertController', ['create']);

  beforeEach(() => {
    databaseServiceMock.contarClientes.and.resolveTo(0);
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(0);
    preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
    preferencesServiceMock.setTrialBloqueado.and.resolveTo(undefined);
    alertControllerMock.create.and.resolveTo({
      present: async () => undefined,
    } as any);
    databaseServiceMock.contarClientes.calls.reset();
    preferencesServiceMock.getLicenciaPremium.calls.reset();
    preferencesServiceMock.getDiasDesdeInstalacion.calls.reset();
    preferencesServiceMock.getTrialBloqueado.calls.reset();
    preferencesServiceMock.setTrialBloqueado.calls.reset();
    alertControllerMock.create.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        FreemiumService,
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
        { provide: AlertController, useValue: alertControllerMock },
      ],
    });

    service = TestBed.inject(FreemiumService);
  });

  it('returns true when the trial is still active', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    databaseServiceMock.contarClientes.and.resolveTo(3);
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(4);

    await expectAsync(service.puedeEscribir()).toBeResolvedTo(true);
  });

  it('returns false and shows the block alert when the trial is expired', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    databaseServiceMock.contarClientes.and.resolveTo(7);
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(21);

    await expectAsync(service.puedeEscribir()).toBeResolvedTo(false);
    expect(alertControllerMock.create).toHaveBeenCalled();
    expect(preferencesServiceMock.setTrialBloqueado).toHaveBeenCalledWith(true);
  });

  it('stays blocked after the flag is persisted even if client count drops below the limit', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    preferencesServiceMock.getTrialBloqueado.and.returnValues(false, true);
    databaseServiceMock.contarClientes.and.returnValues(Promise.resolve(7), Promise.resolve(6));
    preferencesServiceMock.getDiasDesdeInstalacion.and.returnValues(Promise.resolve(21), Promise.resolve(1));

    await expectAsync(service.obtenerEstado()).toBeResolvedTo(jasmine.objectContaining({ bloqueado: true }));
    await expectAsync(service.obtenerEstado()).toBeResolvedTo(jasmine.objectContaining({ bloqueado: true }));
  });

  it('returns true when premium is active', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(true);
    preferencesServiceMock.getTrialBloqueado.and.resolveTo(true);

    await expectAsync(service.puedeEscribir()).toBeResolvedTo(true);
    expect(databaseServiceMock.contarClientes).not.toHaveBeenCalled();
    expect(alertControllerMock.create).not.toHaveBeenCalled();
  });
});