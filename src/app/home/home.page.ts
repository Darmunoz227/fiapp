import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonContent, IonCard,
  IonCardContent, IonText, IonSearchbar, IonListHeader, IonLabel,
  IonList, IonItem, IonAvatar, IonNote, IonFab, IonFabButton, IonIcon,
  ModalController, AlertController, IonButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, settingsOutline } from 'ionicons/icons'; 
import { NuevoClienteComponent } from '../shared/modals/nuevo-cliente/nuevo-cliente.component';
import { DatabaseService } from '../core/database/database.service';
import { FreemiumService } from '../core/freemium/freemium.service';
import { formatCurrencyCOP } from '../shared/utils/formatters';
import { PreferencesService } from '../core/preferences/preferences.service';
import { Transaccion } from '../core/models/transaccion.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonContent, IonCard,
    IonCardContent, IonText, IonSearchbar, IonListHeader, IonLabel,
    IonList, IonItem, IonAvatar, IonNote, IonFab, IonFabButton, IonIcon,
    IonButton, IonButtons,
  ],
})
export class HomePage {
  
  totalCartera: number = 0;
  clientesActivos: any[] = [];
  clientesFiltrados: any[] = []; 
  businessName: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private router: Router,
    private alertCtrl: AlertController 
    , private prefs: PreferencesService,
    private freemiumService: FreemiumService
  ) {
    addIcons({ add, settingsOutline }); 
  }

  ionViewWillEnter() {
    this.checkNombreNegocio();
    this.cargarClientesYDeudas();
  }

  async checkNombreNegocio() {
    const nombre = await this.prefs.getNombreNegocio();
    if (nombre && nombre.trim() !== '') {
      this.businessName = nombre.trim();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '¡Personaliza tu App!',
      message: '¿Cómo conocen tus clientes a tu negocio o a ti? FiApp usuara ese nombre para personalizar los mensajes que les envíes por WhatsApp.',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Ej: Tienda La 14, El Paisa...' }
      ],
      buttons: [
        {
          text: 'Guardar',
          handler: async (data: any) => {
            const valor = (data?.nombre || '').toString().trim();
            if (valor) {
              await this.prefs.setNombreNegocio(valor);
              this.businessName = valor;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  formatearMonto(monto: number): string {
    return formatCurrencyCOP(monto);
  }

  async cargarClientesYDeudas() {
    this.totalCartera = 0;
    this.clientesActivos = [];
    const clientesDb = await this.dbService.obtenerClientes();
    
    for (const cliente of clientesDb) {
      let transacciones: Transaccion[] = [];
      try {
        transacciones = await this.dbService.obtenerTransaccionesPorCliente(cliente.id);
      } catch (error) {
        console.error('Error cargando transacciones del cliente', cliente.id, error);
        transacciones = [];
      }

      let deudaCliente = 0;
      for (const t of transacciones) {
        if (t.tipo === 'fiado') deudaCliente += t.monto;
        else if (t.tipo === 'abono') deudaCliente -= t.monto;
      }
      this.clientesActivos.push({
        id: cliente.id,
        nombre: cliente.nombre,
        deudaTotal: deudaCliente
      });
      this.totalCartera += deudaCliente;
    }
    this.clientesFiltrados = [...this.clientesActivos];
  }

  buscarCliente(event: any) {
    const textoBuscar = event.target.value.toLowerCase();
    if (textoBuscar && textoBuscar.trim() !== '') {
      this.clientesFiltrados = this.clientesActivos.filter((cliente) => {
        return cliente.nombre.toLowerCase().indexOf(textoBuscar) > -1;
      });
    } else {
      this.clientesFiltrados = [...this.clientesActivos];
    }
  }

  irADetalle(clienteId: string) {
    this.router.navigate(['/cliente-detalle', clienteId]);
  }

  async abrirModalNuevoCliente() {
    const puedeAgregar = await this.freemiumService.puedeAgregarCliente();
    if (!puedeAgregar) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: NuevoClienteComponent,
      breakpoints: [0, 0.75],
      initialBreakpoint: 0.75,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.guardado) {
      await this.cargarClientesYDeudas();
    }
  }

  irAConfiguraciones() {
    this.router.navigate(['/configuraciones']);
  }
}
