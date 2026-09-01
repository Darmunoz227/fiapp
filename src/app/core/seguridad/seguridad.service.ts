import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { PreferencesService } from '../preferences/preferences.service';
import { verificarPin } from './pin';

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  constructor(
    private alertCtrl: AlertController,
    private prefs: PreferencesService,
  ) {}

  async tienePin(): Promise<boolean> {
    const pin = await this.prefs.getPinAdministrador();
    return !!pin && pin.trim() !== '';
  }

  async configurarPin(nuevo: string): Promise<void> {
    await this.prefs.setPinAdministrador(nuevo.trim());
  }

  async cambiarPin(actual: string, nuevo: string): Promise<boolean> {
    const guardado = await this.prefs.getPinAdministrador();
    if (!verificarPin(actual, guardado)) {
      return false;
    }
    await this.prefs.setPinAdministrador(nuevo.trim());
    return true;
  }

  // Ejecuta la accion directamente si no hay PIN configurado; si lo hay,
  // pide el PIN y solo ejecuta cuando es correcto.
  async ejecutarConPin(accion: () => Promise<void> | void): Promise<void> {
    const pin = await this.prefs.getPinAdministrador();

    if (!pin || pin.trim() === '') {
      await accion();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Acción protegida',
      message: 'Ingresa el PIN de administrador para continuar.',
      inputs: [
        { name: 'pin', type: 'password', placeholder: 'PIN de administrador' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          handler: async (data: { pin?: string }) => {
            const ingresado = (data?.pin ?? '').trim();
            if (verificarPin(ingresado, pin)) {
              await accion();
            } else {
              await this.mostrarPinIncorrecto();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async mostrarPinIncorrecto(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'PIN incorrecto',
      message: 'El PIN ingresado no es correcto. La acción fue cancelada.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }
}
