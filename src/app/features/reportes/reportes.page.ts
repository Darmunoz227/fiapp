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
import { Transaccion } from '../../core/models/transaccion.model';
import { Producto } from '../../core/models/producto.model';
import {
  calcularResumenTransacciones,
  calcularResumenVentas,
  filtrarPorRangoFecha,
  filtrarVentasPorRango,
  RangoReporte,
  ResumenReporte,
} from './reportes-calculations';

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
  transacciones: Transaccion[] = [];
  transaccionesFiltradas: Transaccion[] = [];
  transaccionesManualFiltradas: Transaccion[] = [];
  resumen: ResumenReporte = {
    totalVendido: 0,
    gananciaTotal: 0,
    numeroVentas: 0,
    contadoCount: 0,
    fiadoCount: 0,
    mixtoCount: 0,
    contadoTotal: 0,
    fiadoTotal: 0,
    fiadoManualTotal: 0,
    abonoTotal: 0,
  };
  nombrePorProductoId = new Map<string, string>();
  nombrePorClienteId = new Map<string, string>();

  constructor(private dbService: DatabaseService) {}

  ionViewWillEnter() {
    void this.cargar();
  }

  async cargar() {
    const [ventas, productos, clientes, transacciones] = await Promise.all([
      this.dbService.obtenerVentas(),
      this.dbService.obtenerProductos(),
      this.dbService.obtenerClientes(),
      this.dbService.obtenerTransacciones(),
    ]);

    this.ventas = ventas;
    this.nombrePorProductoId = new Map(productos.map((producto) => [producto.id, producto.nombre]));
    this.nombrePorClienteId = new Map(clientes.map((cliente) => [cliente.id, cliente.nombre]));
    this.transacciones = transacciones;
    this.recomputar();
  }

  recomputar() {
    const ahora = Date.now();
    const filtradasVentas = filtrarVentasPorRango(this.ventas, this.rango, ahora);
    const filtradasTransacciones = filtrarPorRangoFecha(this.transacciones, this.rango, ahora, (transaccion) => transaccion.fecha);

    this.ventasFiltradas = [...filtradasVentas].sort((a, b) => b.venta.fecha - a.venta.fecha);
    this.transaccionesFiltradas = [...filtradasTransacciones].sort((a, b) => b.fecha - a.fecha);
    this.transaccionesManualFiltradas = this.transaccionesFiltradas.filter((transaccion) => transaccion.venta_id == null);
    this.resumen = {
      ...calcularResumenVentas(filtradasVentas),
      ...calcularResumenTransacciones(filtradasTransacciones),
    };
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

  nombreCliente(id: string): string {
    return this.nombrePorClienteId.get(id) ?? 'Cliente eliminado';
  }

  etiquetaTransaccion(transaccion: Transaccion): string {
    return transaccion.tipo === 'abono' ? 'Abono' : 'Fiado manual';
  }

  totalVenta(items: VentaItem[]): number {
    return items.reduce((acumulado, item) => acumulado + (item.precio_venta * item.cantidad), 0);
  }
}