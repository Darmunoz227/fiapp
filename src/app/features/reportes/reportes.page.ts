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
import { Producto } from '../../core/models/producto.model';
import { Venta } from '../../core/models/venta.model';
import { calcularTotalVenta } from '../ventas/ventas-calculations';
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
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
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
    this.ventasFiltradas = [...filtradas].sort((a, b) => b.fecha - a.fecha);
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

  totalVenta(venta: Venta): number {
    return calcularTotalVenta(venta.precio_venta, venta.cantidad);
  }
}