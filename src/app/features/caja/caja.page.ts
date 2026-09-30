import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CajaRepository } from '../../core/repositories/caja.repository';
import { addIcons } from 'ionicons';
import { cashOutline, lockOpenOutline, walletOutline, lockClosedOutline, calculatorOutline, checkmarkCircleOutline, closeCircleOutline, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CajaPage implements OnInit {
  sesionActiva: any = null;
  formBaseStr: string = '';
  formBaseNum: number = 0;

  movimientos: any[] = [];
  totalIngresos: number = 0;
  totalEgresos: number = 0;
  saldoEsperado: number = 0;

  formSaldoFisicoStr: string = '';
  formSaldoFisicoNum: number = 0;
  notaCierre: string = '';

  constructor(
    private cajaRepo: CajaRepository,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ cashOutline, lockOpenOutline, walletOutline, lockClosedOutline, calculatorOutline, checkmarkCircleOutline, closeCircleOutline, addCircleOutline });
  }

  async ngOnInit() { await this.cargarEstadoCaja(); }
  async ionViewWillEnter() { await this.cargarEstadoCaja(); }

  async cargarEstadoCaja() {
    this.sesionActiva = await this.cajaRepo.obtenerSesionAbierta();
    if (this.sesionActiva) {
      this.movimientos = await this.cajaRepo.obtenerMovimientosPorSesion(this.sesionActiva.id);
      this.calcularTotales();
    } else {
      this.movimientos = [];
      this.limpiarFormularios();
    }
  }

  calcularTotales() {
    this.totalIngresos = this.movimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.monto, 0);
    this.totalEgresos = this.movimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.monto, 0);
    this.saldoEsperado = this.sesionActiva.base_inicial + this.totalIngresos - this.totalEgresos;
  }

  onBaseChange(valor: string | number) {
    const raw = valor.toString().replace(/\D/g, '');
    this.formBaseNum = raw ? parseInt(raw, 10) : 0;
    this.formBaseStr = raw ? this.formBaseNum.toLocaleString('es-CO') : '';
  }

  onSaldoFisicoChange(valor: string | number) {
    const raw = valor.toString().replace(/\D/g, '');
    this.formSaldoFisicoNum = raw ? parseInt(raw, 10) : 0;
    this.formSaldoFisicoStr = raw ? this.formSaldoFisicoNum.toLocaleString('es-CO') : '';
  }

  get diferencia(): number { return this.formSaldoFisicoNum - this.saldoEsperado; }

  async abrirCaja() {
    if (this.formBaseNum < 0) return;
    try {
      await this.cajaRepo.abrirCaja(this.formBaseNum);
      await this.cargarEstadoCaja();
      this.mostrarToast('¡Turno iniciado con éxito!', 'success');
    } catch (e) { console.error(e); }
  }

  async confirmarCierre() {
    const d = this.diferencia;
    const header = d === 0 ? '¡Cuadre Perfecto!' : d > 0 ? `Sobran $${d.toLocaleString('es-CO')}` : `Faltan $${Math.abs(d).toLocaleString('es-CO')}`;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Corte Z',
      message: `${header}<br><br>¿Seguro que deseas cerrar la caja declarando que hay <b>$${this.formSaldoFisicoNum.toLocaleString('es-CO')}</b> físicos?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Hacer Corte Z', handler: () => { this.ejecutarCierre(); } }
      ]
    });
    await alert.present();
  }

  async ejecutarCierre() {
    try {
      await this.cajaRepo.cerrarCaja(this.sesionActiva.id, this.saldoEsperado, this.formSaldoFisicoNum, this.diferencia, this.notaCierre);
      await this.cargarEstadoCaja();
      this.mostrarToast('¡Turno cerrado y guardado correctamente!', 'success');
    } catch (e) {
      console.error(e);
      this.mostrarToast('Error al cerrar la caja.', 'danger');
    }
  }

  limpiarFormularios() {
    this.formBaseStr = ''; this.formBaseNum = 0;
    this.formSaldoFisicoStr = ''; this.formSaldoFisicoNum = 0;
    this.notaCierre = '';
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color, position: 'top' });
    await toast.present();
  }
}
