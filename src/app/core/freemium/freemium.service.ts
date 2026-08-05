import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { DatabaseService } from '../database/database.service';
import { PreferencesService } from '../preferences/preferences.service';

type EstadoFreemium = {
  bloqueado: boolean;
  motivo: 'clientes' | 'tiempo' | 'ninguno';
  licenciaPremium: boolean;
  totalClientes: number;
  diasDesdeInstalacion: number;
};

@Injectable({ providedIn: 'root' })
export class FreemiumService {
  private readonly LIMITE_CLIENTES = 7;
  private readonly LIMITE_DIAS = 20;
  private readonly WHATSAPP_FEEDBACK_URL = 'https://wa.me/573124895016?text=Hola%20Diego,%20estoy%20usando%20FiApp%20en%20mi%20negocio%20y%20me%20gustar%C3%ADa%20darte%20mi%20feedback.';

  constructor(
    private dbService: DatabaseService,
    private prefsService: PreferencesService,
    private alertCtrl: AlertController
  ) {}

  async asegurarFechaInstalacion(): Promise<void> {
    await this.prefsService.ensureFechaInstalacion();
  }

  async inicializarEstadoFreemium(): Promise<void> {
    await Promise.all([
      this.prefsService.ensureFechaInstalacion(),
      this.prefsService.ensureLicenciaPremiumDefault()
    ]);
  }

  async activarLicenciaPremium(): Promise<void> {
    await this.prefsService.setLicenciaPremium(true);
  }

  async tieneLicenciaPremium(): Promise<boolean> {
    return this.prefsService.getLicenciaPremium();
  }

  async calcularDiasDesdeInstalacion(): Promise<number> {
    return this.prefsService.getDiasDesdeInstalacion();
  }

  async obtenerEstado(): Promise<EstadoFreemium> {
    const licenciaPremium = await this.tieneLicenciaPremium();
    if (licenciaPremium) {
      return {
        bloqueado: false,
        motivo: 'ninguno',
        licenciaPremium: true,
        totalClientes: 0,
        diasDesdeInstalacion: 0,
      };
    }

    const trialBloqueado = await this.prefsService.getTrialBloqueado();
    if (trialBloqueado) {
      return {
        bloqueado: true,
        motivo: 'clientes',
        licenciaPremium: false,
        totalClientes: 0,
        diasDesdeInstalacion: 0,
      };
    }

    const [totalClientes, diasDesdeInstalacion] = await Promise.all([
      this.dbService.contarClientes(),
      this.calcularDiasDesdeInstalacion()
    ]);

    const bloqueadoPorClientes = totalClientes >= this.LIMITE_CLIENTES;
    const bloqueadoPorTiempo = diasDesdeInstalacion > this.LIMITE_DIAS;
    const bloqueado = bloqueadoPorClientes || bloqueadoPorTiempo;

    if (bloqueado) {
      await this.prefsService.setTrialBloqueado(true);
    }

    return {
      bloqueado,
      motivo: bloqueadoPorClientes ? 'clientes' : bloqueadoPorTiempo ? 'tiempo' : 'ninguno',
      licenciaPremium: false,
      totalClientes,
      diasDesdeInstalacion,
    };
  }

  async puedeAgregarCliente(): Promise<boolean> {
    const estado = await this.obtenerEstado();
    if (estado.bloqueado) {
      await this.mostrarAlertaBloqueo();
      return false;
    }

    return true;
  }

  async puedeEscribir(): Promise<boolean> {
    const estado = await this.obtenerEstado();
    if (estado.bloqueado) {
      await this.mostrarAlertaBloqueo();
      return false;
    }

    return true;
  }

  async mostrarAlertaBloqueo(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¡Gracias por usar FiApp! 🚀',
      message: 'Has llegado al límite de tu versión de prueba. Espero de corazón que FiApp le esté sirviendo mucho a tu negocio para llevar las cuentas. Me encantaría conocer tu experiencia y recibir tu opninion, para que sigas disfrutando de la app.',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Contactar a Diego',
          handler: () => this.contactarADiego()
        }
      ]
    });

    await alert.present();
  }

  contactarADiego(): void {
    window.open(this.WHATSAPP_FEEDBACK_URL, '_blank');
  }
}