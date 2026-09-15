import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ModalController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonNote, IonLabel, IonItem
} from "@ionic/angular/standalone";
import { DatabaseService } from "../../../core/database/database.service";
import { FreemiumService } from "../../../core/freemium/freemium.service";
import { TipoGasto } from "../../../core/models/gasto.model";
import { FrecuenciaGasto } from "../../../core/models/gasto-recurrente.model";
import { CATEGORIAS_GASTO, sugerirTipoGasto } from "../../../core/gastos/gastos";
import { v4 as uuidv4 } from "uuid";

const FRECUENCIAS: { valor: FrecuenciaGasto; texto: string }[] = [
  { valor: "DIARIO", texto: "Cada d\u00eda" },
  { valor: "SEMANAL", texto: "Cada semana" },
  { valor: "QUINCENAL", texto: "Cada quincena" },
  { valor: "MENSUAL", texto: "Cada mes" },
  { valor: "ANUAL", texto: "Cada a\u00f1o" },
];

@Component({
  selector: "app-registrar-plantilla",
  templateUrl: "./registrar-plantilla.component.html",
  styleUrls: ["./registrar-plantilla.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
            IonContent, IonButton, IonInput, IonNote, IonLabel, IonItem]
})
export class RegistrarPlantillaComponent {
  categorias = CATEGORIAS_GASTO;
  frecuencias = FRECUENCIAS;
  categoria = "";
  nombreOtro = "";
  valor: number | null = null;
  frecuencia: FrecuenciaGasto = "MENSUAL";
  tipo: TipoGasto = "VARIABLE";
  error = "";

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private freemiumService: FreemiumService
  ) {}

  elegirCategoria(c: string) {
    this.categoria = c;
    if (c !== "Otro") {
      this.nombreOtro = "";
    }
    this.tipo = sugerirTipoGasto(c);
  }

  elegirFrecuencia(f: FrecuenciaGasto) {
    this.frecuencia = f;
  }

  elegirTipo(t: TipoGasto) {
    this.tipo = t;
  }

  // Mismo criterio que el modal de gasto (D-11): el chip Otro guarda el
  // nombre que escribio el merchant, no la palabra "Otro". Asi plantilla
  // y gasto comparten el mismo juego de categorias y al registrar el
  // pago el chip queda preseleccionado.
  get categoriaFinal(): string {
    if (this.categoria !== "Otro") {
      return this.categoria;
    }
    const nombre = this.nombreOtro.trim();
    return nombre === "" ? "Otro" : nombre;
  }

  cancelar() {
    this.modalCtrl.dismiss();
  }

  async guardar() {
    const categoria = this.categoriaFinal.trim();
    const valor = Number(this.valor ?? 0);
    if (categoria === "" || !Number.isFinite(valor) || valor <= 0) {
      this.error = "Elige una categor\u00eda y escribe cu\u00e1nto pagas.";
      return;
    }
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }
    try {
      await this.dbService.crearGastoRecurrente({
        id: uuidv4(),
        categoria,
        valor_estimado: valor,
        tipo_gasto: this.tipo,
        frecuencia: this.frecuencia,
        activo: true,
      });
      this.modalCtrl.dismiss({ guardado: true });
    } catch (error) {
      console.error("No se pudo guardar la plantilla:", error);
      this.error = "No se pudo guardar. Intenta de nuevo.";
    }
  }
}
