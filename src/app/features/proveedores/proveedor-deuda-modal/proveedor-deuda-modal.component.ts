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
  
  saldoActual: number = 0;
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
    
    // Calcular saldo exacto y saldo progresivo para mostrar junto a la nota
    let saldoAcumulado = 0;
    const movsInvertidos = [...this.movimientos].reverse(); // Recorremos de antiguo a nuevo
    
    for (const m of movsInvertidos) {
      if (m.tipo === 'CARGO') saldoAcumulado += m.monto;
      else if (m.tipo === 'ABONO') saldoAcumulado -= m.monto;
      m.saldoMomentaneo = saldoAcumulado; // Guardamos cómo quedó la deuda tras este movimiento
    }
    
    this.saldoActual = saldoAcumulado; // El saldo final
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
      await this.cargarHistorial(); // Esto recalcula todo mágicamente
      this.vistaActual = 'HISTORIAL';
    }
  }

  cerrar() {
    this.modalCtrl.dismiss({ actualizado: true });
  }
}