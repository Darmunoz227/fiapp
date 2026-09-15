import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, AlertController, ToastController, ModalController } from '@ionic/angular/standalone';
import { v4 as uuidv4 } from 'uuid';
import { RegistrarGastoComponent } from '../../shared/modals/registrar-gasto/registrar-gasto.component';
import { RegistrarPlantillaComponent } from '../../shared/modals/registrar-plantilla/registrar-plantilla.component';
import { DatabaseService } from '../../core/database/database.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { Gasto, TipoGasto } from '../../core/models/gasto.model';
import { GastoRecurrente, FrecuenciaGasto } from '../../core/models/gasto-recurrente.model';
import { calcularFijosMensuales, calcularMargenPromedio, calcularPuntoEquilibrio, calcularTotalGastos, sugerirTipoGasto, CATEGORIAS_GASTO, PuntoEquilibrio, estaPagadoEsteMes } from '../../core/gastos/gastos';
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
    private modalCtrl: ModalController,
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
    return estaPagadoEsteMes(this.gastosMes, r.id);
  }

  async abrirNuevoGasto() {
    await this.abrirModalGasto(null);
  }

  // Precarga los datos de la plantilla pero NO guarda nada solo: el
  // merchant confirma. La recurrencia facilita, nunca decide.
  async registrarPagoDe(r: GastoRecurrente) {
    await this.abrirModalGasto(r);
  }

  private async abrirModalGasto(origen: GastoRecurrente | null) {
    const modal = await this.modalCtrl.create({
      component: RegistrarGastoComponent,
      componentProps: { origen },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.cargar();
    }
  }

  // Borrar un gasto NO pide PIN: no es destructivo en el sentido de la
  // Decision 049 (no toca inventario ni datos de otros), es recuperable
  // por ser borrado logico, y exigir PIN mataria la agilidad igual que
  // habria pasado con duplicar producto (Decision 047).
  async confirmarBorrado(g: Gasto) {
    const alert = await this.alertCtrl.create({
      header: 'Borrar este gasto?',
      message: g.categoria + ' por ' + g.valor.toLocaleString('es-CO'),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrarlo',
          role: 'destructive',
          handler: () => {
            void this.borrar(g);
          },
        },
      ],
    });
    await alert.present();
  }

  private async borrar(g: Gasto) {
    try {
      await this.dbService.borrarGasto(g.id);
      await this.cargar();
    } catch (error) {
      console.error('No se pudo borrar el gasto:', error);
      await this.avisar('No se pudo borrar. Intenta de nuevo.');
    }
  }

  private async avisar(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 3000, position: 'bottom', color: 'danger' });
    await toast.present();
  }

  async abrirNuevaPlantilla() {
    const modal = await this.modalCtrl.create({
      component: RegistrarPlantillaComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.cargar();
    }
  }
}
