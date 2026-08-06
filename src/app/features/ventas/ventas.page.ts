import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { FreemiumService } from '../../core/freemium/freemium.service';
import { Cliente } from '../../core/models/cliente.model';
import { MovimInventario } from '../../core/models/movim-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { VentaItem } from '../../core/models/venta-item.model';
import { TipoPago, Venta } from '../../core/models/venta.model';
import { calcularStockDerivado } from '../inventario/inventory-calculations';
import { calcularTotalVenta, derivarTipoPago, generarConceptoFiado } from './ventas-calculations';
import { formatCurrencyCOP, parseCurrencyInput } from '../../shared/utils/formatters';
import { calcularPosicionCursor } from '../../shared/utils/caret-position';

interface LineaCarritoVenta {
  id: string;
  producto: Producto;
  cantidad: number;
  precio_venta: number;
  costo_unitario: number;
  stockDisponible: number;
  bloqueada: boolean;
  repetida: boolean;
  motivoBloqueo: string | null;
}

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
  carrito: LineaCarritoVenta[] = [];

  private stockPorProducto = new Map<string, number>();

  productoId = '';
  clienteId = '';
  cantidad = 1;
  precio = '';
  tipo_pago: TipoPago = 'CONTADO';
  abono = '';
  stockDerivado = 0;
  @ViewChild("precioInput") precioInput?: IonInput;
  @ViewChild("abonoInput") abonoInput?: IonInput;

  constructor(
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private toastCtrl: ToastController,
  ) {}

  ionViewWillEnter() {
    void this.cargarProductos();
  }

  get gananciaEstimada(): number | null {
    const producto = this.productos.find((item) => item.id === this.productoId) ?? null;
    const cantidad = Number(this.cantidad);
    const precio = parseCurrencyInput(this.precio);

    if (producto == null || Number.isNaN(cantidad) || Number.isNaN(precio) || cantidad <= 0 || precio <= 0) {
      return null;
    }

    return (precio - producto.costo_promedio) * cantidad;
  }

  get totalVenta(): number {
    return this.carrito.reduce((acumulado, linea) => acumulado + calcularTotalVenta(linea.precio_venta, linea.cantidad), 0);
  }

  get gananciaTotal(): number {
    return this.carrito.reduce((acumulado, linea) => acumulado + this.calcularGananciaLinea(linea), 0);
  }

  get tieneLineasBloqueadas(): boolean {
    return this.carrito.some((linea) => linea.bloqueada);
  }

  get puedeConfirmar(): boolean {
    return this.carrito.length > 0 && !this.tieneLineasBloqueadas;
  }

  get montoContadoCalculado(): number {
    if (this.tipo_pago === 'CONTADO') {
      return this.totalVenta;
    }
    if (this.tipo_pago === 'FIADO') {
      return 0;
    }
    return parseCurrencyInput(this.abono);
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
      this.precio = '';
      this.stockDerivado = 0;
      return;
    }

    const producto = this.productos.find((item) => item.id === productoId) ?? null;
    this.precio = producto ? formatCurrencyCOP(producto.precio_venta) : '';

    this.stockDerivado = await this.obtenerStockProducto(productoId);
  }

  async agregarLinea() {
    const cantidad = Number(this.cantidad);
    const precio = parseCurrencyInput(this.precio);

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

    const producto = this.productos.find((item) => item.id === this.productoId) ?? null;
    if (producto == null) {
      await this.mostrarToast('Producto no encontrado', 'danger');
      return;
    }

    const costoUnitario = producto.costo_promedio;
    const linea: LineaCarritoVenta = {
      id: uuidv4(),
      producto: { ...producto },
      cantidad,
      precio_venta: precio,
      costo_unitario: costoUnitario,
      stockDisponible: this.stockPorProducto.get(producto.id) ?? 0,
      bloqueada: false,
      repetida: false,
      motivoBloqueo: null,
    };

    this.carrito = [...this.carrito, linea];
    await this.revalidarCarrito();
    this.cantidad = 1;
  }

  async onCantidadLineaChange(linea: LineaCarritoVenta, valor: number | string) {
    const cantidad = Number(valor);
    linea.cantidad = Number.isNaN(cantidad) ? 0 : cantidad;
    await this.revalidarCarrito();
  }

  async eliminarLinea(lineaId: string) {
    this.carrito = this.carrito.filter((linea) => linea.id !== lineaId);
    await this.revalidarCarrito();
  }

  async registrarVenta() {
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    await this.revalidarCarrito();

    if (this.carrito.length === 0) {
      await this.mostrarToast('Debes agregar al menos una línea al carrito', 'danger');
      return;
    }

    if (this.tieneLineasBloqueadas) {
      await this.mostrarToast('Debes resolver las líneas bloqueadas antes de confirmar', 'danger');
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

    const ahora = Date.now();
    const montoContado = this.montoContadoCalculado;
    const montoFiado = this.montoFiadoCalculado;

    const venta: Venta = {
      id: uuidv4(),
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

    const items: VentaItem[] = this.carrito.map((linea) => ({
      id: uuidv4(),
      venta_id: venta.id,
      producto_id: linea.producto.id,
      cantidad: linea.cantidad,
      precio_venta: linea.precio_venta,
      costo_unitario: linea.costo_unitario,
      ganancia: this.calcularGananciaLinea(linea),
      created_at: null,
      updated_at: null,
      deleted_at: null,
      store_id: null,
      created_by: null,
    }));

    const movimientos: MovimInventario[] = this.carrito.map((linea) => ({
      id: uuidv4(),
      producto_id: linea.producto.id,
      tipo: 'VENTA',
      cantidad: linea.cantidad,
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
    }));

    try {
      if (montoFiado > 0) {
        const conceptoFiado = generarConceptoFiado(
          this.carrito.map((linea) => ({
            cantidad: linea.cantidad,
            nombre: linea.producto.nombre,
          })),
        );

        const transaccionFiado: Transaccion = {
          id: uuidv4(),
          cliente_id: this.clienteId,
          venta_id: venta.id,
          tipo: 'fiado',
          monto: montoFiado,
          concepto: conceptoFiado,
          fecha: ahora,
          created_at: null,
          updated_at: null,
          deleted_at: null,
          store_id: null,
          created_by: null,
        };

        await this.dbService.registrarVenta(venta, items, movimientos, transaccionFiado);
      } else {
        await this.dbService.registrarVenta(venta, items, movimientos);
      }

      const valorGanancia = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(this.gananciaTotal);

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
    this.carrito = [];
    this.stockPorProducto.clear();
    this.cantidad = 1;
    this.precio = '';
    this.tipo_pago = 'CONTADO';
    this.abono = '';
    this.stockDerivado = 0;
  }

  private async formatearCampo(input: IonInput | undefined, valor: string): Promise<{ texto: string; pos: number } | null> {
    let nativeInput: HTMLInputElement | null = null;
    try {
      if (input && input.getInputElement) {
        nativeInput = await input.getInputElement();
      }
    } catch (e) {
      nativeInput = null;
    }

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

    return { texto, pos };
  }

  async onPrecioInput() {
    const r = await this.formatearCampo(this.precioInput, this.precio);
    if (r) { this.precio = r.texto; }
  }

  async onPrecioBlur() {
    const numeric = parseCurrencyInput(this.precio);
    this.precio = numeric > 0 ? formatCurrencyCOP(numeric) : "";
  }

  async onAbonoInput() {
    const r = await this.formatearCampo(this.abonoInput, this.abono);
    if (r) { this.abono = r.texto; }
  }

  async onAbonoBlur() {
    const numeric = parseCurrencyInput(this.abono);
    this.abono = numeric > 0 ? formatCurrencyCOP(numeric) : "";
  }

  subtotalLinea(linea: LineaCarritoVenta): number {
    return calcularTotalVenta(linea.precio_venta, linea.cantidad);
  }

  gananciaLinea(linea: LineaCarritoVenta): number {
    return this.calcularGananciaLinea(linea);
  }

  esLineaRepetida(linea: LineaCarritoVenta): boolean {
    return linea.repetida;
  }

  private async obtenerStockProducto(productoId: string): Promise<number> {
    const stockCacheado = this.stockPorProducto.get(productoId);
    if (stockCacheado != null) {
      return stockCacheado;
    }

    const movimientos = await this.dbService.obtenerMovimientosPorProducto(productoId);
    const stock = calcularStockDerivado(movimientos);
    this.stockPorProducto.set(productoId, stock);
    return stock;
  }

  private async revalidarCarrito(): Promise<void> {
    const productosEnCarrito = [...new Set(this.carrito.map((linea) => linea.producto.id))];
    await Promise.all(productosEnCarrito.map(async (productoId) => {
      await this.obtenerStockProducto(productoId);
    }));

    const apariciones = new Map<string, number>();
    const stockRestante = new Map<string, number>();

    for (const linea of this.carrito) {
      const productoId = linea.producto.id;
      const stockBase = this.stockPorProducto.get(productoId) ?? 0;
      const restanteAntes = stockRestante.has(productoId) ? (stockRestante.get(productoId) ?? 0) : stockBase;
      const cantidad = Number(linea.cantidad);

      apariciones.set(productoId, (apariciones.get(productoId) ?? 0) + 1);
      linea.repetida = (apariciones.get(productoId) ?? 0) > 1;
      linea.stockDisponible = Math.max(restanteAntes, 0);

      const cantidadValida = Number.isFinite(cantidad) && cantidad > 0;
      const excedeStock = cantidadValida && cantidad > restanteAntes;
      linea.bloqueada = !cantidadValida || excedeStock;
      linea.motivoBloqueo = !cantidadValida
        ? 'La cantidad debe ser mayor a 0'
        : excedeStock
          ? `Disponible: ${Math.max(restanteAntes, 0)}`
          : null;

      if (!linea.bloqueada) {
        stockRestante.set(productoId, restanteAntes - cantidad);
      } else {
        stockRestante.set(productoId, restanteAntes);
      }
    }
  }

  private calcularGananciaLinea(linea: LineaCarritoVenta): number {
    return (linea.precio_venta - linea.costo_unitario) * linea.cantidad;
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
