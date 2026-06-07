import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardContent, IonText, IonSearchbar, IonListHeader, IonLabel,
  IonList, IonItem, IonAvatar, IonNote, IonFab, IonFabButton, IonIcon,
  ModalController, AlertController, IonItemSliding, IonItemOptions, IonItemOption,
  IonButton, IonButtons // <-- SOLUCIÓN: Agregamos las herramientas de botones aquí
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, settingsOutline } from 'ionicons/icons'; 
import { NuevoClienteComponent } from '../shared/modals/nuevo-cliente/nuevo-cliente.component';
import { DatabaseService } from '../core/database/database.service';
import { formatCurrencyCOP } from '../shared/utils/formatters';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonText, IonSearchbar, IonListHeader, IonLabel,
    IonList, IonItem, IonAvatar, IonNote, IonFab, IonFabButton, IonIcon,
    IonItemSliding, IonItemOptions, IonItemOption,
    IonButton, IonButtons // <-- SOLUCIÓN: Y también las registramos aquí
  ],
})
export class HomePage {
  
  totalCartera: number = 0;
  clientesActivos: any[] = [];
  clientesFiltrados: any[] = []; 

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private router: Router,
    private alertCtrl: AlertController 
  ) {
    addIcons({ add, trash, settingsOutline }); 
  }

  ionViewWillEnter() {
    this.cargarClientesYDeudas();
  }

  formatearMonto(monto: number): string {
    return formatCurrencyCOP(monto);
  }

  async cargarClientesYDeudas() {
    this.totalCartera = 0;
    this.clientesActivos = [];
    const clientesDb = await this.dbService.obtenerClientes();
    
    for (const cliente of clientesDb) {
      const transacciones = await this.dbService.obtenerTransaccionesPorCliente(cliente.id);
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

  async confirmarEliminarCliente(cliente: any) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar cliente?',
      message: '¿Estás seguro de que deseas borrar a ' + cliente.nombre + '? Se perderá todo su historial.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive', 
          handler: async () => {
            await this.dbService.eliminarCliente(cliente.id);
            await this.cargarClientesYDeudas();
          }
        }
      ]
    });
    await alert.present();
  }

  irAConfiguraciones() {
    this.router.navigate(['/configuraciones']);
  }
}
