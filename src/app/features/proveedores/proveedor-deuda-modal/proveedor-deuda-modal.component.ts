import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-proveedor-deuda-modal',
  templateUrl: './proveedor-deuda-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProveedorDeudaModalComponent implements OnInit {
  @Input() proveedorId!: string;
  @Input() proveedorNombre!: string;
  @Input() saldoActual: number = 0;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    // TODO: Cargar historial real desde MovimientoDeudaRepository
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
