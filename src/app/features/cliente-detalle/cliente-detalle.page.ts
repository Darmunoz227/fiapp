import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonCard, IonCardContent, IonText, IonButton, IonIcon, IonList, IonItem, IonLabel, IonNote,
  ModalController, AlertController, IonItemSliding, IonItemOptions, IonItemOption, ToastController
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, trash, logoWhatsapp, receiptOutline } from 'ionicons/icons'; 
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { construirUrlWhatsApp } from '../../core/whatsapp/whatsapp';
import { Cliente } from '../../core/models/cliente.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { NuevaTransaccionComponent } from '../../shared/modals/nueva-transaccion/nueva-transaccion.component';
import { formatCurrencyCOP, formatFiadoConcept, formatTransactionDate } from '../../shared/utils/formatters';
import { v4 as uuidv4 } from 'uuid'; 
import { TransaccionDeleteUndoService } from './transaccion-delete-undo.service';

@Component({
  selector: 'app-cliente-detalle',
  templateUrl: './cliente-detalle.page.html',
  styleUrls: ['./cliente-detalle.page.scss'],
  standalone: true,
  providers: [TransaccionDeleteUndoService],
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonCard, IonCardContent, IonText, IonButton, IonIcon, IonList, IonItem, IonLabel, IonNote,
    IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class ClienteDetallePage implements OnInit {
  
  cliente: Cliente | null = null;
  deudaTotal: number = 0;
  transacciones: Transaccion[] = []; 
  private appStateListener: any = null;

  constructor(
    private route: ActivatedRoute,
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private prefs: PreferencesService,
    private toastCtrl: ToastController,
    private transaccionDeleteUndoService: TransaccionDeleteUndoService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ arrowUpOutline, arrowDownOutline, logoWhatsapp, receiptOutline }); 
  }

  async ngOnInit() {
    await this.cargarDatos();
    void this.registrarListenerEstadoApp();
  }

  ionViewWillEnter() {
    void this.cargarDatos();
    void this.registrarListenerEstadoApp();
  }

  ionViewWillLeave() {
    this.transaccionDeleteUndoService.clear();
  }

  ngOnDestroy() {
    this.transaccionDeleteUndoService.clear();
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
        this.transaccionDeleteUndoService.clear();
      }
    });
  }

  async cargarDatos() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cliente = await this.dbService.obtenerClientePorId(id);
      this.transacciones = await this.dbService.obtenerTransaccionesPorCliente(id);
      this.calcularDeuda();
      this.cdr.detectChanges();
    }
  }

  calcularDeuda() {
    this.deudaTotal = 0;
    for (const t of this.transacciones) {
      if (t.tipo === 'fiado') this.deudaTotal += t.monto;
      else if (t.tipo === 'abono') this.deudaTotal -= t.monto;
    }
  }

  formatearMonto(monto: number): string {
    return formatCurrencyCOP(monto);
  }

  formatearFecha(fecha: number): string {
    return formatTransactionDate(fecha);
  }

  async abrirModalTransaccion(tipoRecibido: 'fiado' | 'abono') {
    const modal = await this.modalCtrl.create({
      component: NuevaTransaccionComponent,
      componentProps: { tipo: tipoRecibido },
      breakpoints: [0, 0.65],
      initialBreakpoint: 0.65,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data && this.cliente) {
      if (data.tipo === 'fiado') {
        const puedeEscribir = await this.freemiumService.puedeEscribir();
        if (!puedeEscribir) {
          return;
        }
      }

      const conceptoFinal = data.concepto?.trim() ? data.concepto.trim() : (data.tipo === 'fiado' ? formatFiadoConcept(new Date()) : '');
      const nuevaTransaccion: Transaccion = {
        id: uuidv4(),
        cliente_id: this.cliente.id,
        tipo: data.tipo,
        monto: data.monto,
        concepto: conceptoFinal,
        fecha: Date.now()
      };
      await this.dbService.crearTransaccion(nuevaTransaccion);
      await this.cargarDatos(); 
    }
  }

  async confirmarEliminarTransaccion(transaccion: Transaccion) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar movimiento?',
      message: '¿Estás seguro de que deseas borrar este ' + transaccion.tipo + ' por $' + transaccion.monto + '?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.dbService.softDeleteTransaccion(transaccion.id);
            this.transaccionDeleteUndoService.stage(transaccion);
            await this.cargarDatos();
            void this.mostrarToastDeshacerTransaccion();
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToastDeshacerTransaccion() {
    const toast = await this.toastCtrl.create({
      message: 'Transacción eliminada',
      duration: 5000,
      position: 'bottom',
      buttons: [
        {
          text: 'Deshacer',
          role: 'cancel',
          handler: async () => {
            const transaccionPendiente = this.transaccionDeleteUndoService.consume();
            if (!transaccionPendiente || !this.cliente) {
              return;
            }

            await this.dbService.restoreTransaccion(transaccionPendiente.id);
            await this.cargarDatos();
            this.cdr.detectChanges();
          }
        }
      ]
    });

    await toast.present();
    await toast.onDidDismiss();
    this.transaccionDeleteUndoService.clear();
  }

  // --- RF-06: COBRAR (WhatsApp General) ---
  async enviarCobroWhatsApp() {
    if (!this.cliente) return;
    const nombreNegocio = await this.prefs.getNombreNegocio();
    const origen = (nombreNegocio && nombreNegocio.trim() !== '') ? nombreNegocio : 'la tienda';
    const mensaje = '¡Hola! Te escribo de ' + origen + ' para recordarte tu saldo actual que es de $' + this.formatearMonto(this.deudaTotal) + ', ' + this.cliente.nombre + '. ¡Quedo atento, gracias!';
    const url = construirUrlWhatsApp(this.cliente.telefono, mensaje);
    window.open(url, '_blank');
  }

  // --- RF-05: COMPARTIR RECIBO (WhatsApp Individual) ---
  enviarReciboWhatsApp(t: Transaccion) {
    if (!this.cliente) return;
    const tipoTexto = t.tipo === 'fiado' ? 'un nuevo Fiado' : 'un Abono';
    const conceptoTexto = t.concepto ? t.concepto : 'Sin detalle';
    
    // Armamos un mini recibo con emojis
    const mensaje = '🧾 Recibo de Transacción\nHola ' + this.cliente.nombre + ', registramos ' + tipoTexto + ' por valor de $' + this.formatearMonto(t.monto) + '.\nConcepto: ' + conceptoTexto + '\n\nSaldo actual: $' + this.formatearMonto(this.deudaTotal) + '';
    
    const url = construirUrlWhatsApp(this.cliente.telefono, mensaje);
    window.open(url, '_blank');
  }
}
