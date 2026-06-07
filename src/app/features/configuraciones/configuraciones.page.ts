import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonLabel, IonInput, IonButton, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
// Importamos la herramienta nativa de compartir
import { Share } from '@capacitor/share'; 

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

  constructor(
    private dbService: DatabaseService,
    private prefs: PreferencesService
  ) {
    addIcons({ downloadOutline, shieldCheckmarkOutline });
  }

  ionViewWillEnter() {
    this.cargarNombreNegocio();
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

  // --- RF-07: EXPORTACIÓN DE RESPALDO JSON NATIVO ---
  async exportarRespaldoJSON() {
    try {
      // 1. Recolectamos todos los datos de la base de datos igual que antes
      const clientes = await this.dbService.obtenerClientes();
      const respaldoCompleto = [];

      for (const cliente of clientes) {
        const transacciones = await this.dbService.obtenerTransaccionesPorCliente(cliente.id);
        respaldoCompleto.push({
          perfil: cliente,
          movimientos: transacciones
        });
      }

      // 2. Lo convertimos a texto JSON
      const dataStr = JSON.stringify(respaldoCompleto, null, 2);
      
      // 3. ¡MAGIA NATIVA!: Abrimos el menú del iPhone/Android para compartir el texto directamente
      const fechaActual = new Date().toLocaleDateString().replace(/\//g, '-');
      
      await Share.share({
        title: 'Respaldo FiApp - ' + fechaActual,
        text: dataStr, // Metemos todo el JSON como texto plano seguro
        dialogTitle: 'Guardar o enviar respaldo de FiApp'
      });

    } catch (error) {
      console.error('Error al exportar nativamente:', error);
      // Nota: Si el usuario cancela el menú de compartir sin elegir ninguna app, 
      // entrará aquí, así que no es necesario alarmar con un alert de error fatal.
    }
  }
}