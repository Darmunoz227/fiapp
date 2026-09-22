import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonContent, IonCard,
  IonCardContent, IonText, IonSearchbar, IonListHeader, IonLabel,
  IonList, IonItem, IonAvatar, IonNote, IonFab, IonFabButton, IonIcon,
  ModalController, AlertController, IonButton, IonButtons, IonItemSliding, IonItemOptions, IonItemOption, ToastController
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { add, cartOutline, cubeOutline, settingsOutline, statsChartOutline, trash, receiptOutline } from 'ionicons/icons'; 
import { NuevoClienteComponent } from '../shared/modals/nuevo-cliente/nuevo-cliente.component';
import { DatabaseService } from '../core/database/database.service';
import { filtrarProductosDeProduccion } from '../core/produccion/produccion';
import { FreemiumService } from '../core/freemium/freemium.service';
import { formatCurrencyCOP } from '../shared/utils/formatters';
import { PreferencesService } from '../core/preferences/preferences.service';
import { Transaccion } from '../core/models/transaccion.model';
import { ClienteDeleteUndoService } from './cliente-delete-undo.service';

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
    IonItemSliding, IonItemOptions, IonItemOption,
    IonButton, IonButtons,
  ],
  providers: [ClienteDeleteUndoService],
})
export class HomePage {
  
  totalCartera: number = 0;
  clientesActivos: any[] = [];
  errorCarga: boolean = false;
  cargando: boolean = false;
  clientesFiltrados: any[] = []; 
  businessName: string | null = null;
  private appStateListener: any = null;

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private router: Router,
    private alertCtrl: AlertController 
    , private prefs: PreferencesService,
    private freemiumService: FreemiumService,
    private toastCtrl: ToastController,
    private clienteDeleteUndoService: ClienteDeleteUndoService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ add, cartOutline, cubeOutline, settingsOutline, statsChartOutline, trash, receiptOutline }); 
  }

  tieneProduccion = false;

  ionViewWillEnter() {
    this.checkNombreNegocio();
    this.cargarClientesYDeudas();
    void this.cargarProductosDeProduccion();
    void this.registrarListenerEstadoApp();
  }

  async cargarProductosDeProduccion(): Promise<void> {
    const productos = await this.dbService.obtenerProductos();
    this.tieneProduccion = filtrarProductosDeProduccion(productos).length > 0;
  }

  irARegistrarProduccion() {
    this.router.navigate(['/registrar-produccion']);
  }

  ionViewWillLeave() {
    this.clienteDeleteUndoService.clear();
  }

  ngOnDestroy() {
    this.clienteDeleteUndoService.clear();
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  private async registrarListenerEstadoApp() {
    if (this.appStateListener) {
      return;
    }

    this.appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        this.clienteDeleteUndoService.clear();
      }
    });
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
        telefono: cliente.telefono,
        deudaTotal: deudaCliente
      });
      this.totalCartera += deudaCliente;
    }
    this.clientesFiltrados = [...this.clientesActivos];
    this.cdr.detectChanges();
  }

  async reintentarCarga(): Promise<void> {
    await this.cargarClientesYDeudas();
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

  async abrirModalEditarCliente(cliente: any) {
    const modal = await this.modalCtrl.create({
      component: NuevoClienteComponent,
      breakpoints: [0, 0.75],
      initialBreakpoint: 0.75,
      componentProps: { modo: 'editar', cliente },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.guardado) {
      await this.cargarClientesYDeudas();
    }
  }

  async confirmarEliminarCliente(cliente: any) {
    if (cliente.deudaTotal > 0) {
      const alert = await this.alertCtrl.create({
        header: 'No se puede borrar',
        message: 'Este cliente tiene saldo positivo y no puede ser borrado.',
        buttons: ['Cerrar']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar cliente?',
      message: '¿Estás seguro de que deseas borrar a ' + cliente.nombre + '?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.dbService.softDeleteCliente(cliente.id);
            this.clienteDeleteUndoService.stage(cliente);
            await this.cargarClientesYDeudas();
            void this.mostrarToastDeshacerCliente();
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToastDeshacerCliente() {
    const toast = await this.toastCtrl.create({
      message: 'Cliente eliminado',
      duration: 5000,
      position: 'bottom',
      buttons: [
        {
          text: 'Deshacer',
          role: 'cancel',
          handler: async () => {
            const clientePendiente = this.clienteDeleteUndoService.consume();
            if (!clientePendiente) {
              return;
            }

            await this.dbService.restoreCliente(clientePendiente.id);
            await this.cargarClientesYDeudas();
          }
        }
      ]
    });

    await toast.present();
    await toast.onDidDismiss();
    this.clienteDeleteUndoService.clear();
  }

  irAReportes() { this.router.navigate(['/reportes']); }

  irAVentas() { this.router.navigate(['/ventas']); }

  irAInventario() { this.router.navigate(['/inventario']); }

  irAConfiguraciones() {
    this.router.navigate(['/configuraciones']);
  }

  irAFiadoProductos() {
    this.router.navigate(['/fiado-productos']);
  }
}
