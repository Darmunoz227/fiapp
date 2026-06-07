import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly KEY = 'nombreNegocio';

  constructor() {}

  async getNombreNegocio(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.KEY });
      return value ?? null;
    } catch (e) {
      console.error('Preferences.get error', e);
      return null;
    }
  }

  async setNombreNegocio(nombre: string): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY, value: nombre });
    } catch (e) {
      console.error('Preferences.set error', e);
    }
  }

  async clearNombreNegocio(): Promise<void> {
    try {
      await Preferences.remove({ key: this.KEY });
    } catch (e) {
      console.error('Preferences.remove error', e);
    }
  }
}
