import { Component, OnInit, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ModalController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonNote, IonLabel, IonItem, IonSelect, IonSelectOption
} from "@ionic/angular/standalone";
import { DatabaseService } from "../../../core/database/database.service";
import { FreemiumService } from "../../../core/freemium/freemium.service";
import { CajaRepository } from "../../../core/repositories/caja.repository";
import { TipoGasto } from "../../../core/models/gasto.model";
import { GastoRecurrente } from "../../../core/models/gasto-recurrente.model";
import { CATEGORIAS_GASTO, sugerirTipoGasto } from "../../../core/gastos/gastos";
import { v4 as uuidv4 } from "uuid";

@Component({
  selector: "app-registrar-gasto",
  templateUrl: "./registrar-gasto.component.html",
  styleUrls: ["./registrar-gasto.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
            IonButton, IonInput, IonNote, IonLabel, IonItem, IonSelect, IonSelectOption]
})
export class RegistrarGastoComponent implements OnInit {
  @Input() origen: GastoRecurrente | null = null;

  categorias = CATEGORIAS_GASTO;
  categoria = "";
  nombreOtro = "";
  valor: number | null = null;
  tipo: TipoGasto = "VARIABLE";
  observacion = "";
  metodo_pago = "EFECTIVO";
  fechaTexto = "";
  error = "";

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private cajaRepo: CajaRepository
  ) {}

  ngOnInit() {
    if (this.origen) {
      this.aplicarCategoriaInicial(this.origen.categoria);
      this.valor = this.origen.valor_estimado;
      this.tipo = this.origen.tipo_gasto;
    }
    this.fechaTexto = this.hoyISO();
  }

  get titulo(): string {
    return this.origen ? "Pago de " + this.origen.categoria : "Registrar un gasto";
  }

  elegirCategoria(c: string) {
    this.categoria = c;
    if (c !== "Otro") {
      this.nombreOtro = "";
    }
    this.tipo = sugerirTipoGasto(c);
  }

  private aplicarCategoriaInicial(c: string) {
    if (CATEGORIAS_GASTO.indexOf(c) >= 0) {
      this.categoria = c;
      this.nombreOtro = "";
      return;
    }
      this.categoria = "Otro";
      this.nombreOtro = c;
  }

  get categoriaFinal(): string {
    if (this.categoria !== "Otro") {
      return this.categoria;
    }
    const nombre = this.nombreOtro.trim();
    return nombre === "" ? "Otro" : nombre;
  }

  elegirTipo(t: TipoGasto) {
    this.tipo = t;
  }

  private hoyISO(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  private fechaEnMilis(): number {
    const partes = this.fechaTexto.split("-").map(Number);
    if (partes.length !== 3 || partes.some((n) => !Number.isFinite(n))) {
      return Date.now();
    }
    return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0).getTime();
  }

  cancelar() {
    this.modalCtrl.dismiss();
  }

  async guardar() {
    const categoria = this.categoriaFinal.trim();
    const valor = Number(this.valor ?? 0);
    if (categoria === "" || !Number.isFinite(valor) || valor <= 0) {
      this.error = "Elige una categoría y escribe cuánto pagaste.";
      return;
    }
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }
    const nota = this.observacion.trim();
    try {
      await this.dbService.crearGasto({
        id: uuidv4(),
        categoria,
        valor,
        fecha: this.fechaEnMilis(),
        observacion: nota === "" ? null : nota,
        tipo_gasto: this.tipo,
        recurrente_id: this.origen ? this.origen.id : null,
        metodo_pago: this.metodo_pago
      } as any);

      // --- CONEXIÓN CON CAJA ---
      if (this.metodo_pago === 'EFECTIVO') {
        try {
          await this.cajaRepo.registrarMovimientoCaja('EGRESO', 'Gastos', valor, `Pago de ${categoria}`);
        } catch (e) {
          console.warn('La caja no está abierta', e);
        }
      }

      this.modalCtrl.dismiss({ guardado: true, tipo: this.tipo });
    } catch (error) {
      console.error("No se pudo guardar el gasto:", error);
      this.error = "No se pudo guardar. Intenta de nuevo.";
    }
  }
}
