import { Component, ViewChild } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption,
  ToastController
} from '@ionic/angular/standalone';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { ResumenInventario } from '../../core/models/resumen-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { formatCurrencyCOP, parseCurrencyInput } from '../../shared/utils/formatters';
import { calcularPosicionCursor } from '../../shared/utils/caret-position';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.page.html',
  styleUrls: ['./inventory-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, RouterLink
  ]
})
export class InventoryListPage {
  productos: Producto[] = [];
  resumenPorProducto = new Map<string, ResumenInventario>();
  nombre = '';
  precio_venta = '';
  tipo_venta: 'UNIDAD' | 'PESO' = 'UNIDAD';
  minimo_stock: number | null = null;
  @ViewChild("precioVentaInput") precioVentaInput?: IonInput;

  constructor(
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    void this.cargarProductos();
  }

  async cargarProductos() {
    this.productos = await this.dbService.obtenerProductos();
    const resumenes = await this.dbService.obtenerResumenInventario();
    this.resumenPorProducto = new Map(resumenes.map((resumen) => [resumen.producto_id, resumen]));
  }

  esStockBajo(productoId: string): boolean {
    return this.resumenPorProducto.get(productoId)?.stock_bajo ?? false;
  }

  stockActual(productoId: string): number {
    return this.resumenPorProducto.get(productoId)?.stock_derivado ?? 0;
  }

  async crearProducto() {
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    const nombre = this.nombre.trim();
    const precioVenta = parseCurrencyInput(this.precio_venta);
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

  private async formatearPrecioVenta(): Promise<string> {
    let nativeInput: HTMLInputElement | null = null;
    try {
      if (this.precioVentaInput && this.precioVentaInput.getInputElement) {
        nativeInput = await this.precioVentaInput.getInputElement();
      }
    } catch (e) {
      nativeInput = null;
    }

    const valor = this.precio_venta;
    const caretPos = nativeInput ? nativeInput.selectionStart || 0 : valor.length;
    const numeric = parseCurrencyInput(valor);
    const texto = numeric > 0 ? formatCurrencyCOP(numeric) : "";
    const pos = calcularPosicionCursor(valor, caretPos, texto);

    if (nativeInput) {
      const el = nativeInput;
      setTimeout(() => {
        try { el.setSelectionRange(pos, pos); } catch (e) {}
      }, 0);
    }

    return texto;
  }

  async onPrecioVentaInput() {
    this.precio_venta = await this.formatearPrecioVenta();
  }

  async onPrecioVentaBlur() {
    const numeric = parseCurrencyInput(this.precio_venta);
    this.precio_venta = numeric > 0 ? formatCurrencyCOP(numeric) : "";
  }

  limpiarFormulario() {
    this.nombre = '';
    this.precio_venta = '';
    this.tipo_venta = 'UNIDAD';
    this.minimo_stock = null;
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