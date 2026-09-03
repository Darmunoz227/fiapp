import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel, IonSearchbar, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, removeOutline, arrowForwardOutline, checkmarkCircleOutline, logoWhatsapp } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { Cliente } from '../../core/models/cliente.model';
import { CatalogoItem } from '../../core/models/catalogo-item.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { CarritoFiado, calcularTotalFiado, construirConceptoFiado } from '../../core/fiado/fiado-productos';
import { calcularSaldoCliente } from '../../core/fiado/saldo';
import { construirUrlWhatsApp } from '../../core/whatsapp/whatsapp';

type Paso = 'cliente' | 'productos' | 'confirmacion';

@Component({
  selector: 'app-fiado-productos',
  templateUrl: './fiado-productos.page.html',
  styleUrls: ['./fiado-productos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel, IonSearchbar],
})
export class FiadoProductosPage {
  paso: Paso = 'cliente';
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  catalogo: CatalogoItem[] = [];
  carrito: CarritoFiado = {};
  clienteSeleccionado: Cliente | null = null;
  guardando = false;

  // resumen de la confirmacion
  conceptoGuardado = '';
  totalGuardado = 0;

  constructor(
    private dbService: DatabaseService,
    private prefs: PreferencesService,
    private freemiumService: FreemiumService,
    private toastCtrl: ToastController,
    private router: Router,
  ) {
    addIcons({ addOutline, removeOutline, arrowForwardOutline, checkmarkCircleOutline, logoWhatsapp });
  }

  async ionViewWillEnter() {
    this.paso = 'cliente';
    this.carrito = {};
    this.clienteSeleccionado = null;
    this.clientes = await this.dbService.obtenerClientes();
    this.clientesFiltrados = this.clientes;
    this.catalogo = await this.prefs.getCatalogoFiado();
  }

  buscarCliente(evento: CustomEvent) {
    const termino = ((evento.detail as { value?: string }).value ?? '').toLowerCase().trim();
    this.clientesFiltrados = termino
      ? this.clientes.filter((c) => c.nombre.toLowerCase().includes(termino))
      : this.clientes;
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.paso = 'productos';
  }

  volverACliente() {
    this.paso = 'cliente';
  }

  irAConfiguraciones() {
    this.router.navigate(['/configuraciones']);
  }

  cantidad(item: CatalogoItem): number {
    return this.carrito[item.id] ?? 0;
  }

  sumar(item: CatalogoItem) {
    this.carrito = { ...this.carrito, [item.id]: this.cantidad(item) + 1 };
  }

  restar(item: CatalogoItem) {
    const nueva = this.cantidad(item) - 1;
    const copia = { ...this.carrito };
    if (nueva <= 0) {
      delete copia[item.id];
    } else {
      copia[item.id] = nueva;
    }
    this.carrito = copia;
  }

  get total(): number {
    return calcularTotalFiado(this.carrito, this.catalogo);
  }

  get hayProductos(): boolean {
    return this.total > 0;
  }

  async guardarFiado() {
    if (!this.clienteSeleccionado || !this.hayProductos || this.guardando) {
      return;
    }
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }
    this.guardando = true;
    const concepto = construirConceptoFiado(this.carrito, this.catalogo);
    const monto = this.total;
    const nuevaTransaccion: Transaccion = {
      id: uuidv4(),
      cliente_id: this.clienteSeleccionado.id,
      tipo: 'fiado',
      monto,
      concepto,
      fecha: Date.now(),
    };
    try {
      await this.dbService.crearTransaccion(nuevaTransaccion);
      this.conceptoGuardado = concepto;
      this.totalGuardado = monto;
      this.paso = 'confirmacion';
    } catch (error) {
      console.error('Error al guardar fiado por productos:', error);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo guardar el fiado. Intenta de nuevo.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.guardando = false;
    }
  }

  irADetalleCliente() {
    if (this.clienteSeleccionado) {
      this.router.navigate(['/cliente-detalle', this.clienteSeleccionado.id]);
    }
  }

  async enviarComprobante() {
    if (!this.clienteSeleccionado) return;

    const telefono = this.clienteSeleccionado.telefono;
    if (!telefono || telefono.trim() === '') {
      const toast = await this.toastCtrl.create({
        message: 'Este cliente no tiene telefono. Agregalo con Editar para enviar el comprobante.',
        duration: 3500,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    const transacciones = await this.dbService.obtenerTransaccionesPorCliente(this.clienteSeleccionado.id);
    const saldo = calcularSaldoCliente(transacciones);
    const nombreNegocio = await this.prefs.getNombreNegocio();
    const origen = nombreNegocio && nombreNegocio.trim() !== '' ? nombreNegocio : 'Mi Negocio';

    const mensaje =
      '\u{1F9FE} Recibo de Fiado\n' +
      'Hola ' + this.clienteSeleccionado.nombre + ', registramos tu fiado por $' +
      this.totalGuardado.toLocaleString('es-CO') + '.\n' +
      'Detalle: ' + this.conceptoGuardado + '\n\n' +
      'Saldo actual: $' + saldo.toLocaleString('es-CO') + '\n' +
      origen;

    const url = construirUrlWhatsApp(telefono, mensaje);
    window.open(url, '_blank');
  }

  registrarOtro() {
    this.carrito = {};
    this.clienteSeleccionado = null;
    this.conceptoGuardado = '';
    this.totalGuardado = 0;
    this.paso = 'cliente';
  }
}
