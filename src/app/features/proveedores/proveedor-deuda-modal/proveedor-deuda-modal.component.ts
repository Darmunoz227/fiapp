import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { timeOutline, arrowUpCircleOutline, arrowDownCircleOutline, cashOutline, addCircleOutline } from 'ionicons/icons';
import { MovimientoDeudaRepository } from '../../../core/repositories/movimiento-deuda.repository';

@Component({
  selector: 'app-proveedor-deuda-modal',
  templateUrl: './proveedor-deuda-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProveedorDeudaModalComponent implements OnInit {
  @Input() proveedorId!: string;
  @Input() proveedorNombre!: string;
  @Input() saldoActual: number = 0;

  movimientos: any[] = [];
  vistaActual: 'HISTORIAL' | 'FORMULARIO' = 'HISTORIAL';
  tipoMovimiento: 'ABONO' | 'CARGO' = 'ABONO';
  formMontoStr: string = '';
  formMontoNum: number = 0;
  formNotas: string = '';

  constructor(private modalCtrl: ModalController, private movRepo: MovimientoDeudaRepository) {
    addIcons({ timeOutline, arrowUpCircleOutline, arrowDownCircleOutline, cashOutline, addCircleOutline });
  }

  async ngOnInit() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.movimientos = await this.movRepo.obtenerMovimientos(this.proveedorId);
  }

  onMontoChange(valor: string | number) {
    const raw = valor.toString().replace(/\D/g, ''); 
    if (!raw) {
      this.formMontoStr = '';
      this.formMontoNum = 0;
      return;
    }
    this.formMontoNum = parseInt(raw, 10);
    this.formMontoStr = this.formMontoNum.toLocaleString('es-CO'); 
  }

  abrirFormulario(tipo: 'ABONO' | 'CARGO') {
    this.tipoMovimiento = tipo;
    this.formMontoStr = '';
    this.formMontoNum = 0;
    this.formNotas = '';
    this.vistaActual = 'FORMULARIO';
  }

  async guardarMovimiento() {
    if (this.formMontoNum > 0) {
      await this.movRepo.registrarMovimiento(this.proveedorId, this.tipoMovimiento, this.formMontoNum, this.formNotas);
      this.saldoActual = this.tipoMovimiento === 'CARGO' 
        ? (this.saldoActual || 0) + this.formMontoNum 
        : (this.saldoActual || 0) - this.formMontoNum;
      await this.cargarHistorial();
      this.vistaActual = 'HISTORIAL';
    }
  }

  cerrar() {
    this.modalCtrl.dismiss({ actualizado: true });
  }
}
