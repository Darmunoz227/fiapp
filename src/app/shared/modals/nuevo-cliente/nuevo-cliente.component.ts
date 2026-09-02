import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonCheckbox, IonRow, IonCol, IonButton
} from '@ionic/angular/standalone';

import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../core/database/database.service';
import { FreemiumService } from '../../../core/freemium/freemium.service';
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
export class NuevoClienteComponent implements OnInit {
  
  nombre: string = '';
  telefono: string = '';
  habeasData: boolean = false;

  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() cliente?: Cliente;

  ngOnInit() {
    if (this.modo === 'editar' && this.cliente) {
      this.nombre = this.cliente.nombre;
      this.telefono = this.cliente.telefono;
      this.habeasData = this.cliente.habeas_data_flag;
    }
  }

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private freemiumService: FreemiumService
  ) {}

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  async guardarCliente() {
    if (this.modo === 'editar') {
      await this.editarClienteExistente();
      return;
    }

    const puedeAgregar = await this.freemiumService.puedeAgregarCliente();
    if (!puedeAgregar) {
      return;
    }

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

  private async editarClienteExistente() {
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir || !this.cliente) {
      return;
    }

    const clienteActualizado: Cliente = {
      ...this.cliente,
      nombre: this.nombre,
      telefono: this.telefono,
    };

    try {
      await this.dbService.actualizarCliente(clienteActualizado);
      this.modalCtrl.dismiss({ guardado: true });
    } catch (error) {
      console.error('No se pudo actualizar el cliente', error);
    }
  }
}
