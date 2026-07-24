import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { MovimInventario } from '../../core/models/movim-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { calcularStockDerivado } from './inventory-calculations';

@Component({
  selector: 'app-inventory-movement',
  templateUrl: './inventory-movement.page.html',
  styleUrls: ['./inventory-movement.page.scss'],
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
export class InventoryMovementPage {
  productoId = '';
  producto: Producto | null = null;
  movimientos: MovimInventario[] = [];
  stockDerivado = 0;

  tipo: 'COMPRA' | 'VENTA' | 'MERMA' | 'AJUSTE' = 'COMPRA';
  cantidad = 0;
  costo_unitario = 0;
  conteo_fisico = 0;
  motivo = '';

  constructor(
    private dbService: DatabaseService,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
  ) {
    this.productoId = this.route.snapshot.paramMap.get('productoId') ?? '';
  }

  ionViewWillEnter() {
    void this.cargarDatos();
  }

  get movimientosOrdenados(): MovimInventario[] {
    return [...this.movimientos].sort((a, b) => b.fecha - a.fecha);
  }

  async cargarDatos() {
    const productos = await this.dbService.obtenerProductos();
    this.producto = productos.find((producto) => producto.id === this.productoId) ?? null;
    this.movimientos = await this.dbService.obtenerMovimientosPorProducto(this.productoId);
    this.stockDerivado = calcularStockDerivado(this.movimientos);
  }

  async anularMovimiento(movimiento: MovimInventario) {
    if (movimiento.tipo === 'COMPRA') {
      await this.mostrarToast('Las COMPRAS se corrigen con un AJUSTE', 'danger');
      return;
    }

    try {
      await this.dbService.softDeleteMovimiento(movimiento.id);
      await this.cargarDatos();
      await this.mostrarToastDeshacer(movimiento.id);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo anular el movimiento';
      await this.mostrarToast(mensaje, 'danger');
    }
  }

  async registrarMovimiento() {
    const motivo = this.motivo.trim();

    if (this.tipo === 'AJUSTE') {
      const conteoFisico = Number(this.conteo_fisico);

      if (Number.isNaN(conteoFisico) || conteoFisico < 0) {
        await this.mostrarToast('El conteo físico debe ser mayor o igual a 0', 'danger');
        return;
      }

      const stockAnterior = this.stockDerivado;
      const diferencia = conteoFisico - stockAnterior;

      const movimiento: MovimInventario = {
        id: uuidv4(),
        producto_id: this.productoId,
        tipo: 'AJUSTE',
        cantidad: 0,
        costo_unitario: 0,
        motivo: motivo || null,
        fecha: Date.now(),
        actor_id: null,
        stock_calculado_anterior: stockAnterior,
        cantidad_fisica: conteoFisico,
        diferencia_calculada: diferencia,
        created_at: null,
        updated_at: null,
        deleted_at: null,
        store_id: null,
        created_by: null,
      };

      try {
        await this.dbService.crearMovimiento(movimiento);
        await this.cargarDatos();
        this.limpiarFormulario();
        await this.mostrarToast('Movimiento registrado', 'success');
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'No se pudo registrar el movimiento';
        await this.mostrarToast(mensaje, 'danger');
      }

      return;
    }

    const cantidad = Number(this.cantidad);
    const costoUnitario = Number(this.costo_unitario);

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      await this.mostrarToast('La cantidad debe ser mayor a 0', 'danger');
      return;
    }

    if (this.tipo === 'COMPRA' && (Number.isNaN(costoUnitario) || costoUnitario < 0)) {
      await this.mostrarToast('El costo unitario debe ser mayor o igual a 0', 'danger');
      return;
    }

    const movimiento: MovimInventario = {
      id: uuidv4(),
      producto_id: this.productoId,
      tipo: this.tipo,
      cantidad,
      costo_unitario: this.tipo === 'COMPRA' ? costoUnitario : 0,
      motivo: motivo || null,
      fecha: Date.now(),
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
      await this.dbService.crearMovimiento(movimiento);
      await this.cargarDatos();
      this.limpiarFormulario();
      await this.mostrarToast('Movimiento registrado', 'success');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo registrar el movimiento';
      await this.mostrarToast(mensaje, 'danger');
    }
  }

  limpiarFormulario() {
    this.tipo = 'COMPRA';
    this.cantidad = 0;
    this.costo_unitario = 0;
    this.conteo_fisico = 0;
    this.motivo = '';
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

  private async mostrarToastDeshacer(movimientoId: string) {
    const toast = await this.toastCtrl.create({
      message: 'Movimiento anulado',
      duration: 5000,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'Deshacer',
          role: 'undo',
          handler: () => {
            void this.restaurarMovimientoDesdeToast(movimientoId);
          },
        },
      ],
    });

    await toast.present();
  }

  private async restaurarMovimientoDesdeToast(movimientoId: string) {
    try {
      await this.dbService.restoreMovimiento(movimientoId);
      await this.cargarDatos();
      await this.mostrarToast('Movimiento restaurado', 'success');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo restaurar el movimiento';
      await this.mostrarToast(mensaje, 'danger');
    }
  }
}
