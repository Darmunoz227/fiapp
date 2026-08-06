import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonLabel, IonInput, IonButton, IonToast, AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { App } from '@capacitor/app';
// Importamos la herramienta nativa de compartir
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { construirRespaldo } from '../../core/respaldo/respaldo-builder';

@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.page.html',
  styleUrls: ['./configuraciones.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonLabel, IonInput, IonButton, IonToast]
})
export class ConfiguracionesPage {
  nombreNegocio = '';
  mostrarToastGuardado = false;
  appVersion: string = '1.0.0';
  private tapsEnCreditos = 0;
  private timerResetTaps: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private dbService: DatabaseService,
    private prefs: PreferencesService,
    private freemiumService: FreemiumService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ downloadOutline, shieldCheckmarkOutline });
  }

  ionViewWillEnter() {
    this.cargarNombreNegocio();
    this.cargarVersionApp();
  }

  async cargarVersionApp() {
    try {
      const info = await App.getInfo();
      this.appVersion = info.version || '1.0.0';
    } catch (error) {
      console.error('Error cargando versión de la app:', error);
      this.appVersion = '1.0.0';
    }
  }

  async cargarNombreNegocio() {
    const nombre = await this.prefs.getNombreNegocio();
    this.nombreNegocio = nombre?.trim() ?? '';
  }

  async guardarNombreNegocio() {
    const valor = this.nombreNegocio.trim();
    this.nombreNegocio = valor;
    if (valor) {
      await this.prefs.setNombreNegocio(valor);
    } else {
      await this.prefs.clearNombreNegocio();
    }

    this.mostrarToastGuardado = true;
  }

  cerrarToastGuardado() {
    this.mostrarToastGuardado = false;
  }

  onTapCreditos() {
    this.tapsEnCreditos += 1;

    if (this.timerResetTaps) {
      clearTimeout(this.timerResetTaps);
    }

    this.timerResetTaps = setTimeout(() => {
      this.tapsEnCreditos = 0;
      this.timerResetTaps = null;
    }, 2500);

    if (this.tapsEnCreditos >= 5) {
      this.tapsEnCreditos = 0;
      if (this.timerResetTaps) {
        clearTimeout(this.timerResetTaps);
        this.timerResetTaps = null;
      }
      this.mostrarAlertaCodigoActivacion();
    }
  }

  async mostrarAlertaCodigoActivacion() {
    const alert = await this.alertCtrl.create({
      header: 'Activar FiApp',
      inputs: [
        { name: 'password', type: 'password', placeholder: 'Código de activación' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desbloquear',
          handler: async (data: { password?: string }) => {
            const password = (data?.password ?? '').trim();
            if (password === 'darmunoz') {
              await this.freemiumService.activarLicenciaPremium();
              await this.mostrarToastDesbloqueo();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async mostrarToastDesbloqueo() {
    const toast = await this.toastCtrl.create({
      message: '¡FiApp Desbloqueada con éxito! Gracias por tu apoyo. 🚀',
      duration: 2400,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }

  // --- RF-07: EXPORTACION DE RESPALDO JSON COMPLETO (Feature 014) ---
  // Escribe el archivo y devuelve su URI. NO comparte, NO muestra toast.
  // Reutilizado por la exportacion manual y por el respaldo de seguridad previo
  // a una importacion (Feature 016). Si falla, lanza: los fallos silenciosos
  // estan prohibidos por la Decision 031.
  async generarArchivoRespaldo(prefijo = "fiapp-respaldo"): Promise<string> {
    const data = {
      clientes: await this.dbService.leerCrudoClientes(),
      transacciones: await this.dbService.leerCrudoTransacciones(),
      productos: await this.dbService.leerCrudoProductos(),
      movim_inventario: await this.dbService.leerCrudoMovimInventario(),
      ventas: await this.dbService.leerCrudoVentas(),
      venta_items: await this.dbService.leerCrudoVentaItems(),
    };

    const respaldo = construirRespaldo(data, new Date().toISOString());
    const contenido = JSON.stringify(respaldo, null, 2);
    const fecha = new Date().toISOString().slice(0, 10);
    const nombre = prefijo + "-" + fecha + ".json";

    const escrito = await Filesystem.writeFile({
      path: nombre,
      data: contenido,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    return escrito.uri;
  }

  async exportarRespaldoJSON() {
    let uriArchivo: string;

    try {
      uriArchivo = await this.generarArchivoRespaldo();
    } catch (error) {
      console.error("Error al generar el respaldo:", error);
      await this.mostrarToastRespaldoFallido();
      return;
    }

    try {
      await Share.share({
        title: "Respaldo FiApp",
        files: [uriArchivo],
        dialogTitle: "Guardar o enviar respaldo de FiApp",
      });
    } catch {
      // El usuario cancelo la hoja de compartir. El archivo YA existe en disco,
      // asi que el respaldo se genero correctamente y no hay nada que reportar.
    }
  }

  async mostrarToastRespaldoFallido() {
    const toast = await this.toastCtrl.create({
      message: "No se pudo generar el respaldo. Intenta de nuevo.",
      duration: 3000,
      position: "bottom",
      color: "danger"
    });

    await toast.present();
  }
}
