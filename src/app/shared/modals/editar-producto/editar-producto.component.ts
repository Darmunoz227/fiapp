import { Component, OnInit, ViewChild, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ModalController, IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonRow, IonCol, IonButton, IonNote
} from "@ionic/angular/standalone";

import { DatabaseService } from "../../../core/database/database.service";
import { FreemiumService } from "../../../core/freemium/freemium.service";
import { Producto } from "../../../core/models/producto.model";
import { formatCurrencyCOP, parseCurrencyInput } from "../../utils/formatters";
import { calcularPosicionCursor } from "../../utils/caret-position";
import { v4 as uuidv4 } from "uuid";

@Component({
  selector: "app-editar-producto",
  templateUrl: "./editar-producto.component.html",
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonRow, IonCol, IonButton, IonNote
  ]
})
export class EditarProductoComponent implements OnInit {
  producto!: Producto;
  @Input() modo: 'editar' | 'duplicar' = 'editar';

  nombre = "";
  precio_venta = "";
  minimo_stock: number | null = null;
  modoProduccion = false;

  @ViewChild("precioInput") precioInput?: IonInput;

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private freemiumService: FreemiumService
  ) {}

  ngOnInit() {
    this.nombre = this.producto.nombre;
    this.precio_venta = formatCurrencyCOP(this.producto.precio_venta);
    this.minimo_stock = this.producto.minimo_stock;
    this.modoProduccion = this.producto.modo_produccion ?? false;
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  async onPrecioInput() {
    let nativeInput: HTMLInputElement | null = null;
    try {
      if (this.precioInput && this.precioInput.getInputElement) {
        nativeInput = await this.precioInput.getInputElement();
      }
    } catch (e) {
      nativeInput = null;
    }

    const valor = this.precio_venta;
    const caretPos = nativeInput ? nativeInput.selectionStart || 0 : valor.length;
    const numeric = parseCurrencyInput(valor);
    const texto = numeric > 0 ? formatCurrencyCOP(numeric) : "";
    const pos = calcularPosicionCursor(valor, caretPos, texto);

    this.precio_venta = texto;

    if (nativeInput) {
      const el = nativeInput;
      setTimeout(() => {
        try { el.setSelectionRange(pos, pos); } catch (e) {}
      }, 0);
    }
  }

  async onPrecioBlur() {
    const numeric = parseCurrencyInput(this.precio_venta);
    this.precio_venta = numeric > 0 ? formatCurrencyCOP(numeric) : "";
  }

  async guardar() {
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    const nombre = this.nombre.trim();
    const precioVenta = parseCurrencyInput(this.precio_venta);
    const minimoStock = Number(this.minimo_stock);

    if (!nombre || precioVenta <= 0 || Number.isNaN(minimoStock) || minimoStock < 0) {
      return;
    }

    try {
      if (this.modo === 'duplicar') {
        const nuevo: Producto = {
          id: uuidv4(),
          nombre,
          precio_venta: precioVenta,
          tipo_venta: this.producto.tipo_venta,
          minimo_stock: minimoStock,
          costo_promedio: 0,
        };
        await this.dbService.crearProducto(nuevo);
      } else {
        await this.dbService.actualizarProducto(this.producto.id, nombre, precioVenta, minimoStock, this.modoProduccion);
      }
      this.modalCtrl.dismiss({ guardado: true });
    } catch (error) {
      console.error("No se pudo guardar el producto", error);
    }
  }
}
