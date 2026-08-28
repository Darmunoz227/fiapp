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
    'getUltimoDiaRecordatorioMostrado',
    'setUltimoDiaRecordatorioMostrado',
  ]);
  const alertControllerMock = jasmine.createSpyObj('AlertController', ['create']);

  beforeEach(() => {
    databaseServiceMock.contarClientes.and.resolveTo(0);
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(0);
    preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
    preferencesServiceMock.setTrialBloqueado.and.resolveTo(undefined);
    preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);
    preferencesServiceMock.setUltimoDiaRecordatorioMostrado.and.resolveTo(undefined);
    alertControllerMock.create.and.resolveTo({
      present: async () => undefined,
    } as any);
    databaseServiceMock.contarClientes.calls.reset();
    preferencesServiceMock.getLicenciaPremium.calls.reset();
    preferencesServiceMock.getDiasDesdeInstalacion.calls.reset();
    preferencesServiceMock.getTrialBloqueado.calls.reset();
    preferencesServiceMock.setTrialBloqueado.calls.reset();
    preferencesServiceMock.getUltimoDiaRecordatorioMostrado.calls.reset();
    preferencesServiceMock.setUltimoDiaRecordatorioMostrado.calls.reset();
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
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(26);

    await expectAsync(service.puedeEscribir()).toBeResolvedTo(false);
    expect(alertControllerMock.create).toHaveBeenCalled();
    expect(preferencesServiceMock.setTrialBloqueado).toHaveBeenCalledWith(true);
  });

  it('client count no longer influences blocking: 50 clients within day limit stays unblocked', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    databaseServiceMock.contarClientes.and.resolveTo(50);
    preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(10);

    await expectAsync(service.puedeEscribir()).toBeResolvedTo(true);
  });

  it('stays blocked after the flag is persisted even if days would look active on a later check', async () => {
    preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
    preferencesServiceMock.getTrialBloqueado.and.returnValues(false, true);
    preferencesServiceMock.getDiasDesdeInstalacion.and.returnValues(Promise.resolve(26), Promise.resolve(1));

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

  describe('verificarRecordatorioCompromiso', () => {
    it('shows the commitment alert on day 8 when not shown today', async () => {
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
      preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(8);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).toHaveBeenCalled();
      expect(preferencesServiceMock.setUltimoDiaRecordatorioMostrado).toHaveBeenCalled();
    });

    it('shows the commitment alert on day 17', async () => {
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
      preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(17);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).toHaveBeenCalled();
    });

    it('does not show the alert on a day outside the reminder list', async () => {
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
      preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(9);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).not.toHaveBeenCalled();
    });

    it('does not repeat the alert if already shown today', async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
      preferencesServiceMock.getTrialBloqueado.and.resolveTo(false);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(8);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(hoy);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).not.toHaveBeenCalled();
    });

    it('does not show the alert when premium license is active', async () => {
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(true);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(8);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).not.toHaveBeenCalled();
    });

    it('does not show the alert when the trial is already blocked', async () => {
      preferencesServiceMock.getLicenciaPremium.and.resolveTo(false);
      preferencesServiceMock.getTrialBloqueado.and.resolveTo(true);
      preferencesServiceMock.getDiasDesdeInstalacion.and.resolveTo(8);
      preferencesServiceMock.getUltimoDiaRecordatorioMostrado.and.resolveTo(null);

      await service.verificarRecordatorioCompromiso();

      expect(alertControllerMock.create).not.toHaveBeenCalled();
    });
  });
});
