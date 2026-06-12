import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly KEY_NOMBRE_NEGOCIO = 'nombreNegocio';
  private readonly KEY_FECHA_INSTALACION = 'fecha_instalacion';
  private readonly KEY_LICENCIA_PREMIUM = 'licencia_premium';

  constructor() {}

  async getNombreNegocio(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_NOMBRE_NEGOCIO });
      return value ?? null;
    } catch (e) {
      console.error('Preferences.get error', e);
      return null;
    }
  }

  async setNombreNegocio(nombre: string): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_NOMBRE_NEGOCIO, value: nombre });
    } catch (e) {
      console.error('Preferences.set error', e);
    }
  }

  async clearNombreNegocio(): Promise<void> {
    try {
      await Preferences.remove({ key: this.KEY_NOMBRE_NEGOCIO });
    } catch (e) {
      console.error('Preferences.remove error', e);
    }
  }

  async getFechaInstalacion(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_FECHA_INSTALACION });
      return value ?? null;
    } catch (e) {
      console.error('Preferences.get fecha_instalacion error', e);
      return null;
    }
  }

  async setFechaInstalacion(fechaIso: string): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_FECHA_INSTALACION, value: fechaIso });
    } catch (e) {
      console.error('Preferences.set fecha_instalacion error', e);
    }
  }

  async ensureFechaInstalacion(): Promise<string> {
    const fechaExistente = await this.getFechaInstalacion();
    if (fechaExistente) {
      return fechaExistente;
    }

    const fechaActualIso = new Date().toISOString();
    await this.setFechaInstalacion(fechaActualIso);
    return fechaActualIso;
  }

  async getDiasDesdeInstalacion(): Promise<number> {
    const fechaIso = await this.ensureFechaInstalacion();
    const fechaInstalacion = new Date(fechaIso);

    if (Number.isNaN(fechaInstalacion.getTime())) {
      const fechaActualIso = new Date().toISOString();
      await this.setFechaInstalacion(fechaActualIso);
      return 0;
    }

    const diferenciaMs = Date.now() - fechaInstalacion.getTime();
    return Math.max(0, Math.floor(diferenciaMs / 86400000));
  }

  async getLicenciaPremium(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_LICENCIA_PREMIUM });
      return value === 'true';
    } catch (e) {
      console.error('Preferences.get licencia_premium error', e);
      return false;
    }
  }

  async setLicenciaPremium(activa: boolean): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_LICENCIA_PREMIUM, value: activa ? 'true' : 'false' });
    } catch (e) {
      console.error('Preferences.set licencia_premium error', e);
    }
  }

  async ensureLicenciaPremiumDefault(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_LICENCIA_PREMIUM });
      if (value === null) {
        await Preferences.set({ key: this.KEY_LICENCIA_PREMIUM, value: 'false' });
        return false;
      }

      return value === 'true';
    } catch (e) {
      console.error('Preferences.ensure licencia_premium error', e);
      return false;
    }
  }
}
