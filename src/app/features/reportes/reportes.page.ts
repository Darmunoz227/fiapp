import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { DatabaseService } from '../../core/database/database.service';
import { VentaConItems } from '../../core/models/venta-con-items.model';
import { VentaItem } from '../../core/models/venta-item.model';
import { Producto } from '../../core/models/producto.model';
import { calcularResumenVentas, filtrarVentasPorRango, RangoReporte, ResumenVentas } from './reportes-calculations';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
  ],
})
export class ReportesPage {
  rango: RangoReporte = 'TODO';
  ventas: VentaConItems[] = [];
  ventasFiltradas: VentaConItems[] = [];
  resumen: ResumenVentas = {
    totalVendido: 0,
    gananciaTotal: 0,
    numeroVentas: 0,
    contadoCount: 0,
    fiadoCount: 0,
    mixtoCount: 0,
    contadoTotal: 0,
    fiadoTotal: 0,
  };
  nombrePorProductoId = new Map<string, string>();

  constructor(private dbService: DatabaseService) {}

  ionViewWillEnter() {
    void this.cargar();
  }

  async cargar() {
    this.ventas = await this.dbService.obtenerVentas();
    const productos: Producto[] = await this.dbService.obtenerProductos();
    this.nombrePorProductoId = new Map(productos.map((producto) => [producto.id, producto.nombre]));
    this.recomputar();
  }

  recomputar() {
    const filtradas = filtrarVentasPorRango(this.ventas, this.rango, Date.now());
    this.ventasFiltradas = [...filtradas].sort((a, b) => b.venta.fecha - a.venta.fecha);
    this.resumen = calcularResumenVentas(filtradas);
  }

  cambiarRango(rango: string | number | undefined) {
    if (rango === 'HOY' || rango === 'TODO') {
      this.rango = rango;
      this.recomputar();
    }
  }

  nombreProducto(id: string): string {
    return this.nombrePorProductoId.get(id) ?? 'Producto eliminado';
  }

  totalVenta(items: VentaItem[]): number {
    return items.reduce((acumulado, item) => acumulado + (item.precio_venta * item.cantidad), 0);
  }
}