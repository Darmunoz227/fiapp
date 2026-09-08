import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, AlertController, ToastController } from '@ionic/angular/standalone';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { Gasto, TipoGasto } from '../../core/models/gasto.model';
import { GastoRecurrente, FrecuenciaGasto } from '../../core/models/gasto-recurrente.model';
import { calcularFijosMensuales, calcularMargenPromedio, calcularPuntoEquilibrio, calcularTotalGastos, sugerirTipoGasto, CATEGORIAS_GASTO, PuntoEquilibrio } from '../../core/gastos/gastos';
import { calcularResumenVentas, filtrarPorRangoFecha } from '../reportes/reportes-calculations';

const ETIQUETA_FRECUENCIA: Record<FrecuenciaGasto, string> = {
  DIARIO: 'Cada día',
  SEMANAL: 'Cada semana',
  QUINCENAL: 'Cada quincena',
  MENSUAL: 'Cada mes',
  ANUAL: 'Cada año',
};

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton],
})
export class GastosPage {
  recurrentes: GastoRecurrente[] = [];
  gastosMes: Gasto[] = [];
  totalMes = 0;
  fijosMensuales = 0;
  margenPorcentaje = 0;
  punto: PuntoEquilibrio = { calculable: false, ventaNecesariaMensual: 0, ventaNecesariaDiaria: 0 };

  constructor(
    private dbService: DatabaseService,
    private freemiumService: FreemiumService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  async ionViewWillEnter() {
    await this.cargar();
  }

  async cargar() {
    const [recurrentes, gastos, ventas] = await Promise.all([
      this.dbService.obtenerGastosRecurrentes(),
      this.dbService.obtenerGastos(),
      this.dbService.obtenerVentas(),
    ]);

    this.recurrentes = recurrentes;

    const ahora = Date.now();
    this.gastosMes = filtrarPorRangoFecha(gastos, 'MES', ahora, (g) => g.fecha);
    this.totalMes = calcularTotalGastos(this.gastosMes);

    this.fijosMensuales = calcularFijosMensuales(recurrentes);

    const resumen = calcularResumenVentas(ventas);
    const margen = calcularMargenPromedio(resumen.totalVendido, resumen.gananciaTotal);
    this.margenPorcentaje = Math.round(margen * 100);
    this.punto = calcularPuntoEquilibrio(this.fijosMensuales, margen);
  }

  etiquetaFrecuencia(r: GastoRecurrente): string {
    return ETIQUETA_FRECUENCIA[r.frecuencia] ?? '';
  }

  yaPagadoEsteMes(r: GastoRecurrente): boolean {
    return this.gastosMes.some((g) => g.recurrente_id === r.id);
  }

  async abrirNuevoGasto() {
    await this.pedirGasto('Registrar gasto', '', 0, null);
  }

  // Precarga los datos de la plantilla pero NO guarda nada solo: el
  // merchant confirma. La recurrencia facilita, nunca decide.
  async registrarPagoDe(r: GastoRecurrente) {
    await this.pedirGasto('Pago de ' + r.categoria, r.categoria, r.valor_estimado, r);
  }

  private async pedirGasto(titulo: string, categoria: string, valor: number, origen: GastoRecurrente | null) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: origen ? 'Puedes cambiar el valor antes de guardar.' : 'Categorias: ' + CATEGORIAS_GASTO.join(', '),
      inputs: [
        { name: 'categoria', type: 'text', placeholder: 'Categoria', value: categoria },
        { name: 'valor', type: 'number', placeholder: 'Cuanto pagaste', value: valor > 0 ? String(valor) : '' },
        { name: 'observacion', type: 'text', placeholder: 'Nota (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            void this.guardarGasto(data, origen);
          },
        },
      ],
    });
    await alert.present();
  }

  private async guardarGasto(data: any, origen: GastoRecurrente | null) {
    const categoria = String(data?.categoria ?? '').trim();
    const valor = Number(data?.valor ?? 0);

    if (categoria === '' || !Number.isFinite(valor) || valor <= 0) {
      await this.avisar('Escribe una categoria y un valor mayor a cero.');
      return;
    }

    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    // El tipo se COPIA al registrar: si manana la plantilla cambia, los
    // gastos ya registrados no deben cambiar (mismo criterio que
    // Decision 038).
    const tipo: TipoGasto = origen ? origen.tipo_gasto : sugerirTipoGasto(categoria);
    const observacion = String(data?.observacion ?? '').trim();

    try {
      await this.dbService.crearGasto({
        id: uuidv4(),
        categoria,
        valor,
        fecha: Date.now(),
        observacion: observacion === '' ? null : observacion,
        tipo_gasto: tipo,
        recurrente_id: origen ? origen.id : null,
      });
      await this.cargar();
    } catch (error) {
      console.error('No se pudo guardar el gasto:', error);
      await this.avisar('No se pudo guardar el gasto. Intenta de nuevo.');
    }
  }

  private async avisar(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 3000, position: 'bottom', color: 'danger' });
    await toast.present();
  }

  async abrirNuevaPlantilla() {
    const alert = await this.alertCtrl.create({
      header: 'Gasto que se repite',
      message: 'Lo que pagas siempre. FiApp no lo registra solo: tu confirmas cada pago.',
      inputs: [
        { name: 'categoria', type: 'text', placeholder: 'Ej. Arriendo' },
        { name: 'valor', type: 'number', placeholder: 'Cuanto pagas' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            void this.guardarPlantilla(data);
          },
        },
      ],
    });
    await alert.present();
  }

  private async guardarPlantilla(data: any) {
    const categoria = String(data?.categoria ?? '').trim();
    const valor = Number(data?.valor ?? 0);

    if (categoria === '' || !Number.isFinite(valor) || valor <= 0) {
      await this.avisar('Escribe una categoria y un valor mayor a cero.');
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
        tipo_gasto: sugerirTipoGasto(categoria),
        frecuencia: 'MENSUAL',
        activo: true,
      });
      await this.cargar();
    } catch (error) {
      console.error('No se pudo guardar la plantilla:', error);
      await this.avisar('No se pudo guardar. Intenta de nuevo.');
    }
  }
}
