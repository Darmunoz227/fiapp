import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption,
  ToastController
} from '@ionic/angular/standalone';
import { DatabaseService } from '../../core/database/database.service';
import { Producto } from '../../core/models/producto.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.page.html',
  styleUrls: ['./inventory-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption
  ]
})
export class InventoryListPage {
  productos: Producto[] = [];
  nombre = '';
  precio_venta = 0;
  tipo_venta: 'UNIDAD' | 'PESO' = 'UNIDAD';
  minimo_stock = 0;

  constructor(
    private dbService: DatabaseService,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    void this.cargarProductos();
  }

  async cargarProductos() {
    this.productos = await this.dbService.obtenerProductos();
  }

  async crearProducto() {
    const nombre = this.nombre.trim();
    const precioVenta = Number(this.precio_venta);
    const minimoStock = Number(this.minimo_stock);

    if (!nombre) {
      await this.mostrarToastValidacion('Ingresa un nombre válido');
      return;
    }

    if (!this.esTipoVentaValido(this.tipo_venta)) {
      await this.mostrarToastValidacion('Selecciona un tipo de venta válido');
      return;
    }

    if (Number.isNaN(precioVenta) || precioVenta <= 0) {
      await this.mostrarToastValidacion('El precio debe ser mayor a 0');
      return;
    }

    if (Number.isNaN(minimoStock) || minimoStock < 0) {
      await this.mostrarToastValidacion('El stock mínimo no puede ser negativo');
      return;
    }

    const producto: Producto = {
      id: uuidv4(),
      nombre,
      precio_venta: precioVenta,
      tipo_venta: this.tipo_venta,
      minimo_stock: minimoStock,
      costo_promedio: 0,
      created_at: Date.now(),
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };

    await this.dbService.crearProducto(producto);
    await this.cargarProductos();
    this.limpiarFormulario();
    void this.mostrarToastProductoCreado();
  }

  limpiarFormulario() {
    this.nombre = '';
    this.precio_venta = 0;
    this.tipo_venta = 'UNIDAD';
    this.minimo_stock = 0;
  }

  private esTipoVentaValido(tipoVenta: string): tipoVenta is 'UNIDAD' | 'PESO' {
    return tipoVenta === 'UNIDAD' || tipoVenta === 'PESO';
  }

  private async mostrarToastValidacion(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2200,
      position: 'bottom',
      color: 'danger'
    });

    await toast.present();
  }

  private async mostrarToastProductoCreado() {
    const toast = await this.toastCtrl.create({
      message: 'Producto guardado',
      duration: 1800,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }
}