import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { MovimientoDeudaRepository } from '../../../core/repositories/movimiento-deuda.repository';

@Component({
  selector: 'app-proveedor-deuda-modal',
  templateUrl: './proveedor-deuda-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProveedorDeudaModalComponent implements OnInit {
  movimientos: any[] = [];
  @Input() proveedorId!: string;
  @Input() proveedorNombre!: string;
  @Input() saldoActual: number = 0;

  constructor(private modalCtrl: ModalController, private movRepo: MovimientoDeudaRepository) {}

    async ngOnInit() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.movimientos = await this.movRepo.obtenerMovimientos(this.proveedorId);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
