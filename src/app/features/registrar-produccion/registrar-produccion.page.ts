import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonItem, IonLabel, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { removeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { Producto } from '../../core/models/producto.model';
import { CarritoProduccion, construirProduccion, filtrarProductosDeProduccion, calcularCostoTotalProduccion, calcularCostoSugerido } from '../../core/produccion/produccion';

type PasoProduccion = 'productos' | 'confirmacion';

@Component({
  selector: 'app-registrar-produccion',
  templateUrl: './registrar-produccion.page.html',
  styleUrls: ['../fiado-productos/fiado-productos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonItem, IonLabel],
})
export class RegistrarProduccionPage {
  paso: PasoProduccion = 'productos';
  productos: Producto[] = [];
  carrito: CarritoProduccion = {};
  guardando = false;
  totalGuardado = 0;
  lineasGuardadas = 0;

  constructor(
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
  ) {
    addIcons({ removeOutline, checkmarkCircleOutline });
  }

  async ionViewWillEnter() {
    this.paso = 'productos';
    this.carrito = {};
    const todos = await this.dbService.obtenerProductos();
    this.productos = filtrarProductosDeProduccion(todos);
  }

  cantidad(producto: Producto): number {
    return this.carrito[producto.id]?.cantidad ?? 0;
  }

  costo(producto: Producto): number {
    return this.carrito[producto.id]?.costoUnitario ?? 0;
  }

  sumar(producto: Producto) {
    const linea = this.carrito[producto.id];
    this.carrito = {
      ...this.carrito,
      [producto.id]: { cantidad: (linea?.cantidad ?? 0) + 1, costoUnitario: linea?.costoUnitario ?? 0 },
    };
  }

  restar(producto: Producto) {
    const linea = this.carrito[producto.id];
    const nueva = (linea?.cantidad ?? 0) - 1;
    const copia = { ...this.carrito };
    if (nueva <= 0) {
      delete copia[producto.id];
    } else {
      copia[producto.id] = { cantidad: nueva, costoUnitario: linea?.costoUnitario ?? 0 };
    }
    this.carrito = copia;
  }

  cambiarCosto(producto: Producto, evento: CustomEvent) {
    const linea = this.carrito[producto.id];
    if (!linea) {
      return;
    }
    const valor = Number((evento.detail as { value?: string }).value ?? 0);
    this.carrito = {
      ...this.carrito,
      [producto.id]: { cantidad: linea.cantidad, costoUnitario: Number.isFinite(valor) ? valor : 0 },
    };
  }

  get productosConCantidad(): Producto[] {
    return this.productos.filter((p) => this.cantidad(p) > 0);
  }

  get hayLineas(): boolean {
    return this.productosConCantidad.length > 0;
  }

  get costoTotal(): number {
    return calcularCostoTotalProduccion(this.carrito);
  }

  get puedeGuardar(): boolean {
    return this.hayLineas && this.costoTotal > 0;
  }

  async guardarProduccion() {
    if (!this.puedeGuardar || this.guardando) {
      return;
    }
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    this.guardando = true;
    const armada = construirProduccion(this.carrito, Date.now(), () => uuidv4());

    try {
      await this.dbService.registrarProduccion(armada.produccion, armada.items, armada.movimientos);
      this.totalGuardado = this.costoTotal;
      this.lineasGuardadas = armada.items.length;
      this.carrito = {};
      this.paso = 'confirmacion';
    } catch (error) {
      console.error('Error al registrar produccion:', error);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo registrar la produccion. Intenta de nuevo.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.guardando = false;
    }
  }

  registrarOtra() {
    this.carrito = {};
    this.totalGuardado = 0;
    this.lineasGuardadas = 0;
    this.paso = 'productos';
  }

  fijarCosto(producto: Producto, valor: number) {
    const linea = this.carrito[producto.id];
    if (!linea) {
      return;
    }
    this.carrito = {
      ...this.carrito,
      [producto.id]: { cantidad: linea.cantidad, costoUnitario: valor },
    };
  }

  async abrirCalculadora(producto: Producto) {
    const alert = await this.alertCtrl.create({
      header: 'Calcular costo fijo por unidad',
      message: 'Reparte tus gastos del mes (arriendo, luz, gas) entre lo que produces. Ejemplo: 600.000 entre 3.000 unidades = 200 por unidad. Despues sumale la materia prima.',
      inputs: [
        { name: 'fijos', type: 'number', placeholder: 'Arriendo, luz, gas del mes' },
        { name: 'unidades', type: 'number', placeholder: 'Unidades que produces al mes' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Usar este costo',
          handler: (data) => {
            const sugerido = calcularCostoSugerido(Number(data.fijos), Number(data.unidades));
            if (sugerido > 0) {
              this.fijarCosto(producto, Math.round(sugerido));
            }
          },
        },
      ],
    });
    await alert.present();
  }

  irAInventario() {
    this.router.navigate(['/inventario']);
  }
}
