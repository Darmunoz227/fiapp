import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../core/database/database.service';
import { Cliente } from '../../core/models/cliente.model';
import { MovimInventario } from '../../core/models/movim-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { TipoPago, Venta } from '../../core/models/venta.model';
import { calcularStockDerivado } from '../inventario/inventory-calculations';
import { calcularTotalVenta, derivarTipoPago } from './ventas-calculations';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
  ],
})
export class VentasPage {
  productos: Producto[] = [];
  clientes: Cliente[] = [];

  productoId = '';
  clienteId = '';
  cantidad = 0;
  precio = 0;
  tipo_pago: TipoPago = 'CONTADO';
  abono = 0;
  stockDerivado = 0;

  constructor(
    private dbService: DatabaseService,
    private toastCtrl: ToastController,
  ) {}

  ionViewWillEnter() {
    void this.cargarProductos();
  }

  get gananciaEstimada(): number | null {
    const producto = this.productos.find((item) => item.id === this.productoId) ?? null;
    const cantidad = Number(this.cantidad);
    const precio = Number(this.precio);

    if (producto == null || Number.isNaN(cantidad) || Number.isNaN(precio) || cantidad <= 0 || precio <= 0) {
      return null;
    }

    return (precio - producto.costo_promedio) * cantidad;
  }

  get totalVenta(): number {
    const cantidad = Number(this.cantidad);
    const precio = Number(this.precio);
    if (Number.isNaN(cantidad) || Number.isNaN(precio)) {
      return 0;
    }
    return calcularTotalVenta(precio, cantidad);
  }

  get montoContadoCalculado(): number {
    if (this.tipo_pago === 'CONTADO') {
      return this.totalVenta;
    }
    if (this.tipo_pago === 'FIADO') {
      return 0;
    }
    return Number(this.abono) || 0;
  }

  get montoFiadoCalculado(): number {
    return this.totalVenta - this.montoContadoCalculado;
  }

  async cargarProductos() {
    this.productos = await this.dbService.obtenerProductos();
    this.clientes = await this.dbService.obtenerClientes();

    if (this.productoId) {
      await this.onSeleccionarProducto(this.productoId);
    }
  }

  async onSeleccionarProducto(productoId: string) {
    this.productoId = productoId;

    if (!productoId) {
      this.precio = 0;
      this.stockDerivado = 0;
      return;
    }

    const producto = this.productos.find((item) => item.id === productoId) ?? null;
    this.precio = producto?.precio_venta ?? 0;

    const movimientos = await this.dbService.obtenerMovimientosPorProducto(productoId);
    this.stockDerivado = calcularStockDerivado(movimientos);
  }

  async registrarVenta() {
    const cantidad = Number(this.cantidad);
    const precio = Number(this.precio);

    if (!this.productoId) {
      await this.mostrarToast('Debes seleccionar un producto', 'danger');
      return;
    }

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      await this.mostrarToast('La cantidad debe ser mayor a 0', 'danger');
      return;
    }

    if (Number.isNaN(precio) || precio <= 0) {
      await this.mostrarToast('El precio debe ser mayor a 0', 'danger');
      return;
    }

    if (this.montoContadoCalculado < 0 || this.montoContadoCalculado > this.totalVenta) {
      await this.mostrarToast('El abono debe estar entre 0 y el total de la venta', 'danger');
      return;
    }

    if (this.montoFiadoCalculado > 0 && !this.clienteId) {
      await this.mostrarToast('Debes seleccionar un cliente para el saldo fiado', 'danger');
      return;
    }

    const producto = this.productos.find((item) => item.id === this.productoId) ?? null;
    if (producto == null) {
      await this.mostrarToast('Producto no encontrado', 'danger');
      return;
    }

    const costoUnitario = producto.costo_promedio;
    const ganancia = (precio - costoUnitario) * cantidad;
    const ahora = Date.now();

    const montoContado = this.montoContadoCalculado;
    const montoFiado = this.montoFiadoCalculado;

    const venta: Venta = {
      id: uuidv4(),
      producto_id: this.productoId,
      cantidad,
      precio_venta: precio,
      costo_unitario: costoUnitario,
      ganancia,
      tipo_pago: derivarTipoPago(montoContado, montoFiado),
      monto_contado: montoContado,
      monto_fiado: montoFiado,
      cliente_id: montoFiado > 0 ? this.clienteId : null,
      fecha: ahora,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };

    const movimiento: MovimInventario = {
      id: uuidv4(),
      producto_id: this.productoId,
      tipo: 'VENTA',
      cantidad,
      costo_unitario: 0,
      motivo: null,
      fecha: ahora,
      actor_id: null,
      stock_calculado_anterior: null,
      cantidad_fisica: null,
      diferencia_calculada: null,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    };

    try {
      if (montoFiado > 0) {
        const transaccionFiado: Transaccion = {
          id: uuidv4(),
          cliente_id: this.clienteId,
          tipo: 'fiado',
          monto: montoFiado,
          concepto: 'Venta a crédito',
          fecha: ahora,
          created_at: null,
          updated_at: null,
          deleted_at: null,
          store_id: null,
          created_by: null,
        };

        await this.dbService.registrarVenta(venta, movimiento, transaccionFiado);
      } else {
        await this.dbService.registrarVenta(venta, movimiento);
      }

      await this.onSeleccionarProducto(this.productoId);

      const valorGanancia = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(ganancia);

      await this.mostrarToast(`Venta registrada. Ganancia: ${valorGanancia}`, 'success');
      this.limpiarFormulario();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo registrar la venta';
      await this.mostrarToast(mensaje, 'danger');
    }
  }

  limpiarFormulario() {
    this.productoId = '';
    this.clienteId = '';
    this.cantidad = 0;
    this.precio = 0;
    this.tipo_pago = 'CONTADO';
    this.abono = 0;
    this.stockDerivado = 0;
  }

  private async mostrarToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });

    await toast.present();
  }
}
