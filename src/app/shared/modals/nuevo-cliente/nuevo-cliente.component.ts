import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonCheckbox, IonRow, IonCol, IonButton
} from '@ionic/angular/standalone';

import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../core/database/database.service';
import { Cliente } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-nuevo-cliente',
  templateUrl: './nuevo-cliente.component.html',
  styleUrls: ['./nuevo-cliente.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonCheckbox, IonRow, IonCol, IonButton
  ]
})
export class NuevoClienteComponent {
  
  nombre: string = '';
  telefono: string = '';
  habeasData: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService 
  ) {}

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  async guardarCliente() {
    const nuevoCliente: Cliente = {
      id: uuidv4(), 
      nombre: this.nombre,
      telefono: this.telefono,
      habeas_data_flag: this.habeasData,
      fecha_creacion: Date.now() 
    };

    try {
      await this.dbService.crearCliente(nuevoCliente);
      this.modalCtrl.dismiss({ guardado: true });
    } catch (error) {
      console.error('No se pudo guardar el cliente', error);
    }
  }
}
